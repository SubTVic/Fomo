#!/usr/bin/env python3
"""
FOMO Kontaktdaten-Scraper
Nutzt Anthropic API mit Web Search Tool.
Claude sucht Kontaktdaten für alle Hochschulgruppen: E-Mail, Telefon,
Website, Instagram, LinkedIn, Facebook, YouTube, etc.

Voraussetzungen:
  pip install anthropic

Nutzung:
  # API-Key in skripte/.env eintragen:
  # ANTHROPIC_API_KEY=sk-ant-...
  python scrape_contacts.py

Output:
  output/contacts.json          — Alle Gruppen mit Kontaktdaten
  output/contacts_partial.json  — Fortschritt (für Resume)
  output/contacts.csv           — CSV-Export

Zusammenführen mit Attribut-Daten:
  python merge_contacts.py      — Kombiniert groups.json + contacts.json
"""

import anthropic
import json
import csv
import os
import sys
import time
from datetime import datetime
from pathlib import Path

# Load .env from the same directory as this script
_env_file = Path(__file__).parent / ".env"
if _env_file.exists():
    for _line in _env_file.read_text().splitlines():
        if _line.strip() and not _line.startswith("#") and "=" in _line:
            _k, _v = _line.split("=", 1)
            os.environ.setdefault(_k.strip(), _v.strip())

# ─── CONFIG ──────────────────────────────────────────────

MODEL = "claude-sonnet-4-6"
MAX_SEARCHES_PER_GROUP = 4
OUTPUT_DIR = "output"
PARTIAL_FILE = os.path.join(OUTPUT_DIR, "contacts_partial.json")
FINAL_JSON   = os.path.join(OUTPUT_DIR, "contacts.json")
FINAL_CSV    = os.path.join(OUTPUT_DIR, "contacts.csv")

# ─── GRUPPEN ─────────────────────────────────────────────

GRUPPEN = [
    "404 UNIVERSITY ESPORTS DRESDEN",
    "AEGEE-Dresden e. V.",
    "AIAS Dresden e.V.",
    "AIESEC",
    "Akademische Fliegergruppe der TU Dresden e.V. (Akaflieg)",
    "altBau e.V. - Alumniverein Bauingenieurwesen TU Dresden",
    "Amateurfunk an der TU Dresden (DL0TUD)",
    "Amnesty International Hochschulgruppe Dresden",
    "ANW Hochschulgruppe Tharandt",
    "Arbeiterkind.de Dresden",
    "Baghira",
    "Betonbootteam",
    "bonding-studierendeninitiative e.V.",
    "btS – Life Sciences Studierendeninitiative e.V.",
    "Campusradio Dresden e.V.",
    "Christians for Mission",
    "Club 11 e.V.",
    "Club Aquarium e.V.",
    "Club HängeMathe e.V.",
    "DE-LATAM e.V.",
    "DGB Hochschulgruppe Dresden",
    "DIE BÜHNE e.V. – das Theater der TU Dresden",
    "Die Linke.SDS Dresden",
    "DIAS",
    "Elbflorace Formula Student Team TU Dresden e.V.",
    "elbMUN e.V.",
    "Erasmus Student Network TU Dresden e.V.",
    "EUROAVIA Dresden e.V.",
    "Evangelische Studierendengemeinde Dresden (ESG)",
    "First Aid for All - Dresden",
    "Folkloretanzensemble 'Thea Maass' der TU Dresden",
    "Fridays for Future Dresden",
    "Genow - Gender Equality NOW",
    "Gutzkowclub e.V.",
    "Heinrich-Cotta-Club e.V.",
    "HSG Grundvorlesung ökologische Nachhaltigkeit",
    "Indian Association Dresden e.V.",
    "Ingenieure ohne Grenzen Dresden (IOG)",
    "IG Börse an der TU Dresden e.V.",
    "Islamischer Hochschulbund Dresden",
    "jDPG Dresden",
    "JuFORUM-Lokalgruppe Dresden",
    "junge GEW",
    "Junges Ensemble Dresden",
    "Juso-Hochschulgruppe (JHG) Dresden",
    "Kammerchor Cantabile Dresden",
    "Katholische Studierendengemeinde Dresden (KSG)",
    "Kellerklub GAG 18",
    "Kino im Kasten",
    "KRETA - Kritische Einführungstage",
    "kritmed*",
    "Kultur in der Neuen Mensa",
    "Leo Club Dresden",
    "Liberale Hochschulgruppe Dresden",
    "Medinetz Dresden e.V.",
    "Mit Sicherheit Verliebt",
    "Nachhaltigkeits-AG Bauwesen",
    "Nightline Dresden e.V.",
    "Pakistani Student Association (PSA)",
    "PAUL Consultants e.V.",
    "Progressiv am Campus",
    "RCDS Dresden",
    "Rock Your Life! Dresden e.V.",
    "SMD Dresden",
    "STAR Dresden e.V.",
    "Studentenclub Bärenzwinger e.V.",
    "Studentenreiter Dresden",
    "STAV e.V.",
    "Studentische Wasserwacht Dresden",
    "Studentischer Sanitätsdienst",
    "Studis gegen Rechts",
    "Studytutors Dresden",
    "Stutentenclub Borsi 34 e.V.",
    "Team AufeinanderAchten",
    "The Big Band Therapy",
    "Therapie mal anders",
    "Traumtänzer e.V",
    "TU Big Band e.V.",
    "TU Dresden Robotik AG",
    "Universitätsorchester Dresden",
    "Verkehrte Welt e.V",
    "Volt Hochschulgruppe Dresden",
    "VWI HG Dresden e.V.",
    "YETI Dresden",
]

