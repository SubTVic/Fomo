<!-- SPDX-License-Identifier: AGPL-3.0-only -->

# FOMO – Zusammenfassung für den StuRa (ohne Technik-Vorwissen)

*Stand: 03.10.2026. Eine Seite zum Verstehen, Entscheiden und Weitergeben.*

## Nachtrag 04.10.2026: Was seit dieser Zusammenfassung erledigt ist

Der Umbau (Phase 1–5 des Umsetzungsplans) und die Funde aus dem Oktober-Audit sind
seit dem 04.10.2026 im Hauptstand. Die Liste „Die wichtigsten Baustellen“ weiter unten
ist der Zustand **vorher**; heute gilt:

| Baustelle (unten) | Stand jetzt |
|---|---|
| 1. Internes Werkzeug lässt sich nicht aktualisieren | ✅ Behoben, auf aktuelle Software (Next.js 16, Node 24) gebracht. Jede Änderung wird jetzt vor dem Merge automatisch geprüft. |
| 2. Sicherheitslücke im internen Werkzeug | ✅ Geschlossen. Dazu: Rollen (Super-Admin/Editor), Login-Sperre nach Fehlversuchen. |
| Daten müssen von Hand übertragen werden | ✅ Ein Knopf („Daten-Sync“) erzeugt den Vorschlag, ein Klick schaltet ihn live. Einmalig einzurichten (Zugangsschlüssel `EXPORT_TOKEN`, siehe `TODO.md` §1.0). |
| 3. Alles hängt an privaten Konten | ⬜ Offen — Phase 7 (Übergabe der Konten). |
| 4. Keine Sicherungskopien, keine Überwachung | 🟡 Anleitung für Backups und Wiederherstellung liegt vor (`docs/runbooks/11-backup-und-migration.md`), läuft aber noch von Hand. Automatische Backups und Überwachung kommen mit dem Server-Umzug (Phase 6). |
| 5. Datenschutz | 🟡 Das interne Werkzeug hat jetzt Impressum und Datenschutzerklärung; ein Löschkonzept liegt als Entwurf vor (`docs/datenschutz-loeschkonzept.md`). **Offen:** juristische Prüfung der Texte, Fristen festlegen, Statistik-Anbieter in der Datenschutzerklärung der Website nennen. |

Die Quiz-Ergebnisse wurden außerdem robuster: Wer weniger als 5 Fragen mit Ja/Nein
beantwortet, bekommt einen Hinweis statt eines zufälligen Rankings.

**Nächste Entscheidungen für den StuRa:** Umzug auf den StuRa-Server (Phase 6, braucht
ein Gespräch mit dem Referat Technik) und Übergabe der Konten (Phase 7). Offene
Entscheidungen E2–E9 stehen in `docs/uebergabe/umsetzungsplan.md` §2.

## Was ist FOMO technisch?

FOMO besteht aus **zwei Teilen**:

1. **Die öffentliche Website** (www.fomo-dresden.app) mit dem Quiz für Erstis. Sie ist
   eine „statische" Seite: nur fertige Dateien, keine Datenbank, kein Server, der
   abstürzen kann. Sie läuft **stabil und praktisch kostenlos** und braucht kaum Pflege.
2. **Ein internes Werkzeug** (nur für euch, nicht öffentlich beworben), mit dem sich
   Hochschulgruppen registrieren und ihr Profil pflegen. Das hat eine Datenbank, einen
   Login und ist der **aufwändige, pflegeintensive Teil**.

Zwischen beiden liegt ein Haken: Wenn eine Gruppe im internen Werkzeug etwas ändert,
wird das **nicht automatisch** auf der Website sichtbar. Jemand muss die Daten von Hand
übertragen (ein Export, dann hochladen). Das ist zuletzt am **17.08.2026** passiert —
seitdem sind Änderungen der Gruppen **nicht online**.

## Was kostet FOMO?

- **Website-Hosting:** derzeit 0 € (kostenloses Kontingent).
- **Domain** (die Adresse fomo-dresden.app): ca. **15 €/Jahr** — **wichtig: jährlich
  verlängern, sonst ist die Seite weg.**
