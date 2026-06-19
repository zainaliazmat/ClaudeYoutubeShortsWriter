// render/scripts/check-lottie-render.mjs
// Quality check for the Lottie accent fixture: renders SUSTAIN-window frames (ramp
// excluded so a fade-in/out isn't flagged), crops to the accent's safe-area box, and
// asserts the region is not uniformly background — spatial luma range (YMAX-YMIN) above
// a floor. Reuses the qa-probe ffmpeg signalstats mechanism (no JS PNG decoder).
// Run via: node --experimental-strip-types scripts/check-lottie-render.mjs
import { bundle } from "@remotion/bundler";
import { getCompositions, renderStill } from "@remotion/renderer";
import { execFile } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
// Import the SAME placement math the component uses, so the crop box tracks safeArea.ts.
import { accentBoxStyle } from "../src/lib/lottie/lottie-helpers.ts";

const execFileP = promisify(execFile);
const COMP_ID = "lottie-fixture";
const ENTRY = new URL("../src/index.ts", import.meta.url).pathname;
const CHROMIUM = { gl: "swiftshader" };
const RANGE_FLOOR = 40; // YMAX-YMIN over the accent box; a blank/flat box ~ 0.
// Accent box = exactly what the fixture renders (placement {anchor:"center", sizePx:320}).
const s = accentBoxStyle({ anchor: "center", sizePx: 320 });
const BOX = { w: s.width, h: s.height, x: s.left, y: s.top };

// Reuse qa-probe's mechanism: ffmpeg writes signalstats metadata across BOTH stdout
// and stderr — concatenate both (and on error too), then regex the values out.
async function ff(args) {
  try {
    const { stdout, stderr } = await execFileP("ffmpeg", args, { maxBuffer: 64 * 1024 * 1024 });
    return stdout + stderr;
  } catch (e) {
    return (e.stdout || "") + (e.stderr || "");
  }
}

async function rangeOverBox(png) {
  const out = await ff([
    "-loglevel", "error", "-i", png,
    "-vf", `crop=${BOX.w}:${BOX.h}:${BOX.x}:${BOX.y},signalstats,metadata=print:file=-`,
    "-frames:v", "1", "-f", "null", "-",
  ]);
  const ymin = Number((out.match(/YMIN=(\d+(?:\.\d+)?)/) || [])[1]);
  const ymax = Number((out.match(/YMAX=(\d+(?:\.\d+)?)/) || [])[1]);
  return Number.isFinite(ymax) && Number.isFinite(ymin) ? ymax - ymin : 0;
}

const tmp = mkdtempSync(join(tmpdir(), "lottie-render-"));
try {
  const serveUrl = await bundle({ entryPoint: ENTRY });
  const comp = (await getCompositions(serveUrl)).find((c) => c.id === COMP_ID);
  if (!comp) {
    console.error(`[check-lottie-render] composition "${COMP_ID}" not found`);
    process.exit(2);
  }
  const dur = comp.durationInFrames; // 30
  // Sustain window: drop the first/last ~20% (entrance/exit ramp).
  const lo = Math.ceil(dur * 0.2);
  const hi = Math.floor(dur * 0.8);
  const frames = [...new Set([lo, Math.floor((lo + hi) / 2), hi])];

  let allOk = true;
  for (const frame of frames) {
    const out = join(tmp, `f${frame}.png`);
    await renderStill({ composition: comp, serveUrl, output: out, frame, chromiumOptions: CHROMIUM, scale: 1 });
    const range = await rangeOverBox(out);
    const ok = range >= RANGE_FLOOR;
    allOk = allOk && ok;
    console.log(`  frame ${frame}: range=${range.toFixed(0)} ${ok ? "OK" : `< ${RANGE_FLOOR} BLANK`}`);
  }
  if (!allOk) {
    console.error(`\n[check-lottie-render] ${COMP_ID}: accent box is blank/flat in the sustain window.`);
    process.exit(1);
  }
  console.log(`\n[check-lottie-render] OK — accent visible (range >= ${RANGE_FLOOR}) across the sustain window.`);
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
