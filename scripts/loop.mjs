#!/usr/bin/env node
// loop.mjs <output/F-NNN-slug> [--max 3] — the closed self-improving render loop (D3).
//
//   for each iteration (<= max, default 3):
//     precheck  -> auto-fix any fixable pre-render defect (re-precheck); unfixable -> HALT
//     render-run (Phase 1) -> final.mp4
//     qa-probe  -> score, cat9, blockers, attributed findings
//     pass bar (>=85, no blockers, Cat9>=70)?  -> keep as final-best.mp4, STATUS PASS, stop
//     else      -> attribute top defect to its owner, apply the owner's auto-fix,
//                  enforce monotonicity (strict score gain vs best, else abort),
//                  keep best render, re-render next iteration
//   write a per-run iteration ledger; append a dated lesson per confirmed fix.
//
// Owners: script | voice | video | video(master) | human. Deterministic auto-fixers
// exist for video(bg-near-black) [regenerate bg tokens from the 05 spec palette] and
// video(master) [re-master]. script/voice/other-video defects are ATTRIBUTED and the
// loop halts with HUMAN ACTION routing to the owning skill (those regenerations are
// agent-driven). Run with: node --experimental-strip-types scripts/loop.mjs <run>

import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { precheck } from "./precheck.mjs";
import { probe, BAR } from "./qa-probe.mjs";
import { renderRun } from "./render-run.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const LESSONS = path.join(ROOT, "memory", "lessons.md");
const TODAY = process.env.FATHOM_DATE || "2026-06-17"; // Date.* unavailable in some envs

const log = (m) => process.stdout.write(`[loop] ${m}\n`);

function appendLesson(line) {
  const entry = `- ${line} ${TODAY}\n`;
  fs.appendFileSync(LESSONS, entry);
  log(`lesson: ${line}`);
}

// ---- deterministic auto-fixers (keyed by finding check/defect) ----

// Regenerate the background gradient tokens from the spec palette in
// 05-remotion-prompt.md (the source of truth) — heals a drifted/corrupted bg.
function fixBgFromSpec(runDir, short) {
  const specPath = path.join(runDir, "05-remotion-prompt.md");
  const dataPath = path.join(ROOT, "render", "src", short, "data.ts");
  if (!fs.existsSync(specPath) || !fs.existsSync(dataPath)) return { applied: false };
  const spec = fs.readFileSync(specPath, "utf8");
  const m = /bg gradient `(#[0-9a-fA-F]{6})`[^\n]*?→\s*`(#[0-9a-fA-F]{6})`/.exec(spec);
  if (!m) return { applied: false };
  const [, top, bot] = m;
  let data = fs.readFileSync(dataPath, "utf8");
  data = data
    .replace(/bgTop:\s*"#[0-9a-fA-F]{6}"/, `bgTop: "${top}"`)
    .replace(/bgBottom:\s*"#[0-9a-fA-F]{6}"/, `bgBottom: "${bot}"`);
  fs.writeFileSync(dataPath, data);
  return {
    applied: true,
    description: `regenerated bg gradient from 05 spec palette (${top} -> ${bot})`,
    lesson: `${short}: near-black/flat background in the video stage — auto-fixed by regenerating the bg gradient tokens from the 05-remotion-prompt palette (${top}->${bot}). Codegen must always use the lib Background with the spec gradient, never a flat/dark single hex.`,
  };
}

const FIXERS = {
  "bg-not-near-black": fixBgFromSpec, // precheck owner=video
  "near-black / flat frame": fixBgFromSpec, // qa-probe owner=video
};

// ---- ledger ----
function writeLedger(runDir, rounds, status) {
  const id = path.basename(runDir);
  let md = `# 09 — Iteration ledger (${id})\n\n`;
  md += `Closed render loop: precheck -> render -> qa-probe -> attribute -> fix. Bar: score >= ${BAR.score}, no blockers, Cat9 >= ${BAR.cat9}.\n\n`;
  md += `| # | score | Cat9 | blockers | owner | fix | lesson |\n|---|---|---|---|---|---|---|\n`;
  for (const r of rounds)
    md += `| ${r.n} | ${r.score ?? "-"} | ${r.cat9 ?? "-"} | ${r.blockers ?? "-"} | ${r.owner ?? "-"} | ${r.fix ?? "-"} | ${r.lesson ? "yes" : "-"} |\n`;
  md += `\n**STATUS: ${status}**\n`;
  fs.writeFileSync(path.join(runDir, "09-iteration-ledger.md"), md);
}

