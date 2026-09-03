# TFPO project page

Official project page for **TFPO: Token-Level Objective Fusion for Stable Preference Alignment**.

The site presents the abstract, method figures, matched capability results,
mechanistic evidence, and a 1920×1080 narrated explainer with English captions.

> **Research-code status:** this repository contains the project website and
> video-production source only. The TFPO research implementation is not included
> and will be released upon paper acceptance.

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

## Video production

The checked-in video is built as a Remotion composition with native typography,
purposeful data animation, paper-derived assets, unobtrusive captions, and
source-faithful English narration. Generate the narration timing first, then
render the composition:

```bash
python3 scripts/make_explainer.py
cd remotion-video
npm install
npx remotion render TFPOExplainer ../public/tfpo-explainer.mp4
```

The current narration uses `en-US-AvaMultilingualNeural`. An optional WebVTT
track is also generated for browser accessibility.
