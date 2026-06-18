#!/usr/bin/env node
// check-tiling.mjs <F-NNN[-slug]> — pre-render gate: the scene boundaries in
// render/src/F-NNN/scenes.json must tile [0, total] (total = vo-timing.json `total`),
// 0-indexed, half-open, contiguous. Mirrors the tts framemap validator on the render
// side. Reads pure JSON via fs (no Remotion-coupled import). Exits 0 pass / 1 fail.
//   node --experimental-strip-types scripts/check-tiling.mjs F-NNN

import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { validateTiling } from "../src/lib/tiling.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RENDER = path.resolve(__dirname, "..");

const id = process.argv[2];
if (!id || !/^F-\d{3}(-[a-z0-9-]+)?$/.test(id)) {
  process.stderr.write(`usage: check-tiling.mjs <F-NNN[-slug]> (got ${id})\n`);
  process.exit(2);
}
const short = id.match(/^F-\d{3}/)[0];
const dir = path.join(RENDER, "src", short);
const scenesPath = path.join(dir, "scenes.json");
const voPath = path.join(dir, "vo-timing.json");
for (const p of [scenesPath, voPath]) {
  if (!fs.existsSync(p)) {
    process.stderr.write(`check-tiling: missing ${path.relative(RENDER, p)}\n`);
    process.exit(1);
  }
}

const vo = JSON.parse(fs.readFileSync(voPath, "utf8"));
const order = JSON.parse(fs.readFileSync(scenesPath, "utf8")).order;
if (!Array.isArray(order) || order.length === 0) {
  process.stderr.write("check-tiling: scenes.json must have a non-empty `order` array\n");
  process.exit(1);
}

// Validate the RAW authored (from, duration) from scenes.json — NOT durations re-derived
// from consecutive `from`s. Re-deriving is contiguous by construction and would hide an
// overrun (a scene whose authored duration pushes it past the next scene / the tail, like
// F-002's old Beat6 = `TOTAL - from`). Raw durations let validateTiling actually catch it.
const sorted = [...order].sort((a, b) => a.from - b.from);
const ranges = sorted.map((s) => ({ from: s.from, duration: s.duration }));

const r = validateTiling(ranges, vo.total);
if (!r.ok) {
  process.stderr.write(`check-tiling FAIL (${short}, total=${vo.total}):\n`);
  for (const e of r.errors) process.stderr.write(`  - ${e}\n`);
  process.exit(1);
}
process.stdout.write(`check-tiling OK: ${ranges.length} scenes tile [0, ${vo.total}]\n`);
