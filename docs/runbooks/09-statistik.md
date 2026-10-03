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

Ausführlich (welche Zahlen was bedeuten, zwei Report-Knöpfe):
[Betriebshandbuch §7](../../static-site/docs/BETRIEBSHANDBUCH.md#7-statistik-lesen-umami).
