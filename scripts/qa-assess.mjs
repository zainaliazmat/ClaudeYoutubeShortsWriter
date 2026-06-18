// qa-assess.mjs — the PURE judgment layer of the QA probe (no ffmpeg, no fs).
// Separated from qa-probe.mjs so the scoring formula, the Cat-9 proxy, the
// pass/bar predicate, and every defect-attribution decision can be unit-tested
// deterministically against plain numbers — the half of the probe that owns the
// "is this good?" call, with the measurement half (ffmpeg) left in qa-probe.mjs.
//
// assessMetrics(metrics) takes ALREADY-MEASURED values and returns the same
// finding objects the loop consumes ({ defect, evidence, owner, fix, principle,
// blocker }). Single source of truth for the thresholds, too.

import { COMPOSITED_LUMA_MIN } from "./quality-floors.mjs";

// ---- thresholds (single source; qa-probe imports these) ----
export const THRESH = {
  LUMA_MEAN_MIN: COMPOSITED_LUMA_MIN, // composited-frame near-black floor (shared w/ safeArea.bgLumaMin)
  LUMA_MEAN_TARGET: 45, // lit reference for the Cat-9 proxy
  CAT9_FLOOR: 20, // luma at which Cat-9 reads 0
  SEAM_DELTA_MAX: 6, // max |YUV avg delta| frame0 vs frameLast for a clean loop
  LUFS_TARGET: -14,
  LUFS_TOL: 1.0,
  TP_CEIL: -1.0,
  TP_SLACK: 0.5, // a hair over (-0.7) is fine — no clip
  // --- de-gaming / dynamics / ducking (used by the fixes) ---
  FLAT_RANGE_MIN: 40, // min mean per-frame luma RANGE (YMAX-YMIN); a lit-but-flat
  //                     frame has near-zero range — catches the "bright void"
  LRA_MIN: 5, // measured loudness range below this = dynamics collapsed
  DUCK_MAX: 0.4, // envelope vol at/below this counts as "ducked under speech"
  SWELL_DELTA_MIN: 0.2, // envelope max-min must exceed this (it actually modulates)
};

export const BAR = { score: 85, cat9: 70 }; // + zero blockers

// Cat-9 proxy from rendered luma: 0 at CAT9_FLOOR, 100 at >= target.
export function cat9FromLuma(lumaMean, c = THRESH) {
  return Math.max(
    0,
    Math.min(100, Math.round(((lumaMean - c.CAT9_FLOOR) / (c.LUMA_MEAN_TARGET - c.CAT9_FLOOR)) * 100)),
  );
}

export function scoreFromFindings(findings) {
  const blockers = findings.filter((f) => f.blocker).length;
  const warnings = findings.length - blockers;
  return Math.max(0, 100 - blockers * 25 - warnings * 6);
}

export function passBar({ blockerCount, score, cat9 }, bar = BAR) {
  return blockerCount === 0 && score >= bar.score && cat9 >= bar.cat9;
}

// Is the authored ducking envelope real — does the bed actually duck under speech
// and swell elsewhere? A contract check on vo-timing.json (the envelope drives
// AudioBed at render time; we cannot isolate the bed from the final mix, but we
// CAN verify the envelope that produced it was authored to duck).
export function validateDuckingEnvelope(vo, c = THRESH) {
  const e = vo && vo.envelope;
  if (!Array.isArray(e) || e.length < 2) return false;
  for (const k of e) {
    if (!Number.isInteger(k.frame) || k.frame < 0) return false;
    if (typeof k.vol !== "number" || k.vol < 0 || k.vol > 1) return false;
  }
  for (let i = 1; i < e.length; i++) if (e[i].frame < e[i - 1].frame) return false;
  if (e[0].frame !== 0) return false;
  if (typeof vo.total === "number" && e[e.length - 1].frame !== vo.total) return false;
  const vols = e.map((k) => k.vol);
  if (Math.max(...vols) - Math.min(...vols) < c.SWELL_DELTA_MIN) return false;
  const regions = vo.speech_regions || [];
  if (regions.length === 0) return Math.min(...vols) <= c.DUCK_MAX;
  return regions.some((r) => e.some((k) => k.frame >= r.start && k.frame <= r.end && k.vol <= c.DUCK_MAX));
}

