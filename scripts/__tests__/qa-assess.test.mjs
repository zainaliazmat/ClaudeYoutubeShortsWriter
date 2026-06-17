import { test } from "node:test";
import assert from "node:assert";
import {
  cat9FromLuma, scoreFromFindings, passBar, assessMetrics, validateDuckingEnvelope, BAR,
} from "../qa-assess.mjs";

// A metrics bag that should produce ZERO findings (F-001-ish numbers). Each test
// spreads this and perturbs ONE field, so a failure points at exactly one rule.
const CLEAN = {
  frames: 930, total: 930, width: 1080, height: 1920,
  seamDelta: 2.0, lumaMean: 40, lumaRange: 180,
  longBlackCount: 0, blackLabel: "",
  I: -14.0, TP: -1.3, LRA: 8, trackMean: -18,
  duckingEnvelopeOk: true,
};
const defects = (fs) => fs.map((f) => f.defect);
const ownerOf = (fs, re) => fs.find((f) => re.test(f.defect))?.owner;

// ---------- scoring formula ----------
test("scoreFromFindings: clean run is 100; blockers -25, warnings -6; clamps at 0", () => {
  assert.equal(scoreFromFindings([]), 100);
  assert.equal(scoreFromFindings([{ blocker: true }]), 75);
  assert.equal(scoreFromFindings([{ blocker: false }]), 94);
  assert.equal(scoreFromFindings([{ blocker: true }, { blocker: false }]), 69);
  assert.equal(scoreFromFindings(Array(5).fill({ blocker: true })), 0); // clamp, not -25
});

// ---------- Cat-9 proxy ----------
test("cat9FromLuma: 0 at luma 20, 100 at >=45, linear between, clamped", () => {
  assert.equal(cat9FromLuma(20), 0);
  assert.equal(cat9FromLuma(45), 100);
  assert.equal(cat9FromLuma(32.5), 50);
  assert.equal(cat9FromLuma(10), 0);
  assert.equal(cat9FromLuma(60), 100);
});

// ---------- pass predicate ----------
test("passBar: needs zero blockers AND score>=85 AND cat9>=70; boundaries are inclusive", () => {
  assert.equal(passBar({ blockerCount: 0, score: 85, cat9: 70 }), true);
  assert.equal(passBar({ blockerCount: 0, score: 84, cat9: 70 }), false);
  assert.equal(passBar({ blockerCount: 0, score: 85, cat9: 69 }), false);
  assert.equal(passBar({ blockerCount: 1, score: 100, cat9: 100 }), false);
});

// ---------- attribution (characterization: the CURRENT correct behavior) ----------
test("clean metrics produce no findings", () => {
  assert.deepEqual(assessMetrics(CLEAN), []);
});
test("wrong dimensions -> blocker owned by video", () => {
  const f = assessMetrics({ ...CLEAN, width: 720, height: 1280 });
  assert.equal(ownerOf(f, /dimensions/), "video");
  assert.equal(f.find((x) => /dimensions/.test(x.defect)).blocker, true);
});
test("frame count off by 2 -> blocker; off by 1 -> tolerated (no finding)", () => {
  assert.ok(defects(assessMetrics({ ...CLEAN, frames: 932 })).some((d) => /frame-count/.test(d)));
  assert.deepEqual(assessMetrics({ ...CLEAN, frames: 931 }), []); // ±1 tolerance
});
test("near-black mean -> blocker owned by video", () => {
  assert.equal(ownerOf(assessMetrics({ ...CLEAN, lumaMean: 18, lumaRange: 5 }), /near-black/), "video");
});
test("long black stretch -> blocker; loudness off -> master; VO silent -> voice; seam -> warning", () => {
  assert.ok(defects(assessMetrics({ ...CLEAN, longBlackCount: 1, blackLabel: "2.0-4.0s" })).some((d) => /black-screen/.test(d)));
  assert.equal(ownerOf(assessMetrics({ ...CLEAN, I: -20 }), /loudness off-target/), "video (master)");
  assert.equal(ownerOf(assessMetrics({ ...CLEAN, trackMean: -60 }), /VO silent/), "voice");
  const seam = assessMetrics({ ...CLEAN, seamDelta: 8 });
  assert.equal(seam[0].defect, "loop seam mismatch");
  assert.equal(seam[0].blocker, false); // warning, not blocker
});

// ---------- ducking envelope contract ----------
test("validateDuckingEnvelope: real ducked+swelled envelope passes", () => {
  const vo = { total: 930, speech_regions: [{ start: 0, end: 855 }],
    envelope: [{ frame: 0, vol: 0.22 }, { frame: 855, vol: 0.22 }, { frame: 864, vol: 0.72 }, { frame: 930, vol: 0.72 }] };
  assert.equal(validateDuckingEnvelope(vo), true);
});
test("validateDuckingEnvelope: flat / missing / malformed envelopes fail", () => {
  const speech = [{ start: 0, end: 855 }];
  assert.equal(validateDuckingEnvelope({ total: 930, speech_regions: speech, envelope: [{ frame: 0, vol: 0.5 }, { frame: 930, vol: 0.5 }] }), false); // no swing
  assert.equal(validateDuckingEnvelope({ total: 930, speech_regions: speech }), false); // missing
  assert.equal(validateDuckingEnvelope({ total: 930, speech_regions: speech, envelope: [{ frame: 0, vol: 0.22 }, { frame: 800, vol: 0.72 }] }), false); // doesn't end at total
  assert.equal(validateDuckingEnvelope({ total: 930, speech_regions: speech, envelope: [{ frame: 0, vol: 0.22 }, { frame: 930, vol: 1.4 }] }), false); // vol out of range
});

// =====================================================================
// THE FIXES: these assert the corrected behavior.
// RED before the four fixes are applied, GREEN after.
// =====================================================================
test("FIX: a lit-but-FLAT frame (bright, no contrast) fails — de-games Cat-9", () => {
  const f = assessMetrics({ ...CLEAN, lumaMean: 120, lumaRange: 3 });
  assert.equal(ownerOf(f, /flat|contrast/), "video", "expected a flat/low-contrast blocker");
  const blockers = f.filter((x) => x.blocker).length;
  // bright flat frame would otherwise score 100/Cat9 100 and PASS:
  assert.equal(passBar({ blockerCount: blockers, score: scoreFromFindings(f), cat9: cat9FromLuma(120) }), false);
});
test("FIX: collapsed loudness range (LRA) is flagged as a warning on master", () => {
  const f = assessMetrics({ ...CLEAN, LRA: 3 });
  const lra = f.find((x) => /loudness range|dynamics/.test(x.defect));
  assert.ok(lra, "expected an LRA/dynamics warning");
  assert.equal(lra.blocker, false);
  assert.equal(lra.owner, "video (master)");
});
test("FIX: a bad/absent ducking envelope is flagged (owner voice)", () => {
  const f = assessMetrics({ ...CLEAN, duckingEnvelopeOk: false });
  const duck = f.find((x) => /duck/.test(x.defect));
  assert.ok(duck, "expected a ducking warning");
  assert.equal(duck.owner, "voice");
});

void BAR;
