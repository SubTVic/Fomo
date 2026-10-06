<!-- SPDX-License-Identifier: AGPL-3.0-only -->

# Runbook: Statistik ansehen

**Stand: Oktober 2026.**

- **Fertiger Bericht (ohne Login):** www.fomo-dresden.app/report/ — Antworten pro Frage,
  Abbruch-Kurve, Top-Gruppen, Bias-Analyse. Anonyme Sammelwerte; kann an den StuRa
  weitergegeben werden.
- **Rohdaten:** Umami-Login → Website „fomo-dresden.app".
- **Aktualität:** Der Bericht wird bei jedem Deploy neu erzeugt; montags stößt eine
  GitHub-Automatik einen Deploy an. Das funktioniert nur, wenn das GitHub-Secret
  `VERCEL_DEPLOY_HOOK_URL` gesetzt ist. Sofort aktualisieren: GitHub → Actions →
  „Weekly report redeploy" → „Run workflow".
- **Bericht leer/„ohne Live-Daten"**: im Vercel-Projekt `fomo-static` fehlen
  `UMAMI_API_KEY` und/oder `UMAMI_WEBSITE_ID`.

- **Achtung bei Vergleichen über die Zeit:** Daten **vor dem 03.10.2026** enthalten
  Doppelzählungen: Wer auf der Ergebnisseite „Antworten ändern“ nutzte, wurde erneut als
  `quiz-complete`/`quiz-response` gezählt (deshalb teils mehr Abschlüsse als Starts).
  Seitdem zählt jeder Durchlauf einmal. Der Eintrag in
  `static-site/data/report-milestones.json` markiert die Grenze.
- **Neues Event seit Oktober 2026:** `results-too-few-answers` — die Person hat weniger
  als 5 Fragen mit Ja/Nein beantwortet und bekam deshalb kein Ranking. Ein hoher Anteil
  heißt: viele klicken nur „Neutral“.

- **Feedback-Zähler (👍/👎) „auf 0 setzen“:** in `static-site/data/report-milestones.json`
  das Feld `feedbackSince` auf das Startdatum setzen (z. B. Beginn einer Werbekampagne),
  per PR mergen. Ab dem nächsten Deploy zählt die Kachel nur Feedback ab diesem Tag; die
  alten Daten bleiben in Umami erhalten. Feld leeren = wieder ganzer Zeitraum.

Ausführlich (welche Zahlen was bedeuten, zwei Report-Knöpfe):
[Betriebshandbuch §7](../../static-site/docs/BETRIEBSHANDBUCH.md#7-statistik-lesen-umami).
