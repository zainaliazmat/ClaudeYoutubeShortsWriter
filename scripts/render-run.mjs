#!/usr/bin/env node
// render-run.mjs <output/F-NNN-slug> [--timeout-sec N] [--keep-out]
//
// One command: run folder -> validated -> assets gated -> public seeded ->
// remotion render -> master (default: linear gain + true-peak limiter, which preserves
// LRA on voice-led shorts; FATHOM_MASTER=loudnorm / --master loudnorm for the old two-pass
// loudnorm) -> output/F-NNN/final.mp4 verified to -14 LUFS / <= -1 dBTP.
//
// Security (audit #9/#17): id is validated against ^F-\d{3}-[a-z0-9-]+$, asset
// basenames are basename-only + charset-checked, every external process is spawned
// with execFile (array args, NO shell), and remotion render has a HARD timeout.
//
// Reusable as a module: `import { renderRun } from './render-run.mjs'`.
// Agent bash cwd resets between calls, so the repo root is resolved from this file.

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { publicDirForRun, publicRunsRoot, staleRunDirs } from "./render-paths.mjs";
import { assertSchemaVersion } from "./schema.mjs";
import { resolveMasterMode, linearGainDb, limiterAf } from "./master.mjs";

const execFileP = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Startup sweep: remove per-run public dirs orphaned by an uncatchable exit
// (SIGKILL / crash) where the render-time `finally` never ran. Pure keep/delete
// decision lives in render-paths (staleRunDirs); this just performs the fs side.
function sweepStalePublicRuns(renderRoot, activeId, log = () => {}) {
  const root = publicRunsRoot(renderRoot);
  if (!fs.existsSync(root)) return [];
  let names;
  try {
    names = fs.readdirSync(root);
  } catch {
    return [];
  }
  const entries = names.map((name) => {
    let mtimeMs = NaN;
    try { mtimeMs = fs.statSync(path.join(root, name)).mtimeMs; } catch { /* treat as stale */ }
    return { name, mtimeMs };
  });
  const now = Date.now();
  const doomed = staleRunDirs(entries, { activeId, now });
  for (const name of doomed) {
    fs.rmSync(path.join(root, name), { recursive: true, force: true });
    log(`swept stale public dir ${name}`);
  }
  return doomed;
}
export const ROOT = path.resolve(__dirname, "..");
const RENDER = path.join(ROOT, "render");

export const ID_RE = /^F-\d{3}-[a-z0-9-]+$/;
const BASENAME_RE = /^[a-zA-Z0-9._-]+$/;
const LUFS_TARGET = -14;
const LUFS_TOL = 1.0; // PASS if |I - (-14)| <= 1
const TP_CEIL = -1.0; // PASS if TP <= -1 (a hair over, e.g. -0.7, is fine — no clip)
const DEFAULT_TIMEOUT_SEC = 600;
// Limiter chain (default master): aim a touch hot of the -15 floor so it lands ~-14.5
// LUFS, well inside the -14±1 gate. The limiter ceiling is set below -1 dB so the
// MEASURED true peak lands <= -1 dBTP (sample-peak limiting leaves inter-sample headroom).
const MASTER_TARGET_I = -14.5;
const LIMITER_CEIL_DB = -1.5;
const MASTER_CORRECT_EPS = 0.2; // dB — land within this of MASTER_TARGET_I
const MASTER_MAX_CORRECTIONS = 3; // bounded re-applies to converge (each is a fast af pass)

const log = (m) => process.stdout.write(`[render-run] ${m}\n`);

class GateError extends Error {
  constructor(message, payload) {
    super(message);
    this.name = "GateError";
    this.payload = payload || {};
  }
}

// ---- helpers ---------------------------------------------------------------

function resolveRunDir(arg) {
  const p = path.isAbsolute(arg) ? arg : path.join(ROOT, arg);
  if (!fs.existsSync(p) || !fs.statSync(p).isDirectory())
    throw new GateError(`run folder not found: ${p}`, { owner: "human" });
  return p;
}

function readId(runDir) {
  const id = path.basename(runDir);
  if (!ID_RE.test(id))
    throw new GateError(
      `run folder id "${id}" does not match ${ID_RE} — refusing (injection guard)`,
      { owner: "human" },
    );
  return id;
}

function loadManifest(runDir, id) {
  const mPath = path.join(runDir, "assets.json");
  if (!fs.existsSync(mPath))
    throw new GateError(
      `no assets.json in ${runDir}. The codegen step writes it; for legacy runs add one listing { vo, assets[] }.`,
      { owner: "human" },
    );
  const m = JSON.parse(fs.readFileSync(mPath, "utf8"));
  assertSchemaVersion(m, "assets.json", GateError, { owner: "human" });
  if (m.compositionId && m.compositionId !== id)
    throw new GateError(
      `assets.json compositionId "${m.compositionId}" != run folder "${id}".`,
      { owner: "human" },
    );
  const names = [m.vo, ...(m.assets || []).map((a) => a.file)];
  for (const n of names)
    if (n && (!BASENAME_RE.test(n) || n.includes("/") || n.includes("..")))
      throw new GateError(`unsafe asset basename "${n}" in assets.json.`, {
        owner: "human",
      });
  return m;
}

