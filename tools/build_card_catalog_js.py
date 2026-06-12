import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CSV_MODEL = ROOT / "assets/cards/card_model.csv"
JSON_MODEL = ROOT / "assets/cards/card_model.json"
OUTPUT = ROOT / "randomizer/game/card-catalog.js"
INTEGER_FIELDS = {
    "price",
    "card_type_code",
    "discard_action_code",
    "scan_action_code",
    "income_code",
}


def read_csv_model() -> list[dict[str, object]]:
    with CSV_MODEL.open("r", encoding="utf-8-sig", newline="") as input_file:
        rows = []
        for row in csv.DictReader(input_file):
            normalized = {}
            for key, value in row.items():
                normalized[key] = int(value) if key in INTEGER_FIELDS else value
            rows.append(normalized)
        return rows


def write_json_model(catalog: list[dict[str, object]]) -> None:
    JSON_MODEL.write_text(
        json.dumps(catalog, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def main() -> None:
    catalog = read_csv_model()
    write_json_model(catalog)
    body = (
        '(function (root) {\n'
        '  "use strict";\n'
        f"  root.SetiCardCatalog = Object.freeze({json.dumps(catalog, ensure_ascii=False)});\n"
        '})(typeof globalThis !== "undefined" ? globalThis : window);\n'
    )
    OUTPUT.write_text(body, encoding="utf-8")
    print(f"wrote {JSON_MODEL} ({len(catalog)} cards)")
    print(f"wrote {OUTPUT} ({len(catalog)} cards)")


if __name__ == "__main__":
    main()