- Datenbank + Statistik: derzeit im kostenlosen Rahmen. Zur Erstiwoche könnte das
  Statistik-Kontingent knapp werden (viele Besucher auf einmal) — das sollte man im
  Blick behalten.
- **Zu klären:** Das kostenlose Hosting ist laut Anbieter nur für private Projekte
  gedacht. Für ein vom StuRa finanziertes Projekt sollte man prüfen, ob das zulässig
  ist (sonst kostenpflichtiger Tarif oder Uni-Server).

## Was muss man regelmäßig tun?

- **Einmal im Jahr:** Domain verlängern.
- **Vor der Erstiwoche:** Gruppendaten aktualisieren, tote Links stichprobenartig
  prüfen, Statistik anschauen.
- **Bei Gruppen-Anfragen** (neue Gruppe, Änderung, Link verloren): über das interne
  Werkzeug erledigen — Anleitungen liegen als „Runbooks" bei.
- **Sonst:** Die Website selbst braucht keine laufenden Sicherheitsupdates. Das interne
  Werkzeug schon.

## Die wichtigsten Baustellen (bitte vor der Übergabe klären)

1. **Das interne Werkzeug lässt sich seit Ende Juni nicht mehr aktualisieren** (ein
   technischer Fehler blockiert das). Muss repariert werden, sonst kann man dort nichts
   mehr ändern oder absichern.
2. **Eine Sicherheitslücke** im internen Werkzeug erlaubt derzeit Zugriff ohne Passwort.
   Muss vor weiterem Betrieb geschlossen werden.
3. **Alles hängt an privaten Konten einer Einzelperson** (Code-Konto, Hosting, Domain,
   und das Impressum läuft auf eine Privatadresse). Vor der Übergabe auf StuRa/YETI
   umstellen, sonst ist der StuRa nach dem Weggang des Teams handlungsunfähig.
4. **Keine Sicherungskopien, keine Überwachung:** Es gibt keinen automatischen
   Backup- und Wiederherstellungsweg und keine Warnung, wenn etwas kaputtgeht (deshalb
   fiel Baustelle 1 monatelang niemandem auf).
5. **Datenschutz prüfen lassen:** Die Statistik erfasst anonym, aber recht detailliert
   (u. a. welche Gruppe jemand kennt). Die Datenschutzerklärung ist unvollständig und
   enthält noch einen Platzhalter. Das interne Werkzeug hat gar kein Impressum/keine
   Datenschutzerklärung, obwohl es Kontaktdaten sammelt.

## Was der StuRa zur Übergabe haben muss

- **Zugänge** zu: Code-Konto (GitHub), Hosting (Vercel), Datenbank, Statistik (Umami),
  Domain-Verwaltung, Kontakt-Postfach. Am besten auf StuRa-/YETI-Konten, nicht privat.
- **Wer ist im Notfall ansprechbar?** (Altteam, YETI, technische Hilfe)
- Die beiliegenden Unterlagen: ausführlicher Bericht (`audit.md`), Anleitungen
  (`docs/runbooks/`), Projekt-Doku (`CLAUDE.md`), Betriebshandbuch.

## Wen fragt man?

- **Routine ohne Technik** (Text ändern, Statistik ansehen): Betriebshandbuch +
  Runbooks reichen.
- **Gruppen-Daten pflegen:** Runbook 01–03.
- **Etwas ist kaputt / tiefergehende Änderung:** jede:r Webentwickler:in kann
  übernehmen — das Projekt ist Open Source, kein Anbieter-Lock-in. Alternativ eine
  KI-Coding-Hilfe (z. B. Claude Code) mit den beiliegenden Leitplanken.

> **Gute Nachricht:** Die öffentliche Seite ist robust und günstig. **Handlungsbedarf
> besteht vor allem beim internen Werkzeug und bei den Konten/Zugängen** — das sollte
> vor dem Weggang des aktuellen Teams geregelt werden.
