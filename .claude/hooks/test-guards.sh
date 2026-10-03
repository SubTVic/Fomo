#!/bin/sh
# SPDX-License-Identifier: AGPL-3.0-only
# Self-test for the guard hooks: feeds sample hook JSON on stdin and checks the
# exit code (2 = blocked, 0 = allowed). Run: sh .claude/hooks/test-guards.sh
# (Run it from a terminal: inside Claude Code the Bash guard itself would block
# a command line that contains these sample strings.)
cd "$(dirname "$0")/../.." || exit 1
export CLAUDE_PROJECT_DIR="$PWD"
fail=0
check() { # expected-exit hook json
  out=$(printf '%s' "$3" | ".claude/hooks/$2" 2>&1); code=$?
  if [ "$code" = "$1" ]; then echo "ok   ($code) $3"; else echo "FAIL (got $code, want $1) $3 :: $out"; fail=1; fi
}
P="$PWD"
REMOTE_HOST="ep-cool-db.eu-central-1.aws.neon.tech"
check 2 guard-files.sh "{\"tool_name\":\"Edit\",\"tool_input\":{\"file_path\":\"$P/static-site/data/groups.json\"}}"
check 2 guard-files.sh "{\"tool_name\":\"Write\",\"cwd\":\"$P/static-site\",\"tool_input\":{\"file_path\":\"data/groups.json\"}}"
check 0 guard-files.sh "{\"tool_name\":\"Edit\",\"tool_input\":{\"file_path\":\"$P/static-site/data/quiz.json\"}}"
check 0 guard-files.sh "{\"tool_name\":\"Write\",\"tool_input\":{\"file_path\":\"$P/src/lib/x.ts\"}}"
check 2 guard-bash.sh "{\"tool_name\":\"Bash\",\"tool_input\":{\"command\":\"DATABASE_URL=postgresql://u:p@$REMOTE_HOST/fomo npx prisma studio\"}}"
check 2 guard-bash.sh "{\"tool_name\":\"Bash\",\"tool_input\":{\"command\":\"cd /x && DIRECT_URL=postgres://u@db.example.org:5432/x npm run db:status\"}}"
check 0 guard-bash.sh '{"tool_name":"Bash","tool_input":{"command":"DATABASE_URL=postgresql://fomo@localhost:5433/fomo_test npx prisma migrate dev"}}'
check 0 guard-bash.sh '{"tool_name":"Bash","tool_input":{"command":"DATABASE_URL=postgresql://x:x@db:5432/x npm run dev"}}'
check 2 guard-bash.sh '{"tool_name":"Bash","tool_input":{"command":"git push origin main"}}'
check 2 guard-bash.sh '{"tool_name":"Bash","tool_input":{"command":"git add . && git push -u origin HEAD:main"}}'
check 2 guard-bash.sh '{"tool_name":"Bash","tool_input":{"command":"git push --force-with-lease origin wp-1"}}'
check 2 guard-bash.sh '{"tool_name":"Bash","tool_input":{"command":"git push origin +wp-1"}}'
check 0 guard-bash.sh '{"tool_name":"Bash","tool_input":{"command":"git push -u origin wp-2-5-ai-guardrails"}}'
check 0 guard-bash.sh '{"tool_name":"Bash","tool_input":{"command":"git push origin feature-fix-main-menu"}}'
check 0 guard-bash.sh '{"tool_name":"Bash","tool_input":{"command":"npm test"}}'
check 0 guard-bash.sh 'not json'
exit $fail
