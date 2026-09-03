#!/usr/bin/env python3
"""Generate TFPO narration, timed captions, and Remotion timing metadata."""

from __future__ import annotations

import json
import math
import os
import re
import subprocess
import sys
from pathlib import Path

import imageio_ffmpeg


ROOT = Path(__file__).resolve().parents[1]
REMOTION = ROOT / "remotion-video"
CONTENT = REMOTION / "src" / "content.json"
TIMING = REMOTION / "src" / "timing.json"
AUDIO_DIR = ROOT / "public" / "video" / "audio"
CAPTION_DIR = ROOT / "public" / "video" / "captions"
OUTPUT_VTT = ROOT / "public" / "tfpo-explainer.vtt"
EDGE_PACKAGES = ROOT / "build" / "video-python"

FPS = 30
TRANSITION_FRAMES = 18
TAIL_SECONDS = 1.25
VOICE = "en-US-AvaMultilingualNeural"
RATE = "-3%"
PITCH = "-2Hz"


def timestamp_ms(value: str) -> int:
    hours, minutes, seconds = value.replace(",", ".").split(":")
    return round((int(hours) * 3600 + int(minutes) * 60 + float(seconds)) * 1000)


def vtt_timestamp(value_ms: int) -> str:
    hours, remainder = divmod(value_ms, 3_600_000)
    minutes, remainder = divmod(remainder, 60_000)
    seconds, milliseconds = divmod(remainder, 1000)
    return f"{hours:02d}:{minutes:02d}:{seconds:02d}.{milliseconds:03d}"


def parse_vtt(path: Path) -> list[dict[str, object]]:
    text = path.read_text(encoding="utf-8-sig").replace("\r\n", "\n")
    pattern = re.compile(
        r"(\d{2}:\d{2}:\d{2}[.,]\d{3})\s+-->\s+"
        r"(\d{2}:\d{2}:\d{2}[.,]\d{3})[^\n]*\n(.+?)(?=\n\n|\Z)",
        re.S,
    )
    captions: list[dict[str, object]] = []
    for start, end, raw_text in pattern.findall(text):
        clean = " ".join(line.strip() for line in raw_text.splitlines() if line.strip())
        captions.append(
            {
                "text": clean,
                "startMs": timestamp_ms(start),
                "endMs": timestamp_ms(end),
                "timestampMs": None,
                "confidence": None,
            }
        )
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
    source_vtt = CAPTION_DIR / f"{scene['id']}.source.vtt"
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
        str(audio),
        "--write-subtitles",
        str(source_vtt),
    ]
    environment = os.environ.copy()
    environment["PYTHONPATH"] = str(EDGE_PACKAGES)
    subprocess.run(command, check=True, env=environment)
    captions = parse_vtt(source_vtt)
    caption_json.write_text(json.dumps(captions, indent=2) + "\n", encoding="utf-8")
    source_vtt.unlink()
    return audio, captions


def main() -> None:
    if str(EDGE_PACKAGES) not in sys.path:
        sys.path.insert(0, str(EDGE_PACKAGES))
    try:
        __import__("edge_tts")
    except ImportError as error:
        raise SystemExit("edge-tts dependencies are unavailable in build/video-python") from error

    scenes: list[dict[str, str]] = json.loads(CONTENT.read_text(encoding="utf-8"))
    timing_scenes: list[dict[str, object]] = []
    full_vtt: list[str] = ["WEBVTT", ""]
    current_start_frames = 0
    cue_number = 1

    for scene in scenes:
        audio, captions = generate_scene_audio(scene)
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
