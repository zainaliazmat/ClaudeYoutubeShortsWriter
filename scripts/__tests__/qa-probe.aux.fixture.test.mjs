import { test, before, after } from "node:test";
import assert from "node:assert";
import { execFileSync } from "node:child_process";
import os from "node:os";
import path from "node:path";
import fs from "node:fs";
import { detectCuts, cutCadenceProbe, cutCorrespondenceProbe, captionLegibilityProbe, hasBin } from "../qa-probe.mjs";

let hasFfmpeg = true;
try { execFileSync("ffmpeg", ["-version"], { stdio: "ignore" }); } catch { hasFfmpeg = false; }

let dir;
const cuts = () => path.join(dir, "cuts.mp4");

before(() => {
  if (!hasFfmpeg) return;
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "fathom-aux-"));
  // 6s clip = 2s red, 2s green, 2s blue concatenated -> 2 hard cuts at ~2s and ~4s.
  execFileSync("ffmpeg", ["-y",
    "-f", "lavfi", "-i", "color=c=red:s=320x568:d=2:r=30",
    "-f", "lavfi", "-i", "color=c=green:s=320x568:d=2:r=30",
    "-f", "lavfi", "-i", "color=c=blue:s=320x568:d=2:r=30",
    "-filter_complex", "[0][1][2]concat=n=3:v=1:a=0[v]", "-map", "[v]",
    "-pix_fmt", "yuv420p", cuts()], { stdio: "ignore" });
});
after(() => { if (dir) fs.rmSync(dir, { recursive: true, force: true }); });

test("detectCuts: parses real scdet output into a sorted numeric cut list", { skip: !hasFfmpeg }, async () => {
  const t = await detectCuts(cuts());
  assert.ok(t.length >= 1, `expected >=1 cut, got ${t.length}: ${t}`);
  assert.ok(t.every((x) => Number.isFinite(x)), "all cut times finite");
  assert.deepEqual(t, [...t].sort((a, b) => a - b), "cut times sorted");
});

// Derive the test duration from the MEASURED cut count so the in-band / out-of-band
// assertions hold regardless of scdet's per-color-pair sensitivity.
test("cutCadenceProbe: in-band duration -> no finding; long duration -> 'too slow'", { skip: !hasFfmpeg }, async () => {
  const measured = await detectCuts(cuts());
  const shots = measured.length + 1;
  const inBand = await cutCadenceProbe(cuts(), shots * 3); // 3s/shot, squarely in band
  assert.equal(inBand.finding, null, `3s/shot should be in band (cuts=${measured.length})`);
  const slow = await cutCadenceProbe(cuts(), shots * 20); // 20s/shot
  assert.ok(slow.finding && /slow/.test(slow.finding.defect));
});

test("cutCorrespondenceProbe: real cuts aligned to a matching scenes.json -> no finding", { skip: !hasFfmpeg }, async () => {
  const measuredS = await detectCuts(cuts());
  // build a scenes.json whose interior boundaries are exactly the detected cut frames
  const order = [{ from: 0 }, ...measuredS.map((t) => ({ from: Math.round(t * 30) }))];
  const scenesPath = path.join(dir, "scenes.json");
  fs.writeFileSync(scenesPath, JSON.stringify({ order }));
  const aligned = await cutCorrespondenceProbe(cuts(), scenesPath, 30);
  assert.equal(aligned.finding, null, `cuts matching boundaries should pass (cuts=${aligned.cuts})`);
  // now move a boundary far from any real cut -> a "missing" warning
  const badPath = path.join(dir, "scenes-bad.json");
  fs.writeFileSync(badPath, JSON.stringify({ order: [{ from: 0 }, { from: 999 }] }));
  const bad = await cutCorrespondenceProbe(cuts(), badPath, 30);
  assert.ok(bad.finding && bad.finding.blocker === false, "a boundary at no cut should warn");
});

test("cutCorrespondenceProbe: missing scenes.json self-skips cleanly", async () => {
  const r = await cutCorrespondenceProbe("/whatever.mp4", "/no-such-scenes.json", 30);
  assert.equal(r.skipped, true);
  assert.equal(r.finding, null);
});

test("captionLegibilityProbe: self-skips cleanly when tesseract is absent", async () => {
  const present = await hasBin("tesseract");
  const vo = { speech_regions: [{ start: 0, end: 60 }], words: [{ display: "x", start: 10 }] };
  const r = await captionLegibilityProbe("/nonexistent-if-skipped.mp4", vo, 30);
  if (!present) {
    assert.equal(r.skipped, true);
    assert.deepEqual(r.ratios, []);
    assert.equal(r.finding, null);
  } else {
    assert.equal(typeof r.skipped, "boolean");
  }
});
