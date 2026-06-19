// Pure, frame-independent helpers for the Lottie accent layer. No React, no
// Remotion runtime — unit-testable under node:test. Determinism: pure math only.
import { SAFE_TOP, SAFE_BOTTOM, SAFE_INSET_X, WIDTH } from "../safeArea.ts";

export const CANONICAL_FPS = 30;

/** Hard-fail guard: the accent's natural fps MUST match the composition fps, else
 *  lottie-web's goToAndStop() seeks a mis-scaled timeline (wrong speed + non-integer
 *  loop period). Throws — callers must NOT swallow this. */
export function assertAccentFps(
  metaFps: number | null | undefined,
  compFps: number,
  name: string,
): void {
  if (metaFps == null) {
    throw new Error(`[LottieAccent] ${name}: could not read Lottie metadata (fps).`);
  }
  if (Math.round(metaFps) !== compFps) {
    throw new Error(
      `[LottieAccent] ${name}: accent fps ${metaFps} != composition fps ${compFps}. ` +
        `Regenerate the accent at ${compFps}fps (lottie_gen.py --fps ${compFps}).`,
    );
  }
}

export type AccentPlacement = {
  anchor: "top" | "center" | "above-captions";
  sizePx: number;
};

/** Centered horizontally; vertical position by anchor; the box is clamped to sit
 *  fully inside the safe area regardless of sizePx. */
export function accentBoxStyle(p: AccentPlacement): {
  position: "absolute";
  left: number;
  top: number;
  width: number;
  height: number;
} {
  const maxW = WIDTH - 2 * SAFE_INSET_X;
  const maxH = SAFE_BOTTOM - SAFE_TOP;
  const size = Math.min(p.sizePx, maxW, maxH);
  const left = Math.round((WIDTH - size) / 2);
  let top: number;
  if (p.anchor === "top") {
    top = SAFE_TOP;
  } else if (p.anchor === "above-captions") {
    top = SAFE_BOTTOM - size;
  } else {
    top = Math.round((SAFE_TOP + SAFE_BOTTOM - size) / 2);
  }
  // Clamp (defensive — size is already bounded).
  top = Math.max(SAFE_TOP, Math.min(top, SAFE_BOTTOM - size));
  return { position: "absolute", left, top, width: size, height: size };
}

/** Loop only if the accent is strictly shorter than its window AND divides it
 *  evenly (integer-frame period). Otherwise play once and freeze on the last frame
 *  — never a fractional loop that fights the video seam. */
export function loopForWindow(accentDurationInFrames: number, windowFrames: number): boolean {
  if (accentDurationInFrames <= 0) return false;
  return accentDurationInFrames < windowFrames && windowFrames % accentDurationInFrames === 0;
}