# ─── SYSTEM PROMPT ───────────────────────────────────────

SYSTEM_PROMPT = """Du bist ein Recherche-Assistent für das Projekt FOMO (Find Our Matching Organizations) der TU Dresden.

Deine Aufgabe: Finde alle öffentlichen Kontaktdaten einer studentischen Hochschulgruppe.

WICHTIG: Antworte AUSSCHLIESSLICH mit einem JSON-Objekt. Kein Markdown, keine Erklärung, nur JSON.

Das JSON muss exakt dieses Format haben:
{
  "name": "Exakter Name der Gruppe",
  "email": "kontakt@beispiel.de oder leerer String",
  "phone": "Telefonnummer oder leerer String",
  "website": "https://... oder leerer String",
  "instagram": "https://instagram.com/... oder leerer String",
  "facebook": "https://facebook.com/... oder leerer String",
  "linkedin": "https://linkedin.com/... oder leerer String",
  "youtube": "https://youtube.com/... oder leerer String",
  "twitter": "https://twitter.com/... oder leerer String",
  "tiktok": "https://tiktok.com/... oder leerer String",
  "discord": "https://discord.gg/... oder leerer String",
  "telegram": "https://t.me/... oder leerer String",
  "other_links": ["URL1", "URL2"],
  "address": "Postadresse oder Treffpunkt oder leerer String",
  "contact_person": "Name der Ansprechperson oder leerer String",
  "stura_page": "https://stura.tu-dresden.de/... oder leerer String",
  "sources": ["URL1", "URL2"]
}

Regeln:
- Nur öffentlich zugängliche Kontaktdaten eintragen
- Keine privaten E-Mail-Adressen oder Telefonnummern
- URLs immer vollständig mit https:// angeben
- Wenn eine Information nicht gefunden wurde: leerer String "" oder leeres Array []
- other_links: sonstige relevante Links (Linktr.ee, Vereinsregister, uni-Seite, etc.)
- stura_page: Link zur Seite auf stura.tu-dresden.de falls vorhanden
- Suche auf: Website der Gruppe, Instagram, Facebook, StuRa-Seite, Google

Antworte NUR mit dem JSON-Objekt."""

# ─── API CALL ────────────────────────────────────────────

