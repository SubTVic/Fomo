# Architektur-Review: Empfehlungen aus Entwicklergespräch (April 2026)

> Dieses Dokument fasst die Erkenntnisse aus einem Gespräch mit einem externen Entwickler (André) zusammen. Ziel: Claude Code soll diese Einschätzungen kennen und bei Architekturentscheidungen berücksichtigen.

---

## Gesamteindruck

Der Entwickler lobte die aktuelle Implementierung als **sehr professionell**. Die Kernkritik war keine Qualitätsfrage, sondern eine strategische Architekturfrage: **Dynamisches Hosting (Next.js mit Server) macht für FOMO langfristig keinen Sinn.**

---

## Hauptempfehlung: Static Hosting statt dynamisches Backend

### Das Problem mit dem aktuellen Ansatz

FOMO ist aktuell eine vollständige Next.js-App mit eigenem Backend (API-Routes, PostgreSQL, Auth.js). Für ein Quiz-Tool, das:
- kein permanentes User-Login braucht
- die Matching-Logik im Browser ausführt
- an mehrere Hochschulen skaliert werden soll

...ist das unnötig komplex und wartungsaufwändig.

### Die empfohlene Architektur

**Frontend:** Statisch gebauter HTML/JS-Bundle (z.B. Next.js `output: 'export'` oder ein schlankeres Framework). Läuft komplett im Browser. Keine Server-Roundtrips für das Quiz selbst.

**Datenhaltung:** Die Hochschulgruppen-Daten (Attribute, Profile) werden **nicht** in einer eigenen PostgreSQL-DB gehalten, sondern in einem **separaten, schlanken Datenspeicher** — z.B. eine strukturierte Excel/CSV-Datei oder ein einfaches JSON im Repository.

**Matching:** Läuft bereits heute komplett im Browser — das ist gut und soll so bleiben.

**Webstatistik / Event-Tracking:** Statt eines eigenen Backends für Analytics wird ein **Open-Source-Statistiktool** genutzt (siehe unten). Quiz-Abschlüsse, Klicks, etc. werden per URL-Call an dieses Tool geschickt.

---

## Empfohlenes Statistiktool: Umami

**Von André empfohlen:** [Umami](https://umami.is/)

- Open Source, DSGVO-konform (kein Cookie-Banner nötig, keine personenbezogenen Daten)
- Self-hosting möglich (auch auf Vercel, kostenlos)
- Cloud-Version: **Free Tier mit 100.000 Requests/Monat** — reicht für den Start
- Tracking per einfachem Script-Tag + Event-Calls im Frontend

### Mehrere Hochschulen in einem Umami-Account

Jede Hochschule bekommt eine **eigene Website-ID** in Umami. Beim Tracking-Aufruf wird diese ID mitgegeben → saubere Trennung der Analytics pro Standort (TU Dresden, Leipzig, Chemnitz).

### Alternative: Plausible

[Plausible.io](https://plausible.io/) — ebenfalls privacy-first, aber:
- kein Free Tier in der Cloud
- Self-hosting aufwändiger als Umami

→ **Empfehlung: Umami bevorzugen.**

---

## Repository-Struktur: Public + Private

Der Entwickler empfahl ein **Zwei-Repository-Modell**:

| Repo | Inhalt | Sichtbarkeit |
|------|--------|-------------|
| `fomo-public` | Reiner Quiz-Code, kein hochschulspezifischer Content | Öffentlich (Open Source) |
| `fomo-[hochschule]` | Angepasster Code + Hochschulgruppen-Daten für eine spezifische Hochschule | Privat (pro Hochschule) |

Das private Repo erbt / forkt vom öffentlichen und ergänzt nur die institutionsspezifischen Daten.

---

## Automatisiertes Deployment via GitHub Actions

Idee des Entwicklers: **Ein regelmäßiger automatischer Prozess**, der:

1. In eine **Excel- oder CSV-Datei** schaut (z.B. im Repo oder einem Google Sheet)
2. Prüft ob sich die Hochschulgruppen-Daten geändert haben
3. Falls ja: automatisch neu baut und deployed

Das bedeutet: Hochschulgruppen pflegen ihre Daten in einer einfachen Tabelle. Ein GitHub Action (Cron-Job) erkennt Änderungen und aktualisiert die live App — **ohne manuelle Deployments**.

---

## Docker für Umami

Umami kann auch via **Docker Container** selbst gehostet werden — zum Beispiel auf dem eigenen Server des Rechenzentrums oder StuRa. Das wäre relevant, falls:
- der Free Tier von Umami Cloud nicht ausreicht
- die TU Dresden / StuRa eigene Infrastruktur bevorzugt

---

## Offene Folgefrage: Gespräch mit Referat Technik

Der Entwickler empfahl ein **Gespräch mit dem Referat Technik** (StuRa oder TU Dresden):
- Was sind die technischen Gegebenheiten der Hochschule?
- Gibt es bevorzugte Hosting-Infrastruktur?
- Kann Umami auf deren Servern laufen?

Dieses Gespräch sollte geführt werden, **bevor** eine finale Hosting-Entscheidung getroffen wird.

---

## Zusammenfassung: Was das für FOMO bedeutet

| Aspekt | Heute | Empfehlung |
|--------|-------|------------|
| Hosting | Dynamisch (Next.js + Server) | Statisch (HTML/JS Bundle) |
| Datenbank | PostgreSQL (selbst gehostet) | Einfache JSON/CSV im Repo |
| Analytics | Keine / eigene API | Umami (Open Source, DSGVO-konform) |
| Multi-Hochschule | Nicht vorbereitet | Separate Website-IDs in Umami + privates Repo pro Hochschule |
| Datenschutz | Eigene Server, Auth.js | Kein User-Login nötig, Matching im Browser |
| Deployment | Manuell / Vercel push | GitHub Actions Cron-Job auf Dateiänderungen |

---

## Wichtiger Hinweis für Claude Code

Diese Empfehlungen sind **noch nicht umgesetzt**. Die aktuelle Codebase ist Next.js 15 mit PostgreSQL, Prisma und Auth.js. Eine vollständige Migration ist ein größeres Vorhaben.

Kurzfristig (vor September 2026 Launch) sollte der Fokus auf dem aktuellen Stack bleiben. Diese Architektur-Empfehlungen sind als **mittelfristige Roadmap** zu verstehen — insbesondere relevant für die Skalierung auf andere sächsische Hochschulen nach dem Launch.
