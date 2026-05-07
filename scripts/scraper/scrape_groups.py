#!/usr/bin/env python3
"""
FOMO Hochschulgruppen-Scraper
Nutzt Anthropic API mit Web Search Tool.
Claude sucht im Web, liest Seiten, klassifiziert Attribute.

Voraussetzungen:
  pip install -r requirements.txt
  export ANTHROPIC_API_KEY=sk-ant-...

Nutzung:
  python scripts/scraper/scrape_groups.py              # alle 83 Gruppen
  python scripts/scraper/scrape_groups.py --dry-run    # 5 Test-Gruppen (Elbflorace, SMD, YETI, ESN, Nightline)
  python scripts/scraper/scrape_groups.py --resume     # weitermachen wo aufgehört

Output:
  data/hsg-scraper-output/groups_partial.json  — Fortschritt (Resume)
  data/hsg-scraper-output/groups_raw.json      — Raw-Output mit Confidence + Reasons
  data/hsg-profiles-scraped.json               — Fertiges Profil-Format (via convert_to_profiles.py)
"""

import anthropic
import json
import os
import sys
import time
from datetime import datetime
from pathlib import Path

REPO_ROOT = Path(__file__).parent.parent.parent
INPUT_FILE = REPO_ROOT / "data" / "hsg-input-list.json"
SCHEMA_FILE = REPO_ROOT / "data" / "group-attributes-schema.json"
OUTPUT_DIR = REPO_ROOT / "data" / "hsg-scraper-output"
PARTIAL_FILE = OUTPUT_DIR / "groups_partial.json"
FINAL_RAW = OUTPUT_DIR / "groups_raw.json"

MODEL = "claude-sonnet-4-6"
MAX_SEARCHES_PER_GROUP = 5

DRY_RUN_GROUPS = ["Elbflorace Formula Student Team TU Dresden e.V.", "SMD Dresden",
                  "YETI Dresden", "Erasmus Student Network TU Dresden e.V.", "Nightline Dresden e.V."]

# ─── ATTRIBUTE SCHEMA ────────────────────────────────────────

def load_attribute_definitions() -> str:
    """Lädt Attribut-Definitionen aus group-attributes-schema.json."""
    schema = json.loads(SCHEMA_FILE.read_text(encoding="utf-8"))
    lines = []
    for attr in schema["attributes"]:
        pos = ", ".join(attr["positive_examples"][:2])
        neg = ", ".join(attr["negative_examples"][:2])
        lines.append(
            f'- {attr["id"]} ({attr["label"]}): {attr["definition"]}\n'
            f'  ✓ Beispiele: {pos}\n'
            f'  ✗ Nicht: {neg}'
        )
    return "\n".join(lines)


# ─── SYSTEM PROMPT ───────────────────────────────────────────

def build_system_prompt(attr_definitions: str) -> str:
    return f"""Du bist ein Recherche-Assistent für das Projekt FOMO (Find Our Matching Organizations) der TU Dresden.

Deine Aufgabe: Recherchiere eine studentische Hochschulgruppe und klassifiziere ihre Eigenschaften anhand der unten stehenden Definitionen.

WICHTIG: Antworte AUSSCHLIESSLICH mit einem JSON-Objekt. Kein Markdown, keine Erklärung, nur JSON.

Das JSON muss exakt dieses Format haben:
{{
  "name": "Exakter Name der Gruppe",
  "description": "1-2 Sätze Beschreibung auf Deutsch, was die Gruppe macht",
  "website": "URL der Hauptwebsite oder leerer String",
  "sources": ["URL1", "URL2"],
  "attributes": {{
    "career":      {{"value": 0, "confidence": "high", "reason": "max 10 Wörter"}},
    "tech":        {{"value": 0, "confidence": "high", "reason": "max 10 Wörter"}},
    "socialImpact": {{"value": 0, "confidence": "high", "reason": "max 10 Wörter"}},
    "party":       {{"value": 0, "confidence": "high", "reason": "max 10 Wörter"}},
    "religion":    {{"value": 0, "confidence": "high", "reason": "max 10 Wörter"}},
    "sports":      {{"value": 0, "confidence": "high", "reason": "max 10 Wörter"}},
    "networking":  {{"value": 0, "confidence": "high", "reason": "max 10 Wörter"}},
    "arts":        {{"value": 0, "confidence": "high", "reason": "max 10 Wörter"}},
    "music":       {{"value": 0, "confidence": "high", "reason": "max 10 Wörter"}},
    "timeLow":     {{"value": 0, "confidence": "high", "reason": "max 10 Wörter"}},
    "handsOn":     {{"value": 0, "confidence": "high", "reason": "max 10 Wörter"}},
    "outdoor":     {{"value": 0, "confidence": "high", "reason": "max 10 Wörter"}},
    "international": {{"value": 0, "confidence": "high", "reason": "max 10 Wörter"}},
    "beginnerFriendly": {{"value": 0, "confidence": "high", "reason": "max 10 Wörter"}},
    "competitive": {{"value": 0, "confidence": "high", "reason": "max 10 Wörter"}},
    "financialCost": {{"value": 0, "confidence": "high", "reason": "max 10 Wörter"}},
    "leadershipOpportunities": {{"value": 0, "confidence": "high", "reason": "max 10 Wörter"}},
    "language":    {{"value": "german", "confidence": "high", "reason": "max 10 Wörter"}},
    "eventFrequency": {{"value": "medium", "confidence": "high", "reason": "max 10 Wörter"}},
    "groupSize":   {{"value": "small", "confidence": "high", "reason": "max 10 Wörter"}}
  }}
}}

ATTRIBUT-DEFINITIONEN (maßgeblich für deine Klassifikation):
{attr_definitions}

Regeln für kategoriale Attribute:
- language: "german" | "both" | "english"
- eventFrequency: "low" (< 2x/Monat) | "medium" (~2x/Monat) | "high" (wöchentlich)
- groupSize: "small" (< 15 aktive) | "medium" (15–50) | "large" (> 50)

confidence: "high" | "medium" | "low"
- "high" = du bist sicher (klare Belege)
- "medium" = wahrscheinlich richtig, aber nicht explizit belegt
- "low" = Schätzung, kaum Belege

Recherchiere gründlich: Website, Instagram, StuRa-Seite (stura.tu-dresden.de).
Bei echten Unsicherheiten: confidence = "low", aber trotzdem einen plausiblen Wert angeben."""


