import { test } from "node:test";
import assert from "node:assert";
import { validateTiling } from "../tiling.ts";

// The render-side frame-tiling contract (mirrors the tts framemap validator):
// scene ranges must be 0-indexed, half-open, contiguous, and tile [0, total]
// exactly — no gaps, no overlaps, first starts at 0, last ends at total.

test("accepts a contiguous half-open tiling of [0, total]", () => {
  const ranges = [
    { from: 0, duration: 109 },
    { from: 109, duration: 150 },
    { from: 259, duration: 671 },
  ];
  const r = validateTiling(ranges, 930);
  assert.equal(r.ok, true);
  assert.deepEqual(r.errors, []);
});

test("rejects a gap between scenes", () => {
  const ranges = [
    { from: 0, duration: 100 },
    { from: 110, duration: 820 }, // gap 100..110
  ];
  const r = validateTiling(ranges, 930);
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((e) => /gap|contiguous|expected start 100/i.test(e)));
});

test("rejects an overlap between scenes", () => {
  const ranges = [
    { from: 0, duration: 120 },
    { from: 100, duration: 830 }, // overlaps 100..120
  ];
  const r = validateTiling(ranges, 930);
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((e) => /overlap|contiguous|expected start 120/i.test(e)));
});

test("rejects a first scene that does not start at 0", () => {
  const ranges = [{ from: 5, duration: 925 }];
  const r = validateTiling(ranges, 930);
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((e) => /start.*0|first/i.test(e)));
});

test("rejects a last scene that does not end at total", () => {
  const ranges = [
    { from: 0, duration: 100 },
    { from: 100, duration: 800 }, // ends at 900, not 930
  ];
  const r = validateTiling(ranges, 930);
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((e) => /end.*930|total/i.test(e)));
});

test("rejects a non-positive duration", () => {
  const ranges = [
    { from: 0, duration: 0 },
    { from: 0, duration: 930 },
  ];
  const r = validateTiling(ranges, 930);
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((e) => /duration|positive/i.test(e)));
});

test("rejects non-integer frames", () => {
  const ranges = [
    { from: 0, duration: 100.5 },
    { from: 100.5, duration: 829.5 },
  ];
  const r = validateTiling(ranges, 930);
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((e) => /integer/i.test(e)));
});

test("rejects an empty range list", () => {
  const r = validateTiling([], 930);
  assert.equal(r.ok, false);
});
