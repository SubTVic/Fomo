#!/usr/bin/env bash
# SPDX-License-Identifier: AGPL-3.0-only
#
# Publish (new) data to the running FOMO site with zero downtime.
# Only Docker is required on the host — the build runs in a container.
#
#   ./scripts/update-data.sh                     # rebuild & publish current data/
#   ./scripts/update-data.sh new-groups.json     # swap in new groups, then publish
#   ./scripts/update-data.sh new-groups.json new-quiz.json
#
# What it does:
#   1. (optional) copy the new JSON into data/ (old files backed up)
#   2. validate + build the static bundle inside the builder container
#   3. copy the fresh bundle into web/releases/<timestamp>
#   4. atomically switch web/current → the new release and reload nginx
#   5. keep the last 5 releases for instant rollback
#
# If any step before the symlink switch fails, the live site is untouched.

set -euo pipefail
cd "$(dirname "$0")/.."   # → static-site/

KEEP_RELEASES=5
NEW_GROUPS="${1:-}"
NEW_QUIZ="${2:-}"

log() { printf '\033[1;34m[update]\033[0m %s\n' "$*"; }

# 1) Stage new data files (with backup) ---------------------------------------
stamp="$(date +%Y%m%d-%H%M%S)"
if [ -n "$NEW_GROUPS" ]; then
  log "Staging new groups.json (backup → data/groups.json.bak-$stamp)"
  cp data/groups.json "data/groups.json.bak-$stamp"
  cp "$NEW_GROUPS" data/groups.json
fi
if [ -n "$NEW_QUIZ" ]; then
  log "Staging new quiz.json (backup → data/quiz.json.bak-$stamp)"
  cp data/quiz.json "data/quiz.json.bak-$stamp"
  cp "$NEW_QUIZ" data/quiz.json
fi

# 2) Validate + build in the builder container --------------------------------
log "Validating and building bundle (builder container)…"
rm -rf out
docker compose run --rm builder

if [ ! -f out/index.html ]; then
  log "ERROR: build produced no out/index.html — aborting. Live site untouched."
  exit 1
fi

# 3) Copy the bundle into a timestamped release -------------------------------
release="web/releases/$stamp"
log "Publishing release $release"
mkdir -p "$release"
cp -r out/. "$release/"

# 4) Atomic switch + reload ---------------------------------------------------
# Relative symlink so it resolves the same inside the nginx container.
ln -sfn "releases/$stamp" web/current
log "Switched web/current → releases/$stamp"

if docker compose ps web --status running 2>/dev/null | grep -q web; then
  docker compose exec -T web nginx -s reload && log "nginx reloaded"
else
  log "Starting web service…"
  docker compose up -d web
fi

# 5) Prune old releases -------------------------------------------------------
log "Pruning old releases (keeping $KEEP_RELEASES)…"
ls -1dt web/releases/*/ 2>/dev/null | tail -n +$((KEEP_RELEASES + 1)) | xargs -r rm -rf

log "Done. Live at http://localhost:${WEB_PORT:-8080}/  (rollback: re-point web/current)"
