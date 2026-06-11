import csv
import json
import re
from pathlib import Path

import cv2
import numpy as np
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
INPUTS = [
    ("basic", ROOT / "assets/cards/basic/split_analysis.csv"),
    ("space-agency", ROOT / "assets/cards/space-agency/split_analysis.csv"),
]
CSV_OUTPUT = ROOT / "assets/cards/card_model.csv"
JSON_OUTPUT = ROOT / "assets/cards/card_model.json"
MAPPING_CSV_OUTPUT = ROOT / "assets/cards/card_corner_mapping.csv"
MAPPING_JSON_OUTPUT = ROOT / "assets/cards/card_corner_mapping.json"
TYPE_MAPPING_CSV_OUTPUT = ROOT / "assets/cards/card_type_mapping.csv"
TYPE_MAPPING_JSON_OUTPUT = ROOT / "assets/cards/card_type_mapping.json"


DISCARD_ACTIONS = {
    "红": {"code": 0, "effect": "gain_publicity_1", "description": "玩家获取一点宣传"},
    "蓝": {"code": 1, "effect": "gain_data_1", "description": "玩家获取一点数据"},
    "灰": {"code": 2, "effect": "move_1", "description": "玩家获取一次移动"},
}

SCAN_ACTIONS = {
    "黄": {"code": 0, "regions": ["室女座61", "开普勒22"], "description": "室女座61或开普勒22区域信号"},
    "红": {"code": 1, "regions": ["巴纳德", "比邻星"], "description": "巴纳德或比邻星区域信号"},
    "蓝": {"code": 2, "regions": ["天狼星A", "南河三"], "description": "天狼星A或南河三区域信号"},
    "黑": {"code": 3, "regions": ["织女一", "绘架座β"], "description": "织女一或绘架座β区域信号"},
}

INCOMES = {
    "黄": {"code": 0, "income": "credit", "description": "信用点收入"},
    "绿": {"code": 1, "income": "energy", "description": "能量收入"},
    "灰": {"code": 2, "income": "blind_draw_card", "description": "盲抽卡牌收入"},
}

CARD_TYPES = {
    0: {"type": "normal", "description": "普通"},
    1: {"type": "trigger_task", "description": "触发型任务"},
    2: {"type": "status_task", "description": "状态型任务"},
    3: {"type": "end_game_scoring", "description": "终局计分"},
}


CSV_FIELDS = [
    "card_id",
    "card_name",
    "price",
    "card_type_code",
    "set",
    "discard_action_code",
    "scan_action_code",
    "income_code",
]


def numeric_key(card_id: str) -> int:
    match = re.search(r"\d+", card_id)
    return int(match.group()) if match else 0


def image_path_for(set_name: str, card_id: str) -> Path:
    return ROOT / "assets/cards" / set_name / "split" / card_id


def connected_components(mask: np.ndarray) -> list[tuple[int, int, int, int, int]]:
    num, _labels, stats, _centroids = cv2.connectedComponentsWithStats(mask.astype("uint8"), 8)
    return [
        (
            int(stats[index, cv2.CC_STAT_AREA]),
            int(stats[index, cv2.CC_STAT_LEFT]),
            int(stats[index, cv2.CC_STAT_TOP]),
            int(stats[index, cv2.CC_STAT_WIDTH]),
            int(stats[index, cv2.CC_STAT_HEIGHT]),
        )
        for index in range(1, num)
    ]


def core_content_crop(path: Path) -> np.ndarray:
    image = np.array(Image.open(path).convert("RGB"))
    height, width = image.shape[:2]
    y_start = int(height * 0.515)
    y_end = int(height * 0.885)
    x_start = int(width * 0.035)
    x_end = int(width * 0.965)
    return image[y_start:y_end, x_start:x_end]


def has_gold_scoring_bar(core: np.ndarray) -> bool:
    hue, saturation, value = cv2.cvtColor(core, cv2.COLOR_RGB2HSV).transpose(2, 0, 1)
    gold = (hue >= 16) & (hue <= 38) & (saturation > 45) & (value > 115)
    return any(area > 18000 and width > 360 and height > 35 for area, _x, _y, width, height in connected_components(gold))


def has_status_split_panel(core: np.ndarray) -> bool:
    _hue, saturation, value = cv2.cvtColor(core, cv2.COLOR_RGB2HSV).transpose(2, 0, 1)
    gray_panel = (saturation < 35) & (value > 135) & (value < 220)
    _height, width = gray_panel.shape
    return any(
        area > 25000 and component_width > 220 and component_height > 120 and x > width * 0.45
        for area, x, _y, component_width, component_height in connected_components(gray_panel)
    )


