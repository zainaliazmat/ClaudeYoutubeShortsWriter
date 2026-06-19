#!/usr/bin/env node
// Determinism Layer 3 — static grep guard (ENG-6).
//
// Fails the gate if lib/dataviz/ or any per-video scene .tsx imports a forbidden
// d3 wall-clock/DOM module, or uses a non-deterministic API. This is the ONLY
// layer that catches a future `npm i d3` reintroducing d3-transition/timer (tsc
// would pass because the types resolve), so it lives in the codegen gate.
//
// Patterns are anchored so they do NOT false-positive on legitimate code:
//   - Math.random( is forbidden; Math.sin/max/PI (motion.ts) are fine.
//   - new Date() (zero-arg wall clock) is forbidden; new Date(2560,0,1) (fixed
//     literal, needed by scaleTime — ENG-4) is allowed.
// Scope: lib/dataviz/ + scene dirs (F-*, cleopatra). NOT lib/motion.ts.

import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const SRC = join(ROOT, "src");

const SCAN_DIRS = [join(SRC, "lib", "dataviz")];
// Scene dirs: any src/F-* and src/cleopatra (the per-video composition code).
for (const e of readdirSync(SRC, { withFileTypes: true })) {
  if (e.isDirectory() && (/^F-/.test(e.name) || e.name === "cleopatra")) {
    SCAN_DIRS.push(join(SRC, e.name));
  }
}

const FORBIDDEN = [
  { re: /\bMath\.random\s*\(/, why: "Math.random() is non-deterministic — use Remotion seeded random()" },
  { re: /\bDate\.now\s*\(/, why: "Date.now() is wall-clock — forbidden" },
  { re: /\bperformance\.now\s*\(/, why: "performance.now() is wall-clock — forbidden" },
  { re: /\brequestAnimationFrame\s*\(/, why: "requestAnimationFrame is wall-clock — forbidden" },
  { re: /new Date\s*\(\s*\)/, why: "new Date() (zero-arg) is wall-clock — use a fixed literal new Date(y,m,d)" },
  { re: /from\s+['"]d3-(transition|timer|selection)['"]/, why: "d3-transition/timer/selection are wall-clock/DOM — not installed, never import" },
];

function walk(dir) {
  let out = [];
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out; // dir may not exist (e.g. no scenes yet)
  }
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "__tests__" || e.name === "node_modules") continue;
      out = out.concat(walk(p));
    } else if (/\.(ts|tsx)$/.test(e.name)) {
      out.push(p);
    }
  }
  return out;
}

// Blank out comments (both /* */ and //) while PRESERVING newlines, so line
// numbers stay accurate and a doc-comment that NAMES a forbidden API (as
// scales.ts does) is not a false hit.
function stripComments(text) {
  let out = text.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "));
  out = out.replace(/\/\/[^\n]*/g, (m) => " ".repeat(m.length));
  return out;
}

const files = SCAN_DIRS.flatMap(walk);
const violations = [];
for (const f of files) {
  const raw = readFileSync(f, "utf8");
  const rawLines = raw.split("\n");
  const codeLines = stripComments(raw).split("\n");
  codeLines.forEach((code, i) => {
    for (const { re, why } of FORBIDDEN) {
      if (re.test(code)) {
        violations.push({ file: relative(ROOT, f), line: i + 1, text: rawLines[i].trim(), why });
      }
    }
  });
}

if (violations.length > 0) {
  console.error(`\n[check-dataviz-static] ${violations.length} determinism violation(s):\n`);
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}  ${v.why}`);
    console.error(`    > ${v.text}`);
  }
  console.error(
    `\nScanned ${files.length} file(s) across: ${SCAN_DIRS.map((d) => relative(ROOT, d)).join(", ")}`,
  );
  process.exit(1);
}

console.log(`[check-dataviz-static] OK — ${files.length} file(s) clean (no forbidden wall-clock/DOM APIs).`);