// The attribution table, as pure logic. metrics is the measured bag of numbers;
// returns the findings array (blockers + warnings) with owners attached.
export function assessMetrics(m, c = THRESH) {
  const findings = [];
  const add = (defect, evidence, owner, fix, principle) =>
    findings.push({ defect, evidence, owner, fix, principle, blocker: true });
  const warn = (defect, evidence, owner, fix, principle) =>
    findings.push({ defect, evidence, owner, fix, principle, blocker: false });

  // a. frame count + dims
  if (Math.abs(m.frames - m.total) > 1)
    add("frame-count mismatch", `${m.frames} vs total ${m.total}`, "video",
      "duration via calculateMetadata(vo.total); re-render", "loop seam breaks if off");
  if (m.width !== 1080 || m.height !== 1920)
    add("wrong dimensions", `${m.width}x${m.height}`, "video", "1080x1920 in safeArea", "format");

  // b. loop seam
  if (m.seamDelta > c.SEAM_DELTA_MAX)
    warn("loop seam mismatch", `YUV delta ${m.seamDelta.toFixed(1)} (frame0 vs ${m.total - 1})`,
      "video", "cross-dissolve last scene back to frame-0 composition", "invisible loop");

  // c. brightness / black
  if (m.lumaMean < c.LUMA_MEAN_MIN)
    add("near-black / flat frame", `mean YAVG ${m.lumaMean.toFixed(1)} (< ${c.LUMA_MEAN_MIN})`,
      "video", "depth background (gradient+glow+nebula); raise bg luma", "F-001 void");
  if (m.longBlackCount > 0)
    add("black-screen stretch", m.blackLabel || `${m.longBlackCount} stretch(es)`,
      "video", "no black lead-in/holes; open lit on the hook", "in-feed black");

  // e. loudness
  const iOk = Math.abs(m.I - c.LUFS_TARGET) <= c.LUFS_TOL;
  const tpOk = m.TP <= c.TP_CEIL + c.TP_SLACK;
  if (!iOk || !tpOk)
    add("loudness off-target", `I=${m.I} LUFS, TP=${m.TP} dBTP`,
      "video (master)", "re-run two-pass loudnorm to -14 LUFS / <= -1 dBTP", "quiet in-feed");

  // f. VO present
  if (Number.isNaN(m.trackMean) || m.trackMean <= -50)
    add("VO silent / no audio", `track mean ${m.trackMean} dB`, "voice",
      "ensure vo.wav copied to public/ and AudioBed wired", "no narration");

  // === FIXES ===

  // C. de-game Cat-9: a frame can be bright yet FLAT (a lit void). Cat-9 rewards
  // brightness, so a flat bright frame would otherwise score 100 and PASS. If the
  // frame is lit (not already caught as near-black) but has near-zero spatial luma
  // range, it carries no legible content — block it.
  if (m.lumaMean >= c.LUMA_MEAN_MIN && Number.isFinite(m.lumaRange) && m.lumaRange < c.FLAT_RANGE_MIN)
    add("flat / low-contrast frame",
      `luma range ${m.lumaRange.toFixed(1)} (< ${c.FLAT_RANGE_MIN}) — lit but no contrast/legible type`,
      "video", "render hero type + depth layers (lib Background + Captions); never a flat fill",
      "a bright void still fails — Cat-9 must not pass on brightness alone");

  // B1. dynamics collapse: a correctly-loud master can still read as over-compressed.
  // Proven NOT a master-flag problem — linear=true is byte-identical here because the
  // pre-master mix is quiet + peaky (isolated SFX transients force loudnorm into dynamic
  // mode for the +6 dB it needs). The fix is upstream in the mix. Warn before publish.
  if (Number.isFinite(m.LRA) && m.LRA < c.LRA_MIN)
    warn("narrow loudness range",
      `LRA ${m.LRA} (< ${c.LRA_MIN}) — dynamics collapsed (loudnorm linear=false?)`,
      "video (mix)",
      "tame SFX transient peaks (lower/limit the SFX bus) and raise the VO/bed body so the master needs only a small near-linear gain",
      "flat dynamics read as lifeless even at -14 LUFS");

  // B2. ducking: cannot be measured from the inseparable final mix, so verify the
  // authored envelope that drives AudioBed actually ducks under speech and swells.
  if (m.duckingEnvelopeOk === false)
    warn("weak / absent ducking envelope",
      "envelope does not duck under speech then swell on the tail",
      "voice", "tts-voiceover must author a ducking envelope (~0.22 under speech -> ~0.72 tail)",
      "VO must sit above the bed");

  return findings;
}

// =====================================================================
// AUXILIARY (slow-tier) checks. Their pure decision logic lives here and is
// unit-tested deterministically; the measurement that feeds them (OCR via
// tesseract, scene-cut counting via ffmpeg scdet) lives in qa-probe and self-skips
// when the tool is absent. These are NOT folded into assessMetrics / the loop score
// (so the shipped videos' scores never move) — they're the richer render-qa tier.
// =====================================================================

// ---- (d) caption legibility / OCR ----
export const CAPTION_MATCH_MIN = 0.6; // fraction of expected words OCR must recover

