import { test } from "node:test";
import assert from "node:assert";
import {
  normalizeCaptionText, captionMatchRatio, assessCaptionLegibility, CAPTION_MATCH_MIN,
  captionSamplePlan,
  assessCutCadence, CADENCE,
  assessCutCorrespondence, CUT_MATCH,
  relativeLuminance, contrastRatio, assessCaptionContrast, WCAG_AA_MIN,
} from "../qa-assess.mjs";

// ---------- (d) caption legibility / OCR ----------
test("normalizeCaptionText: case-folds, strips punctuation + diacritics, collapses ws", () => {
  assert.equal(normalizeCaptionText("  Cleopatra’s  PYRAMIDS! "), "cleopatra s pyramids");
  assert.equal(normalizeCaptionText("café — 2,500"), "cafe 2 500"); // punctuation -> separator
});

test("captionMatchRatio: counts expected words present in OCR text", () => {
  assert.equal(captionMatchRatio("the moon landing was closer", ["moon", "landing"]), 1);
  assert.equal(captionMatchRatio("the mon landng was", ["moon", "landing"]), 0); // OCR garbled both
  assert.equal(captionMatchRatio("moon only", ["moon", "landing"]), 0.5);
  assert.equal(captionMatchRatio("anything", []), 1); // nothing expected
  assert.equal(captionMatchRatio("Moon Landing", "moon landing"), 1); // string form
});

test("assessCaptionLegibility: warns below the floor, null above, null when nothing measured", () => {
  assert.equal(assessCaptionLegibility([]), null); // tool absent
  assert.equal(assessCaptionLegibility([1, 0.9, 0.8]), null); // legible
  const f = assessCaptionLegibility([0.2, 0.3]);
  assert.ok(f && /OCR/.test(f.defect));
  assert.equal(f.blocker, false);
  assert.equal(f.owner, "video");
  assert.ok(CAPTION_MATCH_MIN > 0 && CAPTION_MATCH_MIN < 1);
});

// ---------- (d2) caption sampling plan — ONE sample per displayed token ----------
// Regression guard for the old probe bug: it OCR'd a single frame at the MIDPOINT of
// the whole speech region and compared it to EVERY word in the region, so a perfectly
// legible word-by-word render scored ~1/N (≈6% on F-001). A correct plan samples each
// token once, in its own stable display window, matched only to its own text.
test("captionSamplePlan: one interior sample per token, matched to that token's text", () => {
  const tokens = [
    { display: "Cleopatra", start: 0, end: 19, beat: "hook" },
    { display: "lived", start: 19, end: 27, beat: "hook" },
    { display: "1969", start: 27, end: 60, beat: "beat5" },
  ];
  const plan = captionSamplePlan(tokens);
  // one sample PER TOKEN — not one frame for the whole region
  assert.equal(plan.length, tokens.length);
  // each sample carries exactly its own token's display, in order
  assert.deepEqual(plan.map((p) => p.display), ["Cleopatra", "lived", "1969"]);
  // each frame lands in its token's interior, past the fade-in, before the end
  plan.forEach((p, i) => {
    const t = tokens[i];
    assert.ok(p.frame > t.start && p.frame < t.end, `frame ${p.frame} inside (${t.start},${t.end})`);
    assert.ok(p.frame >= Math.min(t.end - 1, t.start + 3), "samples the stable display, not the fade-in");
  });
});

test("captionSamplePlan: empty / degenerate input -> empty plan", () => {
  assert.deepEqual(captionSamplePlan([]), []);
  assert.deepEqual(captionSamplePlan(null), []);
});

// ---------- (e) cut cadence ----------
test("assessCutCadence: in-band (2-4s) passes; too slow / too fast warn", () => {
  // 30s clip, 9 cuts => 10 shots => 3s/shot — in band
  assert.equal(assessCutCadence([3, 6, 9, 12, 15, 18, 21, 24, 27], 30), null);
  // 30s clip, 1 cut => 2 shots => 15s/shot — too slow
  const slow = assessCutCadence([15], 30);
  assert.ok(slow && /slow/.test(slow.defect));
  assert.equal(slow.blocker, false);
  // 30s clip, 59 cuts => 60 shots => 0.5s/shot — too fast
  const fast = assessCutCadence(Array.from({ length: 59 }, (_, i) => i + 1), 30);
  assert.ok(fast && /fast/.test(fast.defect));
});

