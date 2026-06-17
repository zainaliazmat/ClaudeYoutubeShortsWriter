#!/usr/bin/env node
// qa-probe.mjs <output/F-NNN-slug> [--file final.mp4] — deterministic pixel +
// loudness QA on a rendered Short. Implements the programmatically-decidable subset
// of the render-qa skill (frame count, loop seam, brightness/black, loudness, VO
// presence/ducking), computes a score + a Cat-9 proxy, and ATTRIBUTES each finding
// to an owner stage (script | voice | video | video(master)) per the merge plan.
//
// Emits JSON to stdout (and returns it from probe()). The richer per-beat visual
// judgment (collisions, mechanic legibility) stays with the render-qa SKILL at the
// human gate; this is the loop's autonomous signal. Reusable as a module.

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import { fileURLToPath } from "node:url";
import {
  captionMatchRatio, assessCaptionLegibility, assessCutCadence, assessCutCorrespondence,
} from "./qa-assess.mjs";

const execFileP = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(__dirname, "..");

// ---- pure judgment layer (scoring, Cat-9 proxy, attribution) lives in qa-assess ----
import {
  assessMetrics, scoreFromFindings, cat9FromLuma, passBar, validateDuckingEnvelope,
} from "./qa-assess.mjs";
export { BAR } from "./qa-assess.mjs";

// measurement-side constants only (the ffmpeg commands need these; every
// judgment threshold now lives in qa-assess.mjs / THRESH — single source).
const BLACK_SEG_MAX_S = 1.5; // a black stretch >= this counts as a long-black
const LUFS_TARGET = -14; // loudnorm measure target
const TP_CEIL = -1.0; // loudnorm measure ceiling

async function ff(args) {
  // ffmpeg writes to stderr; capture both.
  try {
    const { stdout, stderr } = await execFileP("ffmpeg", args, { maxBuffer: 64 * 1024 * 1024 });
    return stdout + stderr;
  } catch (e) {
    return (e.stdout || "") + (e.stderr || "");
  }
}

async function frameCount(file) {
  const { stdout } = await execFileP("ffprobe", [
    "-v", "error", "-count_frames", "-select_streams", "v:0",
    "-show_entries", "stream=nb_read_frames,width,height,r_frame_rate",
    "-of", "default=noprint_wrappers=1", file,
  ]);
  const n = /nb_read_frames=(\d+)/.exec(stdout);
  const w = /width=(\d+)/.exec(stdout);
  const h = /height=(\d+)/.exec(stdout);
  const r = /r_frame_rate=([\d/]+)/.exec(stdout);
  return {
    frames: n ? parseInt(n[1], 10) : -1,
    width: w ? parseInt(w[1], 10) : -1,
    height: h ? parseInt(h[1], 10) : -1,
    fps: r ? r[1] : "?",
  };
}

async function frameYUV(file, frame) {
  const out = await ff([
    "-loglevel", "error", "-i", file,
    "-vf", `select=eq(n\\,${frame}),signalstats,metadata=print:file=-`,
    "-frames:v", "1", "-f", "null", "-",
  ]);
  const y = /YAVG=([\d.]+)/.exec(out);
  const u = /UAVG=([\d.]+)/.exec(out);
  const v = /VAVG=([\d.]+)/.exec(out);
  return {
    y: y ? parseFloat(y[1]) : 0,
    u: u ? parseFloat(u[1]) : 0,
    v: v ? parseFloat(v[1]) : 0,
  };
}

export async function meanLuma(file) {
  const out = await ff([
    "-i", file,
    "-vf", "select='not(mod(n,15))',signalstats,metadata=print:file=-",
    "-an", "-f", "null", "-",
  ]);
  const avg = [...out.matchAll(/YAVG=([\d.]+)/g)].map((m) => parseFloat(m[1]));
  const lo = [...out.matchAll(/YMIN=([\d.]+)/g)].map((m) => parseFloat(m[1]));
  const hi = [...out.matchAll(/YMAX=([\d.]+)/g)].map((m) => parseFloat(m[1]));
  if (avg.length === 0) return { mean: 0, min: 0, range: 0, n: 0 };
  // per-frame spatial luma range (YMAX-YMIN); a lit-but-FLAT frame ~ 0, a frame
  // with bright type on a dark bg ~ 200. Averaged so a lone transition frame
  // doesn't trip it. This is what makes Cat-9 ungameable by brightness alone.
  const ranges = avg.map((_, i) => (hi[i] != null && lo[i] != null ? hi[i] - lo[i] : 0));
  return {
    mean: avg.reduce((s, x) => s + x, 0) / avg.length,
    min: Math.min(...avg),
    range: ranges.reduce((s, x) => s + x, 0) / ranges.length,
    n: avg.length,
  };
}