// Normalize for fuzzy text comparison: case-fold, strip punctuation/diacritics,
// collapse whitespace. Caption type is stylized, so we compare on words, not glyphs.
export function normalizeCaptionText(s) {
  return String(s || "")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Fraction of EXPECTED words that appear in the OCR'd text (0..1). expectedWords may
// be an array of word strings (vo-timing words[].display) or a single string.
export function captionMatchRatio(ocrText, expectedWords) {
  const exp = (Array.isArray(expectedWords) ? expectedWords : String(expectedWords).split(/\s+/))
    .map(normalizeCaptionText)
    .filter(Boolean);
  if (exp.length === 0) return 1;
  const hay = ` ${normalizeCaptionText(ocrText)} `;
  const found = exp.filter((w) => hay.includes(` ${w} `)).length;
  return found / exp.length;
}

// Caption fade-in length (frames) — opacity ramps [start, start+CAPTION_FADE] in
// lib/Captions.tsx. Sample AFTER it so OCR reads the fully-opaque word, not a ghost.
export const CAPTION_FADE = 3;

// captionSamplePlan — turn the displayed caption TOKENS into one OCR sample per token
// (NOT one frame for the whole speech region matched to every word — that scored ~1/N
// on a perfectly legible word-by-word render). Each sample lands in the token's stable
// display window (past the fade-in, before its end) and carries only its own text.
// `tokens` are the merged display tokens (lib/captions-core buildTokens): {display,start,end}.
export function captionSamplePlan(tokens) {
  if (!Array.isArray(tokens)) return [];
  return tokens.map((t) => {
    const len = t.end - t.start;
    const frame = Math.min(t.end - 1, t.start + Math.max(CAPTION_FADE + 1, Math.floor(len / 2)));
    return { frame, display: t.display };
  });
}

// Pure decision: given measured per-region match ratios, return a finding (warning)
// or null. Warning, not blocker — OCR is fuzzy and must not false-fail a clean render.
export function assessCaptionLegibility(ratios, c = { CAPTION_MATCH_MIN }) {
  const vals = (ratios || []).filter((r) => Number.isFinite(r));
  if (vals.length === 0) return null; // nothing measured (tool absent) -> no finding
  const worst = Math.min(...vals);
  const mean = vals.reduce((s, x) => s + x, 0) / vals.length;
  if (mean >= c.CAPTION_MATCH_MIN) return null;
  return {
    defect: "caption text not legible (OCR)",
    evidence: `mean OCR match ${(mean * 100).toFixed(0)}% (worst ${(worst * 100).toFixed(0)}%), floor ${(c.CAPTION_MATCH_MIN * 100).toFixed(0)}%`,
    owner: "video",
    fix: "raise caption contrast/size; ensure burned-in words match vo-timing.json",
    principle: "captions must render the spoken words legibly",
    blocker: false,
  };
}

// ---- (e) cut cadence ----
export const CADENCE = { MIN_S: 2, MAX_S: 4, SLACK: 0.5 }; // a cut every 2–4s (CLAUDE.md)

// Pure decision: given detected cut timestamps (seconds) and total duration (seconds),
// is the average shot length within the 2–4s house cadence? Returns a finding or null.
export function assessCutCadence(cutTimes, durationS, c = CADENCE) {
  if (!Number.isFinite(durationS) || durationS <= 0) return null;
  const cuts = (cutTimes || []).filter((t) => Number.isFinite(t) && t > 0 && t < durationS);
  const shots = cuts.length + 1; // N cuts => N+1 shots
  const avg = durationS / shots;
  const lo = c.MIN_S - c.SLACK;
  const hi = c.MAX_S + c.SLACK;
  if (avg >= lo && avg <= hi) return null;
  const tooSlow = avg > hi;
  return {
    defect: tooSlow ? "cut cadence too slow" : "cut cadence too fast",
    evidence: `${shots} shots over ${durationS.toFixed(1)}s = avg ${avg.toFixed(1)}s/shot (target ${c.MIN_S}-${c.MAX_S}s)`,
    owner: "video",
    fix: tooSlow ? "add scene cuts every 2–4s" : "lengthen shots; fewer/slower cuts",
    principle: "a cut every 2–4s sustains retention",
    blocker: false,
  };
}

// ---- (e2) cut-vs-scene correspondence ----
// The rate check above answers "are there roughly the right NUMBER of cuts?".
// It does NOT answer "did the cuts land where the scene graph said they would?".
// A render can hit the cadence average yet have a scene boundary that produces no
// visible change (dead transition) or a visible jump the scene graph never declared
// (flash, decode glitch, loop seam). This compares detected cut frames against the
// declared scene boundaries (scenes.json order[].from). Warning only, and OUT of the
// loop score — it's a richer render-qa-tier probe, not a loop blocker.
export const CUT_MATCH = { TOL_FRAMES: 6 }; // ±6f ≈ 0.2s at 30fps — slack for scdet jitter

export function assessCutCorrespondence(detectedFrames, boundaryFrames, c = CUT_MATCH) {
  const tol = c.TOL_FRAMES;
  const cuts = [...new Set((detectedFrames || []).filter(Number.isFinite).map((f) => Math.round(f)))]
    .sort((a, b) => a - b);
  // The opening frame (0) is the start of the video, not a cut — drop it.
  const bounds = [...new Set((boundaryFrames || []).filter(Number.isFinite).map((f) => Math.round(f)))]
    .filter((f) => f > 0)
    .sort((a, b) => a - b);
  if (bounds.length === 0) return null; // no interior boundaries -> nothing to compare
  const near = (x, list) => list.some((y) => Math.abs(x - y) <= tol);
  const missing = bounds.filter((b) => !near(b, cuts)); // declared boundary, no detected cut
  const orphan = cuts.filter((cf) => !near(cf, bounds)); // detected cut, no declared boundary
  if (missing.length === 0 && orphan.length === 0) return null;
  const parts = [];
  if (missing.length) parts.push(`${missing.length} boundary(ies) with no cut [${missing.join(",")}]`);
  if (orphan.length) parts.push(`${orphan.length} orphan cut(s) at no boundary [${orphan.join(",")}]`);
  return {
    defect: "scene cuts don't correspond to declared boundaries",
    evidence: `${parts.join("; ")} (±${tol}f)`,
    owner: "video",
    fix: missing.length
      ? "ensure each scene boundary actually changes the frame (or remove the dead boundary)"
      : "remove the uncommanded visual jump / fix the loop seam at the orphan cut",
    principle: "every declared scene boundary should be a real cut, and vice-versa",
    blocker: false,
  };
}

// ---- (f) WCAG caption contrast ----
export const WCAG_AA_MIN = 4.5; // AA for normal text; large text is 3:1 but captions are read fast

// Proper sRGB relative luminance (NOT Rec.601 luma / hexLuma — that's non-linear and
// wrong for WCAG). Linearize each channel, weight 0.2126/0.7152/0.0722.
export function relativeLuminance(hex) {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(String(hex).trim());
  if (!m) return 0;
  const n = parseInt(m[1], 16);
  const chan = (c8) => {
    const s = c8 / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  const r = chan((n >> 16) & 255);
  const g = chan((n >> 8) & 255);
  const b = chan(n & 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// WCAG contrast ratio (L1+0.05)/(L2+0.05), >= 1, lighter over darker.
export function contrastRatio(hexA, hexB) {
  const la = relativeLuminance(hexA);
  const lb = relativeLuminance(hexB);
  const [hi, lo] = la >= lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

// Pure decision: caption text vs background contrast. Warning below ~4.5:1.
//
// `bg` may be a single hex (a gradient stop) OR an array of candidate background
// colors — the gradient stops PLUS the bright hero glow. We report the WORST case
// (the candidate that yields the lowest contrast against the text), because a caption
// that clears AA over the dark navy stop can still be illegible where it crosses the
// bright hero region. The single-stop form stays byte-identical for existing callers.
//
// LIMITATION (spec-color coverage, not pixel-true): this still compares the text hex
// against *declared* colors, not the actual rendered pixels under each caption's
// bounding box over its active frames. A glow/gradient blend or an overlapping glyph
// can produce a local luminance this list doesn't enumerate. Full coverage requires
// rasterizing frames and sampling the caption bbox — see the OCR/raster path in
// qa-probe for the machinery.
// TODO(render-qa): sample real pixels under the caption bbox across active frames and
// feed the brightest sampled color here, so this becomes pixel-true rather than
// worst-of-declared-stops.
export function assessCaptionContrast(textHex, bg, c = { WCAG_AA_MIN }) {
  const candidates = Array.isArray(bg) ? bg.filter(Boolean) : [bg];
  if (candidates.length === 0) return null;
  // worst case = lowest contrast ratio = the candidate closest in luminance to the text
  let worstHex = candidates[0];
  let worstRatio = Infinity;
  for (const hex of candidates) {
    const r = contrastRatio(textHex, hex);
    if (r < worstRatio) { worstRatio = r; worstHex = hex; }
  }
  if (worstRatio >= c.WCAG_AA_MIN) return null;
  return {
    defect: "caption contrast below WCAG AA",
    evidence: `${textHex} on ${worstHex} = ${worstRatio.toFixed(2)}:1 (< ${c.WCAG_AA_MIN}:1)`,
    owner: "video",
    fix: "darken the caption scrim or brighten caption text to reach >= 4.5:1",
    principle: "captions must clear WCAG AA contrast to read in-feed",
    blocker: false,
  };
}