# ─── API CALL ────────────────────────────────────────────────

BOOL_ATTRS = [
    "career", "tech", "socialImpact", "party", "religion", "sports",
    "networking", "arts", "music", "timeLow", "handsOn", "outdoor",
    "international", "beginnerFriendly", "competitive", "financialCost",
    "leadershipOpportunities",
]
CAT_ATTRS = {"language": ["german", "both", "english"],
             "eventFrequency": ["low", "medium", "high"],
             "groupSize": ["small", "medium", "large"]}


def research_group(client: anthropic.Anthropic, group_name: str, system_prompt: str) -> dict:
    user_msg = (
        f"Recherchiere die Hochschulgruppe der TU Dresden und klassifiziere alle 20 Attribute:\n\n"
        f"**{group_name}**\n\n"
        f"Suche auf deren Website, Instagram, der StuRa-Seite und anderen Quellen.\n"
        f"Antworte NUR mit dem JSON-Objekt."
    )

    response = client.messages.create(
        model=MODEL,
        max_tokens=2000,
        system=system_prompt,
        messages=[{"role": "user", "content": user_msg}],
        tools=[{"type": "web_search_20250305", "name": "web_search", "max_uses": MAX_SEARCHES_PER_GROUP}],
    )

    text_parts = [block.text for block in response.content if hasattr(block, "text")]
    full_text = "\n".join(text_parts).strip()

    # Strip markdown code fences if present
    json_str = full_text
    for fence in ["```json", "```"]:
        if fence in json_str:
            json_str = json_str.split(fence)[1].split("```")[0].strip()
            break

    start, end = json_str.find("{"), json_str.rfind("}") + 1
    if start >= 0 and end > start:
        json_str = json_str[start:end]

    result = json.loads(json_str)
    assert "name" in result and "attributes" in result

    attrs = result["attributes"]
    for attr in BOOL_ATTRS:
        assert attr in attrs, f"Missing '{attr}'"
        attrs[attr]["value"] = int(bool(attrs[attr]["value"]))

    for attr, allowed in CAT_ATTRS.items():
        assert attr in attrs, f"Missing '{attr}'"
        if attrs[attr]["value"] not in allowed:
            attrs[attr] = {"value": allowed[0], "confidence": "low", "reason": f"Fallback: ungültiger Wert"}

    result["_scraped_at"] = datetime.now().isoformat()
    result["_model"] = MODEL
    result["_tokens"] = {"input": response.usage.input_tokens, "output": response.usage.output_tokens}
    return result


# ─── MAIN ────────────────────────────────────────────────────

