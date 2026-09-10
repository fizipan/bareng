"""Buat ikon PWA & splash iOS dari logo Bareng. Jalankan: python3 scripts/pwa-icons.py"""
from pathlib import Path
from PIL import Image, ImageDraw

RED, PAPER, DARK, FLASH = (228, 70, 46), (244, 243, 239), (22, 20, 29), (255, 210, 63)
ROOT = Path(__file__).resolve().parent.parent


def mark(size, rounded=True, strip_scale=1.0, bg=RED):
    # Gambar 8x lebih besar lalu diperkecil supaya tepinya halus.
    S = size * 8
    u = S / 34
    im = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    if rounded:
        d.rounded_rectangle([0, 0, S - 1, S - 1], radius=10 * u, fill=bg)
    else:
        d.rectangle([0, 0, S - 1, S - 1], fill=bg)
    k = strip_scale
    w, h = 14 * u * k, 24 * u * k
    x0, y0 = (S - w) / 2, (S - h) / 2
    d.rounded_rectangle([x0, y0, x0 + w, y0 + h], radius=2 * u * k, fill=PAPER)
    pad, gap = 2.5 * u * k, 2 * u * k
    cw, ch = w - 2 * pad, (h - 2 * pad - 2 * gap) / 3
    for i, c in enumerate([DARK, FLASH, DARK]):
        cy = y0 + pad + i * (ch + gap)
        d.rounded_rectangle([x0 + pad, cy, x0 + pad + cw, cy + ch], radius=1 * u * k, fill=c)
    return im.resize((size, size), Image.LANCZOS)


icons = ROOT / "public" / "icons"
icons.mkdir(parents=True, exist_ok=True)
for s in (192, 512):
    mark(s).save(icons / f"icon-{s}.png", optimize=True)
    # Maskable: latar penuh, strip di dalam zona aman (lingkaran 80%).
    mark(s, rounded=False, strip_scale=0.8).convert("RGB").save(icons / f"maskable-{s}.png", optimize=True)
mark(96).save(icons / "shortcut-96.png", optimize=True)

# Splash iOS (apple-touch-startup-image): latar kertas + logo di tengah.
SPLASH = [
    # (lebar CSS, tinggi CSS, dpr)
    (440, 956, 3), (402, 874, 3), (430, 932, 3), (393, 852, 3), (428, 926, 3),
    (390, 844, 3), (375, 812, 3), (414, 896, 3), (414, 896, 2), (375, 667, 2),
    (820, 1180, 2), (1024, 1366, 2),
]
splash = ROOT / "public" / "splash"
splash.mkdir(parents=True, exist_ok=True)
for w, h, dpr in SPLASH:
    W, H = w * dpr, h * dpr
    im = Image.new("RGB", (W, H), PAPER)
    logo = mark(int(min(W, H) * 0.24))
    im.paste(logo, ((W - logo.width) // 2, (H - logo.height) // 2), logo)
    im.save(splash / f"splash-{W}x{H}.png", optimize=True)
print("ok")
