// lib/dataviz — the D3 (d3-scale + d3-shape) composition-style primitive. Pure,
// frame-driven chart components + their scale-honesty / path / color helpers.
// Peer to Background.tsx / Captions.tsx; consumed by per-video scene .tsx.
// Determinism rules (Phase-1 skill §4): everything a pure function of frame;
// animate by interpolating the domain / a reveal cutoff, never d3.transition;
// no Math.random / Date.now / new Date().

export * from "./scales";
export * from "./scaleHonest";
export * from "./paths";
export * from "./colors";
export { GrowthCurve } from "./GrowthCurve";
export { BarChart } from "./BarChart";
export { Distribution } from "./Distribution";
