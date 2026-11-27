#!/usr/bin/env python3
"""Convert raw-data/weapons.csv and map-points.csv to src/data/*.json."""
import csv
import json
import os


def to_int(value):
    try:
        return int(value) if value not in (None, "") else None
    except (ValueError, TypeError):
        return None


def main():
    base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    out_dir = os.path.join(base, "src", "data")
    os.makedirs(out_dir, exist_ok=True)

    with open(os.path.join(base, "raw-data", "weapons.csv"), encoding="utf-8-sig") as f:
        rows = list(csv.DictReader(f))
    weapons = []
    for r in rows:
        weapons.append(
            {
                "id": r.get("id"),
                "slug": r.get("id"),
                "name": r.get("name_en"),
                "damage": to_int(r.get("damage")),
                "headshotDamage": to_int(r.get("headshot_damage")),
                "roundsPerMinute": to_int(r.get("rounds_per_minute")),
                "magazine": to_int(r.get("magazine")),
                "fullDamageRangeM": to_int(r.get("full_damage_range_m")),
                "damagePerSecond": to_int(r.get("damage_per_second")),
                "url": r.get("url"),
                "source": r.get("source"),
            }
        )
    with open(os.path.join(out_dir, "weapons.json"), "w", encoding="utf-8") as f:
        json.dump(weapons, f, ensure_ascii=False, indent=1)
    print(f"Wrote {len(weapons)} weapons")

    with open(os.path.join(base, "raw-data", "map-points.csv"), encoding="utf-8-sig") as f:
        rows = list(csv.DictReader(f))
    points = []
    for r in rows:
        points.append(
            {
                "id": r.get("id"),
                "slug": r.get("id"),
                "type": r.get("type"),
                "name": r.get("name_en"),
                "district": r.get("district_ru"),
                "building": r.get("building_ru"),
                "lootEntries": to_int(r.get("loot_entries")) or 0,
                "url": r.get("url"),
                "source": r.get("source"),
            }
        )
    with open(os.path.join(out_dir, "map-points.json"), "w", encoding="utf-8") as f:
        json.dump(points, f, ensure_ascii=False, indent=1)
    print(f"Wrote {len(points)} map points")


if __name__ == "__main__":
    main()
