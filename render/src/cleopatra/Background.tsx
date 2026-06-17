import React, { useMemo } from "react";
import {
  AbsoluteFill,
  interpolate,
  random,
  useCurrentFrame,
} from "remotion";
import { COLORS, DURATION, HEIGHT, WIDTH, Y } from "./theme";

// Persistent depth background (z:0, ALL frames) — never flat black.
// Vertical navy→indigo gradient + breathing radial glow + faint nebula wash +
// a drifting star field. Target avg luma ~40–70 (fixes the v2 near-black void).

const STAR_COUNT = 70;

export const Background: React.FC = () => {
  const frame = useCurrentFrame(); // global frame (mounted outside sequences)

  // Glow softly breathes scale 1.0 ↔ 1.04 over ~120f.
  const glowScale = interpolate(
    Math.sin((frame / 120) * Math.PI * 2),
    [-1, 1],
    [1.0, 1.04],
  );

  // Stars drift upward slowly (translateY 0 → -56 over the full run).
  const drift = interpolate(frame, [0, DURATION], [0, -56]);

  const stars = useMemo(
    () =>
      new Array(STAR_COUNT).fill(0).map((_, i) => ({
        x: random(`stars-x-${i}`) * WIDTH,
        y: random(`stars-y-${i}`) * HEIGHT,
        r: 1 + random(`stars-r-${i}`) * 1, // 2–4px diameter
        o: 0.25 + random(`stars-o-${i}`) * 0.35, // 25–60%
      })),
    [],
  );

  return (
    <AbsoluteFill>
      {/* Vertical depth gradient — ancient (top) → modern (bottom). */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(180deg, ${COLORS.bgTop} 0%, ${COLORS.bgBottom} 100%)`,
        }}
      />

      {/* Faint nebula wash, upper-left. */}
      <div
        style={{
          position: "absolute",
          left: -260,
          top: -200,
          width: 900,
          height: 900,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${COLORS.nebula} 0%, rgba(58,44,107,0) 70%)`,
          opacity: 0.12,
          filter: "blur(80px)",
        }}
      />

      {/* ~900px radial glow behind the hero, breathing. */}
      <div
        style={{
          position: "absolute",
          left: WIDTH / 2 - 450,
          top: Y.hero - 450,
          width: 900,
          height: 900,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${COLORS.glow} 0%, rgba(46,74,140,0) 68%)`,
          opacity: 0.35,
          transform: `scale(${glowScale})`,
        }}
      />

      {/* Star field — Remotion random(seed), never Math.random. */}
      <svg
        width={WIDTH}
        height={HEIGHT}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        style={{ position: "absolute", inset: 0 }}
      >
        {stars.map((s, i) => (
          <circle
            key={i}
            cx={s.x}
            cy={((s.y + drift) % HEIGHT + HEIGHT) % HEIGHT}
            r={s.r}
            fill={COLORS.text}
            opacity={s.o}
          />
        ))}
      </svg>
    </AbsoluteFill>
  );
};
