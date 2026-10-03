// SPDX-License-Identifier: AGPL-3.0-only

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import * as path from "node:path";
import { compareItemSets } from "../../../scripts/check-items-sync.mjs";

const ROOT = path.resolve(__dirname, "../../..");
const read = (p: string) => JSON.parse(readFileSync(path.join(ROOT, p), "utf8"));
const ws = read("data/working-set-v2.json");
const quiz = read("static-site/data/quiz.json");
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));

describe("check-items-sync", () => {
  it("finds the committed item sets identical", () => {
    expect(compareItemSets(ws, quiz)).toEqual([]);
  });

  it("detects a changed text, a reordering and a renamed filter", () => {
    const changedText = clone(quiz);
    changedText.items[3].text += " (geändert)";
    expect(compareItemSets(ws, changedText).join("\n")).toContain(`${quiz.items[3].id}: Feld "text"`);

    const reordered = clone(quiz);
    [reordered.items[0], reordered.items[1]] = [reordered.items[1], reordered.items[0]];
    expect(compareItemSets(ws, reordered).join("\n")).toContain("Item-IDs/Reihenfolge verschieden");

    const filter = clone(quiz);
    filter.filters.options[0].label = "Anders";
    expect(compareItemSets(ws, filter).join("\n")).toContain("Filter");
  });

  it("detects changed matching attributes", () => {
    const attrs = clone(quiz);
    attrs.items[0].attributes = [];
    expect(compareItemSets(ws, attrs).join("\n")).toContain('Feld "attributes"');
  });
});
