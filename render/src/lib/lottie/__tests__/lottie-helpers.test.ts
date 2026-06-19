import { test } from "node:test";
import assert from "node:assert";
import {
  CANONICAL_FPS,
  assertAccentFps,
  accentBoxStyle,
  loopForWindow,
} from "../lottie-helpers.ts";
import { SAFE_TOP, SAFE_BOTTOM, SAFE_INSET_X, WIDTH } from "../../safeArea.ts";

test("CANONICAL_FPS is 30", () => {
  assert.equal(CANONICAL_FPS, 30);
});

test("assertAccentFps: passes when rounded fps equals comp fps", () => {
  assert.doesNotThrow(() => assertAccentFps(30, 30, "a.json"));
  assert.doesNotThrow(() => assertAccentFps(29.97, 30, "a.json")); // rounds to 30
});

test("assertAccentFps: throws hard on mismatch", () => {
  assert.throws(() => assertAccentFps(60, 30, "a.json"), /a\.json.*fps/);
});

test("assertAccentFps: throws when metadata is missing", () => {
  assert.throws(() => assertAccentFps(null, 30, "a.json"), /a\.json.*metadata/);
});

test("accentBoxStyle: box stays inside the safe area for every anchor", () => {
  for (const anchor of ["top", "center", "above-captions"] as const) {
    const s = accentBoxStyle({ anchor, sizePx: 300 });
    assert.ok(s.left >= SAFE_INSET_X, `${anchor} left`);
    assert.ok(s.left + s.width <= WIDTH - SAFE_INSET_X, `${anchor} right`);
    assert.ok(s.top >= SAFE_TOP, `${anchor} top`);
    assert.ok(s.top + s.height <= SAFE_BOTTOM, `${anchor} bottom`);
  }
});

test("loopForWindow: loops only when shorter AND an exact divisor", () => {
  assert.equal(loopForWindow(30, 90), true); // 90 % 30 === 0
  assert.equal(loopForWindow(30, 100), false); // not a divisor -> play once
  assert.equal(loopForWindow(90, 90), false); // equal length -> play once
  assert.equal(loopForWindow(120, 90), false); // longer -> play once
});
