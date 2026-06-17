import { test } from "node:test";
import assert from "node:assert";
import { checkSchemaVersion, assertSchemaVersion, SCHEMA } from "../schema.mjs";

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
