// scales — thin wrappers over d3-scale. Pure number->number (and Date->number)
// maps; no DOM, no timer, no animation. Animate by interpolating the DOMAIN or a
// reveal cutoff, never with d3.transition() (forbidden + not installed).

import { scaleLinear, scaleBand, scaleTime } from "d3-scale";

/** A pixel rectangle a chart draws into (top-left origin). */
export type ChartBox = { x: number; y: number; w: number; h: number };

/** Linear value->pixel map over a numeric domain. */
export function linearScale(domain: [number, number], range: [number, number]) {
  return scaleLinear().domain(domain).range(range);
}

/** Categorical band scale (x for bars). `padding` in [0,1). */
export function bandScale(domain: string[], range: [number, number], padding = 0.2) {
  return scaleBand<string>().domain(domain).range(range).padding(padding);
}

/**
 * Time scale. NOTE: the domain is JS `Date` objects — construct them from FIXED
 * literals (`new Date(2560, 0, 1)`), never `new Date()` / `Date.now()` (the
 * static grep guard forbids only the zero-arg wall-clock form, ENG-4).
 */
export function timeScale(domain: [Date, Date], range: [number, number]) {
  return scaleTime().domain(domain).range(range);
}
