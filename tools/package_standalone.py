#!/usr/bin/env python3
"""Package the complete standalone SETI browser build into a zip archive."""

from __future__ import annotations

import argparse
from datetime import datetime
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

ROOT = Path(__file__).resolve().parents[1]
FULL_PACKAGE_DIRS = ("assets", "randomizer")
ARCHIVE_PREFIX = "seti单机版"


def timestamped_name(now: datetime | None = None) -> str:
    value = now or datetime.now()
    return f"{ARCHIVE_PREFIX}_{value:%Y%m%d_%H%M%S}.zip"


def iter_package_files(target: Path) -> list[Path]:
    files: list[Path] = []
    target = target.resolve()

    for directory_name in FULL_PACKAGE_DIRS:
        directory = ROOT / directory_name
        if not directory.is_dir():
            raise FileNotFoundError(f"Required package directory not found: {directory}")
        for path in directory.rglob("*"):
            if path.is_file() and path.resolve() != target:
                files.append(path)

    return sorted(files, key=lambda path: path.relative_to(ROOT).as_posix())


def validate_archive(archive_path: Path) -> int:
    with ZipFile(archive_path, "r") as archive:
        entries = [entry for entry in archive.namelist() if entry.strip()]
    if not entries:
        raise ValueError(f"archive is empty: {archive_path}")

    allowed_roots = set(FULL_PACKAGE_DIRS)
    unexpected = [
        entry for entry in entries
        if entry.replace("\\", "/").split("/", 1)[0] not in allowed_roots
    ][:5]
    if unexpected:
        raise ValueError(f"archive contains unexpected entries: {', '.join(unexpected)}")

    return len(entries)


def build_archive(output_dir: Path) -> Path:
    output_dir = output_dir.resolve()
    output_dir.mkdir(parents=True, exist_ok=True)
    archive_path = output_dir / timestamped_name()
    files = iter_package_files(archive_path)

    with ZipFile(archive_path, "w", compression=ZIP_DEFLATED) as archive:
        for path in files:
            archive.write(path, path.relative_to(ROOT).as_posix())

    validate_archive(archive_path)
    return archive_path


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Full package: assets/ and randomizer/ into seti单机版_日期_时间.zip.",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=ROOT,
        help="directory for the generated zip archive; defaults to the repo root",
    )
    args = parser.parse_args()

    archive_path = build_archive(args.output_dir)
    print(f"wrote {archive_path}")
    print(f"size {archive_path.stat().st_size} bytes")
    print(f"entries {validate_archive(archive_path)}")


if __name__ == "__main__":
    main()
