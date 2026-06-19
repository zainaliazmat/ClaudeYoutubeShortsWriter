import React from "react";
import { AbsoluteFill } from "remotion";
import { COLORS, ANTON, Y, WIDTH } from "../data";
import { HoneyJar } from "./HoneyJar";

// Hook (frames 0–109): ONE FOOD / NEVER EXPIRES at full opacity from frame 0 (thumbnail).
// Jar silhouette present behind from f0. No fade-in — slam-in is for the loop-return only.

export const Hook: React.FC = () => (
  <AbsoluteFill>
    {/* Jar silhouette — persistent from frame 0 */}
    <HoneyJar fillProgress={0} />

    {/* Upper hero: ONE FOOD */}
    <div
      style={{
        position: "absolute",
        top: Y.hero,
        left: 0,
        width: WIDTH,
        textAlign: "center",
        fontFamily: ANTON,
        fontSize: 320,
        color: COLORS.hero,
        lineHeight: 1,
        textShadow: `0 0 64px ${COLORS.hero}44`,
      }}
    >
      ONE FOOD
    </div>

    {/* Sub-hero: NEVER EXPIRES */}
    <div
      style={{
        position: "absolute",
        top: Y.hero + 310,
        left: 0,
        width: WIDTH,
        textAlign: "center",
        fontFamily: ANTON,
        fontSize: 260,
        color: COLORS.accent,
        lineHeight: 1,
        textShadow: `0 0 48px ${COLORS.accent}66`,
      }}
    >
      NEVER EXPIRES
    </div>
  </AbsoluteFill>
);
