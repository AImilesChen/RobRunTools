#!/usr/bin/env python3
"""Convert robrunwiki.net map-spots.json (raw) into src/data/map-spots.json.

The raw data is pixel coordinates on the Looty Bay base image (1320x1020),
sourced from ROB RUN Wiki (robrunwiki.net), game build 26464639.
"""
import json
import os
import hashlib

TYPE_NAMES = {
    "s-safe": "Safe",
    "s-bank_vault": "Bank Vault",
    "s-deposit_box": "Deposit Box",
    "s-cash_register": "Cash Register",
    "s-jewellery": "Jewellery",
    "s-weapons": "Weapons",
    "s-drugs": "Drugs",
    "s-art": "Art",
    "s-electronics": "Electronics",
    "s-medicine": "Medicine",
    "s-alcohol": "Alcohol",
    "s-car_parts": "Car Parts",
    "s-gear": "Gear",
    "s-container": "Container",
    "s-trash": "Trash",
    "s-camera": "Camera",
    "s-alarm": "Alarm",
    "s-metal_detector": "Metal Detector",
    "s-door": "Door",
}

PLACE_NAMES = {
    "nightclub": "Nightclub",
    "liquor-sunny": "Liquor Store (Sunny)",
    "hotel-sunny-west": "Hotel (Sunny West)",
    "noble-mansion": "Noble Mansion",
    "grand-hotel": "Grand Hotel",
    "cafe-pier": "Pier Café",
    "elite-cottage": "Elite Cottage",
    "cottage": "Cottage",
    "hotel-sunny-east": "Hotel (Sunny East)",
    "loraine-house-se": "Loraine House SE",
    "loraine-house-ne": "Loraine House NE",
    "gas-station": "Gas Station",
    "cafe-downtown": "Downtown Café",
    "liquor-downtown": "Liquor Store (Downtown)",
    "liquor-downtown-north": "Liquor Store (Downtown N)",
    "art-gallery": "Art Gallery",
    "police-station": "Police Station",
    "looty-bay-bank": "Looty Bay Bank",
    "jeweler-sunny": "Jeweler (Sunny)",
    "gun-shop-sunny": "Gun Shop (Sunny)",
    "equipment-sunny": "Equipment (Sunny)",
    "pharmacy-sunny": "Pharmacy (Sunny)",
    "electronics-sunny": "Electronics (Sunny)",
    "electronics-downtown": "Electronics (Downtown)",
    "equipment-downtown": "Equipment (Downtown)",
    "jeweler-downtown": "Jeweler (Downtown)",
    "pharmacy-downtown": "Pharmacy (Downtown)",
    "gun-shop-downtown": "Gun Shop (Downtown)",
}


def main():
    base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    src = os.path.join(base, "raw-data", "map-spots-source.json")
    out = os.path.join(base, "src", "data", "map-spots.json")

    raw = json.load(open(src, encoding="utf-8"))
    types = raw["types"]
    places = raw["places"]

    type_list = [
        {"id": t, "name": TYPE_NAMES.get(t, t), "color": raw["colors"][i] if i < len(raw["colors"]) else "#ffffff"}
        for i, t in enumerate(types)
    ]
    place_list = [{"id": p, "name": PLACE_NAMES.get(p, p)} for p in places]

    spots = []
    occurrences = {}
    for s in raw["spots"]:
        x, y, ti, pi = s[0], s[1], s[2], s[3]
        fingerprint = hashlib.sha256(f"{raw['build']}:{x}:{y}:{ti}:{pi}".encode()).hexdigest()[:16]
        occurrences[fingerprint] = occurrences.get(fingerprint, 0) + 1
        point_id = "point-" + fingerprint + (f"-{occurrences[fingerprint]}" if occurrences[fingerprint] > 1 else "")
        spots.append(
            {
                "x": round(x, 1),
                "y": round(y, 1),
                "id": point_id,
                "type": types[ti] if 0 <= ti < len(types) else "unknown",
                "place": places[pi] if 0 <= pi < len(places) else "",
            }
        )

    data = {
        "source": "ROB RUN Wiki (robrunwiki.net), game build " + str(raw["build"]),
        "build": raw["build"],
        "width": 1320,
        "height": 1020,
        "coordinateOrigin": "top-left",
        "types": type_list,
        "places": place_list,
        "spots": spots,
    }
    json.dump(data, open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"Wrote {len(spots)} spots, {len(types)} types, {len(places)} places -> {out}")


if __name__ == "__main__":
    main()
