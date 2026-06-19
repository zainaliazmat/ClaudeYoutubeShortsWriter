#!/usr/bin/env node
// Determinism guard for the Lottie accent layer: every committed accent .json must
// be baked at the channel canonical 30fps. getLottieMetadata reads only the TOP-LEVEL
// fr, so a wrong-fr accent would seek mis-scaled under goToAndStop(). (Nested-precomp
// differing-fr is screened manually in asset-sourcing route A — Lottie exports carry
// a single top-level fr, so this scan covers committed/generated accents.)
//
// TOLERANCE NOTE (intentional difference vs the runtime guard): this static guard is
// STRICT (fr must be exactly 30) because it only scans GENERATED/COMMITTED accents,
// which lottie_gen.py always emits as integer fr:30. The runtime assertAccentFps()
// ROUNDS (Math.round) so a route-A SOURCED file at 29.97 still renders. A sourced
// 29.97 file would pass runtime but fail this static scan — that is desired: sourced
// accents are not committed under src/lib/lottie/, and any that are must be re-baked
// to exactly 30.
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const SCAN = join(ROOT, "src", "lib", "lottie");
const CANONICAL_FPS = 30;

function walk(dir) {
  let out = [];
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "node_modules") continue;
      out = out.concat(walk(p));
    } else if (e.name.endsWith(".json")) {
      out.push(p);
    }
  }
  return out;
}

const files = walk(SCAN);
const violations = [];
for (const f of files) {
  let doc;
  try {
    doc = JSON.parse(readFileSync(f, "utf8"));
  } catch (err) {
    violations.push({ file: relative(ROOT, f), why: `not valid JSON: ${err.message}` });
    continue;
  }
  if (doc.fr !== CANONICAL_FPS) {
    violations.push({ file: relative(ROOT, f), why: `fr is ${doc.fr}, must be ${CANONICAL_FPS}` });
  }
}

if (violations.length > 0) {
  console.error(`\n[check-lottie-fps] ${violations.length} accent(s) not at ${CANONICAL_FPS}fps:\n`);
  for (const v of violations) console.error(`  ${v.file}: ${v.why}`);
  process.exit(1);
}
console.log(`[check-lottie-fps] OK — ${files.length} accent .json at ${CANONICAL_FPS}fps.`);
