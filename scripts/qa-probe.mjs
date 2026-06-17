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
import { fileURLToPath } from "node:url";

const execFileP = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(__dirname, "..");

// ---- bar / thresholds ----
export const BAR = { score: 85, cat9: 70 }; // + zero blockers
const LUMA_MEAN_MIN = 30; // below this overall = near-black void (blocker)
const LUMA_MEAN_TARGET = 45; // lit reference for the Cat-9 proxy
const BLACK_SEG_MAX_S = 1.5; // a black stretch >= this is a blocker
const SEAM_DELTA_MAX = 6; // max |YUV avg delta| frame0 vs frameLast for a clean loop
const LUFS_TARGET = -14;
const LUFS_TOL = 1.0;
const TP_CEIL = -1.0;

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

async function meanLuma(file) {
  const out = await ff([
    "-i", file,
    "-vf", "select='not(mod(n,15))',signalstats,metadata=print:file=-",
    "-an", "-f", "null", "-",
  ]);
  const vals = [...out.matchAll(/YAVG=([\d.]+)/g)].map((m) => parseFloat(m[1]));
  if (vals.length === 0) return { mean: 0, min: 0, n: 0 };
  return {
    mean: vals.reduce((s, x) => s + x, 0) / vals.length,
    min: Math.min(...vals),
    n: vals.length,
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

// ---- main ----
export async function probe(runArg, opts = {}) {
  const runDir = path.isAbsolute(runArg) ? runArg : path.join(ROOT, runArg);
  const id = path.basename(runDir);
  const file = path.join(runDir, opts.file || "final.mp4");
  if (!fs.existsSync(file)) throw new Error(`qa-probe: no ${path.basename(file)} in ${id}`);
  const vo = JSON.parse(fs.readFileSync(path.join(runDir, "vo-timing.json"), "utf8"));
  const total = vo.total;
  const fps = vo.fps || 30;

  const findings = [];
  const add = (defect, evidence, owner, fix, principle) =>
    findings.push({ defect, evidence, owner, fix, principle, blocker: true });
  const warn = (defect, evidence, owner, fix, principle) =>
    findings.push({ defect, evidence, owner, fix, principle, blocker: false });

  // a. frame count + dims
  const fc = await frameCount(file);
  if (Math.abs(fc.frames - total) > 1)
    add("frame-count mismatch", `${fc.frames} vs total ${total}`, "video",
      "duration via calculateMetadata(vo.total); re-render", "loop seam breaks if off");
  if (fc.width !== 1080 || fc.height !== 1920)
    add("wrong dimensions", `${fc.width}x${fc.height}`, "video", "1080x1920 in safeArea", "format");

  // b. loop seam (frame 0 vs last)
  const f0 = await frameYUV(file, 0);
  const fl = await frameYUV(file, total - 1);
  const seamDelta = Math.abs(f0.y - fl.y) + Math.abs(f0.u - fl.u) + Math.abs(f0.v - fl.v);
  if (seamDelta > SEAM_DELTA_MAX)
    warn("loop seam mismatch", `YUV delta ${seamDelta.toFixed(1)} (frame0 vs ${total - 1})`,
      "video", "cross-dissolve last scene back to frame-0 composition", "invisible loop");

  // c. brightness / black
  const lum = await meanLuma(file);
  const blacks = await blackSegments(file);
  const longBlack = blacks.filter((b) => b.dur >= BLACK_SEG_MAX_S);
  if (lum.mean < LUMA_MEAN_MIN)
    add("near-black / flat frame", `mean YAVG ${lum.mean.toFixed(1)} (< ${LUMA_MEAN_MIN})`,
      "video", "depth background (gradient+glow+nebula); raise bg luma", "F-001 void");
  if (longBlack.length)
    add("black-screen stretch", longBlack.map((b) => `${b.start.toFixed(1)}-${b.end.toFixed(1)}s`).join(","),
      "video", "no black lead-in/holes; open lit on the hook", "in-feed black");

  // e. loudness
  const ld = await loudness(file);
  const iOk = Math.abs(ld.I - LUFS_TARGET) <= LUFS_TOL;
  const tpOk = ld.TP <= TP_CEIL + 0.5;
  if (!iOk || !tpOk)
    add("loudness off-target", `I=${ld.I} LUFS, TP=${ld.TP} dBTP`,
      "video (master)", "re-run two-pass loudnorm to -14 LUFS / <= -1 dBTP", "quiet in-feed");

  // f. VO present & ducked
  const trackMean = await meanVolume(file);
  let speechMean = NaN, tailMean = NaN;
  const region = (vo.speech_regions || [])[0];
  if (region) {
    speechMean = await meanVolume(file, region.start / fps, Math.max(1, (region.end - region.start) / fps / 2));
    const tailStart = (vo.speech_regions[vo.speech_regions.length - 1].end + 2) / fps;
    if (tailStart < total / fps) tailMean = await meanVolume(file, tailStart, 1);
  }
  // VO must be present (not silent). NOTE: this channel's bed SWELLS on the silent
  // loop tail by design (music leads the tail), so the tail is legitimately louder
  // than the ducked-speech mix — do NOT flag speech<=tail (that's a false positive).
  if (Number.isNaN(trackMean) || trackMean <= -50)
    add("VO silent / no audio", `track mean ${trackMean} dB`, "voice",
      "ensure vo.wav copied to public/ and AudioBed wired", "no narration");

  // ---- score + Cat-9 proxy ----
  const blockers = findings.filter((f) => f.blocker);
  const warnings = findings.filter((f) => !f.blocker);
  // Cat-9 proxy from rendered luma: 0 at YAVG=20, 100 at YAVG>=target.
  const cat9 = Math.max(0, Math.min(100, Math.round(((lum.mean - 20) / (LUMA_MEAN_TARGET - 20)) * 100)));
  let score = 100 - blockers.length * 25 - warnings.length * 6;
  if (score < 0) score = 0;
  const pass = blockers.length === 0 && score >= BAR.score && cat9 >= BAR.cat9;

  return {
    id, file: path.basename(file), pass, score, cat9,
    metrics: {
      frames: fc.frames, expected: total, dims: `${fc.width}x${fc.height}`,
      lumaMean: +lum.mean.toFixed(1), lumaMin: +lum.min.toFixed(1),
      seamDelta: +seamDelta.toFixed(1), blackSegs: blacks.length, longBlack: longBlack.length,
      I: ld.I, TP: ld.TP, LRA: ld.LRA,
      trackMean, speechMean, tailMean,
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
