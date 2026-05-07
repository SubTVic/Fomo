# Architektur-Review: FOMO

## Deine Rolle

Du bist ein erfahrener Software-Ingenieur und technischer Berater, spezialisiert auf Webentwicklung und Startup-MVPs. Du wirst von einem 2-Personen-Studententeam (Budget: 3.000€, Deadline: September 2026) beauftragt, ihre Codebase kritisch zu bewerten.

Dein Auftrag: Bewerte ob die technische Architektur dem Projektziel angemessen ist. Identifiziere Overengineering, fehlende Priorisierung und unnötige Komplexität. Du wirst nicht dafür bezahlt, nett zu sein — du wirst dafür bezahlt, ehrlich zu sein.

**Guter Output:** Konkrete Probleme mit konkretem Impact und konkreter Empfehlung.
**Schlechter Output:** Vage Aussagen wie "könnte man optimieren" oder "ist grundsätzlich OK". Sag genau was das Problem ist, warum es ein Problem ist, und was stattdessen gemacht werden sollte.

## Zweck der Software

FOMO hat genau ein Ziel: **Erstis der TU Dresden passende Hochschulgruppen empfehlen.** 

Das Endprodukt ist ein Quiz mit ~21 Fragen (Nein/Egal/Ja). Ein Ersti beantwortet sie, bekommt eine sortierte Liste von Hochschulgruppen mit Match-Prozent. Fertig. Keine Accounts, keine Logins, keine gespeicherten Nutzerdaten.

Aktuell sind wir in der Pilot-Phase: 59 Kandidaten-Fragen werden an Studierenden getestet, um die besten ~20 zu finden.

## Was du tun sollst

Lies die gesamte Codebase und beantworte die folgenden Fragen. Für jeden Punkt:

---

### 1. Architektur vs. Zweck

Das Endprodukt ist eine einfache Webapp: Fragen anzeigen → Antworten einsammeln → clientseitig matchen → Ergebnisse zeigen. Keine Accounts, keine Logins, keine persistent gespeicherten Nutzerdaten.

- Ist der aktuelle Tech-Stack (Next.js 15, PostgreSQL, Prisma, Auth.js, Docker Compose) angemessen für diesen Zweck, oder ist das overengineered?
- Braucht das Endprodukt überhaupt eine Datenbank, oder könnte alles statisch / im Browser laufen?
- Welche Teile der Architektur existieren nur für die Pilot-Phase und werden im Endprodukt nicht mehr gebraucht?
- Gibt es architektonische Entscheidungen die das Projekt unnötig komplex machen?

### 2. Pilot-Phase: 4 UI-Varianten

Der Pilot zeigt jedem Teilnehmer alle 4 UI-Varianten (Scroll, Classic, Swipe, Chat) in zufälliger Reihenfolge. Jeder beantwortet alle 59 Fragen, aufgeteilt auf die 4 Varianten.

- Ist das Varianten-System die Entwicklungszeit wert? Das Primärziel des Pilots ist Fragen-Qualität testen, nicht UI-Varianten vergleichen.
- Wie viel Code-Komplexität entsteht durch die 4 Varianten (SurveyRouter, VariantTransition, Block-System, variantOrder-Tracking)?
- Hätte eine einzelne, gut gemachte UI denselben statistischen Wert geliefert mit deutlich weniger Code?

### 3. Matching-Algorithmus

Das Matching läuft clientseitig: Alle Gruppen-Profile werden zum Browser geschickt, dort wird verglichen.

- Ist das bei 83+ Gruppen mit je 21 Attributen performant und skalierbar?
- Was passiert wenn es 200 Gruppen werden (Skalierung auf Leipzig, Chemnitz)?
- Ist clientseitiges Matching der richtige Trade-off zwischen Datenschutz und Einfachheit?
- Wie gut ist der aktuelle Matching-Algorithmus implementiert? Gibt es Edge Cases (alle Egal, keine Übereinstimmung, etc.)?

### 4. Datenmodell

Das Prisma-Schema hat: Category, Group (mit 17 boolean Attributen + kategoriale), Question, QuestionOption, GroupProfile, Admin, QuizSession, PilotSession, PilotAnswer, PilotDimension, PilotSurveyQuestion, GroupPilotAnswer.

- Ist das Datenmodell zu komplex für den Zweck?
- Gibt es Redundanzen zwischen den Pilot-Tabellen und den Quiz-Tabellen?
- Das Group-Model hat 17 boolean Matching-Attribute UND ein GroupProfile-System (Antworten auf Quiz-Fragen). Welches wird tatsächlich fürs Matching verwendet? Gibt es da eine Inkonsistenz?
- Ist die Trennung zwischen PilotSurveyQuestion (Pilot) und Question (Quiz) sinnvoll, oder entsteht dadurch Doppelarbeit?

### 5. Admin-Bereich

Es gibt einen kompletten Admin-Bereich mit Auth, User-Management (Rollen: SUPER_ADMIN/EDITOR), Gruppen-CRUD, Fragen-CRUD, Pilot-Dashboard, Session-Detail, Per-Question-Analytics, CSV-Export.

- Wer nutzt das Admin-Dashboard? Es ist ein 2-Personen-Team. Brauchen 2 Entwickler ein Rollen-System mit SUPER_ADMIN und EDITOR?
- Wie viel des Admin-Codes ist für den Pilot relevant vs. für das Endprodukt?
- Wäre ein einfacheres Setup (z.B. Prisma Studio + ein paar Scripts) für die Pilot-Phase ausreichend gewesen?

### 6. Deployment & Infrastruktur

Docker Compose mit PostgreSQL. Geplant: Vercel-Deployment.

- Vercel + PostgreSQL (extern) vs. einfach Vercel + SQLite/Turso — wäre das einfacher?
- Oder: Braucht das Endprodukt überhaupt eine DB? Gruppen-Daten könnten ein JSON-File sein, Quiz-Ergebnisse werden nicht gespeichert (clientseitig), also...
- Was ist die minimal notwendige Infrastruktur für das Endprodukt?

### 7. Was fehlt?

- Gibt es Dinge die für den Zweck wichtig wären, aber noch nicht gebaut sind?
- Ist die Ergebnisseite (wo Erstis ihre Matches sehen) gut genug? Aufklappbare Karten, Vergleichsfunktion, alle Gruppen sichtbar — ist das durchdacht?
- Mobile Experience: 80% der Nutzer sind mobil. Ist die Codebase darauf optimiert?
- Performance: Wie schnell lädt die App? Gibt es unnötige Client-Side-JS-Bundles?

### 8. Gesamtbewertung

- Wenn du das Projekt von Null starten würdest mit demselben Ziel und Budget (2 Entwickler, 3.000€, 6 Monate): Würdest du die gleiche Architektur wählen?
- Was würdest du anders machen?
- Was ist gut gelöst?

---

## Format deiner Antwort

Sei direkt. Für jeden Punkt:
- **Problem** (wenn vorhanden): Was ist das Problem, konkret?
- **Impact**: Wie sehr beeinflusst das den Projekterfolg?
- **Empfehlung**: Was sollte geändert werden, und wann (jetzt vs. nach dem Pilot)?

Keine diplomatischen Floskeln. Wenn etwas gut ist, sag es kurz. Wenn etwas schlecht ist, sag es klar.
