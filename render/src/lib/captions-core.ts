// Caption token core — pure logic shared by the Captions renderer, codegen, and
// tests. Word-by-word captions come from vo-timing.json integer word frames. The
// merge/override/accent rules live HERE (single source of truth — they churned
// once already at commit e5d3c7a), parameterized by fully-resolved tokens.

export type Word = { display: string; start: number; end: number; beat: string };
export type Token = { display: string; start: number; end: number; beat: string };

/**
 * buildTokens — collapse consecutive words that share the same (override-resolved)
 * `display` AND the same `beat` into one token spanning all their frames. Overrides
 * are applied to each word's display BEFORE the merge comparison.
 */
export function buildTokens(
  words: Word[],
  overrides: Record<string, string> = {},
): Token[] {
  const tokens: Token[] = [];
  for (const w of words) {
    const display = overrides[w.display] ?? w.display;
    const prev = tokens[tokens.length - 1];
    if (prev && prev.display === display && prev.beat === w.beat) {
      prev.end = w.end;
    } else {
      tokens.push({ display, start: w.start, end: w.end, beat: w.beat });
    }
  }
  return tokens;
}

/** isNumeric — digit-bearing or the BC era abbreviation carry the side accent. */
export function isNumeric(display: string): boolean {
  return /\d/.test(display) || display === "BC";
}

/** tokenAt — the active token for a global frame (half-open [start, end)). */
export function tokenAt(tokens: Token[], frame: number): Token | undefined {
  return tokens.find((t) => frame >= t.start && frame < t.end);
}
