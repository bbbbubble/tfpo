#!/usr/bin/env python3
"""Generate TFPO narration, timed captions, and Remotion timing metadata."""

from __future__ import annotations

import json
import argparse
import math
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

import imageio_ffmpeg


ROOT = Path(__file__).resolve().parents[1]
REMOTION = ROOT / "video"
CONTENT = REMOTION / "src" / "content.json"
TIMING = REMOTION / "src" / "timing.json"
AUDIO_DIR = REMOTION / "public" / "audio"
CAPTION_DIR = REMOTION / "public" / "captions"
OUTPUT_VTT = ROOT / "site" / "public" / "tfpo-explainer.vtt"
EDGE_PACKAGES = ROOT / "build" / "video-python"

FPS = 30
TRANSITION_FRAMES = 18
TAIL_SECONDS = 1.25
VOICE = "en-US-AvaMultilingualNeural"
RATE = "-3%"
PITCH = "-2Hz"

CAPTION_REPLACEMENTS = (
    (r"\bten-benchmark\b", "10-benchmark"),
    (r"\bthree-seed\b", "3-seed"),
    (r"\bthree regularizers\b", "3 regularizers"),
    (r"\beighty-eight point zero zero\b", "88.00"),
    (r"\beighty-three point zero eight\b", "83.08"),
    (r"\beighty-three point five two\b", "83.52"),
    (r"\bone thousand\b", "1,000"),
    (r"\bzero point eight five\b", "0.85"),
    (r"\bzero point five five\b", "0.55"),
    (r"\bzero point zero two\b", "0.02"),
    (r"\bseventy-one point zero three\b", "71.03"),
    (r"\bninety-one point nine seven\b", "91.97"),
    (r"\beighty-six point three three\b", "86.33"),
    (r"\bninety point five six\b", "90.56"),
    (r"\bone point six\b", "1.6"),
    (r"\bthirty-six point one\b", "36.1"),
    (r"\bsix point four\b", "6.4"),
    (r"\bfifty-two point one\b", "52.1"),
    (r"\btwo-hundred-prompt\b", "200-prompt"),
    (r"\bfour samples per prompt\b", "4 samples per prompt"),
    (r"\btwenty samples per problem\b", "20 samples per problem"),
    (r"\bthree training seeds\b", "3 training seeds"),
    (r"\bpass at one\b", "pass@1"),
    (r"\bsixty-two point three three\b", "62.33"),
    (r"\bQwen three eight B\b", "Qwen3-8B"),
    (r"\bQwen three V L\b", "Qwen3-VL"),
    (r"\bA U P R C\b", "AUPRC"),
    (r"\bacross ten benchmarks\b", "across 10 benchmarks"),
    (r"\bthree distinct instabilities\b", "3 distinct instabilities"),
    (r"\bAcross four matched samples\b", "Across 4 matched samples"),
)


def timestamp_ms(value: str) -> int:
    hours, minutes, seconds = value.replace(",", ".").split(":")
    return round((int(hours) * 3600 + int(minutes) * 60 + float(seconds)) * 1000)


def vtt_timestamp(value_ms: int) -> str:
    hours, remainder = divmod(value_ms, 3_600_000)
    minutes, remainder = divmod(remainder, 60_000)
    seconds, milliseconds = divmod(remainder, 1000)
    return f"{hours:02d}:{minutes:02d}:{seconds:02d}.{milliseconds:03d}"


def normalize_caption_text(text: str) -> str:
    for pattern, replacement in CAPTION_REPLACEMENTS:
        text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)
    return text


def split_caption(caption: dict[str, object], max_words: int = 12) -> list[dict[str, object]]:
    words = str(caption["text"]).split()
    if len(words) <= max_words:
        return [caption]

    chunks: list[list[str]] = []
    current: list[str] = []
    for word in words:
        current.append(word)
        natural_break = word.endswith((",", ";", ":", ".", "?", "!")) and len(current) >= 6
        if len(current) >= max_words or natural_break:
            chunks.append(current)
            current = []
    if current:
        chunks.append(current)
    if len(chunks) > 1 and len(chunks[-1]) < 4:
        needed = 4 - len(chunks[-1])
        chunks[-1] = chunks[-2][-needed:] + chunks[-1]
        chunks[-2] = chunks[-2][:-needed]

    start_ms = int(caption["startMs"])
    end_ms = int(caption["endMs"])
    total_words = sum(len(chunk) for chunk in chunks)
    cursor = start_ms
    split: list[dict[str, object]] = []
    words_seen = 0
    for index, chunk in enumerate(chunks):
        words_seen += len(chunk)
        chunk_end = end_ms if index == len(chunks) - 1 else round(
            start_ms + (end_ms - start_ms) * words_seen / total_words
        )
        split.append({**caption, "text": " ".join(chunk), "startMs": cursor, "endMs": chunk_end})
        cursor = chunk_end
    return split