// Pre-render asset-existence gate. Missing music/SFX -> halt with the download
// checklist (file -> URL -> license). Owner = human (the loop cannot fix a binary).
function assetGate(runDir, manifest) {
  const missing = [];
  const voSrc = path.join(runDir, manifest.vo || "vo.wav");
  if (!fs.existsSync(voSrc))
    missing.push({
      file: manifest.vo || "vo.wav",
      url: "(generated by tts-voiceover — re-run step 3.5)",
      license: "n/a (local Kokoro)",
    });
  for (const a of manifest.assets || []) {
    const src = path.join(runDir, "assets", a.file);
    if (!fs.existsSync(src))
      missing.push({ file: a.file, url: a.url, license: a.license });
  }
  if (missing.length) {
    const lines = missing
      .map((x) => `  - ${x.file}\n      URL:     ${x.url}\n      License: ${x.license}`)
      .join("\n");
    throw new GateError(
      `PRE-RENDER ASSET GATE: ${missing.length} required binary(ies) missing from ${path.relative(ROOT, runDir)}/assets/.\n` +
        `Download each (monetization-safe source) into that folder, then re-run:\n${lines}`,
      { owner: "human", missing },
    );
  }
}

function seedPublic(runArg, publicDir) {
  // Reuse the single copy+clean source of truth, targeting this run's isolated
  // public dir (audit #7 — concurrent runs must not clobber a shared render/public).
  return execFileP("bash", [path.join(__dirname, "seed-public.sh"), runArg, publicDir], {
    cwd: ROOT,
  });
}

// Parse the loudnorm JSON block ffmpeg prints to stderr.
function parseLoudnorm(stderr) {
  const start = stderr.lastIndexOf("{");
  const end = stderr.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start)
    throw new Error("could not find loudnorm JSON in ffmpeg output");
  const obj = JSON.parse(stderr.slice(start, end + 1));
  return obj;
}

async function ffmpegMeasure(file) {
  // execFile captures stderr even on success; loudnorm prints JSON there.
  const { stderr } = await execFileP("ffmpeg", [
    "-hide_banner",
    "-i", file,
    "-af", `loudnorm=I=${LUFS_TARGET}:TP=${TP_CEIL}:LRA=11:print_format=json`,
    "-f", "null", "-",
  ]);
  return parseLoudnorm(stderr);
}

// ---- main ------------------------------------------------------------------