def research_contacts(client: anthropic.Anthropic, group_name: str) -> dict:
    """Recherchiert Kontaktdaten einer Gruppe via Claude + Web Search."""

    user_msg = f"""Finde alle öffentlichen Kontaktdaten der folgenden Hochschulgruppe der TU Dresden:

**{group_name}**

Suche auf der Gruppenwebsite, Instagram, Facebook, der StuRa-Seite (stura.tu-dresden.de) und Google.
Antworte NUR mit dem JSON-Objekt."""

    response = client.messages.create(
        model=MODEL,
        max_tokens=1000,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_msg}],
        tools=[{
            "type": "web_search_20250305",
            "name": "web_search",
            "max_uses": MAX_SEARCHES_PER_GROUP,
        }],
    )

    # Extract text blocks from response
    text_parts = []
    for block in response.content:
        if hasattr(block, "text"):
            text_parts.append(block.text)

    full_text = "\n".join(text_parts).strip()

    # Strip markdown code fences if present
    json_str = full_text
    if "```json" in json_str:
        json_str = json_str.split("```json")[1].split("```")[0].strip()
    elif "```" in json_str:
        json_str = json_str.split("```")[1].split("```")[0].strip()

    start = json_str.find("{")
    end = json_str.rfind("}") + 1
    if start >= 0 and end > start:
        json_str = json_str[start:end]

    result = json.loads(json_str)

    assert "name" in result, "Missing 'name'"

    # Ensure all expected fields exist
    string_fields = [
        "email", "phone", "website", "instagram", "facebook",
        "linkedin", "youtube", "twitter", "tiktok", "discord",
        "telegram", "address", "contact_person", "stura_page",
    ]
    for field in string_fields:
        if field not in result:
            result[field] = ""

    for field in ["other_links", "sources"]:
        if field not in result:
            result[field] = []

    # Add metadata
    result["_scraped_at"] = datetime.now().isoformat()
    result["_model"] = MODEL
    result["_tokens"] = {
        "input": response.usage.input_tokens,
        "output": response.usage.output_tokens,
    }

    return result


# ─── EXPORT ──────────────────────────────────────────────

CONTACT_FIELDS = [
    "name", "email", "phone", "website", "instagram", "facebook",
    "linkedin", "youtube", "twitter", "tiktok", "discord", "telegram",
    "address", "contact_person", "stura_page",
]

