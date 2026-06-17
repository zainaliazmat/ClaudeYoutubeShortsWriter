import { test } from "node:test";
import assert from "node:assert";
import { parseSpecGradient, rewriteBgTokens, decideMonotonic } from "../loop-logic.mjs";

// The exact prose the 05-remotion-prompt.md spec uses (verbatim from F-001).
const SPEC_LINE =
  "- **Colors:** bg gradient `#0B1430` (top) → `#1C2A55` (bottom); hero radial glow `#2E4A8C` @35%; nebula `#3A2C6B` @12%; text `#F4F1E8`.";

const DATA_TS = `export const COLORS = {
  bgTop: "#0B1430",
  bgBottom: "#1C2A55",
  text: "#F4F1E8",
} as const;`;

// data.ts whose tokens DON'T match the rewrite regex (single quotes — a plausible
// codegen format drift). The pre-fix bug: the fixer rewrites nothing yet reports success.
const DATA_TS_NOMATCH = `export const COLORS = { bgTop: '#0B1430', bgBottom: '#1C2A55' } as const;`;

test("parseSpecGradient: pulls top+bottom from the real spec prose", () => {
  assert.deepEqual(parseSpecGradient(SPEC_LINE), { top: "#0B1430", bot: "#1C2A55" });
});
test("parseSpecGradient: returns null when the prose has drifted", () => {
  assert.equal(parseSpecGradient("- Colors: a dark navy background fading to indigo"), null);
});

// =====================================================================
// THE FIXES: RED before, GREEN after.
// =====================================================================
test("FIX: rewriteBgTokens reports a real change when tokens are present", () => {
  const { text, changed } = rewriteBgTokens(DATA_TS, "#123456", "#abcdef");
  assert.equal(changed, true);
  assert.match(text, /bgTop:\s*"#123456"/);
  assert.match(text, /bgBottom:\s*"#abcdef"/);
});
test("FIX: rewriteBgTokens reports NO change on a no-op (so the fixer can't fake success)", () => {
  const { text, changed } = rewriteBgTokens(DATA_TS_NOMATCH, "#123456", "#abcdef");
  assert.equal(changed, false);
  assert.equal(text, DATA_TS_NOMATCH); // untouched
});
test("FIX: decideMonotonic aborts only when a fix produced no score gain", () => {
  assert.equal(decideMonotonic(true, 80, 80), true);   // fixed last round, no gain -> abort
  assert.equal(decideMonotonic(true, 70, 80), true);   // fixed last round, went DOWN -> abort
  assert.equal(decideMonotonic(true, 90, 80), false);  // fixed last round, strict gain -> continue
  assert.equal(decideMonotonic(false, 80, 80), false); // no prior fix (first render) -> never abort
});
