import { test } from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { BG_STOP_LUMA_MIN, COMPOSITED_LUMA_MIN } from "../quality-floors.mjs";
import { THRESH } from "../qa-assess.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const scriptsDir = path.resolve(here, "..");

test("qa-assess LUMA_MEAN_MIN is the shared composited floor (imported, not redefined)", () => {
  assert.equal(THRESH.LUMA_MEAN_MIN, COMPOSITED_LUMA_MIN);
});

test("the two surfaces stay distinct: stop floor < composited floor", () => {
  // a stop-level floor must sit BELOW the composited floor (depth layers lift the
  // composited frame above the raw gradient stops) — see quality-floors.mjs.
  assert.ok(BG_STOP_LUMA_MIN < COMPOSITED_LUMA_MIN);
});

test("precheck does not redefine the stop floor as a literal (imports it)", () => {
  const src = fs.readFileSync(path.join(scriptsDir, "precheck.mjs"), "utf8");
  assert.match(src, /BG_STOP_LUMA_MIN/, "precheck must import the shared stop floor");
  // no stray `NEAR_BLACK_LUMA = 15` literal redefinition
  assert.doesNotMatch(src, /NEAR_BLACK_LUMA\s*=\s*\d/, "stop floor must not be a hardcoded literal");
});

test("qa-assess does not redefine the composited floor as a literal", () => {
  const src = fs.readFileSync(path.join(scriptsDir, "qa-assess.mjs"), "utf8");
  assert.match(src, /LUMA_MEAN_MIN:\s*COMPOSITED_LUMA_MIN/, "must reference the shared composited floor");
});
