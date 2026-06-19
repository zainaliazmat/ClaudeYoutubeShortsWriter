// scaleHonest — the scale-honesty invariant, machine-checked.
//
// The codegen quality floor "length ratio MUST equal data ratio" used to be a
// hand-checked rule (F-001 drew a real ~5:4 gap as ~3:1). Here it is enforceable
// by construction: rendered pixel length is ALWAYS computed from the data value
// via a single px-per-unit factor, never hand-picked. `isScaleHonest` is the
// invariant the unit tests assert.

/**
 * Pixel length for `value` given a reference (value, px) pair. Pure px-per-unit:
 * `length = (value / refValue) * refPx`. The ONLY sanctioned way to turn a data
 * value into a bar height / curve y — never pin a pixel length by hand.
 */
export function lengthFor(value: number, refValue: number, refPx: number): number {
  if (refValue === 0) throw new Error("scaleHonest.lengthFor: refValue must be non-zero");
  return (value / refValue) * refPx;
}

/**
 * True iff every rendered length is proportional to its data value within `eps`
 * (one shared px-per-unit factor). A labeled transform (e.g. log) is the only
 * sanctioned exception and is NOT checked here — the caller must label it.
 */
export function isScaleHonest(values: number[], lengths: number[], eps = 1e-9): boolean {
  if (values.length !== lengths.length || values.length === 0) return false;
  const ref = values.findIndex((v) => v !== 0);
  if (ref === -1) return lengths.every((l) => l === 0);
  const k = lengths[ref] / values[ref]; // px per unit
  return values.every(
    (v, j) => Math.abs(lengths[j] - k * v) <= eps * Math.max(1, Math.abs(k * v)),
  );
}
