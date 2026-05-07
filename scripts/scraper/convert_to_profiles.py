#!/usr/bin/env python3
"""
Konvertiert den Scraper-Output (hsg-scraped-raw.json) in das
kanonische Profil-Format (data/hsg-profiles-scraped.json).

Usage:
  python scripts/scraper/convert_to_profiles.py
  python scripts/scraper/convert_to_profiles.py --input data/hsg-scraped-raw.json
"""

import json
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).parent.parent.parent
INPUT_DEFAULT = REPO_ROOT / "data" / "hsg-scraped-raw.json"
OUTPUT = REPO_ROOT / "data" / "hsg-profiles-scraped.json"

BOOL_ATTRS = [
    "career", "tech", "socialImpact", "party", "religion", "sports",
    "networking", "arts", "music", "timeLow", "handsOn", "outdoor",
    "international", "beginnerFriendly", "competitive", "financialCost",
    "leadershipOpportunities",
]
CAT_ATTRS = ["language", "eventFrequency", "groupSize"]
ALL_ATTRS = BOOL_ATTRS + CAT_ATTRS

CONF_MAP = {"high": 0.9, "medium": 0.65, "low": 0.4}


def slugify(name: str) -> str:
    s = name.lower()
    for src, dst in [("ä","ae"),("ö","oe"),("ü","ue"),("ß","ss")]:
        s = s.replace(src, dst)
    s = re.sub(r"[^a-z0-9\s-]", "", s).strip()
    s = re.sub(r"[\s_]+", "-", s)
    s = re.sub(r"-+", "-", s)
    return s[:80]


def convert_group(raw: dict) -> dict:
    attrs_raw = raw.get("attributes", {})

    attributes = {}
    confidence = {}

    for attr in BOOL_ATTRS:
        entry = attrs_raw.get(attr, {})
        val = entry.get("value", 0)
        attributes[attr] = bool(int(val))
        conf_str = entry.get("confidence", "low")
        confidence[attr] = CONF_MAP.get(conf_str, 0.4)

    for attr in CAT_ATTRS:
        entry = attrs_raw.get(attr, {})
        attributes[attr] = entry.get("value", None)
        conf_str = entry.get("confidence", "low")
        confidence[attr] = CONF_MAP.get(conf_str, 0.4)

    desc = raw.get("description", raw.get("name", ""))
    short_desc = desc[:200] if desc else ""

    return {
        "id": slugify(raw["name"]),
        "name": raw["name"],
        "shortDescription": short_desc,
        "website": raw.get("website") or None,
        "logoUrl": None,
        "attributes": attributes,
        "scrapedFrom": raw.get("sources", []),
        "scrapedAt": raw.get("_scraped_at", ""),
        "confidence": confidence,
        "verifiedByGroup": False,
        "verifiedAt": None,
    }


def main():
    input_path = Path(sys.argv[2]) if len(sys.argv) > 2 and sys.argv[1] == "--input" else INPUT_DEFAULT

    if not input_path.exists():
        print(f"❌ Input nicht gefunden: {input_path}")
        sys.exit(1)

    raw_data = json.loads(input_path.read_text(encoding="utf-8"))
    print(f"📂 Lade {len(raw_data)} Gruppen aus {input_path.name}")

    profiles = []
    missing_attrs = []

    for raw in raw_data:
        name = raw.get("name", "?")
        attrs = raw.get("attributes", {})

        # Check for missing attrs
        missing = [a for a in ALL_ATTRS if a not in attrs]
        if missing:
            missing_attrs.append((name, missing))

        profile = convert_group(raw)
        profiles.append(profile)

    # Write output
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(profiles, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"✅ {len(profiles)} Profile → {OUTPUT.relative_to(REPO_ROOT)}")

    if missing_attrs:
        print(f"\n⚠️  {len(missing_attrs)} Gruppen mit fehlenden Attributen:")
        for name, missing in missing_attrs[:5]:
            print(f"   {name}: fehlt {missing}")
        if len(missing_attrs) > 5:
            print(f"   ... und {len(missing_attrs) - 5} weitere")

    # Quick stats
    attr_counts = {a: sum(1 for p in profiles if p["attributes"].get(a) is True) for a in BOOL_ATTRS}
    print("\n📊 Attribut-Verteilung (wie viele Gruppen haben Attribut=True):")
    for attr, count in sorted(attr_counts.items(), key=lambda x: -x[1]):
        bar = "█" * (count // 3)
        print(f"   {attr:<25} {count:3d}/83  {bar}")


if __name__ == "__main__":
    main()
