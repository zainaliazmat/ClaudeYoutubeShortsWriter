import { test } from "node:test";
import assert from "node:assert";
import {
  checkSchemaVersion,
  assertSchemaVersion,
  SCHEMA,
  parseEffectiveStyle,
  validateChartSpec,
  DEFAULT_EFFECTIVE_STYLE,
} from "../schema.mjs";

test("checkSchemaVersion: accepts the version this engine speaks", () => {
  for (const [name, v] of Object.entries(SCHEMA)) {
    assert.equal(checkSchemaVersion(name, v).ok, true, `${name} v${v} should pass`);
  }
});

test("checkSchemaVersion: missing version FAILS OPEN — warns and is treated as v1", () => {
  // A *missing* schemaVersion is an un-backfilled / pre-audit artifact, not a
  // corrupt one. Fail open: ok=true so old runs don't hard-crash, warn=true so
  // the reader can surface a nudge to re-run the writer skill.
  const r = checkSchemaVersion("vo-timing.json", undefined);
  assert.equal(r.ok, true, "missing must not be a hard failure");
  assert.equal(r.warn, true, "missing must flag a warning");
  assert.equal(r.assumed, 1, "missing is assumed to be the spoken version");
  assert.match(r.message, /no schemaVersion/);
  assert.match(r.message, /assum/i);
  assert.match(r.message, /v1/);
});

test("checkSchemaVersion: present-but-wrong version FAILS CLOSED — 'speaks vN, expected vM'", () => {
  const r = checkSchemaVersion("scenes.json", 2);
  assert.equal(r.ok, false);
  assert.ok(!r.warn, "a wrong version is an error, not a warning");
  assert.match(r.message, /schemaVersion 2 unsupported/);
  assert.match(r.message, /speaks v2/);
  assert.match(r.message, /expect\w* v1/);
});

test("checkSchemaVersion: rejects an unknown artifact name", () => {
  assert.equal(checkSchemaVersion("mystery.json", 1).ok, false);
});

test("assertSchemaVersion: returns the object on a match, throws ONLY on a wrong version", () => {
  const obj = { schemaVersion: 1, total: 930 };
  assert.equal(assertSchemaVersion(obj, "vo-timing.json"), obj);
  // present-but-wrong = fail closed (throw)
  assert.throws(() => assertSchemaVersion({ schemaVersion: 99 }, "vo-timing.json"), /unsupported/);
  // missing = fail open: returns the object (assumed v1), does NOT throw
  const legacy = { total: 930 };
  assert.equal(assertSchemaVersion(legacy, "scenes.json"), legacy);
});

test("assertSchemaVersion: throws with a custom error ctor + payload (render-run gate style)", () => {
  class GateError extends Error {
    constructor(m, p) { super(m); this.payload = p; }
  }
  try {
    // wrong version (not missing) is the fail-closed branch that throws
    assertSchemaVersion({ schemaVersion: 7 }, "assets.json", GateError, { owner: "human" });
    assert.fail("should have thrown");
  } catch (e) {
    assert.ok(e instanceof GateError);
    assert.equal(e.payload.owner, "human");
  }
});

// ---- d3 style decision: effective_style parsing (DX-3) ----
test("parseEffectiveStyle: a single d3 line is read as d3", () => {
  const r = parseEffectiveStyle("title\neffective_style: d3\nmore");
  assert.equal(r.style, "d3");
  assert.equal(r.missing, false);
  assert.equal(r.multiple, false);
});

test("parseEffectiveStyle: MISSING line defaults to kinetic-typography (fail-safe, Criterion 7)", () => {
  const r = parseEffectiveStyle("an old prompt with no style line");
  assert.equal(r.style, DEFAULT_EFFECTIVE_STYLE);
  assert.equal(r.style, "kinetic-typography");
  assert.equal(r.missing, true);
});

test("parseEffectiveStyle: MULTIPLE lines are flagged (reviewer error) and default safely", () => {
  const r = parseEffectiveStyle("effective_style: d3\neffective_style: kinetic-typography");
  assert.equal(r.multiple, true);
  assert.equal(r.style, "kinetic-typography");
});

test("parseEffectiveStyle: an unknown value is invalid and defaults safely", () => {
  const r = parseEffectiveStyle("effective_style: lottie");
  assert.equal(r.invalid, true);
  assert.equal(r.style, "kinetic-typography");
});

// ---- d3 chart-spec validation + halt routing (DX-1, DX-5) ----
test("validateChartSpec: a well-formed bars spec with >=3 sourced points passes", () => {
  const spec = {
    schemaVersion: 1,
    archetype: "bars",
    points: [
      { label: "a", value: 10, sourceRef: "ref1" },
      { label: "b", value: 20, sourceRef: "ref2" },
      { label: "c", value: 30, sourceRef: "ref3" },
    ],
  };
  const r = validateChartSpec(spec);
  assert.equal(r.ok, true);
  assert.equal(r.owner, null);
});

test("validateChartSpec: <3 sourced points routes to owner=script (re-run writer)", () => {
  const spec = {
    archetype: "bars",
    points: [
      { label: "a", value: 10, sourceRef: "ref1" },
      { label: "b", value: 20 }, // unsourced -> not counted
    ],
  };
  const r = validateChartSpec(spec);
  assert.equal(r.ok, false);
  assert.equal(r.owner, "script");
  assert.match(r.reason, />=3 sourced/);
});

test("validateChartSpec: a bad archetype routes to owner=video (re-run prompt-generator)", () => {
  const r = validateChartSpec({ archetype: "piechart", points: [] });
  assert.equal(r.ok, false);
  assert.equal(r.owner, "video");
});

test("validateChartSpec: a null/missing spec routes to owner=video", () => {
  assert.equal(validateChartSpec(null).owner, "video");
  assert.equal(validateChartSpec(undefined).ok, false);
});

test("SCHEMA registers chart-spec at v1", () => {
  assert.equal(SCHEMA["chart-spec"], 1);
});
