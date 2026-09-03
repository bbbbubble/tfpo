# TFPO project page

Official project page for **TFPO: Token-Level Objective Fusion for Stable Preference Alignment**.

The site presents the abstract, method figures, matched capability results,
mechanistic evidence, and a 1920×1080 narrated explainer with English captions.

## Local development

```bash
npm install
npm run dev
```

The GitHub Pages build is fully static:

```bash
npm run build:pages
npm run preview:pages
```

## Paper provenance

`public/paper.pdf` is an exact copy of the author-affiliation camera-ready PDF.

SHA-256:

```text
0e597b867e6e3c064dc108195f70aeb1657c1025cd63834b9693947f7e0baf3b
```

The website intentionally does not state a conference venue and does not
publish the supplementary package.

## Video regeneration

The checked-in video is reproducibly assembled from the paper figures,
animated focus cues, typeset on-frame captions, and source-faithful narration
using an online neural voice. Install the small rendering dependencies and run:

```bash
python3 -m pip install edge-tts pillow imageio-ffmpeg
python3 scripts/make_explainer.py
```

The script uses `en-US-AndrewMultilingualNeural` and an ffmpeg binary supplied
by `imageio-ffmpeg`.
