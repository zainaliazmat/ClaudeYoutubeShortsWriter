import { test } from "node:test";
import assert from "node:assert";
import { loopSafeDrift, loopSafePulse } from "../motion.ts";

// Audit #4: a persistent furniture animation must return to its frame-0 value at
// `total`, or the loop seam shows. These primitives guarantee that by construction.

const TOTALS = [930, 720, 901, 333]; // incl. totals NOT divisible by the old 120 period

test("loopSafeDrift: value(0) === value(total) === 0 for any total", () => {
  for (const total of TOTALS) {
    assert.equal(loopSafeDrift(0, total, 56), 0);
    assert.ok(Math.abs(loopSafeDrift(total, total, 56)) < 1e-9, `drift(total) for ${total}`);
  }
});

test("loopSafeDrift: actually moves mid-clip (peak near the midpoint)", () => {
  const mid = loopSafeDrift(465, 930, 56);
  assert.ok(Math.abs(mid - -56) < 0.5, `expected ~-56 at midpoint, got ${mid}`);
});

test("loopSafePulse: lands back at its start value at the loop point (whole cycles)", () => {
  for (const total of TOTALS) {
    const at0 = loopSafePulse(0, total, Math.round(total / 120), [1.0, 1.04]);
    const atEnd = loopSafePulse(total, total, Math.round(total / 120), [1.0, 1.04]);
    assert.ok(Math.abs(at0 - atEnd) < 1e-9, `pulse seam for ${total}: ${at0} vs ${atEnd}`);
  }
});

test("loopSafePulse: stays within the requested range and rounds cycles >= 1", () => {
  for (let f = 0; f <= 930; f += 37) {
    const v = loopSafePulse(f, 930, 0, [1.0, 1.04]); // cycles 0 -> clamped to 1
    assert.ok(v >= 1.0 - 1e-9 && v <= 1.04 + 1e-9, `pulse ${v} out of range at ${f}`);
  }
});

test("primitives are safe at total<=0 (no NaN/Infinity)", () => {
  assert.equal(loopSafeDrift(5, 0, 56), 0);
  assert.equal(loopSafePulse(5, 0, 4, [1.0, 1.04]), 1.0);
});