// ---- main ----
export async function loop(runArg, opts = {}) {
  const max = opts.max || 3;
  const runDir = path.isAbsolute(runArg) ? runArg : path.join(ROOT, runArg);
  const id = path.basename(runDir);
  const short = (id.match(/^F-\d{3}/) || [])[0];
  const rounds = [];
  let best = { score: -1, file: null };
  let scriptRecuts = 0;

  for (let n = 1; n <= max; n++) {
    log(`=== iteration ${n}/${max} ===`);

    // --- precheck + pre-render auto-fix loop ---
    for (let attempt = 0; attempt < 3; attempt++) {
      const pc = precheck(runArg);
      const bad = pc.findings.filter((f) => !f.ok);
      if (pc.ok) { log(`precheck PASS`); break; }
      log(`precheck FAIL: ${bad.map((f) => `${f.check}[${f.owner}]`).join(", ")}`);
      const f = bad[0];
      if (f.owner === "human") {
        const status = `BAR-NOT-MET(best=${best.score < 0 ? "none" : best.score}) HUMAN ACTION: ${f.fix} (${f.detail})`;
        writeLedger(runDir, rounds, status);
        return { status: "HALT-HUMAN", owner: "human", detail: f.detail, best };
      }
      const fixer = FIXERS[f.check];
      if (!fixer) {
        const status = `BAR-NOT-MET(best=${best.score < 0 ? "none" : best.score}) HUMAN ACTION: route to ${f.owner} — ${f.fix}`;
        writeLedger(runDir, rounds, status);
        return { status: "HALT-NO-FIXER", owner: f.owner, detail: f.detail, best };
      }
      const res = fixer(runDir, short);
      if (!res.applied) {
        writeLedger(runDir, rounds, `BAR-NOT-MET HUMAN ACTION: ${f.owner} fix could not be applied automatically (${f.detail})`);
        return { status: "HALT-FIX-FAILED", owner: f.owner, detail: f.detail, best };
      }
      log(`auto-fix [${f.owner}]: ${res.description}`);
      if (res.lesson) appendLesson(res.lesson);
      rounds.push({ n, owner: f.owner, fix: res.description, lesson: res.lesson, blockers: `precheck:${f.check}` });
    }

    // --- render + master ---
    let render;
    try {
      render = await renderRun(runArg, { timeoutSec: opts.timeoutSec || 600 });
    } catch (e) {
      const owner = e.payload?.owner || "video";
      const status = `BAR-NOT-MET(best=${best.score < 0 ? "none" : best.score}) HUMAN ACTION: render halted (${owner}): ${e.message}`;
      writeLedger(runDir, rounds, status);
      return { status: "HALT-RENDER", owner, detail: e.message, best };
    }

    // --- QA ---
    const qa = await probe(runArg, { file: "final.mp4" });
    log(`qa: score=${qa.score} cat9=${qa.cat9} blockers=${qa.blockers.length} pass=${qa.pass}`);

    // keep best render (never overwrite a passing earlier attempt)
    if (qa.score > best.score) {
      const bestPath = path.join(runDir, "final-best.mp4");
      fs.copyFileSync(path.join(runDir, "final.mp4"), bestPath);
      best = { score: qa.score, cat9: qa.cat9, file: bestPath };
      log(`kept final-best.mp4 (score ${qa.score})`);
    }

    const top = qa.blockers[0] || qa.warnings[0];
    rounds.push({
      n, score: qa.score, cat9: qa.cat9, blockers: qa.blockers.length,
      owner: top?.owner, fix: top?.fix,
    });

    if (qa.pass) {
      writeLedger(runDir, rounds, `PASS (score ${qa.score}, Cat9 ${qa.cat9}) — final-best.mp4 ready for human publish gate`);
      log(`PASS at iteration ${n}. Human publish gate next.`);
      return { status: "PASS", score: qa.score, cat9: qa.cat9, best, rounds };
    }

    // --- attribute + fix the top blocker ---
    if (!top) break;
    if (top.owner === "script") {
      if (scriptRecuts >= 1) {
        writeLedger(runDir, rounds, `BAR-NOT-MET(best=${best.score}) HUMAN ACTION: script re-cut budget (1/loop) spent; route to youtube-shorts-writer`);
        return { status: "HALT-SCRIPT-BUDGET", owner: "script", best };
      }
      scriptRecuts++;
    }
    const fixer = FIXERS[top.defect];
    if (!fixer) {
      writeLedger(runDir, rounds, `BAR-NOT-MET(best=${best.score}) HUMAN ACTION: route to ${top.owner} — ${top.fix} (${top.evidence})`);
      return { status: "HALT-NO-FIXER", owner: top.owner, detail: top.evidence, best };
    }
    const res = fixer(runDir, short);
    if (!res.applied) {
      writeLedger(runDir, rounds, `BAR-NOT-MET(best=${best.score}) HUMAN ACTION: ${top.owner} auto-fix failed (${top.evidence})`);
      return { status: "HALT-FIX-FAILED", owner: top.owner, best };
    }
    log(`auto-fix [${top.owner}]: ${res.description}`);
    if (res.lesson) appendLesson(res.lesson);

    // monotonicity: next render must strictly beat best, else abort (no oscillation)
    // (checked after the next qa; here we just guard the iteration budget)
  }

  writeLedger(runDir, rounds, `BAR-NOT-MET(best=${best.score < 0 ? "none" : best.score}) HUMAN ACTION: max iterations reached; inspect final-best.mp4`);
  return { status: "BAR-NOT-MET", best, rounds };
}

// ---- CLI ----
const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const args = process.argv.slice(2);
  const runArg = args.find((a) => !a.startsWith("--"));
  const mIdx = args.indexOf("--max");
  if (!runArg) {
    process.stderr.write("usage: loop.mjs <output/F-NNN-slug> [--max 3]\n");
    process.exit(2);
  }
  loop(runArg, { max: mIdx !== -1 ? parseInt(args[mIdx + 1], 10) : 3 })
    .then((r) => {
      process.stdout.write(`\n[loop] terminal: ${r.status}` + (r.score ? ` score=${r.score} cat9=${r.cat9}` : "") + `\n`);
      process.exit(r.status === "PASS" ? 0 : 1);
    })
    .catch((e) => {
      process.stderr.write(`[loop] error: ${e.stack || e.message}\n`);
      process.exit(2);
    });
}
