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
  // chart-spec: the d3 style decision block recorded inside 05-remotion-prompt.md
  // (a fenced ```json chart-spec). prompt-generator writes it, codegen + reviewer
  // read it. Shape: { schemaVersion, archetype:"curve|bars|distribution",
  // points:[{label,value,sourceRef}], domain:[n,n], range:[n,n],
  // axisLabels:{x,y}, transform:"linear|log", growsAcrossBeats:[int] }.
  "chart-spec": 1,
};

// Allowed values for the machine-greppable style decision recorded in
// 05-remotion-prompt.md as `effective_style: <value>` (DX-3). A MISSING line
// defaults to kinetic-typography (fail-safe to the untouched default path).
export const EFFECTIVE_STYLES = ["kinetic-typography", "d3"];
export const DEFAULT_EFFECTIVE_STYLE = "kinetic-typography";

// Parse the effective_style decision from a 05-remotion-prompt.md body.
// Returns { style, missing, multiple, invalid }. Missing -> default
// (kinetic-typography, fail-safe); multiple matches -> flagged (reviewer error);
// single unknown value -> default + invalid:true.
export function parseEffectiveStyle(promptBody) {
  const all = [...String(promptBody).matchAll(/^effective_style:\s*(\S+)\s*$/gm)];
  if (all.length === 0) return { style: DEFAULT_EFFECTIVE_STYLE, missing: true, multiple: false };
  if (all.length > 1) return { style: DEFAULT_EFFECTIVE_STYLE, missing: false, multiple: true };
  const v = all[0][1];
  const ok = EFFECTIVE_STYLES.includes(v);
  return { style: ok ? v : DEFAULT_EFFECTIVE_STYLE, missing: false, multiple: false, invalid: !ok };
}

// Validate a parsed chart-spec object for the d3 branch (DX-1, DX-5 routing).
// Returns { ok, owner, reason } — owner drives the codegen controlled-halt route:
//   <3 sourced points        -> owner:"script" (re-run youtube-shorts-writer)
//   incomparable / malformed -> owner:"video"  (re-run remotion-prompt-generator)
export function validateChartSpec(spec) {
  if (!spec || typeof spec !== "object")
    return { ok: false, owner: "video", reason: "chart-spec missing or not an object" };
  const archetypes = ["curve", "bars", "distribution"];
  if (!archetypes.includes(spec.archetype))
    return { ok: false, owner: "video", reason: `archetype must be one of ${archetypes.join("|")}` };
  const pts = Array.isArray(spec.points) ? spec.points : [];
  const sourced = pts.filter((p) => p && typeof p.value === "number" && p.sourceRef);
  if (sourced.length < 3)
    return {
      ok: false,
      owner: "script",
      reason: `d3 needs >=3 sourced numeric points, found ${sourced.length}`,
    };
  return { ok: true, owner: null, reason: `chart-spec ok (${archetype(spec)}, ${sourced.length} sourced points)` };
}

function archetype(spec) {
  return spec.archetype;
}

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