def main():
    dry_run = "--dry-run" in sys.argv
    resume = "--resume" in sys.argv or os.path.exists(PARTIAL_FILE)

    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        print("\n❌ ANTHROPIC_API_KEY nicht gesetzt!")
        print('   export ANTHROPIC_API_KEY="sk-ant-..."')
        sys.exit(1)

    if not INPUT_FILE.exists():
        print(f"❌ {INPUT_FILE} nicht gefunden")
        sys.exit(1)

    input_data = json.loads(INPUT_FILE.read_text(encoding="utf-8"))
    all_groups = [g["name"] for g in input_data["groups"]]

    attr_defs = load_attribute_definitions()
    system_prompt = build_system_prompt(attr_defs)
    client = anthropic.Anthropic(api_key=api_key)

    if dry_run:
        groups_to_run = DRY_RUN_GROUPS
        print(f"🧪 DRY RUN — {len(groups_to_run)} Gruppen")
    else:
        groups_to_run = all_groups
        print(f"🚀 FOMO Scraper — {len(groups_to_run)} Gruppen")

    print(f"   Model: {MODEL} | Searches/Gruppe: {MAX_SEARCHES_PER_GROUP}")
    print("=" * 60)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    done = {}
    if resume and PARTIAL_FILE.exists():
        done = {r["name"]: r for r in json.loads(PARTIAL_FILE.read_text(encoding="utf-8"))}
        print(f"📂 Resume: {len(done)} Gruppen bereits fertig\n")

    start_time = time.time()
    success = failed = total_tokens = 0
    errors = []

    for i, name in enumerate(groups_to_run, 1):
        if name in done:
            print(f"[{i:2d}/{len(groups_to_run)}] ⏭️  {name[:45]:<45} (cached)")
            success += 1
            continue

        print(f"[{i:2d}/{len(groups_to_run)}] 🔍 {name[:45]:<45}", end=" ", flush=True)

        for attempt in range(3):
            try:
                result = research_group(client, name, system_prompt)
                done[name] = result
                total_tokens += result["_tokens"]["input"] + result["_tokens"]["output"]
                low = sum(1 for a in result["attributes"].values() if a.get("confidence") == "low")
                print(f"✅{f' ({low} unsicher)' if low else ''}")
                success += 1
                PARTIAL_FILE.write_text(json.dumps(list(done.values()), ensure_ascii=False, indent=2), encoding="utf-8")
                break

            except anthropic.RateLimitError:
                wait = 30 * (attempt + 1)
                print(f"⏳ Rate limit, warte {wait}s…", end=" ", flush=True)
                time.sleep(wait)

            except (anthropic.APIConnectionError, anthropic.APITimeoutError) as e:
                if attempt < 2:
                    time.sleep(20 * (attempt + 1))
                else:
                    print(f"❌ Connection error")
                    errors.append({"name": name, "error": str(e)})
                    failed += 1

            except (json.JSONDecodeError, AssertionError, KeyError) as e:
                if attempt < 2:
                    time.sleep(2)
                else:
                    print(f"❌ Parse-Fehler: {str(e)[:50]}")
                    errors.append({"name": name, "error": str(e)})
                    failed += 1

            except Exception as e:
                print(f"❌ {str(e)[:50]}")
                errors.append({"name": name, "error": str(e)})
                failed += 1
                break

        time.sleep(1)

        if i % 10 == 0 and not dry_run:
            elapsed = time.time() - start_time
            eta = (elapsed / i) * (len(groups_to_run) - i) / 60
            print(f"   ⏱️  {i}/{len(groups_to_run)} | ETA: ~{eta:.1f} min | Tokens: {total_tokens:,}")

    # Save final raw output
    results = list(done.values())
    FINAL_RAW.write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")

    elapsed = time.time() - start_time
    print(f"\n{'=' * 60}")
    print(f"{'🧪 DRY RUN' if dry_run else '✅'} FERTIG")
    print(f"   ✅ {success}/{len(groups_to_run)} erfolgreich")
    if failed:
        print(f"   ❌ {failed} fehlgeschlagen")
    print(f"   📊 Tokens: {total_tokens:,}  (~{total_tokens/1_000_000*3:.2f}€)")
    print(f"   ⏱️  {elapsed/60:.1f} min")
    print(f"\n   → {FINAL_RAW.relative_to(REPO_ROOT)}")

    if dry_run:
        print("\n   Qualität prüfen, dann Vollrun starten:")
        print("   python scripts/scraper/scrape_groups.py")
        print("   python scripts/scraper/convert_to_profiles.py --input data/hsg-scraper-output/groups_raw.json")
    else:
        print("\n   → Konvertieren:")
        print("   python scripts/scraper/convert_to_profiles.py --input data/hsg-scraper-output/groups_raw.json")

    if errors:
        print(f"\n   ❌ Fehler bei:")
        for e in errors:
            print(f"      - {e['name']}: {e['error'][:60]}")

    if not dry_run and failed == 0 and PARTIAL_FILE.exists():
        PARTIAL_FILE.unlink()
        print("\n   🧹 Partial-File gelöscht")


if __name__ == "__main__":
    main()
