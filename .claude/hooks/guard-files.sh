#!/bin/sh
# SPDX-License-Identifier: AGPL-3.0-only
# PreToolUse hook (Edit|Write|MultiEdit|NotebookEdit): blocks hand edits of
# generated files such as static-site/data/groups.json. Logic: guards.mjs.
exec node "$(dirname "$0")/guards.mjs" files
