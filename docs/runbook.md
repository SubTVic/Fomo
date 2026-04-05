# FOMO Betriebsdokumentation (Runbook)

> Dieses Dokument ist für StuRa-Mitglieder, die FOMO betreiben, aber **keine Entwickler** sind.
> Alle wiederkehrenden Aufgaben sind über das Admin-Dashboard möglich — kein Terminal nötig (außer Server-Start).

---

## 1. Server starten & stoppen

### Starten

```bash
ssh user@fomo-server.tu-dresden.de
cd /opt/fomo
docker compose up -d
```

### Stoppen

```bash
docker compose down
```

### Status prüfen

```bash
docker compose ps
```

Alle drei Container sollten `Up` zeigen:
- `fomo-db-1` — Datenbank
- `fomo-app-1` — Webserver
- `fomo-backup-1` — Tägliches Backup

### Logs ansehen

```bash
# Alle Logs
docker compose logs --tail 100

# Nur App-Logs
docker compose logs app --tail 50 --follow
```

### Health-Check

Im Browser: `https://fomo.tu-dresden.de/api/health`

Erwartete Antwort:
```json
{"status":"ok","db":"connected","timestamp":"..."}
```

Falls `status: "error"` → Datenbank prüfen: `docker compose logs db --tail 20`

---

## 2. Jedes Semester wiederholen

### 2.1 Semester abschließen

1. Im Admin-Dashboard einloggen: `https://fomo.tu-dresden.de/admin`
2. Navigation: **Semester**
3. Neuen Semester-Tag eingeben (z.B. "WS27/28")
4. "Semester abschließen" klicken
5. Bestätigen

**Was passiert automatisch:**
- Statistiken des alten Semesters werden archiviert
- Alle Gruppen werden auf "eingeladen" zurückgesetzt
- Der Semester-Tag wird aktualisiert

### 2.2 Gruppen zur Aktualisierung einladen

1. Navigation: **Gruppen**
2. "Einladungen generieren" klicken
3. E-Mails mit den Token-Links an die Gruppen senden (manuell oder über Uni-Mailverteiler)

### 2.3 Einreichungen verifizieren

1. Navigation: **Gruppen** → Filter "Eingereicht"
2. Profil prüfen (Attribute, Beschreibung, Links)
3. "Verifizieren" klicken

### 2.4 Thesen prüfen

1. Navigation: **Quiz**
2. Thesen durchgehen: Sind sie noch aktuell? Verständlich?
3. Bei Bedarf bearbeiten (alte Version wird automatisch archiviert)

---

## 3. Gruppen verwalten

### Neue Gruppe manuell anlegen

1. Navigation: **Gruppen** → "Neue Gruppe"
2. Pflichtfelder: Name, Kurzbeschreibung, Kategorie
3. Attribute setzen
4. Speichern

### Gruppe deaktivieren

1. Navigation: **Gruppen** → Gruppe suchen
2. "Bearbeiten" → "Aktiv" deaktivieren → Speichern
3. Deaktivierte Gruppen erscheinen nicht im Quiz

### CSV-Import (Bulk)

1. Navigation: **Gruppen** → "CSV importieren"
2. CSV-Datei hochladen (Format siehe `scripts/import-groups.ts`)
3. Importierte Gruppen müssen anschließend verifiziert werden

---

## 4. Admin-Zugang

### Neuen Admin anlegen

1. Navigation: **Admins** (nur für Super-Admins sichtbar)
2. "Neuer Admin" → E-Mail, Name, Passwort, Rolle
3. Rollen:
   - **SUPER_ADMIN:** Alles — Semester, Admins, System-Settings
   - **EDITOR:** Thesen + Gruppen verwalten

### Passwort zurücksetzen

1. Navigation: **Admins** → Admin auswählen
2. "Passwort ändern" → Neues Passwort vergeben

---

## 5. Backup & Wiederherstellung

### Automatische Backups

Der `backup`-Container erstellt täglich eine Datenbank-Sicherung unter `./backups/`:

```
backups/
├── fomo_20260901_0300.sql.gz
├── fomo_20260902_0300.sql.gz
└── ...
```

Backups älter als 30 Tage werden automatisch gelöscht.

### Manuelles Backup

```bash
docker compose exec db pg_dump -U fomo fomo | gzip > backup_manual.sql.gz
```

### Wiederherstellung

```bash
# Datenbank stoppen (außer DB-Container)
docker compose stop app

# Backup einspielen
gunzip -c backups/fomo_20260901_0300.sql.gz | docker compose exec -T db psql -U fomo fomo

# App wieder starten
docker compose start app
```

---

## 6. Problembehandlung

| Problem | Lösung |
|---------|--------|
| **Quiz lädt nicht** | `docker compose logs app --tail 20` prüfen. `docker compose restart app` |
| **"DB disconnected"** in Health-Check | `docker compose restart db`, warten, dann `docker compose restart app` |
| **Admin-Login geht nicht** | Passwort über einen anderen Super-Admin zurücksetzen |
| **Gruppe sieht ihr Formular nicht** | Token prüfen: Abgelaufen? Bereits verwendet? Neues Token generieren. |
| **Server antwortet nicht** | `docker compose ps` → Sind alle Container `Up`? `docker compose up -d` |

### Server-Updates einspielen

```bash
cd /opt/fomo
git pull origin main
docker compose up --build -d
```

---

## 7. Kontakt & Hilfe

- **GitHub:** https://github.com/SubTVic/Fomo
- **Issues melden:** https://github.com/SubTVic/Fomo/issues
- **Lizenz:** AGPL-3.0 (Open Source, Änderungen müssen geteilt werden)
