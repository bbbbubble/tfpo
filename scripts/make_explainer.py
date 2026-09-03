#!/usr/bin/env python3
"""Build a restrained, paper-style TFPO explainer with neural narration."""

from __future__ import annotations

import math
import re
import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont
import imageio_ffmpeg


ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
BUILD = ROOT / "build" / "video"
WIDTH, HEIGHT, FPS = 1920, 1080, 30

PAPER = "#FFFFFF"
INK = "#171717"
MUTED = "#636363"
LINE = "#D8D8D4"
SOFT = "#F5F5F2"
ACCENT = "#9F382D"
ACCENT_SOFT = "#F5E9E6"
TEAL = "#0D7772"

SERIF = "/System/Library/Fonts/NewYork.ttf"
SERIF_ITALIC = "/System/Library/Fonts/NewYorkItalic.ttf"
SANS = "/System/Library/Fonts/SFNS.ttf"
MONO = "/System/Library/Fonts/SFNSMono.ttf"
VOICE = "en-US-AndrewMultilingualNeural"

SCENES = [
    {
        "slug": "title",
        "section": "PAPER OVERVIEW",
        "title": "TFPO",
        "subtitle": "Token-Level Objective Fusion\nfor Stable Preference Alignment",
        "narration": (
            "Preference optimization usually applies one signal to an entire response. "
            "But explanations, final answers, formatting fields, and code do not necessarily need the same objective. "
            "TFPO learns where preference pressure should act, and where likelihood anchoring should preserve a stable conclusion."
        ),
    },
    {
        "slug": "motivation",
        "section": "1  ·  MOTIVATION",
        "title": "A response is not a\nhomogeneous token string.",
        "narration": (
            "Sequence-level preference learning creates a coarse credit-assignment problem. "
            "Reasoning tokens can benefit from preference shaping because they affect whether an explanation is helpful and well justified. "
            "Short answer fields, option letters, JSON keys, and code fragments often need a likelihood anchor to remain correct, parseable, and stable. "
            "The central question is therefore not only which objectives to mix, but where each objective should be applied."
        ),
    },
    {
        "slug": "method",
        "section": "2  ·  METHOD",
        "title": "Learn a soft route\nbetween two objectives.",
        "narration": (
            "TFPO predicts a scalar gate for every response token using a single linear head over the decoder hidden state. "
            "A low gate value routes token mass toward a DPO-style preference objective. "
            "A high value weights chosen-response negative log likelihood. "
            "The route is learned from preference pairs without token-level labels. "
            "Ratio, total-variation, and entropy regularization prevent collapse, noisy switching, and premature saturation."
        ),
    },
    {
        "slug": "results",
        "section": "3  ·  MAIN RESULTS",
        "title": "Matched capability evaluation",
        "narration": (
            "Under one frozen, method-independent ten-benchmark protocol on post-trained Qwen three eight B, TFPO averages eighty-eight point zero zero. "
            "SimPO averages eighty-three point zero eight, and the NLL-anchored SimPO plus NLL control averages eighty-three point five two. "
            "TFPO is strongest on every benchmark in the main table. "
            "The same routing recipe also improves external alignment across Qwen, Llama, and Mistral backbones, and extends to multimodal preference tuning."
        ),
    },
    {
        "slug": "evidence",
        "section": "4  ·  ROUTING EVIDENCE",
        "title": "Does the gate follow content?",
        "narration": (
            "The mechanism is tested against strict position-only controls, blind answer-span annotations, answer-position counterfactuals, and token-removal interventions. "
            "On one thousand gate-blind and model-blind annotated responses from five extractable-answer tasks, the TFPO content gate reaches zero point eight five A U P R C. "
            "The strongest strict position-only control reaches zero point five five. "
            "When the same answer is moved to the beginning, middle, or end, the content gate remains stable, supporting routing by content rather than a fixed tail shortcut."
        ),
    },
    {
        "slug": "stability",
        "section": "5  ·  STABILITY",
        "title": "Stable answers,\ndiverse explanations.",
        "narration": (
            "With four matched samples per prompt on B B H, G S M eight K, and MATH, TFPO improves answer agreement, majority accuracy, and average accuracy. "
            "At the same time, explanation diversity increases rather than decreases. "
            "The evidence is deliberately bounded: gold spans cover five extractable-answer tasks, the route is latent, and the scale study uses seven to eight billion parameter LoRA settings. "
            "Within those limits, the results support token-level objective routing as a practical route to stronger and more stable preference alignment."
        ),
    },
]


