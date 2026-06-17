import React, { useMemo } from "react";
import { AbsoluteFill, interpolate, random, useCurrentFrame } from "remotion";
import { WIDTH, HEIGHT } from "./safeArea";
import { loopSafeDrift, loopSafePulse } from "./motion";

// Persistent depth background (z:0, ALL frames) — NEVER flat single-hex (the
// structural fix for F-001's near-black void). Vertical gradient + breathing
// radial glow + faint nebula wash + a drifting star field. Parameterized so every
// video reuses this tested layer; codegen passes resolved color tokens.

export type BackgroundColors = {
  /** gradient top stop (#rrggbb) */
  bgTop: string;
  /** gradient bottom stop (#rrggbb) */
  bgBottom: string;
  /** radial glow color behind the hero */
  glow: string;
  /** faint upper-left nebula wash */
  nebula: string;
  /** star color */
  star: string;
};

export const Background: React.FC<{
  colors: BackgroundColors;
  totalFrames: number;
  /** y of the hero glow center (defaults to vertical center) */
  heroY?: number;
  starCount?: number;
  /**
   * Close the loop seam (audit #4): make the persistent drift + glow pulse return to
   * their frame-0 values at `totalFrames`, so frame (total-1) pixel-matches frame 0.
   * Default false keeps the original (non-looping) motion so already-shipped renders
   * are byte-identical. Codegen should pass `loopSafe` for new videos.
   */
  loopSafe?: boolean;
}> = ({ colors, totalFrames, heroY = HEIGHT / 2, starCount = 70, loopSafe = false }) => {
  const frame = useCurrentFrame();

  const glowScale = loopSafe
    ? loopSafePulse(frame, totalFrames, Math.round(totalFrames / 120), [1.0, 1.04])
    : interpolate(Math.sin((frame / 120) * Math.PI * 2), [-1, 1], [1.0, 1.04]);
  const drift = loopSafe
    ? loopSafeDrift(frame, totalFrames, 56)
    : interpolate(frame, [0, totalFrames], [0, -56]);

  const stars = useMemo(
    () =>
      new Array(starCount).fill(0).map((_, i) => ({
        x: random(`stars-x-${i}`) * WIDTH,
        y: random(`stars-y-${i}`) * HEIGHT,
        r: 1 + random(`stars-r-${i}`) * 1,
        o: 0.25 + random(`stars-o-${i}`) * 0.35,
      })),
    [starCount],
  );

  return (
    <AbsoluteFill>
      <AbsoluteFill
        style={{
          background: `linear-gradient(180deg, ${colors.bgTop} 0%, ${colors.bgBottom} 100%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: -260,
          top: -200,
          width: 900,
          height: 900,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${colors.nebula} 0%, rgba(58,44,107,0) 70%)`,
          opacity: 0.12,
          filter: "blur(80px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: WIDTH / 2 - 450,
          top: heroY - 450,
          width: 900,
          height: 900,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${colors.glow} 0%, rgba(46,74,140,0) 68%)`,
          opacity: 0.35,
          transform: `scale(${glowScale})`,
        }}
      />
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
            cy={(((s.y + drift) % HEIGHT) + HEIGHT) % HEIGHT}
            r={s.r}
            fill={colors.star}
            opacity={s.o}
          />
        ))}
      </svg>
    </AbsoluteFill>
  );
};
