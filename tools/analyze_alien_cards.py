import argparse
import csv
import json
import re
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

from build_card_model import classify_card_type


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_INPUT = ROOT / "assets/aliens"
ANALYSIS_FILENAME = "card_analysis.csv"
MODEL_CSV_FILENAME = "card_model.csv"
MODEL_JSON_FILENAME = "card_model.json"

EXCLUDED_ALIENS = {"半人马", "九折", "方舟"}
IMAGE_EXTENSIONS = {".webp", ".png", ".jpg", ".jpeg"}

ANALYSIS_FIELDS = [
    "alien",
    "card_id",
    "card_name",
    "price",
    "card_type_code",
    "left_top_symbol_count",
    "left_top_symbol_color",
    "discard_action_code",
    "right_top_color",
    "scan_action_code",
    "bottom_right_color",
    "income_code",
]

MODEL_FIELDS = [
    "card_id",
    "card_name",
    "price",
    "card_type_code",
    "set",
    "discard_action_code",
    "scan_action_code",
    "income_code",
]

SCAN_ACTION_BY_COLOR = {
    "黄": 0,
    "红": 1,
    "蓝": 2,
    "黑": 3,
}

INCOME_BY_COLOR = {
    "黄": 0,
    "绿": 1,
    "灰": 2,
    "蓝": 3,
    "红": 4,
}

DISCARD_BY_SYMBOL = {
    "红2": 3,
    "蓝1分": 4,
    "灰1分": 5,
}


def numeric_key(path: Path) -> int:
    match = re.search(r"\d+", path.stem)
    return int(match.group()) if match else 0


def patch_hsv(image: Image.Image, x: int, y: int, radius: int = 6) -> tuple[int, int, int]:
    width, height = image.size
    x1 = max(0, x - radius)
    y1 = max(0, y - radius)
    x2 = min(width, x + radius + 1)
    y2 = min(height, y + radius + 1)
    patch = np.array(image.crop((x1, y1, x2, y2)).convert("RGB"))
    median_rgb = np.median(patch.reshape(-1, 3), axis=0).astype(np.uint8)
    hsv = cv2.cvtColor(np.uint8([[median_rgb]]), cv2.COLOR_RGB2HSV)[0, 0]
    return int(hsv[0]), int(hsv[1]), int(hsv[2])


def classify_color(hsv: tuple[int, int, int]) -> str:
    hue, saturation, value = hsv
    if value < 95 and saturation < 110:
        return "黑"
    if saturation < 65:
        return "灰"
    if hue < 12 or hue > 165:
        return "红"
    if 125 <= hue <= 164:
        return "粉"
    if 85 <= hue <= 124:
        return "蓝"
    if 18 <= hue <= 42:
        return "黄"
    if 43 <= hue <= 90:
        return "绿"
    if 10 <= hue < 18:
        return "橙"
    return "灰"


def majority(items: list[str]) -> str:
    counts: dict[str, int] = {}
    for item in items:
        counts[item] = counts.get(item, 0) + 1
    return max(counts, key=counts.get)


def classify_right_top(image: Image.Image) -> str:
    width, height = image.size
    votes = [
        classify_color(patch_hsv(image, int(width * 0.85), int(height * 0.020))),
        classify_color(patch_hsv(image, int(width * 0.925), int(height * 0.016))),
        classify_color(patch_hsv(image, int(width * 0.965), int(height * 0.105))),
    ]
    color = majority(votes)
    return color if color in SCAN_ACTION_BY_COLOR else "黑"


def classify_bottom_right(image: Image.Image) -> str:
    width, height = image.size
    crop = np.array(image.crop((int(width * 0.72), int(height * 0.87), width, height)).convert("RGB"))
    hsv = cv2.cvtColor(crop, cv2.COLOR_RGB2HSV)
    hue, saturation, value = hsv[:, :, 0], hsv[:, :, 1], hsv[:, :, 2]
    colored = (saturation > 65) & (value > 90)
    votes: list[str] = []
    for name, mask in [
        ("红", ((hue < 12) | (hue > 165)) & colored),
        ("蓝", (hue >= 85) & (hue <= 124) & colored),
        ("黄", (hue >= 18) & (hue <= 42) & colored),
        ("绿", (hue >= 43) & (hue <= 90) & colored),
    ]:
        votes.extend([name] * int(mask.sum()))
    if not votes:
        return "灰"
    return majority(votes)