def parse_vtt(path: Path) -> list[dict[str, object]]:
    text = path.read_text(encoding="utf-8-sig").replace("\r\n", "\n")
    pattern = re.compile(
        r"(\d{2}:\d{2}:\d{2}[.,]\d{3})\s+-->\s+"
        r"(\d{2}:\d{2}:\d{2}[.,]\d{3})[^\n]*\n(.+?)(?=\n\n|\Z)",
        re.S,
    )
    captions: list[dict[str, object]] = []
    for start, end, raw_text in pattern.findall(text):
        clean = normalize_caption_text(" ".join(line.strip() for line in raw_text.splitlines() if line.strip()))
        caption = {
                "text": clean,
                "startMs": timestamp_ms(start),
                "endMs": timestamp_ms(end),
                "timestampMs": None,
                "confidence": None,
            }
        captions.extend(split_caption(caption))
    return captions


def duration_seconds(path: Path) -> float:
    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    result = subprocess.run(
        [ffmpeg, "-i", str(path), "-f", "null", "-"],
        capture_output=True,
        text=True,
        check=False,
    )
    match = re.search(r"Duration: (\d+):(\d+):(\d+\.\d+)", result.stderr)
    if not match:
        raise RuntimeError(f"Could not read duration for {path}")
    hours, minutes, seconds = match.groups()
    return int(hours) * 3600 + int(minutes) * 60 + float(seconds)


def generate_scene_audio(scene: dict[str, str]) -> tuple[Path, list[dict[str, object]]]:
    AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    CAPTION_DIR.mkdir(parents=True, exist_ok=True)
    audio = AUDIO_DIR / f"{scene['id']}.mp3"
    stage = ROOT / 'build' / 'narration-staging'
    stage.mkdir(parents=True, exist_ok=True)
    staged_audio = stage / f"{scene['id']}.mp3"
    source_vtt = stage / f"{scene['id']}.source.vtt"
    caption_json = CAPTION_DIR / f"{scene['id']}.json"

    command = [
        sys.executable,
        "-m",
        "edge_tts",
        "--voice",
        VOICE,
        f"--rate={RATE}",
        f"--pitch={PITCH}",
        "--text",
        scene["narration"],
        "--write-media",
        str(staged_audio),
        "--write-subtitles",
        str(source_vtt),
    ]
    environment = os.environ.copy()
    environment["PYTHONPATH"] = str(EDGE_PACKAGES)
    subprocess.run(command, check=True, env=environment)
    captions = parse_vtt(source_vtt)
    if not captions or not staged_audio.is_file() or staged_audio.stat().st_size == 0:
        raise RuntimeError(f"Incomplete narration for {scene['id']}; existing published inputs preserved")
    duration_seconds(staged_audio)
    shutil.copyfile(staged_audio, audio)
    caption_json.write_text(json.dumps(captions, indent=2) + "\n", encoding="utf-8")
    return audio, captions


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--scenes', nargs='+', help='Regenerate only these scene IDs, reusing other audio and captions.')
    args = parser.parse_args()
    if str(EDGE_PACKAGES) not in sys.path:
        sys.path.insert(0, str(EDGE_PACKAGES))
    try:
        __import__("edge_tts")
    except ImportError as error:
        raise SystemExit("edge-tts dependencies are unavailable in build/video-python") from error

    scenes: list[dict[str, str]] = json.loads(CONTENT.read_text(encoding="utf-8"))
    unknown = set(args.scenes or []) - {scene['id'] for scene in scenes}
    if unknown:
        raise SystemExit(f'Unknown scenes: {sorted(unknown)}')
    timing_scenes: list[dict[str, object]] = []
    full_vtt: list[str] = ["WEBVTT", ""]
    current_start_frames = 0
    cue_number = 1

    for scene in scenes:
        if args.scenes is None or scene['id'] in args.scenes:
            audio, captions = generate_scene_audio(scene)
        else:
            audio = AUDIO_DIR / f"{scene['id']}.mp3"
            captions = json.loads((CAPTION_DIR / f"{scene['id']}.json").read_text())
        audio_seconds = duration_seconds(audio)
        duration_frames = math.ceil((audio_seconds + TAIL_SECONDS) * FPS)
        start_ms = round(current_start_frames / FPS * 1000)

        timing_scenes.append(
            {
                "id": scene["id"],
                "durationInFrames": duration_frames,
                "audioDurationSeconds": round(audio_seconds, 3),
                "startFrame": current_start_frames,
            }
        )

        for caption in captions:
            full_vtt.extend(
                [
                    str(cue_number),
                    f"{vtt_timestamp(start_ms + int(caption['startMs']))} --> "
                    f"{vtt_timestamp(start_ms + int(caption['endMs']))}",
                    str(caption["text"]),
                    "",
                ]
            )
            cue_number += 1

        current_start_frames += duration_frames - TRANSITION_FRAMES

    total_frames = current_start_frames + TRANSITION_FRAMES
    timing = {
        "fps": FPS,
        "transitionFrames": TRANSITION_FRAMES,
        "totalFrames": total_frames,
        "scenes": timing_scenes,
        "voice": VOICE,
        "rate": RATE,
        "pitch": PITCH,
    }
    TIMING.write_text(json.dumps(timing, indent=2) + "\n", encoding="utf-8")
    OUTPUT_VTT.write_text("\n".join(full_vtt), encoding="utf-8")
    print(json.dumps(timing, indent=2))


if __name__ == "__main__":
    main()
