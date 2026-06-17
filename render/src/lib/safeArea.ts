// Safe-area insets + quality-floor constants — the structural defense against
// F-001's "flat void" failure mode. Codegen reads these as hard constraints; the
// pre-render precheck and render-qa assert them on the actual pixels.

export const WIDTH = 1080;
export const HEIGHT = 1920;
export const FPS = 30;

// Safe area: keep all legible content clear of the top ~8% and bottom ~15%
// (caption gutter + platform UI). y in [SAFE_TOP, SAFE_BOTTOM].
export const SAFE_TOP = 154; // ~8% of 1920
export const SAFE_BOTTOM = 1632; // ~85% of 1920
export const SAFE_INSET_X = 60;

// Explicit vertical bands — codegen must lay out the FULL safe area, not cluster
// everything at center (the F-001 v1 dead-lower-half bug).
export const BANDS = {
  upper: { top: SAFE_TOP, mid: 360 },
  center: { mid: 900 },
  lower: { mid: 1400, bottom: SAFE_BOTTOM },
} as const;

// ---- Quality floors (audit #10; Design voice) ----
// Non-negotiable minimums. Codegen honors them by construction; render-qa is the
// pixel backstop. Tuned to the values in memory/lessons.md.
export const QUALITY_FLOORS = {
  /** hero number / payoff type minimum height in px */
  heroMinPx: 300,
  /**
   * Mean luma floor (0..255) of the RENDERED, COMPOSITED frame — measured by
   * render-qa on actual pixels, NOT a check on the gradient stops alone.
   * F-001's gradient stops average ~31.6 (below this), but the additive glow +
   * nebula + star layers lift the composited frame above it. So the codegen-time
   * rule is structural — see bgRule below — and this number is the pixel backstop.
   */
  bgLumaMin: 35,
  /** fraction of the safe frame that must carry content (anti dead-space) */
  sceneFillMin: 0.55,
  /** count-up reveal max duration in frames (~0.8–1.2s ease-out then hold) */
  countUpMaxFrames: 36,
  /** caption baseline must clear this bottom gutter (px from bottom) */
  captionBottomGutterPx: 288,
  /**
   * Codegen-time background rule (cannot be hallucinated away): the background
   * MUST be a gradient of >= 2 distinct stops AND carry depth layers (a radial
   * glow + a nebula/star field). Never a flat single hex. The lib Background
   * component enforces this by construction; codegen must use it.
   */
  bgRule: "gradient(>=2 stops) + glow + nebula/stars; never flat single hex",
} as const;

/** Relative luminance (Rec. 601) of a #rrggbb hex — used to assert the bg floor. */
export function hexLuma(hex: string): number {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return 0;
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

/** Average luma of a gradient's stops — the codegen-time bg-floor check. */
export function gradientLuma(hexStops: string[]): number {
  if (hexStops.length === 0) return 0;
  return hexStops.reduce((s, h) => s + hexLuma(h), 0) / hexStops.length;
}