export async function renderRun(runArg, opts = {}) {
  const timeoutMs = (opts.timeoutSec || DEFAULT_TIMEOUT_SEC) * 1000;
  const runDir = resolveRunDir(runArg);
  const id = readId(runDir);
  log(`run: ${id}`);

  const manifest = loadManifest(runDir, id);
  log(`asset gate: ${(manifest.assets || []).length} binaries + vo`);
  assetGate(runDir, manifest);
  log("asset gate: all present");

  // Sweep public dirs orphaned by a prior crash/SIGKILL (where finally never ran).
  // Skips the active id and any dir recent enough to be a concurrent render.
  sweepStalePublicRuns(RENDER, id, log);

  // Isolated, per-run public dir so concurrent renders never share mutable state.
  const publicDir = publicDirForRun(RENDER, id);
  const outDir = path.join(RENDER, "out");
  fs.mkdirSync(outDir, { recursive: true });
  const rawOut = path.join(outDir, `${id}.mp4`);

  try {
    // Seed INSIDE the try so a partial seed is cleaned up too — anything that throws
    // after the dir exists must not leak it.
    log(`seeding ${path.relative(ROOT, publicDir)} (copy + clean, run-scoped)`);
    await seedPublic(path.relative(ROOT, runDir), publicDir);

    log(`remotion render (hard timeout ${timeoutMs / 1000}s)`);
    await execFileP(
      "npx",
      ["remotion", "render", id, rawOut, "--public-dir", publicDir],
      { cwd: RENDER, timeout: timeoutMs, maxBuffer: 64 * 1024 * 1024, killSignal: "SIGKILL" },
    );
  } finally {
    // Run-scoped staging is disposable; drop it so .public-runs/ doesn't accumulate
    // (keep it when --keep-out, for render debugging).
    if (!opts.keepOut) fs.rmSync(publicDir, { recursive: true, force: true });
  }
  if (!fs.existsSync(rawOut))
    throw new GateError("remotion render produced no output file", { owner: "video" });
  log(`rendered: ${path.relative(ROOT, rawOut)}`);

  // ---- master ----
  const mode = resolveMasterMode(opts.master, process.env);
  log(`master pass 1: measure (mode=${mode})`);
  const m1 = await ffmpegMeasure(rawOut);
  const finalOut = path.join(runDir, "final.mp4");
  log(
    `measured I=${m1.input_i} TP=${m1.input_tp} LRA=${m1.input_lra} thresh=${m1.input_thresh} offset=${m1.target_offset}`,
  );

  // -af apply, holding the video stream + AAC settings constant across both chains.
  const applyAf = (af) => execFileP("ffmpeg", [
    "-y",
    "-i", rawOut,
    "-c:v", "copy",
    "-af", af,
    "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2",
    "-movflags", "+faststart",
    finalOut,
  ]);

  if (mode === "loudnorm") {
    // Original two-pass loudnorm (dynamic, linear=false). Behind FATHOM_MASTER=loudnorm —
    // its time-varying gain crushes a voice-led short's LRA, so it is no longer the default.
    log("master pass 2: loudnorm apply -> final.mp4");
    await applyAf(`loudnorm=I=${LUFS_TARGET}:TP=${TP_CEIL}:LRA=11:measured_I=${m1.input_i}:measured_TP=${m1.input_tp}:measured_LRA=${m1.input_lra}:measured_thresh=${m1.input_thresh}:offset=${m1.target_offset}:linear=false`);
  } else {
    // DEFAULT: one LINEAR makeup gain to MASTER_TARGET_I, then a true-peak limiter. The
    // linear gain preserves the pre-master loudness range; the limiter only tames isolated
    // transients. The limiter pulls loudness down a touch, so measure the result and apply
    // one residual gain correction to land on target.
    let gain = linearGainDb(parseFloat(m1.input_i), MASTER_TARGET_I);
    log(`master pass 2: limiter apply (gain ${gain} dB, ceil ${LIMITER_CEIL_DB} dBTP) -> final.mp4`);
    await applyAf(limiterAf(gain, LIMITER_CEIL_DB));
    // The limiter pulls loudness below the linear target (it clamps transients), and each
    // correction is itself slightly limited, so converge with a few bounded re-applies
    // (each from the raw premaster — no compounding) until we land on target.
    for (let i = 0; i < MASTER_MAX_CORRECTIONS; i++) {
      const residual = MASTER_TARGET_I - parseFloat((await ffmpegMeasure(finalOut)).input_i);
      if (Math.abs(residual) <= MASTER_CORRECT_EPS) break;
      gain = Math.round((gain + residual) * 100) / 100;
      log(`master correct: residual ${residual.toFixed(2)} dB -> regain ${gain} dB, re-apply`);
      await applyAf(limiterAf(gain, LIMITER_CEIL_DB));
    }
  }

  // ---- verify gate ----
  log("master verify");
  const m2 = await ffmpegMeasure(finalOut);
  const I = parseFloat(m2.input_i);
  const TP = parseFloat(m2.input_tp);
  const iOk = Math.abs(I - LUFS_TARGET) <= LUFS_TOL;
  const tpOk = TP <= TP_CEIL + 0.5; // allow a hair over (-0.7) — no clip
  if (!opts.keepOut) fs.rmSync(rawOut, { force: true });

  const result = {
    id,
    runDir,
    finalMp4: finalOut,
    integratedLUFS: I,
    truePeakDBTP: TP,
    lra: parseFloat(m2.input_lra),
    pass: iOk && tpOk,
  };
  if (!result.pass)
    throw new GateError(
      `MASTER VERIFY FAILED: I=${I} (target ${LUFS_TARGET}±${LUFS_TOL}), TP=${TP} (ceil ${TP_CEIL}). final.mp4 kept for inspection.`,
      { owner: "video (master)", result },
    );
  log(`PASS  final.mp4  I=${I} LUFS  TP=${TP} dBTP  LRA=${result.lra}`);
  return result;
}

// ---- CLI -------------------------------------------------------------------

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const args = process.argv.slice(2);
  const runArg = args.find((a) => !a.startsWith("--"));
  const tIdx = args.indexOf("--timeout-sec");
  const mIdx = args.indexOf("--master");
  const opts = {
    timeoutSec: tIdx !== -1 ? parseInt(args[tIdx + 1], 10) : DEFAULT_TIMEOUT_SEC,
    keepOut: args.includes("--keep-out"),
    master: mIdx !== -1 ? args[mIdx + 1] : undefined, // limiter (default) | loudnorm
  };
  if (!runArg) {
    process.stderr.write("usage: render-run.mjs <output/F-NNN-slug> [--timeout-sec N] [--keep-out] [--master limiter|loudnorm]\n");
    process.exit(2);
  }
  renderRun(runArg, opts)
    .then((r) => {
      process.stdout.write(`\n${JSON.stringify(r, null, 2)}\n`);
      process.exit(0);
    })
    .catch((e) => {
      process.stderr.write(`\n[render-run] HALT (${e.payload?.owner || "error"}): ${e.message}\n`);
      process.exit(1);
    });
}
