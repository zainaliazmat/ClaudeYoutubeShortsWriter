import { test } from "node:test";
import assert from "node:assert";
import { hexLuma, gradientLuma, QUALITY_FLOORS } from "../safeArea.ts";

test("hexLuma: pure black is 0, pure white is 255", () => {
  assert.equal(Math.round(hexLuma("#000000")), 0);
  assert.equal(Math.round(hexLuma("#ffffff")), 255);
});

test("hexLuma: F-001 bgTop #0B1430 is near-black (below the bg floor)", () => {
  // This is exactly the value that made F-001 feel flat — the gradient AVERAGE
  // is what must clear the floor, not either single stop.
  assert.ok(hexLuma("#0B1430") < QUALITY_FLOORS.bgLumaMin);
});

test("gradientLuma: averages the stops", () => {
  const avg = gradientLuma(["#000000", "#ffffff"]);
  assert.ok(Math.abs(avg - 127.5) < 1);
});

test("gradientLuma: tolerates a leading #-less hex", () => {
  assert.equal(Math.round(gradientLuma(["808080"])), Math.round(hexLuma("#808080")));
});