def has_notched_circle_marker(core: np.ndarray) -> bool:
    hsv = cv2.cvtColor(core, cv2.COLOR_RGB2HSV)
    grayscale = cv2.cvtColor(core, cv2.COLOR_RGB2GRAY)
    grayscale = cv2.medianBlur(grayscale, 5)
    circles = cv2.HoughCircles(
        grayscale,
        cv2.HOUGH_GRADIENT,
        dp=1.2,
        minDist=65,
        param1=80,
        param2=27,
        minRadius=36,
        maxRadius=82,
    )
    if circles is None:
        return False

    hue, saturation, value = hsv[:, :, 0], hsv[:, :, 1], hsv[:, :, 2]
    yy, xx = np.indices(grayscale.shape)
    for x, y, radius in np.round(circles[0]).astype(int):
        if x - radius < 0 or y - radius < 0 or x + radius >= grayscale.shape[1] or y + radius >= grayscale.shape[0]:
            continue
        disk = (xx - x) ** 2 + (yy - y) ** 2 <= (radius * 0.82) ** 2
        ring = ((xx - x) ** 2 + (yy - y) ** 2 <= (radius * 1.18) ** 2) & (
            (xx - x) ** 2 + (yy - y) ** 2 >= (radius * 1.02) ** 2
        )
        if disk.sum() == 0 or ring.sum() == 0:
            continue
        white_ratio = (((saturation < 45) & (value > 210) & disk).sum() / disk.sum())
        pale_ring_ratio = (((saturation < 55) & (value > 145) & (value < 245) & ring).sum() / ring.sum())
        yellow_ratio = (((hue >= 16) & (hue <= 42) & (saturation > 55) & (value > 120) & disk).sum() / disk.sum())
        if white_ratio > 0.50 and pale_ring_ratio > 0.32 and yellow_ratio < 0.20:
            return True
    return False


def classify_card_type(path: Path) -> int:
    core = core_content_crop(path)
    if has_gold_scoring_bar(core):
        return 3
    if has_status_split_panel(core):
        return 2
    if has_notched_circle_marker(core):
        return 1
    return 0


def read_rows() -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    for set_name, path in INPUTS:
        with path.open("r", encoding="utf-8-sig", newline="") as input_file:
            for row in csv.DictReader(input_file):
                discard = DISCARD_ACTIONS[row["左上角符号颜色"]]
                scan = SCAN_ACTIONS[row["卡牌右上角颜色"]]
                income = INCOMES[row["右下及底部线条颜色"]]
                card_type = classify_card_type(image_path_for(set_name, row["卡牌编号"]))
                rows.append(
                    {
                        "card_id": row["卡牌编号"],
                        "card_name": row["卡牌名称"],
                        "price": row["卡牌价格"],
                        "card_type_code": card_type,
                        "set": set_name,
                        "discard_action_code": discard["code"],
                        "scan_action_code": scan["code"],
                        "income_code": income["code"],
                    }
                )
    rows.sort(key=lambda row: (row["set"] != "basic", numeric_key(row["card_id"])))
    return rows


def write_csv(rows: list[dict[str, str]]) -> None:
    with CSV_OUTPUT.open("w", encoding="utf-8-sig", newline="") as output_file:
        writer = csv.DictWriter(output_file, fieldnames=CSV_FIELDS)
        writer.writeheader()
        writer.writerows(rows)


def write_json(rows: list[dict[str, str]]) -> None:
    json_rows = []
    for row in rows:
        json_rows.append(
            {
                "card_id": row["card_id"],
                "card_name": row["card_name"],
                "price": int(row["price"]),
                "card_type_code": int(row["card_type_code"]),
                "set": row["set"],
                "discard_action_code": int(row["discard_action_code"]),
                "scan_action_code": int(row["scan_action_code"]),
                "income_code": int(row["income_code"]),
            }
        )
    JSON_OUTPUT.write_text(json.dumps(json_rows, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def build_mapping_rows() -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    for color, value in DISCARD_ACTIONS.items():
        rows.append(
            {
                "corner": "left_top",
                "field": "discard_action_code",
                "code": value["code"],
                "color": color,
                "effect": value["effect"],
                "description": value["description"],
                "regions": "",
            }
        )
    for color, value in SCAN_ACTIONS.items():
        rows.append(
            {
                "corner": "right_top",
                "field": "scan_action_code",
                "code": value["code"],
                "color": color,
                "effect": "place_signal",
                "description": value["description"],
                "regions": "|".join(value["regions"]),
            }
        )
    for color, value in INCOMES.items():
        rows.append(
            {
                "corner": "bottom_right",
                "field": "income_code",
                "code": value["code"],
                "color": color,
                "effect": value["income"],
                "description": value["description"],
                "regions": "",
            }
        )
    return rows


def write_mapping_files() -> None:
    rows = build_mapping_rows()
    fieldnames = ["corner", "field", "code", "color", "effect", "description", "regions"]
    with MAPPING_CSV_OUTPUT.open("w", encoding="utf-8-sig", newline="") as output_file:
        writer = csv.DictWriter(output_file, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
    MAPPING_JSON_OUTPUT.write_text(json.dumps(rows, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def write_type_mapping_files() -> None:
    rows = [
        {
            "field": "card_type_code",
            "code": code,
            "type": value["type"],
            "description": value["description"],
        }
        for code, value in CARD_TYPES.items()
    ]
    fieldnames = ["field", "code", "type", "description"]
    with TYPE_MAPPING_CSV_OUTPUT.open("w", encoding="utf-8-sig", newline="") as output_file:
        writer = csv.DictWriter(output_file, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
    TYPE_MAPPING_JSON_OUTPUT.write_text(json.dumps(rows, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main() -> None:
    rows = read_rows()
    write_csv(rows)
    write_json(rows)
    write_mapping_files()
    write_type_mapping_files()
    print(f"Wrote {len(rows)} cards to {CSV_OUTPUT}")
    print(f"Wrote {len(rows)} cards to {JSON_OUTPUT}")
    print(f"Wrote mappings to {MAPPING_CSV_OUTPUT}")
    print(f"Wrote mappings to {MAPPING_JSON_OUTPUT}")
    print(f"Wrote type mappings to {TYPE_MAPPING_CSV_OUTPUT}")
    print(f"Wrote type mappings to {TYPE_MAPPING_JSON_OUTPUT}")


if __name__ == "__main__":
    main()
