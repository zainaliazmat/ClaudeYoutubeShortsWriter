// schema.mjs — PURE schemaVersion validation for every machine-read artifact
// (audit #8). Before this, only assets.json carried a schemaVersion (render-run
// rejected != 1); vo-timing.json and scenes.json had none, so a future shape change
// would fail DEEP (a render crash or a wrong frame map) instead of at the gate with
// a clear message. Each reader validates the version up front; new runs emit the
// field (see the tts-voiceover and remotion-codegen skills).

// The version each reader in this engine speaks. Bump here + in the writer skill
// when an artifact's shape changes incompatibly.
export const SCHEMA = {
  "assets.json": 1,
  "vo-timing.json": 1,
  "scenes.json": 1,
};

// Pure predicate: does `version` match what this engine speaks for `name`?
// Returns { ok, expected, message } and, for the fail-open case, { warn, assumed }
// — no throw, so callers can fold it into either a findings list (precheck) or a
// thrown gate error (render-run).
//
// Three branches, two failure modes:
//   - match            → ok:true                  (silent pass)
//   - MISSING version  → ok:true,  warn:true       FAIL OPEN — un-backfilled/old
//                        assumed:expected          artifacts are assumed current so
//                                                  they don't hard-crash; nudge to backfill.
//   - WRONG version    → ok:false                 FAIL CLOSED — a declared-but-incompatible
//                                                  shape is a real error ("speaks vN, expected vM").
//   - unknown artifact → ok:false                 (programmer error: not in SCHEMA)
export function checkSchemaVersion(name, version) {
  const expected = SCHEMA[name];
  if (expected === undefined) return { ok: false, expected, message: `unknown artifact "${name}"` };
  if (version === expected) return { ok: true, expected, message: `${name} schemaVersion ${version}` };
  if (version === undefined)
    return {
      ok: true,
      warn: true,
      expected,
      assumed: expected,
      message: `${name} has no schemaVersion — assuming v${expected} (fail-open); re-run its writer skill to backfill`,
    };
  return {
    ok: false,
    expected,
    message: `${name} schemaVersion ${version} unsupported: file speaks v${version}, this reader expects v${expected}`,
  };
}

// Throwing wrapper for readers that gate-and-halt (render-run style). Returns obj.
// Throws only on a WRONG version (fail closed); a missing version warns (to
// `warn`, default console.warn) and is allowed through (fail open).
export function assertSchemaVersion(obj, name, ErrCtor = Error, payload = {}, warn = console.warn) {
  const r = checkSchemaVersion(name, obj && obj.schemaVersion);
  if (!r.ok) throw new ErrCtor(r.message, payload);
  if (r.warn && typeof warn === "function") warn(`[schema] ${r.message}`);
  return obj;
}
