import { test } from "node:test";
import assert from "node:assert";
import { buildTokens, isNumeric } from "../captions-core.ts";

// Caption tokens are built from vo-timing.json word frames. The merge rule:
// consecutive words sharing the same (override-resolved) `display` AND the same
// `beat` collapse into ONE token spanning all their frames — a number/abbrev that
// the voice speaks as several words renders once. Overrides re-skin a display
// (e.g. "2,500" -> "~2,500") BEFORE the merge so the comparison uses the final glyph.

test("merges a run of consecutive same-display words into one token", () => {
  // "2560" spoken as two word-tokens, then "B" "C".
  const words = [
    { display: "2560", start: 100, end: 110, beat: "beat1" },
    { display: "2560", start: 110, end: 118, beat: "beat1" },
    { display: "BC", start: 118, end: 130, beat: "beat1" },
  ];
  const tokens = buildTokens(words);
  assert.deepEqual(tokens, [
    { display: "2560", start: 100, end: 118, beat: "beat1" },
    { display: "BC", start: 118, end: 130, beat: "beat1" },
  ]);
});

test("applies a display override before merging", () => {
  // "2,500" arrives as four spoken words; override -> "~2,500"; all merge to one.
  const words = [
    { display: "2,500", start: 700, end: 705, beat: "beat6" },
    { display: "2,500", start: 705, end: 710, beat: "beat6" },
    { display: "2,500", start: 710, end: 716, beat: "beat6" },
    { display: "2,500", start: 716, end: 720, beat: "beat6" },
  ];
  const tokens = buildTokens(words, { "2,500": "~2,500" });
  assert.equal(tokens.length, 1);
  assert.equal(tokens[0].display, "~2,500");
  assert.equal(tokens[0].start, 700);
  assert.equal(tokens[0].end, 720);
});

test("does NOT merge same display across a beat boundary", () => {
  const words = [
    { display: "BC", start: 250, end: 258, beat: "beat1" },
    { display: "BC", start: 258, end: 266, beat: "beat2" },
  ];
  const tokens = buildTokens(words);
  assert.equal(tokens.length, 2);
});

test("does NOT merge non-adjacent same-display words separated by another", () => {
  const words = [
    { display: "the", start: 0, end: 5, beat: "hook" },
    { display: "moon", start: 5, end: 12, beat: "hook" },
    { display: "the", start: 12, end: 17, beat: "hook" },
  ];
  const tokens = buildTokens(words);
  assert.equal(tokens.length, 3);
});

test("returns an empty list for no words", () => {
  assert.deepEqual(buildTokens([]), []);
});

test("isNumeric: digits and the BC abbreviation count as numeric (accent)", () => {
  assert.equal(isNumeric("2560"), true);
  assert.equal(isNumeric("~2,500"), true);
  assert.equal(isNumeric("BC"), true);
  assert.equal(isNumeric("1969"), true);
  assert.equal(isNumeric("Cleopatra"), false);
  assert.equal(isNumeric("closer"), false);
});