def export_csv(results: list[dict], path: str):
    with open(path, "w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=CONTACT_FIELDS + ["other_links"])
        writer.writeheader()
        for r in results:
            row = {field: r.get(field, "") for field in CONTACT_FIELDS}
            row["other_links"] = " | ".join(r.get("other_links", []))
            writer.writerow(row)
    print(f"   📄 CSV exportiert: {path}")


# ─── MAIN ────────────────────────────────────────────────

def main():
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        print("\n❌ ANTHROPIC_API_KEY nicht gesetzt!")
        print("   Trag den Key in skripte/.env ein:")
        print("   ANTHROPIC_API_KEY=sk-ant-...\n")
        sys.exit(1)

    client = anthropic.Anthropic(api_key=api_key)
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # Load partial results for resume
    done = {}
    if os.path.exists(PARTIAL_FILE):
        with open(PARTIAL_FILE, "r", encoding="utf-8") as f:
            done = {r["name"]: r for r in json.load(f)}
        print(f"📂 Resume: {len(done)} Gruppen bereits fertig\n")

    print(f"🚀 FOMO Kontakt-Scraper — {len(GRUPPEN)} Gruppen")
    print(f"   Model: {MODEL}")
    print(f"   Max Searches/Gruppe: {MAX_SEARCHES_PER_GROUP}")
    print("=" * 60)

    start_time = time.time()
    success = 0
    failed = 0
    total_tokens = 0
    errors = []

    for i, name in enumerate(GRUPPEN, 1):
        if name in done:
            print(f"[{i:2d}/{len(GRUPPEN)}] ⏭️  {name[:45]:<45} (cached)")
            success += 1
            continue

        print(f"[{i:2d}/{len(GRUPPEN)}] 🔍 {name[:45]:<45}", end=" ", flush=True)

        retries = 0
        while retries < 3:
            try:
                result = research_contacts(client, name)
                done[name] = result

                tokens = result["_tokens"]["input"] + result["_tokens"]["output"]
                total_tokens += tokens

                # Count non-empty contact fields
                filled = sum(
                    1 for f in CONTACT_FIELDS[1:]  # skip "name"
                    if result.get(f, "")
                )
                print(f"✅ {filled} Felder gefunden")
                success += 1

                # Save progress after each group
                with open(PARTIAL_FILE, "w", encoding="utf-8") as f:
                    json.dump(list(done.values()), f, ensure_ascii=False, indent=2)

                break

            except anthropic.RateLimitError:
                retries += 1
                wait = 30 * retries
                print(f"⏳ Rate limit, warte {wait}s...", end=" ", flush=True)
                time.sleep(wait)

            except (anthropic.APIConnectionError, anthropic.APITimeoutError):
                retries += 1
                wait = 20 * retries
                if retries < 3:
                    print(f"⏳ Connection error, Retry {retries} (warte {wait}s)...", end=" ", flush=True)
                    time.sleep(wait)
                else:
                    print(f"❌ Connection error nach 3 Versuchen")
                    errors.append({"name": name, "error": "Connection error"})
                    failed += 1

            except (json.JSONDecodeError, AssertionError, KeyError) as e:
                retries += 1
                if retries < 3:
                    print(f"⚠️  Parse-Fehler, Retry {retries}...", end=" ", flush=True)
                    time.sleep(2)
                else:
                    print(f"❌ {str(e)[:50]}")
                    errors.append({"name": name, "error": str(e)})
                    failed += 1

            except Exception as e:
                print(f"❌ {str(e)[:50]}")
                errors.append({"name": name, "error": str(e)})
                failed += 1
                break

        time.sleep(1)

        if i % 10 == 0:
            elapsed = time.time() - start_time
            eta = (elapsed / i) * (len(GRUPPEN) - i) / 60
            print(f"   ⏱️  {i}/{len(GRUPPEN)} | ETA: ~{eta:.1f} min | Tokens: {total_tokens:,}")

    # ─── RESULTS ─────────────────────────────────────────

    results = list(done.values())

    with open(FINAL_JSON, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    export_csv(results, FINAL_CSV)

    elapsed = time.time() - start_time

    # Summary stats
    filled_counts = {field: 0 for field in CONTACT_FIELDS[1:]}
    for r in results:
        for field in CONTACT_FIELDS[1:]:
            if r.get(field, ""):
                filled_counts[field] += 1

    print("\n" + "=" * 60)
    print("✅ KONTAKT-SCRAPING FERTIG")
    print("=" * 60)
    print(f"   ✅ Erfolgreich:    {success}/{len(GRUPPEN)}")
    print(f"   ❌ Fehlgeschlagen: {failed}/{len(GRUPPEN)}")
    print(f"   📊 Tokens:         {total_tokens:,}")
    print(f"   ⏱️  Dauer:          {elapsed/60:.1f} min")
    print(f"\n   Gefundene Kontaktfelder:")
    for field, count in sorted(filled_counts.items(), key=lambda x: -x[1]):
        bar = "█" * (count * 20 // len(GRUPPEN))
        print(f"   {field:<20} {bar:<20} {count}/{len(GRUPPEN)}")
    print(f"\n   📄 {FINAL_JSON}")
    print(f"   📄 {FINAL_CSV}")

    if errors:
        print(f"\n   ❌ Fehler bei:")
        for e in errors:
            print(f"      - {e['name']}: {e['error'][:60]}")

    if failed == 0 and os.path.exists(PARTIAL_FILE):
        os.remove(PARTIAL_FILE)
        print(f"\n   🧹 Partial-File gelöscht (alles fertig)")


if __name__ == "__main__":
    main()