async function blackSegments(file) {
  const out = await ff([
    "-i", file, "-vf", "blackdetect=d=0.4:pix_th=0.10", "-an", "-f", "null", "-",
  ]);
  return [...out.matchAll(/black_start:([\d.]+) black_end:([\d.]+)/g)].map((m) => ({
    start: parseFloat(m[1]),
    end: parseFloat(m[2]),
    dur: parseFloat(m[2]) - parseFloat(m[1]),
  }));
}

async function loudness(file) {
  const out = await ff([
    "-hide_banner", "-i", file,
    "-af", `loudnorm=I=${LUFS_TARGET}:TP=${TP_CEIL}:LRA=11:print_format=json`,
    "-f", "null", "-",
  ]);
  const s = out.lastIndexOf("{");
  const e = out.lastIndexOf("}");
  if (s === -1 || e === -1) return { I: NaN, TP: NaN, LRA: NaN };
  const j = JSON.parse(out.slice(s, e + 1));
  return { I: parseFloat(j.input_i), TP: parseFloat(j.input_tp), LRA: parseFloat(j.input_lra) };
}

async function meanVolume(file, ss, t) {
  const args = ["-hide_banner"];
  if (ss != null) args.push("-ss", String(ss));
  args.push("-i", file);
  if (t != null) args.push("-t", String(t));
  args.push("-af", "volumedetect", "-f", "null", "-");
  const out = await ff(args);
  const m = /mean_volume:\s*(-?[\d.]+) dB/.exec(out);
  return m ? parseFloat(m[1]) : NaN;
}

// ---- auxiliary (slow-tier) measurement: self-skip when the tool is absent ----

export async function hasBin(bin) {
  try { await execFileP(bin, ["--version"]); return true; } catch { return false; }
}

// (e) scene-cut detection via ffmpeg scdet -> sorted cut timestamps (seconds).
export async function detectCuts(file, threshold = 10) {
  const out = await ff([
    "-i", file, "-vf", `scdet=threshold=${threshold}`, "-an", "-f", "null", "-",
  ]);
  return [...out.matchAll(/lavfi\.scd\.time:\s*([\d.]+)/g)]
    .map((m) => parseFloat(m[1]))
    .filter((t) => Number.isFinite(t))
    .sort((a, b) => a - b);
}

// (e) cadence finding (or null). Pure decision in qa-assess; this just measures.
export async function cutCadenceProbe(file, durationS) {
  const cuts = await detectCuts(file);
  return { cuts, finding: assessCutCadence(cuts, durationS) };
}

// (e2) cut-vs-scene correspondence. Measures detected cuts (seconds), reads the
// declared scene boundaries from scenes.json (order[].from, frames), and asks
// whether they line up. Aux tier (richer render-qa), NOT part of the loop score.
export async function cutCorrespondenceProbe(file, scenesPath, fps = 30) {
  if (!fs.existsSync(scenesPath)) return { cuts: [], boundaries: [], finding: null, skipped: true };
  const scenes = JSON.parse(fs.readFileSync(scenesPath, "utf8"));
  const boundaries = (scenes.order || []).map((s) => s.from).filter(Number.isFinite);
  const cutsS = await detectCuts(file);
  const cutFrames = cutsS.map((t) => Math.round(t * fps));
  return { cuts: cutFrames, boundaries, finding: assessCutCorrespondence(cutFrames, boundaries), skipped: false };
}

// (d) OCR one frame at timeS -> recognized text. Requires tesseract; caller self-skips.
export async function ocrFrameText(file, timeS) {
  const png = path.join(os.tmpdir(), `fathom-ocr-${process.pid}-${Math.round(timeS * 1000)}.png`);
  try {
    await execFileP("ffmpeg", ["-y", "-ss", String(timeS), "-i", file, "-frames:v", "1", png]);
    // tesseract <img> stdout -> text on stdout
    const { stdout } = await execFileP("tesseract", [png, "stdout"]);
    return stdout;
  } finally {
    fs.rmSync(png, { force: true });
  }
}

// (d) caption legibility: sample one frame mid each speech region, OCR it, compare to
// the words that fall in that region. Returns per-region ratios + a finding (or null).
// Self-skips (ratios=[]) when tesseract is absent — keeps the suite green everywhere.
export async function captionLegibilityProbe(file, vo, fps = 30) {
  if (!(await hasBin("tesseract"))) return { ratios: [], finding: null, skipped: true };
  const regions = vo.speech_regions || [];
  const words = vo.words || [];
  const ratios = [];
  for (const r of regions) {
    const midFrame = Math.round((r.start + r.end) / 2);
    const expected = words
      .filter((w) => w.start != null && w.start >= r.start && w.start <= r.end)
      .map((w) => w.display || w.spoken || "");
    if (expected.length === 0) continue;
    const text = await ocrFrameText(file, midFrame / fps);
    ratios.push(captionMatchRatio(text, expected));
  }
  return { ratios, finding: assessCaptionLegibility(ratios), skipped: false };
}

