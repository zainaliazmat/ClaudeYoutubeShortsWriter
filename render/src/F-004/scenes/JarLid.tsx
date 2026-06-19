import React from "react";
import { COLORS, WIDTH, Y } from "../data";

// Jar lid SVG — seats on the jar neck during beat4 lid-snap.
// scale is driven by the lid-snap bounce in Beat4 (1.0→1.15→1.0 over 8f).

const LID_W = 200;
const LID_H = 32;
const LID_X = (WIDTH - LID_W) / 2;
// Jar neck is at JAR_Y+24 to JAR_Y+38 — jar Y is centered around Y.jar=900, jar H=500 → JAR_Y = 900-250=650
const JAR_Y = Y.jar - 250;
const LID_Y = JAR_Y + 18;

export const JarLid: React.FC<{ scale?: number }> = ({ scale = 1 }) => (
  <svg
    width={WIDTH}
    height={1920}
    viewBox={`0 0 ${WIDTH} 1920`}
    style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
  >
    <g transform={`translate(${WIDTH / 2}, ${LID_Y}) scale(${scale}) translate(${-WIDTH / 2}, ${-LID_Y})`}>
      {/* Lid body */}
      <rect
        x={LID_X - 10}
        y={LID_Y}
        width={LID_W + 20}
        height={LID_H}
        rx={6}
        fill={COLORS.jar}
        stroke={COLORS.accent}
        strokeWidth={3}
        strokeOpacity={0.85}
      />
      {/* Lid highlight stripe */}
      <rect
        x={LID_X}
        y={LID_Y + 6}
        width={LID_W}
        height={6}
        rx={2}
        fill={COLORS.payoff}
        opacity={0.35}
      />
    </g>
  </svg>
);
