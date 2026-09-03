#!/usr/bin/env python3
"""Build the animated TFPO paper explainer with neural narration and captions."""

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
WIDTH, HEIGHT = 1920, 1080
FPS = 18

PAPER = "#FFFFFF"
INK = "#171717"
MUTED = "#686865"
LINE = "#D7D7D2"
SOFT = "#F4F4F0"
ACCENT = "#9F382D"
ACCENT_SOFT = "#F5E9E6"
TEAL = "#0D7772"
TEAL_SOFT = "#E4F1EF"

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
        "title": "One response.\nDifferent functional roles.",
        "narration": (
            "The idea starts from a simple observation: a response is not one uniform object. "
            "Reasoning tokens shape whether an explanation is helpful and well justified. "
            "Answer fields, option letters, schema keys, and code fragments often need a likelihood anchor to remain stable. "
            "So the question is not only which objectives to mix, but where each one should act."
        ),
    },
    {
        "slug": "method",
        "section": "2  ·  METHOD",
        "title": "A learned route\nbetween two objectives.",
        "narration": (
            "For each response token, a small linear gate reads the decoder state. "
            "Low gate values route mass toward a DPO-style preference objective. "
            "High values weight chosen-response negative log likelihood. "
            "The gate learns this soft partition from preference pairs, without token labels. "
            "Ratio, smoothness, and entropy terms keep the route from collapsing or switching noisily."
        ),
    },
    {
        "slug": "results",
        "section": "3  ·  MAIN RESULTS",
        "title": "Matched capability evaluation",
        "narration": (
            "Under one frozen ten-benchmark protocol, TFPO averages eighty-eight point zero zero on Qwen three eight B. "
            "SimPO reaches eighty-three point zero eight. "
            "The NLL-anchored SimPO plus NLL control reaches eighty-three point five two. "
            "TFPO is strongest on every benchmark in the main table, spanning reasoning, instruction following, math, reading, and code."
        ),
    },
    {
        "slug": "evidence",
        "section": "4  ·  ROUTING EVIDENCE",
        "title": "Does the gate follow content?",
        "narration": (
            "The routing claim is tested directly, not inferred from benchmark scores. "
            "The evaluation uses strict position-only controls, blind answer-span annotations, counterfactual answer placement, and token-removal interventions. "
            "Across one thousand annotated responses, the content gate reaches zero point eight five A U P R C. "
            "The strongest strict position-only control reaches zero point five five."
        ),
    },
    {
        "slug": "multimodal",
        "section": "5  ·  GENERALIZATION",
        "title": "Across models and modalities",
        "narration": (
            "The same routing recipe improves external alignment across Qwen, Llama, and Mistral backbones. "
            "It also extends to multimodal preference tuning. "
            "These examples show the practical failure modes: drifting to the wrong option, omitting the required label, or destabilizing a numerical conclusion after visual reasoning."
        ),
    },
    {
        "slug": "stability",
        "section": "6  ·  STABILITY",
        "title": "Stable answers.\nDiverse explanations.",
        "narration": (
            "With four matched samples per prompt, TFPO improves answer agreement, majority accuracy, and average accuracy. "
            "Explanation diversity also increases, rather than being traded away. "
            "Taken together, the results support a simple view: preference alignment should ask not only whether reward improves, but where optimization pressure acts inside the response."
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


def base_canvas(index: int, scene: dict) -> tuple[Image.Image, ImageDraw.ImageDraw]:
    image = Image.new("RGB", (WIDTH, HEIGHT), PAPER)
    draw = ImageDraw.Draw(image)
    draw.text((94, 56), "TFPO", font=font(SERIF, 34), fill=INK)
    draw.text((1560, 65), scene["section"], font=font(MONO, 17), fill=MUTED)
    draw.line((94, 115, 1826, 115), fill=LINE, width=2)
    draw.text((1774, 1010), f"{index + 1} / {len(SCENES)}", font=font(MONO, 16), fill=MUTED)
    return image, draw


def paste_fit(canvas_image: Image.Image, source: Path, box: tuple[int, int, int, int], padding=18):
    x0, y0, x1, y1 = box
    source_image = Image.open(source).convert("RGB")
    source_image.thumbnail((x1 - x0 - 2 * padding, y1 - y0 - 2 * padding), Image.Resampling.LANCZOS)
    ImageDraw.Draw(canvas_image).rectangle(box, fill=PAPER, outline=LINE, width=2)
    x = x0 + (x1 - x0 - source_image.width) // 2
    y = y0 + (y1 - y0 - source_image.height) // 2
    canvas_image.paste(source_image, (x, y))


def heading(draw: ImageDraw.ImageDraw, scene: dict, size=68):
    y = 166
    for line in scene["title"].split("\n"):
        draw.text((94, y), line, font=font(SERIF, size), fill=INK)
        y += size + 13
    return y


def draw_scene(index: int, scene: dict) -> Image.Image:
    image, draw = base_canvas(index, scene)
    slug = scene["slug"]

    if slug == "title":
        draw.text((94, 212), "TFPO", font=font(SERIF, 172), fill=INK)
        draw.line((100, 420, 420, 420), fill=ACCENT, width=8)
        y = 482
        for line in scene["subtitle"].split("\n"):
            draw.text((94, y), line, font=font(SERIF, 63), fill=INK)
            y += 78
        draw.text((98, 718), "Pei Chen", font=font(SANS, 29), fill=MUTED)
        draw.rectangle((1085, 225, 1790, 825), fill=SOFT)
        draw.text((1140, 284), "TOKEN-LEVEL ROUTING", font=font(MONO, 18), fill=ACCENT)
        draw.text((1140, 374), "reasoning", font=font(SERIF, 38), fill=TEAL)
        draw.text((1140, 437), "1 − gₜ", font=font(MONO, 32), fill=TEAL)
        draw.line((1370, 433, 1690, 433), fill=TEAL, width=5)
        draw.polygon([(1690, 419), (1728, 433), (1690, 447)], fill=TEAL)
        draw.text((1140, 570), "conclusion", font=font(SERIF, 38), fill=ACCENT)
        draw.text((1140, 633), "gₜ", font=font(MONO, 32), fill=ACCENT)
        draw.line((1370, 629, 1690, 629), fill=ACCENT, width=5)
        draw.polygon([(1690, 615), (1728, 629), (1690, 643)], fill=ACCENT)
    elif slug == "motivation":
        heading(draw, scene, 72)
        draw_text_block(draw, 98, 430, "The sequence-level view", font(MONO, 18), MUTED, 650)
        draw_text_block(draw, 98, 478, "One objective decision is inherited by every token.", font(SERIF, 34), INK, 720, 12)
        draw.rectangle((990, 225, 1790, 850), fill=SOFT)
        draw.text((1040, 283), "FUNCTIONAL ROLES WITHIN ONE RESPONSE", font=font(MONO, 17), fill=MUTED)
        rows = [
            ("Explanation", "helpful · concise · well justified", TEAL),
            ("Final answer", "correct · stable · parseable", ACCENT),
            ("Schema / code", "structured · executable", ACCENT),
        ]
        for i, (label, detail, color) in enumerate(rows):
            y = 392 + i * 142
            draw.text((1040, y), label, font=font(SERIF, 35), fill=INK)
            draw.text((1040, y + 55), detail, font=font(SANS, 22), fill=color)
            if i < 2:
                draw.line((1040, y + 103, 1738, y + 103), fill=LINE, width=2)
        draw.line((100, 704, 760, 704), fill=LINE, width=2)
        draw_text_block(draw, 98, 745, "The useful question is where each objective should act.", font(SERIF_ITALIC, 29), ACCENT, 680, 10)
    elif slug == "method":
        heading(draw, scene, 68)
        paste_fit(image, PUBLIC / "assets" / "method.png", (92, 350, 1828, 885), padding=12)
        draw.text((98, 915), "Low gₜ → routed preference   ·   High gₜ → chosen-response likelihood anchor", font=font(MONO, 20), fill=MUTED)
    elif slug == "results":
        heading(draw, scene, 68)
        paste_fit(image, PUBLIC / "assets" / "overview.png", (92, 320, 1828, 885), padding=18)
        draw.text((98, 916), "Three-seed means under one frozen, method-independent protocol", font=font(SANS, 20), fill=MUTED)
    elif slug == "evidence":
        heading(draw, scene, 68)
        paste_fit(image, PUBLIC / "assets" / "routing-evidence.png", (92, 320, 1375, 885), padding=12)
        draw.rectangle((1410, 320, 1828, 885), fill=SOFT)
        draw.text((1450, 375), "GOLD-SPAN RECOVERY", font=font(MONO, 17), fill=MUTED)
        draw.text((1450, 465), "0.85", font=font(SERIF, 94), fill=ACCENT)
        draw.text((1450, 570), "TFPO content gate", font=font(SANS, 22), fill=INK)
        draw.line((1450, 635, 1786, 635), fill=LINE, width=2)
        draw.text((1450, 688), "0.55", font=font(SERIF, 66), fill=MUTED)
        draw.text((1450, 765), "best strict position-only", font=font(SANS, 19), fill=MUTED)
    elif slug == "multimodal":
        heading(draw, scene, 68)
        paste_fit(image, PUBLIC / "assets" / "multimodal-cases.png", (92, 292, 1828, 900), padding=12)
        draw.text((98, 932), "Visual counting · map reasoning · numerical VQA", font=font(MONO, 19), fill=MUTED)
    elif slug == "stability":
        heading(draw, scene, 72)
        headers = ["Method", "Agreement@4", "MajorityAcc@4", "AvgAcc@4", "Div.@4"]
        rows = [
            ["SimPO", "88.33", "80.69", "85.73", "59.01"],
            ["SimPO+NLL", "89.01", "81.69", "86.10", "59.72"],
            ["TFPO", "92.69", "86.32", "90.57", "62.33"],
        ]
        xs = [100, 610, 910, 1230, 1530]
        y0 = 440
        draw.line((96, y0, 1818, y0), fill=INK, width=3)
        for x, value in zip(xs, headers):
            draw.text((x, y0 + 27), value, font=font(SANS, 21), fill=INK)
        draw.line((96, y0 + 84, 1818, y0 + 84), fill=INK, width=2)
        for row_i, row in enumerate(rows):
            y = y0 + 120 + row_i * 105
            if row[0] == "TFPO":
                draw.rectangle((96, y - 18, 1818, y + 68), fill=ACCENT_SOFT)
            for x, value in zip(xs, row):
                draw.text((x, y), value, font=font(SERIF if row[0] == "TFPO" else SANS, 28), fill=INK)
            draw.line((96, y + 70, 1818, y + 70), fill=LINE, width=2)
        draw.line((96, y0 + 430, 1818, y0 + 430), fill=INK, width=3)
        draw.text((102, 906), "Higher answer agreement and accuracy — with greater explanation diversity.", font=font(SERIF_ITALIC, 26), fill=MUTED)
    return image


def ease(value: float) -> float:
    value = max(0.0, min(1.0, value))
    return 1 - (1 - value) ** 3


def draw_caption(draw: ImageDraw.ImageDraw, caption: str):
    if not caption:
        return
    face = font(SANS, 27)
    lines = wrap(draw, caption, face, 1460)
    line_height = 34
    box_height = 36 + len(lines) * line_height
    y0 = 975 - box_height
    draw.rectangle((178, y0, 1742, 982), fill="#FBFBF8", outline=LINE, width=2)
    draw.rectangle((178, y0, 185, 982), fill=ACCENT)
    y = y0 + 17
    for line in lines:
        width = draw.textlength(line, font=face)
        draw.text(((WIDTH - width) / 2, y), line, font=face, fill=INK)
        y += line_height


def animate_frame(base: Image.Image, slug: str, time_value: float, duration: float, caption: str) -> Image.Image:
    entrance = ease(time_value / 0.75)
    offset = int(18 * (1 - entrance))
    frame = Image.new("RGB", (WIDTH, HEIGHT), PAPER)
    frame.paste(base, (0, offset))
    draw = ImageDraw.Draw(frame)
    phase = time_value * 2.2
    pulse = 0.5 + 0.5 * math.sin(phase)

    if slug == "title":
        for index in range(6):
            branch_y = 433 if index % 2 == 0 else 629
            x = 1372 + int((time_value * 155 + index * 76) % 330)
            color = TEAL if branch_y == 433 else ACCENT
            radius = 7 + int(2 * pulse)
            draw.ellipse((x - radius, branch_y - radius, x + radius, branch_y + radius), fill=color)
    elif slug == "motivation":
        active = int((time_value / max(duration, 1)) * 3) % 3
        y = 387 + active * 142
        draw.rectangle((1017, y, 1024, y + 88), fill=TEAL if active == 0 else ACCENT)
    elif slug == "method":
        x0, y0, x1, y1 = 635, 368, 1370, 817
        inset = int(3 * pulse)
        draw.rectangle((x0 - inset, y0 - inset, x1 + inset, y1 + inset), outline=ACCENT, width=3)
        tracer_x = 700 + int((time_value * 120) % 570)
        draw.ellipse((tracer_x - 7, 589 - 7, tracer_x + 7, 589 + 7), fill=ACCENT)
    elif slug == "results":
        panel = min(2, int((time_value / max(duration, 1)) * 3))
        boxes = [(112, 345, 642, 855), (665, 345, 1213, 855), (1235, 345, 1808, 855)]
        box = boxes[panel]
        draw.rectangle(box, outline=ACCENT, width=3)
        draw.line((box[0], box[3] + 8, box[0] + int((box[2] - box[0]) * pulse), box[3] + 8), fill=ACCENT, width=5)
    elif slug == "evidence":
        draw.rectangle((1424, 333, 1814, 872), outline=ACCENT, width=2 + int(2 * pulse))
        marker_y = 350 + int((time_value * 36) % 480)
        draw.line((108, marker_y, 1355, marker_y), fill="#B95B52", width=2)
    elif slug == "multimodal":
        column = min(2, int((time_value / max(duration, 1)) * 3))
        boxes = [(110, 314, 655, 878), (676, 314, 1235, 878), (1255, 314, 1810, 878)]
        draw.rectangle(boxes[column], outline=TEAL if column == 1 else ACCENT, width=4)
    elif slug == "stability":
        underline_width = int(1660 * ease(min(time_value / 3.0, 1.0)))
        draw.line((126, 845, 126 + underline_width, 845), fill=ACCENT, width=5)

    draw.line((94, 1038, 94 + int(1732 * (time_value / max(duration, .1))), 1038), fill=ACCENT, width=4)
    draw_caption(draw, caption)

    if time_value < 0.35:
        frame = Image.blend(Image.new("RGB", frame.size, PAPER), frame, ease(time_value / 0.35))
    remaining = duration - time_value
    if remaining < 0.35:
        frame = Image.blend(Image.new("RGB", frame.size, PAPER), frame, ease(remaining / 0.35))
    return frame


def parse_srt(path: Path) -> list[tuple[float, float, str]]:
    content = path.read_text(encoding="utf-8-sig").replace("\r\n", "\n")
    pattern = re.compile(r"(\d{2}:\d{2}:\d{2}[,.]\d{3})\s+-->\s+(\d{2}:\d{2}:\d{2}[,.]\d{3})\s*\n(.+?)(?=\n\n|\Z)", re.S)
    return [(timestamp_to_seconds(start), timestamp_to_seconds(end), " ".join(text.splitlines())) for start, end, text in pattern.findall(content)]


def caption_at(cues: list[tuple[float, float, str]], time_value: float) -> str:
    for start, end, text in cues:
        if start <= time_value <= end:
            return text
    return ""


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
    cue_number = 1
    for subtitle, duration in zip(subtitles, durations):
        for start, end, caption in parse_srt(subtitle):
            output.extend([str(cue_number), f"{vtt_time(offset + start)} --> {vtt_time(offset + end)}", caption, ""])
            cue_number += 1
        offset += duration
    (PUBLIC / "tfpo-explainer.vtt").write_text("\n".join(output), encoding="utf-8")


def encode_scene(ffmpeg: str, base: Image.Image, scene: dict, audio: Path, subtitle: Path, output: Path, duration: float):
    cues = parse_srt(subtitle)
    command = [
        ffmpeg, "-y",
        "-f", "rawvideo", "-vcodec", "rawvideo", "-pix_fmt", "rgb24",
        "-s", f"{WIDTH}x{HEIGHT}", "-r", str(FPS), "-i", "-",
        "-i", str(audio), "-t", f"{duration:.3f}",
        "-c:v", "libx264", "-preset", "fast", "-crf", "21", "-r", "30", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2",
        "-movflags", "+faststart", str(output),
    ]
    process = subprocess.Popen(command, stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    assert process.stdin is not None
    try:
        for frame_number in range(math.ceil(duration * FPS)):
            time_value = frame_number / FPS
            frame = animate_frame(base, scene["slug"], time_value, duration, caption_at(cues, time_value))
            process.stdin.write(frame.tobytes())
    finally:
        process.stdin.close()
    if process.wait() != 0:
        raise RuntimeError(f"ffmpeg failed while encoding {output}")


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
        audio = BUILD / f"{stem}.mp3"
        subtitle = BUILD / f"{stem}.srt"
        clip = BUILD / f"{stem}.mp4"
        subprocess.run([
            sys.executable, "-m", "edge_tts", "--voice", VOICE,
            "--rate=+2%", "--pitch=-2Hz", "--text", scene["narration"],
            "--write-media", str(audio), "--write-subtitles", str(subtitle),
        ], check=True)
        duration = ffmpeg_duration(ffmpeg, audio) + 0.35
        base = draw_scene(index, scene)
        encode_scene(ffmpeg, base, scene, audio, subtitle, clip, duration)
        clips.append(clip)
        subtitles.append(subtitle)
        durations.append(duration)
        print(f"Rendered {index + 1}/{len(SCENES)}: {scene['slug']} ({duration:.1f}s)", flush=True)

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
    print(f"Created {output} ({sum(durations):.2f}s, animated, {VOICE})")


if __name__ == "__main__":
    main()
