# FOMO – Offene Aufgaben

Stand: 19. Mai 2026

---

## Status-Überblick

| Phase | Status | Beschreibung |
| --- | --- | --- |
| Phase 1: Pilot-Studie | ✅ Abgeschlossen | 104 Sessions, Classic gewinnt (45%), Working Set v1.1 archiviert |
| Phase 2: Gruppen-Registrierung | 🔄 In Arbeit | i18n DE/EN ✅, Selbst-Registrierung + Kontaktliste ✅, Deployment ausstehend |
| Studie 2: Mitglieder-Validierung | 🔄 In Arbeit | `/pilot` gebaut, Daten werden noch erhoben |
| Phase 3: Matching & Ergebnisse | ⏳ Geplant | nach Studie-2-Auswertung |
| Phase 4: Launch | ⏳ Geplant | September 2026, Erstsemester-Woche |

---

## §1 Working Set V2 (Hybrid-Ansatz)

- [x] Pilot-1-Daten analysiert (n=102, Diskriminierungs-Δ, Inter-Item-Korrelationen)
- [x] `data/working-set-v2.json` — 21 Likert-Items + 8 Filter-Optionen (Hybrid-Ansatz)
- [x] `data/study2-plan.md` — Validierungs-Plan mit Metriken + Item-Trimming-Regeln
- [x] `src/lib/study2/items.ts` — TypeScript-Modul für WS2-Items

---

## §2 Studie 2 — Mitglieder-Validierung (`/pilot`)

- [x] DB-Modelle: `Study2Session` + `Study2Answer`
- [x] API: `POST /api/study2/submit` + `GET /api/study2/groups`
- [x] UI: `/pilot` Intro-Screen + `/pilot/quiz` Flow (Filter → 21 Items → Demografie → Feedback → Submit)
- [x] Admin: `/admin/study2` read-only + CSV/JSON-Export
- [x] `APP_MODE` → `APP_LIVE` Bool vereinfacht
- [x] Homepage: 3 CTAs (Studie 2 / Prototyp / Gruppen-Registrierung)
- [ ] **Deployment auf Vercel** (Studie 2 live schalten)
- [ ] **Recruitment:** ≥60 Mitglieder-Sessions (3 pro Gruppe × 20 priorisierte Gruppen)
- [ ] Manual-AC testen (siehe archiv/Studie2-Integration.md §8) + 7 Commits aus §10 anlegen

---

## §3 V2-Integration — Gruppen-Self-Rating + Prototype-Update

Plan: `CLAUDE-pläne/V2-Integration.md`

- [x] DB-Migration: `GroupSelfRating` + `GroupSelfRatingAnswer` Modelle
- [x] `GroupSelfRatingQuiz.tsx` — ersetzt `AttributeChecklist.tsx` im Phase-2-Flow
- [x] `/api/groups/register-attributes` — erweitert um WS2-Self-Rating + `raterCount`
- [ ] `/quiz` Prototype — V2-Matching gegen `GroupSelfRating` (Fallback auf alte Attribute)
- [ ] Homepage: 4. CTA-Block „Alle Gruppen anzeigen" (Browse-Pfad)
- [ ] Deployment + Pilot-Test mit 3 Gruppen (Elbflorace, IOG, YETI)

---

## §4 Group Registration — Deployment

- [x] Token-Einladungen: Email optional (Link ohne Email generierbar)
- [x] Selbst-Registrierung: 6-Schritt-Formular mit Verantwortliche-Person-Bestätigung
- [x] `GroupContact`-Modell + Admin-Kontaktliste mit CSV-Export
- [x] Admin-Backup: JSON-Snapshot aller Tabellen per Button im Dashboard
- [x] i18n DE/EN — next-intl, `[locale]/` Routen, LanguageSwitcher, alle Pages + Komponenten übersetzt
- [x] DB-Migration: `textEn`/`hintEn` auf `QuizThesis`, `labelEn`/`descriptionEn` auf `PilotDimension`
- [x] Quiz-Query: `getActiveQuizTheses(locale)` — liefert EN-Text wenn verfügbar, sonst DE-Fallback
- [x] Admin-Formulare: EN-Felder für Thesen und Dimensionen editierbar
- [ ] **Deployment auf Vercel** — Migration auf Prod-DB anwenden, dann deployen
- [ ] EN-Übersetzungen für Quiz-Thesen im Admin eintragen
- [ ] Prod-Deployment: Working Set V2 auf Prod importieren
- [ ] Gruppen-Invite-Links generieren + mailen (→ Phase-2-Flow mit neuem Self-Rating)
- [ ] Ziel: ≥42 Gruppen mit `GroupSelfRating` (Mindest-Schwelle für verlässliches Matching)
- [ ] Nach ≥42 Gruppen: `leadershipOpportunities` + `beginnerFriendly` aus Schema entfernen

---

## §5 Studie-2-Auswertung (nach Datensammlung)

- [ ] Item-Diskriminierung: Δ(Mitglied vs. Nicht-Mitglied) pro Item
- [ ] Inter-Item-Korrelationen (Drop-Schwelle |r| > 0.7)
- [ ] Top-K-Recall: Wird Gruppe X von Mitgliedern in Top-5 / Top-10 gefunden? (Ziel: ≥60% / ≥80%)
- [ ] Filter-Coverage: Wählen Mitglieder den Filter ihrer Gruppe? (Ziel: ≥70%)
- [ ] Drop-Off pro Item-Position (→ Limit für Live-Quiz-Länge)
- [ ] `data/working-set-v3.json` — getrimmtes Live-Set (~15–16 Items nach Auswertung)

---

## §6 Architektur-Hygiene

- [x] Disclaimer-Banner auf `/quiz`
- [x] `APP_MODE` → `APP_LIVE` Bool
- [x] Admin: `/admin/study2` read-only View
- [x] i18n-Struktur `[locale]/` (DE/EN) vollständig umgesetzt
- [ ] Umami-Account anlegen + `NEXT_PUBLIC_UMAMI_WEBSITE_ID` in Vercel setzen
- [ ] CLAUDE.md Phasen-Beschreibung aktualisieren (Phase 2 = Self-Rating, nicht Attribut-Checkliste)

---

## §7 Deployment-Checkliste für V2-Launch

In dieser Reihenfolge:

1. `V2-Integration.md` durch Sonnet umsetzen lassen (§3 komplett)
2. `npm run build` grün
3. Manual-ACs aus V2-Integration.md §7 testen
4. DB-Migration auf Prod: `npx prisma migrate deploy`
5. `APP_LIVE=false` (default) + alle anderen Env-Vars auf Vercel prüfen
6. Deploy auf Vercel (`git push main`)
7. Invite-Links für 3 Test-Gruppen generieren → neuen GroupSelfRatingQuiz testen
8. Studie-2-Recruitment starten

---

## Archiviert (erledigt, nicht mehr aktiv)

- ~~APP_MODE Pilot/Collect/Live~~ → vereinfacht zu APP_LIVE Bool
- ~~Working Set v1.1~~ → abgelöst durch v2
- ~~Attribut-Checkliste (AttributeChecklist.tsx)~~ → wird durch GroupSelfRatingQuiz abgelöst
- ~~Pilot-1-Varianten-System~~ → abgeschlossen
