// loop-logic.mjs — the PURE, fs-free decisions of the self-improving loop, split
// out so the background auto-fixer's text rewrite and the monotonicity guard can
// be unit-tested without a render. loop.mjs keeps the IO + control flow and calls
// these.

// Pull the spec gradient (#top -> #bottom) out of 05-remotion-prompt.md prose.
export function parseSpecGradient(specText) {
  const m = /bg gradient `(#[0-9a-fA-F]{6})`[^\n]*?→\s*`(#[0-9a-fA-F]{6})`/.exec(specText);
  return m ? { top: m[1], bot: m[2] } : null;
}

// Rewrite COLORS.bgTop / COLORS.bgBottom in a data.ts source string.
// Returns the new text AND whether anything actually changed — so the caller can
// refuse to claim success on a no-op (format drift).
export function rewriteBgTokens(dataText, top, bot) {
  const text = dataText
    .replace(/bgTop:\s*"#[0-9a-fA-F]{6}"/, `bgTop: "${top}"`)
    .replace(/bgBottom:\s*"#[0-9a-fA-F]{6}"/, `bgBottom: "${bot}"`);
  return { text, changed: text !== dataText };
}

// Monotonicity guard: after an auto-fix + re-render, should the loop abort because
// the score did not strictly improve (no point burning more iterations re-applying
// a deterministic fix that changed nothing)?
export function decideMonotonic(fixedLastRound, newScore, prevBestScore) {
  // Abort iff we applied a fix last round and it failed to strictly beat the prior
  // best — re-rendering would just repeat a deterministic fix that changed nothing.
  return fixedLastRound === true && newScore <= prevBestScore;
}
