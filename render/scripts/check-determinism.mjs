#!/usr/bin/env node
// Determinism Layer 2 — render-hash check (ENG-2, ENG-3).
//
// Renders frames 0 / mid / last of an ISOLATED chart composition TWICE and
// asserts the PNGs are byte-identical (SHA-256) — the literal byte-reproducibility
// proof the program demanded. Two deliberate choices keep it stable, not flaky:
//   - ISOLATED chart composition (no caption TEXT, no gradient) — text rasterizes
//     non-deterministically across Chromium runs; pure chart geometry does not.
//   - software GL (gl:"swiftshader") so there is no GPU-driver variance.
// Lives in the render-run PRECHECK (not the fast codegen gate): it needs a bundle
// and real renders. Default composition: dataviz-fixture. Pass a composition id to
// check another isolated chart composition.
//
// Usage:  node scripts/check-determinism.mjs [composition-id]

import { bundle } from "@remotion/bundler";
import { getCompositions, renderStill } from "@remotion/renderer";
import { createHash } from "node:crypto";
import { readFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const COMP_ID = process.argv[2] || "dataviz-fixture";
const ENTRY = new URL("../src/index.ts", import.meta.url).pathname;
const CHROMIUM = { gl: "swiftshader" };

function sha256(file) {
  return createHash("sha256").update(readFileSync(file)).digest("hex");
}

const tmp = mkdtempSync(join(tmpdir(), "d3-determinism-"));
try {
  console.log(`[check-determinism] bundling ${ENTRY} ...`);
  const serveUrl = await bundle({ entryPoint: ENTRY });
  const comps = await getCompositions(serveUrl);
  const comp = comps.find((c) => c.id === COMP_ID);
  if (!comp) {
    console.error(`[check-determinism] composition "${COMP_ID}" not found (have: ${comps.map((c) => c.id).join(", ")})`);
    process.exit(2);
  }
  const last = comp.durationInFrames - 1;
  const frames = [...new Set([0, Math.floor(last / 2), last])];

  let allOk = true;
  for (const frame of frames) {
    const a = join(tmp, `f${frame}-a.png`);
    const b = join(tmp, `f${frame}-b.png`);
    await renderStill({ composition: comp, serveUrl, output: a, frame, chromiumOptions: CHROMIUM, scale: 1 });
    await renderStill({ composition: comp, serveUrl, output: b, frame, chromiumOptions: CHROMIUM, scale: 1 });
    const ha = sha256(a);
    const hb = sha256(b);
    const ok = ha === hb;
    allOk = allOk && ok;
    console.log(`  frame ${frame}: ${ok ? "OK " : "MISMATCH"}  ${ha.slice(0, 16)} ${ok ? "==" : "!="} ${hb.slice(0, 16)}`);
  }

  if (!allOk) {
    console.error(`\n[check-determinism] ${COMP_ID}: NOT byte-reproducible — a frame differed across two renders.`);
    process.exit(1);
  }
  console.log(`\n[check-determinism] OK — ${COMP_ID} is byte-reproducible across ${frames.length} frames (0/mid/last).`);
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
