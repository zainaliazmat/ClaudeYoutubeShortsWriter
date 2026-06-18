import React, { useMemo } from "react";
import { AbsoluteFill, random, useCurrentFrame } from "remotion";
import { WIDTH, HEIGHT } from "../lib/safeArea";
import { loopSafeDrift, loopSafePulse } from "../lib/motion";
import type { V2Palette } from "./Palette";

// v2 warm depth background — gradient + breathing hero glow + drifting dust motes +
// vignette. Never flat single-hex. Loop-safe: drift + pulse return to their frame-0
// values at `total`, so frame (total-1) pixel-matches frame 0.

export const V2Background: React.FC<{
  palette: V2Palette;
  total: number;
  heroY?: number;
  moteCount?: number;
}> = ({ palette, total, heroY = 760, moteCount = 60 }) => {
  const frame = useCurrentFrame();
  const glowScale = loopSafePulse(frame, total, Math.max(1, Math.round(total / 130)), [1.0, 1.05]);
  const drift = loopSafeDrift(frame, total, 46);

  const motes = useMemo(
    () =>
      new Array(moteCount).fill(0).map((_, i) => ({
        x: random(`m-x-${i}`) * WIDTH,
        y: random(`m-y-${i}`) * HEIGHT,
        r: 1.2 + random(`m-r-${i}`) * 2.2,
        o: 0.1 + random(`m-o-${i}`) * 0.28,
      })),
    [moteCount],
  );

  return (
    <AbsoluteFill>
      <AbsoluteFill
        style={{ background: `linear-gradient(168deg, ${palette.bgTop} 0%, ${palette.bgBottom} 100%)` }}
      />
      {/* hero glow */}
      <div
        style={{
          position: "absolute",
          left: WIDTH / 2 - 560,
          top: heroY - 560,
          width: 1120,
          height: 1120,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${palette.glow} 0%, rgba(0,0,0,0) 66%)`,
          opacity: 0.42,
          transform: `scale(${glowScale})`,
        }}
      />
      {/* drifting dust motes (warm, soft) */}
      <svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} style={{ position: "absolute", inset: 0 }}>
        {motes.map((m, i) => (
          <circle
            key={i}
            cx={m.x}
            cy={(((m.y + drift) % HEIGHT) + HEIGHT) % HEIGHT}
            r={m.r}
            fill={palette.mote}
            opacity={m.o}
          />
        ))}
      </svg>
      {/* vignette to focus the center and lift type contrast at edges */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at 50% 42%, rgba(0,0,0,0) 48%, ${palette.vignette} 120%)`,
          opacity: 0.7,
        }}
      />
    </AbsoluteFill>
  );
};
