#!/usr/bin/env python3
"""Split a card sprite sheet into individual card images."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from PIL import Image


def parse_size(value: str | None) -> tuple[int, int] | None:
    if not value:
        return None
    try:
        width, height = value.lower().split("x", 1)
        return int(width), int(height)
    except ValueError as exc:
        raise argparse.ArgumentTypeError("size must look like 747x1040") from exc


def grid_boundary(index: int, total: int, divisions: int) -> int:
    return (index * total + divisions // 2) // divisions


def split_sheet(
    source: Path,
    output_dir: Path,
    *,
    rows: int = 7,
    cols: int = 10,
    output_size: tuple[int, int] | None = None,
    fmt: str = "webp",
    quality: int = 95,
    start_index: int = 1,
    name_template: str = "{source}_r{row:02d}_c{col:02d}",
    manifest_path: Path | None = None,
) -> list[dict[str, object]]:
    source = source.resolve()
    output_dir = output_dir.resolve()
    output_dir.mkdir(parents=True, exist_ok=True)

    with Image.open(source) as image:
        image.load()
        width, height = image.size
        manifest: list[dict[str, object]] = []

        for row in range(rows):
            top = grid_boundary(row, height, rows)
            bottom = grid_boundary(row + 1, height, rows)

            for col in range(cols):
                left = grid_boundary(col, width, cols)
                right = grid_boundary(col + 1, width, cols)
                index = start_index + row * cols + col
                card = image.crop((left, top, right, bottom))

                if output_size:
                    card = card.resize(output_size, Image.Resampling.LANCZOS)

                if fmt == "jpg" and card.mode not in {"RGB", "L"}:
                    card = card.convert("RGB")

                name = name_template.format(
                    source=source.stem,
                    row=row,
                    col=col,
                    index=index,
                )
                target = output_dir / f"{name}.{fmt}"
                save_kwargs = {}
                if fmt in {"jpg", "webp"}:
                    save_kwargs["quality"] = quality
                card.save(target, **save_kwargs)

                manifest.append(
                    {
                        "index": index,
                        "row": row,
                        "col": col,
                        "file": str(target),
                        "source": str(source),
                        "source_rect": [left, top, right - left, bottom - top],
                    }
                )

    manifest_path = manifest_path.resolve() if manifest_path else output_dir / "manifest.json"
    manifest_path.parent.mkdir(parents=True, exist_ok=True)
    manifest_path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print(f"Split {len(manifest)} tiles from {source.name} -> {output_dir}")
    return manifest


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Split a card sprite sheet by a regular rows x columns grid.",
    )
    parser.add_argument("source", type=Path, help="source sprite sheet image")
    parser.add_argument("output_dir", type=Path, help="directory for split cards")
    parser.add_argument("--cols", type=int, default=10, help="number of columns")
    parser.add_argument("--rows", type=int, default=7, help="number of rows")
    parser.add_argument(
        "--output-size",
        type=parse_size,
        default=None,
        help="optional normalized card size, for example 747x1040 or 150x209",
    )
    parser.add_argument(
        "--format",
        choices=("webp", "png", "jpg"),
        default="webp",
        help="output image format",
    )
    parser.add_argument("--quality", type=int, default=95, help="WebP/JPEG quality")
    parser.add_argument("--start-index", type=int, default=1)
    parser.add_argument(
        "--name-template",
        default="{source}_r{row:02d}_c{col:02d}",
        help="Python format string using source, row, col, and index",
    )
    parser.add_argument(
        "--manifest",
        type=Path,
        default=None,
        help="optional JSON manifest path",
    )
    args = parser.parse_args()

    manifest = split_sheet(
        args.source,
        args.output_dir,
        rows=args.rows,
        cols=args.cols,
        output_size=args.output_size,
        fmt=args.format,
        quality=args.quality,
        start_index=args.start_index,
        name_template=args.name_template,
        manifest_path=args.manifest,
    )
    print(f"Manifest: {(args.manifest or args.output_dir / 'manifest.json').resolve()}")
    print(f"Total tiles: {len(manifest)}")


if __name__ == "__main__":
    main()
