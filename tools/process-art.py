#!/usr/bin/env python3
"""Turns the raw Nano Banana output in art/raw/ into the files the site uses.

    python3 tools/process-art.py

- skies: resized and saved as WebP
- cloud layers (white paint on black): brightness becomes transparency
- paper plane (on chroma green): green keyed out, cropped to the plane
"""
from pathlib import Path

import numpy as np
from PIL import Image

RAW = Path("art/raw")
OUT = Path("assets/img")
OUT.mkdir(parents=True, exist_ok=True)


def sky(name: str, width: int, quality: int = 80) -> None:
    im = Image.open(RAW / f"{name}.jpg").convert("RGB")
    im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    im.save(OUT / f"{name}.webp", quality=quality, method=6)


def cloud_layer(name: str, width: int, out_name: str | None = None, ramp=None) -> None:
    """ramp: optional (shadow, mid, highlight) RGB colours to repaint the cloud with."""
    im = Image.open(RAW / f"{name}.jpg").convert("RGB")
    im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    rgb = np.asarray(im).astype(np.float32) / 255.0
    lum = rgb.max(axis=2)
    alpha = np.clip((lum - 0.06) / (0.80 - 0.06), 0.0, 1.0)
    # Un-premultiply so the paint keeps its tone where it is half transparent.
    colour = np.clip(rgb / np.maximum(lum, 1e-3)[..., None], 0.0, 1.0)
    colour = colour * 0.35 + 0.65  # keep it near white, with a little of the shading
    if ramp is not None:
        lo, mid, hi = (np.array(c, dtype=np.float32) / 255.0 for c in ramp)
        t = np.clip((lum - 0.5) / 0.5, 0.0, 1.0)[..., None]
        colour = np.where(t < 0.6, lo + (mid - lo) * (t / 0.6), mid + (hi - mid) * ((t - 0.6) / 0.4))
    out = np.dstack([colour, alpha])
    Image.fromarray((out * 255).astype(np.uint8), "RGBA").save(
        OUT / f"{out_name or name}.webp", quality=82, method=6
    )


def plane(name: str, height: int) -> None:
    im = Image.open(RAW / f"{name}.jpg").convert("RGB")
    rgb = np.asarray(im).astype(np.float32) / 255.0
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    greenness = g - np.maximum(r, b)
    alpha = 1.0 - np.clip((greenness - 0.10) / 0.30, 0.0, 1.0)
    # Remove green spill from the edge pixels that stay partly visible.
    g2 = np.minimum(g, np.maximum(r, b) + 0.02)
    out = np.dstack([r, g2, b, alpha])
    cut = Image.fromarray((out * 255).astype(np.uint8), "RGBA")
    # Shave one pixel off the matte so no green fringe survives.
    a = np.asarray(cut.split()[3]).astype(np.float32)
    a = np.minimum.reduce([a, np.roll(a, 1, 0), np.roll(a, -1, 0), np.roll(a, 1, 1), np.roll(a, -1, 1)])
    cut.putalpha(Image.fromarray(a.astype(np.uint8)))
    cut = cut.crop(cut.getbbox())
    cut = cut.resize((round(cut.width * height / cut.height), height), Image.LANCZOS)
    cut.save(OUT / f"{name}.webp", quality=90, method=6)


sky("dawn-sky", 2400)
sky("dusk-sky", 2600)
sky("night-sky", 2600)
cloud_layer("cloud-layer-a", 2400)
cloud_layer("cloud-layer-b", 2400)
# The same bank, repainted in the colours of the dusk sky it sits in front of.
cloud_layer(
    "cloud-layer-b", 2400, out_name="cloud-layer-dusk",
    ramp=((168, 88, 58), (240, 160, 92), (255, 228, 180)),
)
plane("paper-plane", 640)

for f in sorted(OUT.iterdir()):
    print(f"{f.name:24} {f.stat().st_size / 1024:7.0f} KB  {Image.open(f).size}")
