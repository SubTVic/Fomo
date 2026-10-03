// SPDX-License-Identifier: AGPL-3.0-only
//
// Guard logic for the Claude Code PreToolUse hooks (see .claude/settings.json).
// Reads the hook JSON from stdin. Exit 2 + message on stderr blocks the tool
// call; exit 0 lets it through. Kept in Node because Node is always present in
// this repo (jq may not be).
//
//   node .claude/hooks/guards.mjs files   < hook-input.json
//   node .claude/hooks/guards.mjs bash    < hook-input.json

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { relative, resolve } from "node:path";

const LOCAL_DB_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]", "db", "postgres"]);

/** Files that must never be edited by hand. Paths relative to the repo root. */
const PROTECTED_FILES = {
  "static-site/data/groups.json":
    "groups.json wird aus der DB erzeugt — Änderung über die Admin-App, siehe docs/runbooks/01-gruppe-aendern.md",
};

export function checkFile(input, projectDir) {
  const raw = input?.tool_input?.file_path ?? input?.tool_input?.notebook_path;
  if (typeof raw !== "string" || raw === "") return null;
  const rel = relative(projectDir, resolve(input?.cwd ?? projectDir, raw)).split("\\").join("/");
  return PROTECTED_FILES[rel] ?? null;
}

/** Split a shell command into simple commands (good enough for guarding). */
function subcommands(command) {
  return command.split(/&&|\|\||[;|&\n]/).map((s) => s.trim()).filter(Boolean);
}

function checkDatabaseUrl(command) {
  const re = /\b(?:DATABASE_URL|DIRECT_URL)=["']?postgres(?:ql)?:\/\/(?:[^@\s"'/]*@)?(\[[^\]]+\]|[^:/\s"'?]+)/g;
  for (const m of command.matchAll(re)) {
    const host = m[1].toLowerCase();
    if (!LOCAL_DB_HOSTS.has(host))
      return `Verbindung zu nicht-lokaler Datenbank (${host}) blockiert — nur lokale Test-DB erlaubt (Umsetzungsplan §1 Regel 2/3).`;
  }
  return null;
}

function checkGitPush(sub, currentBranch) {
  const tokens = sub.split(/\s+/);
  const i = tokens.findIndex((t, k) => t === "push" && tokens[k - 1] === "git");
  if (i < 0) return null;
  const rest = tokens.slice(i + 1);
  if (rest.some((t) => t === "--force" || t === "-f" || t.startsWith("--force-") || t === "--mirror" || t === "--all"))
    return "Force-Push/--all/--mirror ist verboten (Umsetzungsplan §1 Regel 5).";
  if (rest.some((t) => t.startsWith("+")))
    return "Force-Push per +refspec ist verboten (Umsetzungsplan §1 Regel 5).";
  const positional = rest.filter((t) => !t.startsWith("-"));
  const refspecs = positional.slice(1); // first positional = remote
  if (refspecs.some((r) => /(^|:)(refs\/heads\/)?main$/.test(r)))
    return "Push auf main ist verboten — Branch + Pull Request (Umsetzungsplan §1 Regel 1).";
  if (refspecs.length === 0 && currentBranch === "main")
    return "git push ohne Branch-Angabe auf main ist verboten — Branch + Pull Request (Umsetzungsplan §1 Regel 1).";
  return null;
}

export function checkBash(input, currentBranch) {
  const command = input?.tool_input?.command;
  if (typeof command !== "string") return null;
  const db = checkDatabaseUrl(command);
  if (db) return db;
  for (const sub of subcommands(command)) {
    const push = checkGitPush(sub, currentBranch);
    if (push) return push;
  }
  return null;
}

function currentBranchOf(dir) {
  try {
    return execFileSync("git", ["-C", dir, "rev-parse", "--abbrev-ref", "HEAD"], { encoding: "utf8" }).trim();
  } catch {
    return null;
  }
}

// CLI entry point
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split("/").pop())) {
  const mode = process.argv[2];
  let input;
  try {
    input = JSON.parse(readFileSync(0, "utf8"));
  } catch {
    process.exit(0); // not our business to block on unreadable input
  }
  const projectDir = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();
  const reason =
    mode === "files" ? checkFile(input, projectDir) : mode === "bash" ? checkBash(input, currentBranchOf(input.cwd || projectDir)) : null;
  if (reason) {
    process.stderr.write(`Blockiert: ${reason}\n`);
    process.exit(2);
  }
  process.exit(0);
}
