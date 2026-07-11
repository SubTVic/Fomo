<!-- SPDX-License-Identifier: AGPL-3.0-only -->

# FOMO – Inbetriebnahme auf einem StuRa-Server

> **Stand Juli 2026:** Die Seite läuft produktiv auf **Vercel**
> (www.fomo-dresden.app, Auto-Deploy bei jedem Push auf `main`) — dafür ist
> keiner dieser Schritte nötig. Diese Anleitung bleibt als Plan B für einen
> Umzug auf einen eigenen Server (StuRa / Rechenzentrum) gültig.

Diese Anleitung beschreibt, wie die **statische FOMO-Seite** auf einem eigenen
Server (StuRa / Rechenzentrum) installiert, betrieben und mit neuen Daten
aktualisiert wird – **ohne Ausfallzeit im laufenden Betrieb**.

Die Seite ist ein reines HTML/JS-Bundle: kein Backend, keine Datenbank, keine
Nutzerdaten verlassen den Browser. Die Registrierung der Hochschulgruppen läuft
weiterhin in der separaten dynamischen App – an ihr ändert sich nichts.

---

## 1. Voraussetzungen

**Empfohlener Weg (Docker):**
- Linux-Server mit **Docker** ≥ 24 und **Docker Compose** v2
- ~1 GB freier Speicher, 1 CPU genügt (statische Auslieferung)
- Optional: ein vorgelagerter Reverse-Proxy (nginx/Traefik) für Domain + HTTPS

**Alternativer Weg (ohne Docker):** Node.js ≥ 20 zum Bauen + ein beliebiger
Webserver (nginx/Apache), der ein Verzeichnis ausliefert (siehe Abschnitt 7).

---

## 2. Schnellstart (Docker, empfohlen)

```bash
git clone <REPO-URL> fomo && cd fomo/static-site

# Konfiguration anlegen
cp .env.example .env
# .env bei Bedarf anpassen (Port, Analytics, Subpfad – siehe Abschnitt 3)

# Skripte ausführbar machen (einmalig nach dem Klonen)
chmod +x scripts/*.sh

# Bauen + veröffentlichen + Webserver starten (ein Befehl, idempotent)
./scripts/update-data.sh
```

Danach läuft die Seite unter **http://SERVER-IP:8080/**.

`update-data.sh` baut das Bundle in einem Container (es muss **kein** Node auf
dem Host installiert sein), validiert die Daten, legt ein Release unter
`web/releases/<zeitstempel>/` ab, schaltet den Symlink `web/current` darauf um
und startet/reloaded nginx.

---

## 3. Konfiguration (`.env`)

Alle `NEXT_PUBLIC_*`-Werte werden **beim Bauen** ins Bundle eingebacken – nach
einer Änderung also neu bauen (`./scripts/update-data.sh`).

| Variable | Zweck | Beispiel |
|---|---|---|
| `WEB_PORT` | Port, auf dem nginx lauscht | `8080` |
| `UMAMI_WEBSITE_ID` | Umami-Website-ID (aktiviert Tracking) | `xxxxxxxx-…` |
| `UMAMI_SRC` | Umami-Script-URL | `https://umami.stura.de/script.js` |
| `NEXT_PUBLIC_BASE_PATH` | Subpfad, falls nicht unter `/` gehostet | `/fomo` |
| `UMAMI_PORT` / `UMAMI_*` | nur für optionales Self-Hosting von Umami | – |

Ohne gesetzte `UMAMI_WEBSITE_ID` wird **kein** Analytics-Script
geladen – datenschutzfreundlicher Default.

---

## 4. Daten im laufenden Betrieb austauschen (Kern-Workflow)

Neue Gruppendaten kommen als `groups.json` (gleiches Schema wie
`data/groups.json`). Veröffentlichen ohne Downtime:

```bash
# Variante A: neue Datei direkt einspielen (alte wird gesichert)
./scripts/update-data.sh /pfad/zu/neuen-groups.json

# Variante B: data/groups.json bereits ersetzt → nur neu veröffentlichen
./scripts/update-data.sh
```

Ablauf intern: **validieren → bauen → neues Release → Symlink atomar umschalten
→ nginx reload**. Schlägt etwas vor dem Umschalten fehl, bleibt die alte Version
live. Die letzten 5 Releases bleiben erhalten.