def is_green_first_symbol(image: Image.Image) -> bool:
    width, height = image.size
    crop = np.array(image.crop((0, 0, int(width * 0.14), int(height * 0.13))).convert("RGB"))
    hsv = cv2.cvtColor(crop, cv2.COLOR_RGB2HSV)
    hue, saturation, value = hsv[:, :, 0], hsv[:, :, 1], hsv[:, :, 2]
    green = (hue >= 43) & (hue <= 90) & (saturation > 65) & (value > 80)
    return int(green.sum()) > 800


def has_standard_second_symbol(image: Image.Image) -> bool:
    width, height = image.size
    crop = np.array(image.crop((int(width * 0.12), 0, int(width * 0.28), int(height * 0.12))).convert("RGB"))
    hsv = cv2.cvtColor(crop, cv2.COLOR_RGB2HSV)
    saturation, value = hsv[:, :, 1], hsv[:, :, 2]
    white = (saturation < 70) & (value > 180)
    return int(white.sum()) > 1500


def is_red_two_symbol(image: Image.Image) -> bool:
    width, height = image.size
    crop = np.array(image.crop((0, 0, int(width * 0.16), int(height * 0.13))).convert("RGB"))
    hsv = cv2.cvtColor(crop, cv2.COLOR_RGB2HSV)
    hue, saturation, value = hsv[:, :, 0], hsv[:, :, 1], hsv[:, :, 2]
    red = ((hue < 12) | (hue > 165)) & (saturation > 65) & (value > 110)
    return int(red.sum()) > 4000


def classify_single_alien_symbol(image: Image.Image) -> str:
    width, height = image.size
    crop = np.array(image.crop((0, 0, int(width * 0.15), int(height * 0.13))).convert("RGB"))
    hsv = cv2.cvtColor(crop, cv2.COLOR_RGB2HSV)
    hue, saturation, value = hsv[:, :, 0], hsv[:, :, 1], hsv[:, :, 2]
    colored = (saturation > 60) & (value > 80)
    votes: list[str] = []
    for name, mask in [
        ("红", ((hue < 12) | (hue > 165)) & colored),
        ("粉", (hue >= 125) & (hue <= 164) & colored),
        ("蓝", (hue >= 85) & (hue <= 124) & colored),
        ("黄", (hue >= 18) & (hue <= 42) & colored),
        ("绿", (hue >= 43) & (hue <= 90) & colored),
        ("橙", (hue >= 10) & (hue < 18) & colored),
    ]:
        votes.extend([name] * int(mask.sum()))
    return majority(votes) if votes else "灰"


def classify_top_left_symbol(image: Image.Image) -> tuple[int, str, str]:
    width, height = image.size
    if is_green_first_symbol(image) and has_standard_second_symbol(image):
        # Alien cards can have a green first symbol plus a standard card symbol.
        # Per the alien-card rule, classify the second symbol only.
        second_color = classify_color(patch_hsv(image, int(width * 0.185), int(height * 0.048), radius=12))
        if second_color == "蓝":
            return 2, "蓝", "蓝1分"
        return 2, "灰", "灰1分"
    if is_red_two_symbol(image):
        return 1, "红", "红2"
    return 1, classify_single_alien_symbol(image), ""


def read_text(reader, image: Image.Image, box: tuple[int, int, int, int], allowlist: str | None = None) -> str:
    crop = image.crop(box)
    crop = crop.resize((crop.width * 3, crop.height * 3))
    kwargs = {"detail": 0, "paragraph": False}
    if allowlist:
        kwargs["allowlist"] = allowlist
    result = reader.readtext(np.array(crop), **kwargs)
    return "".join(result).strip()


def read_price(reader, image: Image.Image) -> str:
    width, height = image.size
    crop_box = (0, int(height * 0.37), int(width * 0.14), int(height * 0.52))
    text = read_text(reader, image, crop_box, allowlist="0123456789")
    match = re.search(r"\d", text)
    return match.group(0) if match else ""


def read_name(reader, image: Image.Image) -> str:
    width, height = image.size
    return read_text(reader, image, (int(width * 0.28), int(height * 0.405), int(width * 0.89), int(height * 0.49)))


