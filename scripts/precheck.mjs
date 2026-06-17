#!/usr/bin/env node
// precheck.mjs <output/F-NNN-slug> — first-class PRE-RENDER gate. Cheap, deterministic
// checks that catch defects before spending a full render (this is what makes the
// max-3 loop affordable): scene-range tiling, asset existence, duration-source
// (calculateMetadata, no DURATION const), and a near-black background estimate.
// Each finding carries an owner stage. Exits 0 if clean, 1 if any blocker.

import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { validateTiling } from "../render/src/lib/tiling.ts";
import { gradientLuma } from "../render/src/lib/safeArea.ts";
import { checkSchemaVersion } from "./schema.mjs";
import { BG_STOP_LUMA_MIN } from "./quality-floors.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(__dirname, "..");
// gradient-stop avg below this is clearly near-black (F-001's legit 31.6 passes;
// depth layers lift the render). Single source: scripts/quality-floors.mjs.
const NEAR_BLACK_LUMA = BG_STOP_LUMA_MIN;

export function precheck(runArg) {
  const runDir = path.isAbsolute(runArg) ? runArg : path.join(ROOT, runArg);
  const id = path.basename(runDir);
  const short = (id.match(/^F-\d{3}/) || [])[0];
  const findings = [];
  const add = (check, ok, owner, detail, fix) =>
    findings.push({ check, ok, owner, detail, fix });

  if (!short) {
    add("id", false, "human", `run id "${id}" not F-NNN-…`, "use a valid run folder");
    return { ok: false, findings };
  }
  const srcDir = path.join(ROOT, "render", "src", short);
  const dataPath = path.join(srcDir, "data.ts");
  const scenesPath = path.join(srcDir, "scenes.json");
  const voPath = path.join(runDir, "vo-timing.json");

  // --- scene code present ---
  if (!fs.existsSync(srcDir) || !fs.existsSync(dataPath)) {
    add("codegen", false, "video", `no render/src/${short}/data.ts`, "run remotion-codegen (step 5.5)");
    return { ok: false, findings };
  }
  const dataTxt = fs.readFileSync(dataPath, "utf8");

  // --- tiling over scene ranges ---
  if (fs.existsSync(scenesPath) && fs.existsSync(voPath)) {
    const vo = JSON.parse(fs.readFileSync(voPath, "utf8"));
    const scenesObj = JSON.parse(fs.readFileSync(scenesPath, "utf8"));

    // schemaVersion gate (audit #8): fail here with a clear "speaks vN" message
    // instead of deep in the render / frame map. vo-timing is voice-owned (tts), the
    // scene contract is video-owned (codegen).
    const voSchema = checkSchemaVersion("vo-timing.json", vo.schemaVersion);
    add("vo-timing-schema", voSchema.ok, "voice", voSchema.message, "re-run tts-voiceover to emit schemaVersion");
    const scSchema = checkSchemaVersion("scenes.json", scenesObj.schemaVersion);
    add("scenes-schema", scSchema.ok, "video", scSchema.message, "re-run remotion-codegen to emit schemaVersion");

    const order = scenesObj.order || [];
    const sorted = [...order].sort((a, b) => a.from - b.from);
    const ranges = sorted.map((s, i) => ({
      from: s.from,
      duration: (i + 1 < sorted.length ? sorted[i + 1].from : vo.total) - s.from,
    }));
    const t = validateTiling(ranges, vo.total);
    add("tiling", t.ok, "video", t.ok ? `${ranges.length} scenes tile [0,${vo.total}]` : t.errors.join("; "),
      "fix scene boundaries in scenes.json");
  } else {
    add("tiling", false, "video", "missing scenes.json or vo-timing.json", "codegen must emit scenes.json");
  }

  // --- duration source: no hardcoded DURATION const ---
  const durConst = /\b(const|let|var)\s+DURATION\b|\bDURATION\s*[:=]\s*\d/.test(dataTxt);
  add("duration-source", !durConst, "video",
    durConst ? "found a DURATION const — must derive from calculateMetadata(vo.total)" : "duration via calculateMetadata",
    "remove DURATION const; calculateMetadata reads vo-timing.json total");

  // --- near-black background estimate (cheap; render-qa is the pixel backstop) ---
  const top = /bgTop:\s*"(#[0-9a-fA-F]{6})"/.exec(dataTxt);
  const bot = /bgBottom:\s*"(#[0-9a-fA-F]{6})"/.exec(dataTxt);
  if (top && bot) {
    const avg = gradientLuma([top[1], bot[1]]);
    add("bg-not-near-black", avg >= NEAR_BLACK_LUMA, "video",
      `gradient stop avg luma ${avg.toFixed(1)} (floor ${NEAR_BLACK_LUMA})`,
      "restore the depth gradient from the spec palette (05-remotion-prompt.md)");
  } else {
    add("bg-not-near-black", false, "video", "could not find COLORS.bgTop/bgBottom in data.ts", "use lib Background with gradient tokens");
  }

  // --- asset existence (manifest) ---
  const mPath = path.join(runDir, "assets.json");
  if (fs.existsSync(mPath)) {
    const m = JSON.parse(fs.readFileSync(mPath, "utf8"));
    const missing = [];
    if (m.vo && !fs.existsSync(path.join(runDir, m.vo))) missing.push(m.vo);
    for (const a of m.assets || [])
      if (!fs.existsSync(path.join(runDir, "assets", a.file))) missing.push(a.file);
    add("assets", missing.length === 0, "human",
      missing.length ? `missing: ${missing.join(", ")}` : `${(m.assets || []).length} binaries + vo present`,
      "download the missing music/SFX (see 04-audio.md URLs)");
  } else {
    add("assets", false, "human", "no assets.json", "codegen must emit output/F-NNN/assets.json");
  }

  const ok = findings.every((f) => f.ok);
  return { ok, findings };
}

// ---- CLI ----
const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const runArg = process.argv[2];
  if (!runArg) {
    process.stderr.write("usage: precheck.mjs <output/F-NNN-slug>\n");
    process.exit(2);
  }
  const r = precheck(runArg);
  for (const f of r.findings)
    process.stdout.write(`  ${f.ok ? "ok  " : "FAIL"} ${f.check} [${f.owner}] — ${f.detail}\n`);
  process.stdout.write(r.ok ? "precheck: PASS\n" : "precheck: FAIL\n");
  process.exit(r.ok ? 0 : 1);
}
