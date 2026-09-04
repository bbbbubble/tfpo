# TFPO

Project page for **TFPO: Token-Level Objective Fusion for Stable Preference Alignment**.

[Project page](https://bbbbubble.github.io/tfpo/) · [Paper](https://bbbbubble.github.io/tfpo/paper.pdf)

> **Research code will be released upon paper acceptance.** This repository
> currently contains only the project website and the source used to produce
> its explainer video. It does not contain TFPO training or evaluation code.

## Video overview

https://github.com/user-attachments/assets/3fe7a38c-6d77-4ad4-864c-ce5b68fad259

## Repository layout

```text
tfpo/
├── site/    # Project-page source and public paper/video files
├── video/   # Remotion composition, narration clips, and caption timing
└── tools/   # Reproducible video-generation utility
```

Generated build directories and dependency folders are excluded from version
control. Paper figures are stored once under `site/public/assets`; the video
project references the same assets rather than keeping duplicate copies.
