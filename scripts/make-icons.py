#!/usr/bin/env python3
"""스터디픽 PWA 아이콘 생성기.

favicon.svg 와 같은 브랜드(시안→민트 그라데이션 + 진한 네이비 펼친 책)를
PIL 로 다시 그려 PNG 로 저장한다. maskable 아이콘으로도 안전하도록 배경은
정사각형 전체를 채우고, 책은 중앙 60% 안전 영역 안에 둔다.
"""

import os

from PIL import Image, ImageDraw

TOP = (34, 211, 238)      # #22d3ee
BOTTOM = (45, 212, 191)   # #2dd4bf
INK = (5, 7, 13)          # #05070d

OUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "public")


def gradient(size: int, ss: int = 2) -> Image.Image:
    s = size * ss
    img = Image.new("RGB", (s, s))
    px = img.load()
    for y in range(s):
        for x in range(s):
            t = ((x / (s - 1)) + (y / (s - 1))) / 2.0
            px[x, y] = (
                round(TOP[0] + (BOTTOM[0] - TOP[0]) * t),
                round(TOP[1] + (BOTTOM[1] - TOP[1]) * t),
                round(TOP[2] + (BOTTOM[2] - TOP[2]) * t),
            )
    return img.resize((size, size), Image.LANCZOS)


def rounded_mask(size: int, radius_ratio: float = 0.25, ss: int = 4) -> Image.Image:
    s = size * ss
    mask = Image.new("L", (s, s), 0)
    draw = ImageDraw.Draw(mask)
    r = int(s * radius_ratio)
    draw.rounded_rectangle([0, 0, s - 1, s - 1], radius=r, fill=255)
    return mask.resize((size, size), Image.LANCZOS)


def book_mask(size: int, ss: int = 4) -> Image.Image:
    """펼친 책 실루엣을 슈퍼샘플링으로 그려 알파 마스크로 반환한다."""
    s = size * ss
    mask = Image.new("L", (s, s), 0)
    draw = ImageDraw.Draw(mask)

    def p(x: float, y: float) -> tuple[float, float]:
        return (x / 64.0 * s, y / 64.0 * s)

    # 왼쪽 페이지 · 오른쪽 페이지 (가운데는 살짝 벌어지게)
    draw.polygon([p(16.5, 21.5), p(30, 18.6), p(30, 44.4), p(16.5, 47)], fill=255)
    draw.polygon([p(47.5, 21.5), p(34, 18.6), p(34, 44.4), p(47.5, 47)], fill=255)
    # 책등 아래 둥근 표식
    draw.ellipse([p(28.6, 48.4)[0], p(28.6, 48.4)[1], p(35.4, 54)[0], p(35.4, 54)[1]], fill=255)

    return mask.resize((size, size), Image.LANCZOS)


def build(size: int, path: str, rounded: bool = True) -> None:
    base = gradient(size)
    if rounded:
        tile = Image.new("RGB", (size, size), (8, 13, 24))
        tile.paste(base, (0, 0), rounded_mask(size))
        base = tile
    layer = Image.new("RGB", (size, size), INK)
    icon = Image.composite(layer, base, book_mask(size))
    icon.save(path, "PNG", optimize=True)
    print(f"{path}  {size}x{size}")


if __name__ == "__main__":
    os.makedirs(OUT_DIR, exist_ok=True)
    build(512, os.path.join(OUT_DIR, "icon-512.png"), rounded=False)
    build(192, os.path.join(OUT_DIR, "icon-192.png"), rounded=False)
    build(180, os.path.join(OUT_DIR, "apple-touch-icon.png"), rounded=False)
