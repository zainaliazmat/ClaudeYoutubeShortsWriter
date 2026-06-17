import { test } from "node:test";
import assert from "node:assert";
import { QUALITY_FLOORS } from "../safeArea.ts";
// The engine's single source for luma floors (scripts/quality-floors.mjs). This test
// runs under the render-lib suite (which strips TS types), so it can import both the
// .ts design constant and the .mjs engine source and assert they never drift apart.
import { COMPOSITED_LUMA_MIN } from "../../../../scripts/quality-floors.mjs";

test("safeArea.bgLumaMin === engine COMPOSITED_LUMA_MIN (finding N7: no drift)", () => {
  assert.equal(QUALITY_FLOORS.bgLumaMin, COMPOSITED_LUMA_MIN);
});