def iter_alien_card_paths(input_dir: Path) -> list[tuple[Path, list[Path]]]:
    groups: list[tuple[Path, list[Path]]] = []
    for alien_dir in sorted([path for path in input_dir.iterdir() if path.is_dir()], key=lambda path: path.name):
        if alien_dir.name in EXCLUDED_ALIENS:
            continue
        cards_dir = alien_dir / "cards"
        if not cards_dir.is_dir():
            continue
        paths: list[Path] = []
        for path in sorted(cards_dir.iterdir(), key=numeric_key):
            if path.suffix.lower() not in IMAGE_EXTENSIONS:
                continue
            if path.stem.lower().startswith("back"):
                continue
            paths.append(path)
        if paths:
            groups.append((alien_dir, paths))
    return groups


def analyze_card(path: Path, reader) -> dict[str, str]:
    image = Image.open(path).convert("RGB")
    symbol_count, symbol_color, symbol_key = classify_top_left_symbol(image)
    right_top_color = classify_right_top(image)
    bottom_right_color = classify_bottom_right(image)
    alien = path.parent.parent.name
    card_id = path.name
    return {
        "alien": alien,
        "card_id": card_id,
        "card_name": read_name(reader, image) if reader else f"{alien}-{path.stem}",
        "price": read_price(reader, image) if reader else "",
        "card_type_code": str(classify_card_type(path)),
        "left_top_symbol_count": str(symbol_count),
        "left_top_symbol_color": symbol_color,
        "discard_action_code": str(DISCARD_BY_SYMBOL[symbol_key]) if symbol_key in DISCARD_BY_SYMBOL else "",
        "right_top_color": right_top_color,
        "scan_action_code": str(SCAN_ACTION_BY_COLOR[right_top_color]),
        "bottom_right_color": bottom_right_color,
        "income_code": str(INCOME_BY_COLOR[bottom_right_color]),
    }


def write_csv(path: Path, rows: list[dict[str, str]], fields: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8-sig", newline="") as output_file:
        writer = csv.DictWriter(output_file, fieldnames=fields)
        writer.writeheader()
        writer.writerows(rows)


def to_model_rows(rows: list[dict[str, str]]) -> list[dict[str, str]]:
    return [
        {
            "card_id": row["card_id"],
            "card_name": row["card_name"],
            "price": row["price"],
            "card_type_code": row["card_type_code"],
            "set": f"alien:{row['alien']}",
            "discard_action_code": row["discard_action_code"],
            "scan_action_code": row["scan_action_code"],
            "income_code": row["income_code"],
        }
        for row in rows
    ]


def write_json(path: Path, rows: list[dict[str, str]]) -> None:
    json_rows = []
    for row in rows:
        json_rows.append(
            {
                "card_id": row["card_id"],
                "card_name": row["card_name"],
                "price": int(row["price"]) if row["price"] else None,
                "card_type_code": int(row["card_type_code"]) if row["card_type_code"] else None,
                "set": row["set"],
                "discard_action_code": int(row["discard_action_code"]) if row["discard_action_code"] else None,
                "scan_action_code": int(row["scan_action_code"]) if row["scan_action_code"] else None,
                "income_code": int(row["income_code"]) if row["income_code"] else None,
            }
        )
    path.write_text(json.dumps(json_rows, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def build_reader(disable_ocr: bool):
    if disable_ocr:
        return None
    import easyocr

    return easyocr.Reader(["ch_sim", "en"], gpu=False, verbose=False)


def main() -> None:
    parser = argparse.ArgumentParser(description="Analyze SETI alien card images into card model CSV/JSON files.")
    parser.add_argument("--input-dir", type=Path, default=DEFAULT_INPUT)
    parser.add_argument("--no-ocr", action="store_true", help="Skip EasyOCR and use stable alien-number card names.")
    args = parser.parse_args()

    reader = build_reader(args.no_ocr)
    total = 0
    for alien_dir, paths in iter_alien_card_paths(args.input_dir):
        rows = [analyze_card(path, reader) for path in paths]
        model_rows = to_model_rows(rows)

        analysis_output = alien_dir / ANALYSIS_FILENAME
        model_output = alien_dir / MODEL_CSV_FILENAME
        json_output = alien_dir / MODEL_JSON_FILENAME

        write_csv(analysis_output, rows, ANALYSIS_FIELDS)
        write_csv(model_output, model_rows, MODEL_FIELDS)
        write_json(json_output, model_rows)

        total += len(rows)
        print(f"Wrote {len(rows)} {alien_dir.name} cards to {analysis_output}")
        print(f"Wrote {len(model_rows)} {alien_dir.name} model rows to {model_output}")
        print(f"Wrote {len(model_rows)} {alien_dir.name} model rows to {json_output}")

    print(f"Wrote {total} alien cards in per-alien directories")


if __name__ == "__main__":
    main()