// ---- main ----
export async function probe(runArg, opts = {}) {
  const runDir = path.isAbsolute(runArg) ? runArg : path.join(ROOT, runArg);
  const id = path.basename(runDir);
  const file = path.join(runDir, opts.file || "final.mp4");
  if (!fs.existsSync(file)) throw new Error(`qa-probe: no ${path.basename(file)} in ${id}`);
  const vo = JSON.parse(fs.readFileSync(path.join(runDir, "vo-timing.json"), "utf8"));
  const total = vo.total;
  const fps = vo.fps || 30;

  // ---- measurement (ffmpeg/ffprobe — the impure half) ----
  const fc = await frameCount(file);

  const f0 = await frameYUV(file, 0);
  const fl = await frameYUV(file, total - 1);
  const seamDelta = Math.abs(f0.y - fl.y) + Math.abs(f0.u - fl.u) + Math.abs(f0.v - fl.v);

  const lum = await meanLuma(file);
  const blacks = await blackSegments(file);
  const longBlack = blacks.filter((b) => b.dur >= BLACK_SEG_MAX_S);
  const blackLabel = longBlack.map((b) => `${b.start.toFixed(1)}-${b.end.toFixed(1)}s`).join(",");

  const ld = await loudness(file);

  // VO presence + (informational) bed levels. NOTE: the bed SWELLS on the silent
  // loop tail by design, so the tail is legitimately louder than the ducked-speech
  // mix — we do NOT gate speech<=tail. Ducking is verified via the authored
  // envelope contract (validateDuckingEnvelope), not the inseparable final mix.
  const trackMean = await meanVolume(file);
  let speechMean = NaN, tailMean = NaN;
  const region = (vo.speech_regions || [])[0];
  if (region) {
    speechMean = await meanVolume(file, region.start / fps, Math.max(1, (region.end - region.start) / fps / 2));
    const tailStart = (vo.speech_regions[vo.speech_regions.length - 1].end + 2) / fps;
    if (tailStart < total / fps) tailMean = await meanVolume(file, tailStart, 1);
  }

  // ---- judgment (pure — qa-assess.mjs) ----
  const duckingEnvelopeOk = validateDuckingEnvelope(vo);
  const findings = assessMetrics({
    frames: fc.frames, total,
    width: fc.width, height: fc.height,
    seamDelta,
    lumaMean: lum.mean, lumaRange: lum.range,
    longBlackCount: longBlack.length, blackLabel,
    I: ld.I, TP: ld.TP, LRA: ld.LRA,
    trackMean,
    duckingEnvelopeOk,
  });
  const blockers = findings.filter((f) => f.blocker);
  const warnings = findings.filter((f) => !f.blocker);
  const cat9 = cat9FromLuma(lum.mean);
  const score = scoreFromFindings(findings);
  const pass = passBar({ blockerCount: blockers.length, score, cat9 });

  return {
    id, file: path.basename(file), pass, score, cat9,
    metrics: {
      frames: fc.frames, expected: total, dims: `${fc.width}x${fc.height}`,
      lumaMean: +lum.mean.toFixed(1), lumaMin: +lum.min.toFixed(1), lumaRange: +lum.range.toFixed(1),
      seamDelta: +seamDelta.toFixed(1), blackSegs: blacks.length, longBlack: longBlack.length,
      I: ld.I, TP: ld.TP, LRA: ld.LRA,
      trackMean, speechMean, tailMean, duckingEnvelopeOk,
    },
    blockers, warnings,
    findings,
  };
}

// ---- CLI ----
const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const args = process.argv.slice(2);
  const runArg = args.find((a) => !a.startsWith("--"));
  const fIdx = args.indexOf("--file");
  if (!runArg) {
    process.stderr.write("usage: qa-probe.mjs <output/F-NNN-slug> [--file final.mp4]\n");
    process.exit(2);
  }
  probe(runArg, { file: fIdx !== -1 ? args[fIdx + 1] : "final.mp4" })
    .then((r) => {
      process.stdout.write(JSON.stringify(r, null, 2) + "\n");
      process.exit(r.pass ? 0 : 1);
    })
    .catch((e) => {
      process.stderr.write(`qa-probe error: ${e.message}\n`);
      process.exit(2);
    });
}
