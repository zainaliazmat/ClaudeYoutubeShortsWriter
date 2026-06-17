import { test, before, after } from "node:test";
import assert from "node:assert";
import { execFileSync } from "node:child_process";
import os from "node:os";
import path from "node:path";
import fs from "node:fs";
import { meanLuma } from "../qa-probe.mjs";
import { assessMetrics, THRESH } from "../qa-assess.mjs";

// This test runs REAL ffmpeg on generated clips to prove the per-frame luma RANGE
// measurement (the thing that de-games Cat-9). It self-skips where ffmpeg is absent
// (fast CI tier) so the suite stays green everywhere.
let hasFfmpeg = true;
try { execFileSync("ffmpeg", ["-version"], { stdio: "ignore" }); } catch { hasFfmpeg = false; }

let dir;
const flat = () => path.join(dir, "flat.mp4");
const textured = () => path.join(dir, "textured.mp4");

before(() => {
  if (!hasFfmpeg) return;
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "fathom-fx-"));
  // a uniformly lit, FLAT frame: bright but zero spatial contrast (the bright void)
  execFileSync("ffmpeg", ["-y", "-f", "lavfi", "-i", "color=c=gray:s=320x568:d=1:r=30",
    "-pix_fmt", "yuv420p", flat()], { stdio: "ignore" });
  // a textured frame: lots of edges/contrast (stand-in for hero type on a dark bg)
  execFileSync("ffmpeg", ["-y", "-f", "lavfi", "-i", "testsrc2=s=320x568:d=1:r=30",
    "-pix_fmt", "yuv420p", textured()], { stdio: "ignore" });
});
after(() => { if (dir) fs.rmSync(dir, { recursive: true, force: true }); });

test("meanLuma: a flat bright clip reads high mean but ~zero range", { skip: !hasFfmpeg }, async () => {
  const m = await meanLuma(flat());
  assert.ok(m.mean > 100, `expected bright mean, got ${m.mean}`);
  assert.ok(m.range < 5, `expected ~flat range, got ${m.range}`);
});

test("meanLuma: a textured clip reads a wide luma range", { skip: !hasFfmpeg }, async () => {
  const m = await meanLuma(textured());
  assert.ok(m.range > THRESH.FLAT_RANGE_MIN, `expected wide range, got ${m.range}`);
});

test("FIX: the flat bright clip's measured metrics trip the flat-frame blocker; textured does not", { skip: !hasFfmpeg }, async () => {
  const base = { frames: 30, total: 30, width: 320, height: 568, seamDelta: 0,
    longBlackCount: 0, I: -14, TP: -1.3, LRA: 8, trackMean: -18, duckingEnvelopeOk: true };

  const fm = await meanLuma(flat());
  const flatFindings = assessMetrics({ ...base, lumaMean: fm.mean, lumaRange: fm.range });
  assert.ok(flatFindings.some((f) => /flat|contrast/.test(f.defect) && f.blocker),
    "real flat clip should produce a flat/low-contrast blocker");

  const tm = await meanLuma(textured());
  const texFindings = assessMetrics({ ...base, lumaMean: tm.mean, lumaRange: tm.range });
  assert.ok(!texFindings.some((f) => /flat|contrast/.test(f.defect)),
    "real textured clip should NOT be flagged flat");
});
