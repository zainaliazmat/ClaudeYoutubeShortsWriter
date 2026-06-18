// scene-tiling.mjs — pure helpers that make a scene OVERRUN catchable before render.
//
// Background: scenes.json is the single source of truth for scene timing. It now carries
// an EXPLICIT `duration` per scene (authored), not just a `from`. precheck used to throw
// the authored durations away and re-derive `duration = next.from - from`, which is
// contiguous by construction — so validateTiling (overlap / last-frame) could never fire
// on a real composition. F-002's Beat6 was authored `TOTAL - from` and overran the tail
// into LoopBack; nothing caught it before render. These helpers close that seam.
//
// No TS / React / fs here so the engine unit tests and the strip-types precheck share it.

// rawSceneRanges — the AUTHORED {from, duration} per scene, straight from scenes.json,
// sorted by `from`. NOT re-derived from consecutive `from`s. Feed these to validateTiling
// so an overrunning duration actually shows up as an overlap / wrong tail.
export function rawSceneRanges(scenesObj) {
  const order = (scenesObj && scenesObj.order) || [];
  return [...order]
    .sort((a, b) => a.from - b.from)
    .map((s) => ({ from: s.from, duration: s.duration }));
}

// auditSceneDurations — scan generated composition source. Every scene Sequence must take
// its length from scenes.json (SCENES.<name>.duration). A durationInFrames computed from
// TOTAL (the F-002 footgun) or a numeric literal is NOT traceable to scenes.json -> fail.
// Only JSX-attribute form `durationInFrames={...}` is scanned; the Composition's own
// `durationInFrames: voTiming.total` (object/colon form) is the whole-clip length, not a
// scene, and is intentionally untouched.
export function auditSceneDurations(sourceText) {
  const src = String(sourceText || "");
  const offenders = [];
  const re = /durationInFrames=\{([^}]*)\}/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    const expr = m[1].trim();
    if (/\bTOTAL\b/.test(expr)) {
      offenders.push({ expr, reason: "scene duration derived from TOTAL — author it in scenes.json (SCENES.<name>.duration)" });
    } else if (/^\d+$/.test(expr)) {
      offenders.push({ expr, reason: "hardcoded literal scene duration — must come from SCENES.<name>.duration (scenes.json)" });
    }
  }
  return { ok: offenders.length === 0, offenders };
}
