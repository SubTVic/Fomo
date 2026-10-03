#!/bin/sh
# SPDX-License-Identifier: AGPL-3.0-only
# PreToolUse hook (Bash): blocks non-local database URLs, pushes to main and
# force pushes. Logic: guards.mjs.
exec node "$(dirname "$0")/guards.mjs" bash