test("assessCutCadence: boundary slack and bad input", () => {
  assert.equal(assessCutCadence([], 0), null); // no duration
  // avg exactly at MAX+SLACK (4.5s) tolerated: 30/4.5 ~ 6.67 shots -> use 30s, 5 shots = 6s? craft: 27s, 5 shots
  // 27s, 5 shots (4 cuts) = 5.4s/shot > 4.5 -> too slow
  assert.ok(assessCutCadence([5, 11, 16, 22], 27));
  assert.equal(CADENCE.MIN_S, 2);
});

// ---------- (e2) cut-vs-scene correspondence ----------
test("assessCutCorrespondence: every interior boundary has a detected cut -> null", () => {
  // boundaries at frames [0, 90, 180, 270]; opening frame 0 is not a cut.
  // detected cuts within tolerance of 90/180/270 -> clean.
  assert.equal(assessCutCorrespondence([91, 179, 271], [0, 90, 180, 270]), null);
});

test("assessCutCorrespondence: a boundary with no detected cut warns (missing)", () => {
  // boundary 180 has no cut near it
  const f = assessCutCorrespondence([91, 271], [0, 90, 180, 270]);
  assert.ok(f && /boundary|missing|no cut/i.test(f.defect + f.evidence));
  assert.equal(f.blocker, false);
  assert.equal(f.owner, "video");
});

test("assessCutCorrespondence: a detected cut at no boundary warns (orphan)", () => {
  // 140 lands between boundaries -> uncommanded jump
  const f = assessCutCorrespondence([91, 140, 179, 271], [0, 90, 180, 270]);
  assert.ok(f && /orphan|no boundary|uncommanded/i.test(f.defect + f.evidence));
  assert.equal(f.blocker, false);
});

test("assessCutCorrespondence: tolerance + degenerate input", () => {
  assert.equal(assessCutCorrespondence([], []), null);       // nothing to compare
  assert.equal(assessCutCorrespondence([90], [0]), null);     // only the opening frame -> nothing interior
  // within TOL_FRAMES of the boundary still counts as a match
  assert.equal(assessCutCorrespondence([90 + CUT_MATCH.TOL_FRAMES], [0, 90]), null);
  assert.ok(assessCutCorrespondence([90 + CUT_MATCH.TOL_FRAMES + 1], [0, 90])); // just outside -> warn
});

// ---------- (f) WCAG caption contrast ----------
test("relativeLuminance: black=0, white=1, NOT the same as Rec.601 luma", () => {
  assert.equal(relativeLuminance("#000000"), 0);
  assert.ok(Math.abs(relativeLuminance("#ffffff") - 1) < 1e-9);
  // mid-gray sRGB 0.5 linearizes to ~0.214, far from a naive 0.5
  assert.ok(relativeLuminance("#808080") < 0.25);
});

test("contrastRatio: white-on-black is 21:1; identical colors are 1:1; order-independent", () => {
  assert.ok(Math.abs(contrastRatio("#ffffff", "#000000") - 21) < 0.01);
  assert.equal(contrastRatio("#123456", "#123456"), 1);
  assert.equal(contrastRatio("#ffffff", "#000000"), contrastRatio("#000000", "#ffffff"));
});

test("assessCaptionContrast: F-001 cream text on navy bg passes; low-contrast warns", () => {
  // F-001 text #F4F1E8 on bgTop #0B1430 — should clear AA comfortably
  assert.equal(assessCaptionContrast("#F4F1E8", "#0B1430"), null);
  const f = assessCaptionContrast("#777777", "#5B6BA8");
  assert.ok(f && /WCAG/.test(f.defect));
  assert.equal(f.blocker, false);
  assert.equal(f.owner, "video");
  assert.equal(WCAG_AA_MIN, 4.5);
});

test("assessCaptionContrast: evaluates the WORST-CASE bg among candidates (the bright hero region)", () => {
  // Light cream text reads fine over the dark navy stops, but the hero GLOW
  // (#E8D9A0) is bright — that's the real worst case. The single dark stop hides it.
  assert.equal(assessCaptionContrast("#F4F1E8", "#0B1430"), null, "navy alone looks safe");
  const f = assessCaptionContrast("#F4F1E8", ["#0B1430", "#1A2A55", "#E8D9A0"]);
  assert.ok(f && /WCAG/.test(f.defect), "must flag cream-on-bright-glow");
  // evidence should name the offending (brightest) bg color, not a dark stop
  assert.match(f.evidence, /E8D9A0/i);
});

test("assessCaptionContrast: array form passes when EVERY candidate clears AA", () => {
  assert.equal(assessCaptionContrast("#FFFFFF", ["#0B1430", "#222222", "#101820"]), null);
});