def font(path: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(path, size=size)


def wrap(draw: ImageDraw.ImageDraw, text: str, face, max_width: int) -> list[str]:
    lines: list[str] = []
    for paragraph in text.split("\n"):
        current = ""
        for word in paragraph.split():
            probe = f"{current} {word}".strip()
            if draw.textlength(probe, font=face) <= max_width:
                current = probe
            else:
                if current:
                    lines.append(current)
                current = word
        if current:
            lines.append(current)
    return lines


def draw_text_block(draw, x, y, text, face, fill, max_width, spacing=15):
    line_height = face.getbbox("Ag")[3] - face.getbbox("Ag")[1]
    for line in wrap(draw, text, face, max_width):
        draw.text((x, y), line, font=face, fill=fill)
        y += line_height + spacing
    return y


def canvas(index: int, scene: dict) -> tuple[Image.Image, ImageDraw.ImageDraw]:
    image = Image.new("RGB", (WIDTH, HEIGHT), PAPER)
    draw = ImageDraw.Draw(image)
    draw.text((94, 56), "TFPO", font=font(SERIF, 34), fill=INK)
    draw.text((1600, 65), scene["section"], font=font(MONO, 17), fill=MUTED)
    draw.line((94, 115, 1826, 115), fill=LINE, width=2)
    draw.text((1774, 1001), f"{index + 1} / {len(SCENES)}", font=font(MONO, 16), fill=MUTED)
    return image, draw


def paste_fit(canvas_image: Image.Image, source: Path, box: tuple[int, int, int, int], padding=18):
    x0, y0, x1, y1 = box
    source_image = Image.open(source).convert("RGB")
    source_image.thumbnail((x1 - x0 - 2 * padding, y1 - y0 - 2 * padding), Image.Resampling.LANCZOS)
    ImageDraw.Draw(canvas_image).rectangle(box, fill=PAPER, outline=LINE, width=2)
    x = x0 + (x1 - x0 - source_image.width) // 2
    y = y0 + (y1 - y0 - source_image.height) // 2
    canvas_image.paste(source_image, (x, y))


def heading(draw: ImageDraw.ImageDraw, scene: dict, size=66):
    y = 175
    for line in scene["title"].split("\n"):
        draw.text((94, y), line, font=font(SERIF, size), fill=INK)
        y += size + 13
    return y


def draw_scene(index: int, scene: dict) -> Image.Image:
    image, draw = canvas(index, scene)
    slug = scene["slug"]

    if slug == "title":
        draw.text((94, 212), "TFPO", font=font(SERIF, 172), fill=INK)
        draw.line((100, 420, 420, 420), fill=ACCENT, width=8)
        y = 482
        for line in scene["subtitle"].split("\n"):
            draw.text((94, y), line, font=font(SERIF, 63), fill=INK)
            y += 78
        draw.text((98, 718), "Pei Chen", font=font(SANS, 29), fill=MUTED)
        draw.rectangle((1110, 230, 1780, 825), fill=SOFT)
        draw.text((1166, 294), "TOKEN-LEVEL ROUTING", font=font(MONO, 18), fill=ACCENT)
        draw.text((1164, 384), "reasoning", font=font(SERIF, 38), fill=TEAL)
        draw.text((1164, 447), "1 − gₜ", font=font(MONO, 32), fill=TEAL)
        draw.line((1390, 443, 1695, 443), fill=TEAL, width=6)
        draw.polygon([(1695, 429), (1732, 443), (1695, 457)], fill=TEAL)
        draw.text((1164, 580), "conclusion", font=font(SERIF, 38), fill=ACCENT)
        draw.text((1164, 643), "gₜ", font=font(MONO, 32), fill=ACCENT)
        draw.line((1390, 639, 1695, 639), fill=ACCENT, width=6)
        draw.polygon([(1695, 625), (1732, 639), (1695, 653)], fill=ACCENT)
    elif slug == "motivation":
        heading(draw, scene, 72)
        draw_text_block(draw, 98, 445, "Reasoning tokens benefit from preference shaping.", font(SERIF, 36), TEAL, 700, 13)
        draw_text_block(draw, 98, 610, "Answer fields and code-like fragments often need likelihood anchoring.", font(SERIF, 36), ACCENT, 700, 13)
        draw.rectangle((1010, 245, 1780, 850), fill=SOFT)
        draw.text((1062, 306), "ONE RESPONSE, DIFFERENT ROLES", font=font(MONO, 18), fill=MUTED)
        rows = [
            ("Explanation", "helpful · concise · justified", TEAL),
            ("Final answer", "correct · stable · parseable", ACCENT),
            ("Schema / code", "structured · executable", ACCENT),
        ]
        for i, (label, detail, color) in enumerate(rows):
            y = 408 + i * 140
            draw.text((1062, y), label, font=font(SERIF, 35), fill=INK)
            draw.text((1062, y + 55), detail, font=font(SANS, 22), fill=color)
            if i < 2:
                draw.line((1062, y + 101, 1725, y + 101), fill=LINE, width=2)
    elif slug == "method":
        heading(draw, scene, 68)
        paste_fit(image, PUBLIC / "assets" / "method.png", (92, 390, 1828, 900), padding=12)
        draw.text((98, 932), "Low gₜ → routed preference   ·   High gₜ → chosen-response likelihood anchor", font=font(MONO, 20), fill=MUTED)
    elif slug == "results":
        heading(draw, scene, 68)
        paste_fit(image, PUBLIC / "assets" / "overview.png", (92, 350, 1828, 920), padding=18)
        draw.text((98, 950), "Three-seed means under one frozen, method-independent protocol", font=font(SANS, 20), fill=MUTED)
    elif slug == "evidence":
        heading(draw, scene, 68)
        paste_fit(image, PUBLIC / "assets" / "routing-evidence.png", (92, 342, 1375, 908), padding=12)
        draw.rectangle((1410, 342, 1828, 908), fill=SOFT)
        draw.text((1450, 395), "GOLD-SPAN RECOVERY", font=font(MONO, 17), fill=MUTED)
        draw.text((1450, 485), "0.85", font=font(SERIF, 94), fill=ACCENT)
        draw.text((1450, 590), "TFPO content gate", font=font(SANS, 22), fill=INK)
        draw.line((1450, 655, 1786, 655), fill=LINE, width=2)
        draw.text((1450, 708), "0.55", font=font(SERIF, 66), fill=MUTED)
        draw.text((1450, 785), "best strict position-only", font=font(SANS, 19), fill=MUTED)
    elif slug == "stability":
        heading(draw, scene, 72)
        headers = ["Method", "Agreement@4", "MajorityAcc@4", "AvgAcc@4", "Div.@4"]
        rows = [
            ["SimPO", "88.33", "80.69", "85.73", "59.01"],
            ["SimPO+NLL", "89.01", "81.69", "86.10", "59.72"],
            ["TFPO", "92.69", "86.32", "90.57", "62.33"],
        ]
        x_positions = [100, 615, 905, 1225, 1510]
        y0 = 465
        draw.line((96, y0, 1818, y0), fill=INK, width=3)
        for x, value in zip(x_positions, headers):
            draw.text((x, y0 + 28), value, font=font(SANS, 21), fill=INK)
        draw.line((96, y0 + 84, 1818, y0 + 84), fill=INK, width=2)
        for row_i, row in enumerate(rows):
            y = y0 + 120 + row_i * 105
            if row[0] == "TFPO":
                draw.rectangle((96, y - 18, 1818, y + 68), fill=ACCENT_SOFT)
            for x, value in zip(x_positions, row):
                draw.text((x, y), value, font=font(SERIF if row[0] == "TFPO" else SANS, 28), fill=INK)
            draw.line((96, y + 70, 1818, y + 70), fill=LINE, width=2)
        draw.line((96, y0 + 430, 1818, y0 + 430), fill=INK, width=3)
        draw.text((102, 942), "Higher answer agreement and accuracy, while explanation diversity also increases.", font=font(SERIF_ITALIC, 26), fill=MUTED)
    return image


def ffmpeg_duration(ffmpeg: str, audio: Path) -> float:
    result = subprocess.run([ffmpeg, "-i", str(audio), "-f", "null", "-"], capture_output=True, text=True)
    match = re.search(r"Duration: (\d+):(\d+):(\d+\.\d+)", result.stderr)
    if not match:
        raise RuntimeError(f"Could not read duration for {audio}")
    hours, minutes, seconds = match.groups()
    return int(hours) * 3600 + int(minutes) * 60 + float(seconds)


def timestamp_to_seconds(value: str) -> float:
    hours, minutes, seconds = value.replace(",", ".").split(":")
    return int(hours) * 3600 + int(minutes) * 60 + float(seconds)


def vtt_time(seconds: float) -> str:
    milliseconds = int(round(seconds * 1000))
    hours, remainder = divmod(milliseconds, 3_600_000)
    minutes, remainder = divmod(remainder, 60_000)
    whole_seconds, milliseconds = divmod(remainder, 1000)
    return f"{hours:02d}:{minutes:02d}:{whole_seconds:02d}.{milliseconds:03d}"


def merge_subtitles(subtitles: list[Path], durations: list[float]):
    output = ["WEBVTT", ""]
    offset = 0.0
    cue = 1
    pattern = re.compile(r"(\d{2}:\d{2}:\d{2}[,.]\d{3})\s+-->\s+(\d{2}:\d{2}:\d{2}[,.]\d{3})\s*\n(.+?)(?=\n\n|\Z)", re.S)
    for subtitle, duration in zip(subtitles, durations):
        content = subtitle.read_text(encoding="utf-8-sig").replace("\r\n", "\n")
        for start, end, caption in pattern.findall(content):
            output.extend([
                str(cue),
                f"{vtt_time(offset + timestamp_to_seconds(start))} --> {vtt_time(offset + timestamp_to_seconds(end))}",
                " ".join(caption.splitlines()),
                "",
            ])
            cue += 1
        offset += duration
    (PUBLIC / "tfpo-explainer.vtt").write_text("\n".join(output), encoding="utf-8")


def make_social_card():
    width, height = 1536, 864
    image = Image.new("RGB", (width, height), PAPER)
    draw = ImageDraw.Draw(image)
    draw.text((86, 65), "TFPO", font=font(SERIF, 38), fill=INK)
    draw.text((1250, 76), "RESEARCH PROJECT", font=font(MONO, 15), fill=MUTED)
    draw.line((86, 125, 1450, 125), fill=LINE, width=2)
    title_face = font(SERIF, 55)
    draw.text((86, 201), "Token-Level Objective", font=title_face, fill=INK)
    draw.text((86, 272), "Fusion for Stable", font=title_face, fill=INK)
    draw.text((86, 343), "Preference Alignment", font=title_face, fill=INK)
    draw.line((90, 448, 340, 448), fill=ACCENT, width=7)
    draw.text((88, 493), "Pei Chen", font=font(SANS, 25), fill=MUTED)
    paste_fit(image, PUBLIC / "assets" / "method.png", (700, 175, 1450, 725), padding=16)
    draw.text((88, 751), "Preference where it helps. Likelihood anchoring where stability matters.", font=font(SERIF_ITALIC, 26), fill=MUTED)
    image.save(PUBLIC / "og.png", optimize=True)


def main():
    try:
        __import__("edge_tts")
    except ImportError as error:
        raise SystemExit("Install edge-tts before rendering: python -m pip install edge-tts") from error

    BUILD.mkdir(parents=True, exist_ok=True)
    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    clips: list[Path] = []
    subtitles: list[Path] = []
    durations: list[float] = []

    for index, scene in enumerate(SCENES):
        stem = f"scene-{index + 1:02d}"
        still = BUILD / f"{stem}.png"
        audio = BUILD / f"{stem}.mp3"
        subtitle = BUILD / f"{stem}.srt"
        clip = BUILD / f"{stem}.mp4"
        draw_scene(index, scene).save(still, optimize=True)
        subprocess.run([
            sys.executable, "-m", "edge_tts",
            "--voice", VOICE,
            "--rate=-6%",
            "--pitch=-2Hz",
            "--text", scene["narration"],
            "--write-media", str(audio),
            "--write-subtitles", str(subtitle),
        ], check=True)
        duration = ffmpeg_duration(ffmpeg, audio) + 0.45
        durations.append(duration)
        subtitles.append(subtitle)
        fade_out = max(0.0, duration - 0.45)
        frames = math.ceil(duration * FPS)
        video_filter = f"zoompan=z='min(zoom+0.000018,1.012)':d={frames}:s=1920x1080:fps={FPS},fade=t=in:st=0:d=0.35,fade=t=out:st={fade_out:.3f}:d=0.4,format=yuv420p"
        subprocess.run([
            ffmpeg, "-y", "-loop", "1", "-i", str(still), "-i", str(audio),
            "-vf", video_filter, "-t", f"{duration:.3f}", "-r", str(FPS),
            "-c:v", "libx264", "-preset", "medium", "-crf", "21",
            "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2",
            "-movflags", "+faststart", str(clip),
        ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        clips.append(clip)

    concat = BUILD / "concat.txt"
    concat.write_text("\n".join(f"file '{clip}'" for clip in clips), encoding="utf-8")
    output = PUBLIC / "tfpo-explainer.mp4"
    subprocess.run([
        ffmpeg, "-y", "-f", "concat", "-safe", "0", "-i", str(concat),
        "-c", "copy", "-movflags", "+faststart", str(output),
    ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    poster = draw_scene(0, SCENES[0]).resize((1600, 900), Image.Resampling.LANCZOS)
    poster.save(PUBLIC / "assets" / "video-poster.jpg", quality=92, optimize=True)
    merge_subtitles(subtitles, durations)
    make_social_card()
    print(f"Created {output} ({sum(durations):.2f}s, {VOICE})")
    print(f"Poster: {PUBLIC / 'assets' / 'video-poster.jpg'}")
    print(f"Captions: {PUBLIC / 'tfpo-explainer.vtt'}")
    print(f"Social card: {PUBLIC / 'og.png'}")


if __name__ == "__main__":
    main()
