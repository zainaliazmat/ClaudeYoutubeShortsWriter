import { Easing, interpolate, spring } from "remotion";

// Reusable motion signatures (v3). All take a LOCAL (scene-relative) frame
// unless noted. Helpers return numbers or small style fragments.

/**
 * wordSlamIn — captions / lines enter: translateY +48px→0, opacity 0→1, ~8f.
 * spring tension 200, damping 22.
 */
export const wordSlamIn = (
  frame: number,
  fps: number,
  delay = 0,
): { transform: string; opacity: number } => {
  const p = spring({
    frame: frame - delay,
    fps,
    config: { stiffness: 200, damping: 22 },
  });
  return {
    transform: `translateY(${interpolate(p, [0, 1], [48, 0])}px)`,
    opacity: p,
  };
};

/**
 * heroOvershoot — hero words/numbers: scale 0.55→1.0 (overshoot ~1.10), ~12f.
 * spring tension 200, damping 13.
 */
export const heroOvershoot = (
  frame: number,
  fps: number,
  delay = 0,
): { transform: string; opacity: number } => {
  const p = spring({
    frame: frame - delay,
    fps,
    config: { stiffness: 200, damping: 13 },
  });
  return {
    transform: `scale(${interpolate(p, [0, 1], [0.55, 1])})`,
    opacity: interpolate(p, [0, 1], [0, 1], { extrapolateRight: "clamp" }),
  };
};

/**
 * yearStampShake — year stamp stone-impact: translateX micro-oscillation
 * (±5px, ~3 cycles) then lock, ~12f. spring tension 420, damping 28 drives the
 * settle; a damped sine provides the oscillation.
 */
export const yearStampShake = (
  frame: number,
  fps: number,
  delay = 0,
): { transform: string; opacity: number } => {
  const local = Math.max(0, frame - delay);
  const settle = spring({
    frame: frame - delay,
    fps,
    config: { stiffness: 420, damping: 28 },
  });
  // damped oscillation: amplitude decays to ~0 by 12f, 3 cycles
  const amp = 5 * Math.max(0, 1 - local / 12);
  const shake = amp * Math.sin((local / 12) * Math.PI * 2 * 3);
  return {
    transform: `translateX(${shake}px)`,
    opacity: settle,
  };
};

/**
 * countUp — numeric count 0→target over [start,end] (LOCAL frames), ease-OUT
 * cubic (fast start, decelerate to land) then holds. Clamped ≥ 0 — never
 * negative (fixes v2's negative-value bug).
 */
export const countUp = (
  frame: number,
  start: number,
  end: number,
  target: number,
): number =>
  Math.max(
    0,
    interpolate(frame, [start, end], [0, target], {
      easing: Easing.out(Easing.cubic),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  );

/**
 * segmentGrow — vertical bar scaleY 0→1 anchored at TOP, ~28–34f.
 * spring tension 130, damping 24.
 */
export const segmentGrow = (
  frame: number,
  fps: number,
  delay = 0,
): number =>
  spring({
    frame: frame - delay,
    fps,
    config: { stiffness: 130, damping: 24 },
  });

/**
 * nodeNudge — Cleopatra node eases downward toward the Moon: Y +0→+28, ~18f.
 * spring tension 110, damping 20.
 */
export const nodeNudge = (
  frame: number,
  fps: number,
  delay = 0,
): number =>
  interpolate(
    spring({
      frame: frame - delay,
      fps,
      config: { stiffness: 110, damping: 20 },
    }),
    [0, 1],
    [0, 28],
  );

/**
 * payoffGlow — sinusoidal glow, ~3 cycles over `cycleFrames*3` from `start`.
 * Returns blur px (4→18→4) and opacity (0.6→1→0.6).
 */
export const payoffGlow = (
  frame: number,
  start: number,
  cycleFrames = 55,
): { blur: number; opacity: number } => {
  const local = Math.max(0, frame - start);
  const phase = Math.sin((local / cycleFrames) * Math.PI * 2);
  const wave = (phase + 1) / 2; // 0..1
  return {
    blur: interpolate(wave, [0, 1], [4, 18]),
    opacity: interpolate(wave, [0, 1], [0.6, 1]),
  };
};

/** crossDissolve — linear opacity over [start,end] (LOCAL frames). */
export const crossDissolve = (
  frame: number,
  start: number,
  end: number,
  from = 0,
  to = 1,
): number =>
  interpolate(frame, [start, end], [from, to], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
