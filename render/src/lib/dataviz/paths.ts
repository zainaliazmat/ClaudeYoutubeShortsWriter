// paths — frame-driven SVG path builders over d3-shape.
//
// d3-shape generators return a path-`d` STRING when no canvas context is
// attached (we call them ourselves and feed the string to <path d={...}>), so
// there is zero d3 DOM involvement. Each builder is a pure function of its
// points. Animate by passing fewer/cut points (a frame-derived reveal), never a
// transition. Empty data throws (a precondition violation that the codegen
// controlled-halt is meant to catch upstream); the `?? ""` satisfies strict tsc
// since d3-shape types the return as `string | null` (ENG-5).

import { line, area, curveMonotoneX, curveLinear, type CurveFactory } from "d3-shape";

export type Pt = { x: number; y: number };

/**
 * Reveal fraction `t` in [0,1] -> the points up to the cutoff, interpolating the
 * final partial segment, so a curve "grows" left->right as `t` advances. Pure.
 */
export function revealPoints(points: Pt[], t: number): Pt[] {
  if (points.length === 0) throw new Error("revealPoints: empty data");
  const tc = Math.max(0, Math.min(1, t));
  if (tc >= 1) return points.slice();
  if (tc <= 0) return [points[0]];
  const pos = (points.length - 1) * tc;
  const i = Math.floor(pos);
  const frac = pos - i;
  const out = points.slice(0, i + 1);
  if (i + 1 < points.length && frac > 0) {
    const a = points[i];
    const b = points[i + 1];
    out.push({ x: a.x + (b.x - a.x) * frac, y: a.y + (b.y - a.y) * frac });
  }
  return out;
}

/** A line path through `points`. */
export function linePath(points: Pt[], curve: CurveFactory = curveMonotoneX): string {
  if (points.length === 0) throw new Error("linePath: empty data");
  const gen = line<Pt>()
    .x((p) => p.x)
    .y((p) => p.y)
    .curve(curve);
  return gen(points) ?? "";
}

/** An area path from baseline `y0` up to `points`. */
export function areaPath(
  points: Pt[],
  y0: number,
  curve: CurveFactory = curveMonotoneX,
): string {
  if (points.length === 0) throw new Error("areaPath: empty data");
  const gen = area<Pt>()
    .x((p) => p.x)
    .y0(y0)
    .y1((p) => p.y)
    .curve(curve);
  return gen(points) ?? "";
}

export { curveMonotoneX, curveLinear };
export type { CurveFactory };
