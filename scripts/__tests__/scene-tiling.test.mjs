import { test } from "node:test";
import assert from "node:assert";
import { rawSceneRanges, auditSceneDurations } from "../scene-tiling.mjs";
import { validateTiling } from "../../render/src/lib/tiling.ts";

// scenes.json now carries an EXPLICIT authored `duration` per scene (the single source).
// rawSceneRanges returns those raw {from,duration} pairs — NOT contiguous values
// re-derived from consecutive `from`s. That distinction is the whole point: precheck
// used to fabricate `duration = next.from - from`, which is contiguous by construction,
// so validateTiling's overlap / last-frame checks could never fire on a real overrun.

test("rawSceneRanges: maps EXPLICIT durations from scenes.json, sorted by from", () => {
  const obj = { order: [
    { name: "b1", from: 100, duration: 50 },
    { name: "hook", from: 0, duration: 100 },
  ] };
  assert.deepEqual(rawSceneRanges(obj), [
    { from: 0, duration: 100 },
    { from: 100, duration: 50 },
  ]);
});

test("rawSceneRanges: empty / missing order -> []", () => {
  assert.deepEqual(rawSceneRanges({}), []);
  assert.deepEqual(rawSceneRanges(null), []);
});

// TDD regression for F-002's seam bug: Beat6 authored as `TOTAL - from` (202) instead
// of its scenes.json duration (127) overran the tail into LoopBack. With RAW durations
// validateTiling must catch it BEFORE render. The OLD derived-contiguous approach
// silently passed — this test pins that the new path actually fails.
test("validateTiling on RAW durations catches a scene that overruns the tail", () => {
  const TOTAL = 720;
  // F-002-shaped, but beat6.duration is the buggy TOTAL-from (202), overrunning loopBack(645)
  const buggy = { order: [
    { name: "hook", from: 0, duration: 95 },
    { name: "beat1", from: 95, duration: 111 },
    { name: "beat2", from: 206, duration: 100 },
    { name: "beat3", from: 306, duration: 89 },
    { name: "beat4", from: 395, duration: 52 },
    { name: "beat5", from: 447, duration: 71 },
    { name: "beat6", from: 518, duration: 202 }, // BUG: TOTAL-from, should be 127
    { name: "loopBack", from: 645, duration: 75 },
  ] };
  const raw = validateTiling(rawSceneRanges(buggy), TOTAL);
  assert.equal(raw.ok, false, "raw authored durations must expose the overrun");
  assert.match(raw.errors.join("; "), /overlap/, "beat6 overruns loopBack -> overlap");

  // Demonstrate WHY this was invisible: the old derived-contiguous ranges tile cleanly.
  const order = buggy.order;
  const derived = order.map((s, i) => ({
    from: s.from,
    duration: (i + 1 < order.length ? order[i + 1].from : TOTAL) - s.from,
  }));
  assert.equal(validateTiling(derived, TOTAL).ok, true, "derived-contiguous hid the bug");

  // And the correctly-authored durations tile.
  const good = { order: order.map((s) => ({ ...s, duration: s.name === "beat6" ? 127 : s.duration })) };
  assert.equal(validateTiling(rawSceneRanges(good), TOTAL).ok, true);
});

// auditSceneDurations: a generated composition's scene Sequences must take their
// durationInFrames from SCENES.<name>.duration (traceable to scenes.json). Any duration
// computed from TOTAL (the F-002 footgun) or a numeric literal is NOT traceable -> fail.
test("auditSceneDurations: flags `TOTAL - from` and numeric-literal scene durations", () => {
  const good = `
    <Sequence from={SCENES.hook.from} durationInFrames={SCENES.hook.duration}><Hook /></Sequence>
    <Sequence from={SCENES.beat6.from} durationInFrames={SCENES.beat6.duration}><Beat6 /></Sequence>
  `;
  assert.equal(auditSceneDurations(good).ok, true);

  const totalFrom = `<Sequence from={SCENES.beat6.from} durationInFrames={TOTAL - SCENES.beat6.from}><Beat6 /></Sequence>`;
  const a = auditSceneDurations(totalFrom);
  assert.equal(a.ok, false);
  assert.match(a.offenders[0].reason, /TOTAL/);

  const literal = `<Sequence from={SCENES.beat6.from} durationInFrames={153}><Beat6 /></Sequence>`;
  assert.equal(auditSceneDurations(literal).ok, false);
});

test("auditSceneDurations: the Composition's own durationInFrames (object form) is NOT a scene duration", () => {
  // calculateMetadata returns `durationInFrames: voTiming.total` — colon form, not a JSX
  // attribute, and legitimately the whole-composition length. Must not be flagged.
  const comp = `return { durationInFrames: voTiming.total, fps: FPS };`;
  assert.equal(auditSceneDurations(comp).ok, true);
});
