#!/usr/bin/env python3
"""Convert raw-data/items.csv to src/data/items.json with English mappings.

Rarity and category come from the source as Russian strings; this script maps
them to English slugs/names and keeps missing prices as null (not 0).
"""
import csv
import json
import os

RARITY_MAP = {
    "Обычный": "common",
    "Необычный": "uncommon",
    "Эпический": "epic",
    "Легендарный": "legendary",
    "Экзотический": "exotic",
}

CATEGORY_MAP = {
    "Ценности (краденое)": ("Valuables", "valuables"),
    "Грузы": ("Cargo", "cargo"),
    "Оружие": ("Weapons", "weapons"),
    "Прочее": ("Other", "other"),
    "Лаборатория": ("Laboratory", "laboratory"),
    "Мебель и объекты": ("Furniture & Objects", "furniture"),
    "Дом и участок": ("House & Plot", "house"),
    "Верстаки и апгрейды": ("Workbenches", "workbenches"),
    "Авто-апгрейды": ("Car Upgrades", "car-upgrades"),
    "Постройки": ("Constructions", "constructions"),
    "Медицина": ("Medical", "medical"),
    "Транспорт": ("Vehicles", "vehicles"),
    "NPC": ("NPC", "npc"),
    "Обслуживание оружия": ("Weapon Maintenance", "weapon-maintenance"),
    "Инструменты взлома": ("Breaking Tools", "breaking-tools"),
    "Кумулятивные предметы": ("Cumulative Items", "cumulative-items"),
    "Броня": ("Armor", "armor"),
    "Ключи": ("Keys", "keys"),
    "Защита": ("Protection", "protection"),
    "Документы": ("Documents", "documents"),
    "Патроны": ("Ammo", "ammo"),
    "Гранаты": ("Grenades", "grenades"),
    "Инструменты": ("Tools", "tools"),
}


def parse_price(value):
    try:
        return int(value)
    except (ValueError, TypeError):
        return None


def main():
    base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    src = os.path.join(base, "raw-data", "items.csv")
    out_dir = os.path.join(base, "src", "data")
    os.makedirs(out_dir, exist_ok=True)
    out = os.path.join(out_dir, "items.json")

    with open(src, encoding="utf-8-sig") as f:
        rows = list(csv.DictReader(f))

    items = []
    for r in rows:
        rarity_ru = (r.get("rarity") or "").strip()
        rarity = RARITY_MAP.get(rarity_ru)
        cat_ru = (r.get("category_ru") or "").strip()
        cat_name, cat_slug = CATEGORY_MAP.get(cat_ru, (cat_ru or "Other", "other"))
        items.append(
            {
                "id": r.get("id"),
                "slug": r.get("id"),
                "name": r.get("name_en"),
                "nameRu": r.get("name_ru"),
                "category": cat_slug,
                "categoryName": cat_name,
                "rarity": rarity,
                "priceMin": parse_price(r.get("fence_price_min_usd")),
                "priceMax": parse_price(r.get("fence_price_max_usd")),
                "url": r.get("url"),
                "source": r.get("source"),
            }
        )

    with open(out, "w", encoding="utf-8") as f:
        json.dump(items, f, ensure_ascii=False, indent=1)

    print(f"Wrote {len(items)} items to {out}")


if __name__ == "__main__":
    main()
