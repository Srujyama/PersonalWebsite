"""Stipple the OUTLINE of the Cal mark instead of filling its background.

The old data stippled the dark field and left the letterforms as negative
space, so the intro read as a black block with a hole in it. The logo already
carries a gold keyline around every stroke and every counter; sampling that
gives a dot drawing of the outline itself.
"""
import json, random
import numpy as np
from PIL import Image

random.seed(7)
im = Image.open("public/Cal_logo.png").convert("RGBA")
W, H = im.size
a = np.asarray(im).astype(np.int16)
R, G, B, A = a[..., 0], a[..., 1], a[..., 2], a[..., 3]

# Gold keyline ~#FDB515. Generous bounds: the PNG is antialiased, so the stroke
# edges blend toward navy on one side and transparent on the other.
gold = (A > 140) & (R > 170) & (G > 100) & (G < 225) & (B < 130) & (R - B > 90)
ys, xs = np.nonzero(gold)
print("gold px:", len(xs), "of", W * H)

pts = list(zip(xs.tolist(), ys.tolist()))
random.shuffle(pts)

# Poisson-ish thinning on a spatial hash so the dots space evenly instead of
# clumping where the stroke is thick.
MIN = 1.35
cell = MIN
grid = {}
kept = []
for x, y in pts:
    gx, gy = int(x / cell), int(y / cell)
    ok = True
    for dx in (-1, 0, 1):
        for dy in (-1, 0, 1):
            for (px, py) in grid.get((gx + dx, gy + dy), ()):
                if (px - x) ** 2 + (py - y) ** 2 < MIN * MIN:
                    ok = False
                    break
            if not ok: break
        if not ok: break
    if ok:
        grid.setdefault((gx, gy), []).append((x, y))
        kept.append((x, y))

print("kept:", len(kept))

dots = [
    {"x": round(x / W, 5), "y": round(y / H, 5), "r": round(1.55 + random.random() * 0.5, 3)}
    for x, y in kept
]
json.dump({"width": W, "height": H, "dotCount": len(dots), "dots": dots},
          open("public/stipple_data.json", "w"))
print("wrote", len(dots), "dots;", W, "x", H)

# Preview exactly what the intro will draw.
S = 3
prev = Image.new("RGB", (W * S, H * S), (244, 243, 240))
from PIL import ImageDraw
d = ImageDraw.Draw(prev)
for p in dots:
    x, y, r = p["x"] * W * S, p["y"] * H * S, p["r"] * 2.2 * S / 2.4
    d.ellipse([x - r, y - r, x + r, y + r], fill=(18, 18, 17))
prev.save("/tmp/stipple_preview.png")
print("preview written")
