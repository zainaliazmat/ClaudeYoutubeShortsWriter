// Frame-tiling contract for scene ranges — the render-side mirror of the tts
// framemap validator. Scene ranges must be 0-indexed, half-open, contiguous, and
// tile [0, total] exactly: no gaps, no overlaps, first starts at 0, last ends at
// total, every frame integer and every duration positive. Pure (no React/Remotion)
// so codegen, the pre-render precheck, and unit tests all share one source of truth.

export type Range = { from: number; duration: number };
export type TilingResult = { ok: boolean; errors: string[] };

export function validateTiling(ranges: Range[], total: number): TilingResult {
  const errors: string[] = [];

  if (!Number.isInteger(total) || total <= 0)
    errors.push(`total must be a positive integer (got ${total})`);
  if (ranges.length === 0) {
    errors.push("no scene ranges (expected at least one tiling [0, total])");
    return { ok: false, errors };
  }

  let cursor = 0;
  ranges.forEach((r, i) => {
    if (!Number.isInteger(r.from) || !Number.isInteger(r.duration))
      errors.push(`scene ${i}: frames must be integers (from=${r.from}, duration=${r.duration})`);
    if (r.duration <= 0)
      errors.push(`scene ${i}: duration must be positive (got ${r.duration})`);

    if (i === 0 && r.from !== 0)
      errors.push(`scene 0 must start at 0 (got ${r.from})`);

    if (r.from !== cursor) {
      const rel = r.from > cursor ? "gap" : "overlap";
      errors.push(`scene ${i}: ${rel} — expected start ${cursor}, got ${r.from} (ranges must be contiguous)`);
    }
    cursor = r.from + r.duration;
  });

  if (cursor !== total)
    errors.push(`last scene must end at total ${total} (ended at ${cursor})`);

  return { ok: errors.length === 0, errors };
}