**Rollback** (sofort, ohne Build):

```bash
ls web/releases                      # verfügbare Releases ansehen
ln -sfn releases/<älteres> web/current
docker compose exec -T web nginx -s reload
```

> Die `groups.json` entsteht aus der Scraping-/Export-Pipeline. Wie man für noch
> **nicht registrierte** Gruppen Daten gewinnt und echte Registrierungen
> nahtlos übernimmt, steht in `docs/SCRAPING-KONZEPT.md`.

---

## 5. Optional: Umami selbst hosten (DSGVO, eigene Infrastruktur)

Statt Umami Cloud kann Umami als Container mitlaufen (Empfehlung des externen
Entwicklers, falls StuRa eigene Infrastruktur bevorzugt):

```bash
# in .env ein Secret + DB-Passwort setzen:
#   UMAMI_APP_SECRET=$(openssl rand -hex 32)
#   UMAMI_DB_PASSWORD=<starkes-passwort>
docker compose --profile analytics up -d
```

Umami-Oberfläche: **http://SERVER-IP:3000/** (Standard-Login `admin` / `umami`
→ sofort ändern). Dort pro Hochschule eine **Website** anlegen → deren
`Website-ID` und Script-URL in `.env` eintragen → FOMO neu bauen
(`./scripts/update-data.sh`). So lassen sich später TU Dresden, Leipzig,
Chemnitz sauber in **einem** Umami trennen.

---

## 6. Domain & HTTPS (Reverse-Proxy)

Der FOMO-Container liefert HTTP auf `WEB_PORT`. Für eine öffentliche Domain mit
TLS einen Reverse-Proxy davorsetzen (Beispiel nginx auf dem Host):

```nginx
server {
    server_name fomo.stura.tu-dresden.de;
    location / { proxy_pass http://127.0.0.1:8080; }
    # TLS via certbot / Let's Encrypt
}
```

Soll FOMO unter einem **Unterpfad** laufen (z. B. `stura.de/fomo`), zusätzlich
`NEXT_PUBLIC_BASE_PATH=/fomo` in `.env` setzen und neu bauen.

---

## 7. Alternative Deployments

**a) Eigenständiges Docker-Image** (für Registry / Air-Gap, Daten fest
eingebacken):

```bash
docker build --build-arg UMAMI_WEBSITE_ID=xxxx -t fomo-static .
docker run -d -p 8080:80 fomo-static
```

**b) Ganz ohne Docker** (Node zum Bauen, dann statisch ausliefern):

```bash
npm install
node scripts/validate-data.mjs
npm run build            # erzeugt ./out
# ./out nach /var/www/fomo kopieren und von nginx/Apache ausliefern lassen
```

---

## 8. App aktualisieren (Code, nicht Daten)

```bash
git pull
./scripts/update-data.sh   # baut die neue Version und schaltet sie live
```

---

## 9. Troubleshooting

| Symptom | Ursache / Lösung |
|---|---|
| `update-data.sh` bricht bei „Validation FAILED" ab | `groups.json`/`quiz.json` fehlerhaft – Meldung lesen, Datei korrigieren. Live-Seite bleibt unberührt. |
| Seite zeigt 404 / leer | Läuft FOMO unter einem Subpfad? `NEXT_PUBLIC_BASE_PATH` setzen und neu bauen. |
| Assets laden nicht hinter Reverse-Proxy | `proxy_pass` ohne Pfad-Rewrite nutzen; bei Subpfad `NEXT_PUBLIC_BASE_PATH` korrekt setzen. |
| Analytics zählt nicht | `UMAMI_WEBSITE_ID` gesetzt **und neu gebaut**? Script-URL erreichbar? |
| Build schlägt fehl (Versionsdrift) | Für Reproduzierbarkeit `package-lock.json` committen (dann nutzt der Build `npm ci`). |

---

## 10. Checkliste vor dem Launch (Erstiwoche)

- [ ] `groups.json` enthält den finalen, geprüften Datenstand (Registrierungen übernommen)
- [ ] `node scripts/validate-data.mjs` ohne Fehler
- [ ] Umami-Website-ID gesetzt, Tracking im Live-Test sichtbar
- [ ] Domain + HTTPS über Reverse-Proxy
- [ ] Test auf echtem Handy (375 px), Quiz einmal komplett durchgespielt
- [ ] Rollback einmal geprobt
