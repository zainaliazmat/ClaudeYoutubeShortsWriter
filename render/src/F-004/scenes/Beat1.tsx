import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { heroOvershoot } from "../../lib/motion";
import { COLORS, ANTON, ARCHIVO_BLACK, Y, WIDTH } from "../data";
import { HoneyJar } from "./HoneyJar";

// Beat1 (frames 109–287): HONEY slams at local f=2 (absolute 111); jar fills bottom→top
// local f=6–30 (abs 115–139). ~0% water chip pops at local f=85 (abs 194).
// Polish fix: slow glow pulse on jar as secondary sustain motion (no static stretch).

const CHIP_POP_START = 85; // local frame when chip appears

export const Beat1: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // HONEY hero slam-in (local f=2 → abs 111)
  const heroIn = heroOvershoot(frame, fps, 2);

  // Jar fill: bottom→top over local f=6–30 (24f easeOut), then holds at 1.0
  const fillProgress = interpolate(frame, [6, 30], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ~0% water chip pop: easeOutBack over local f=85–95
  const chipScale = interpolate(frame, [CHIP_POP_START, CHIP_POP_START + 5, CHIP_POP_START + 10], [0.5, 1.05, 1.0], {
    easing: Easing.linear,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const chipOpacity = interpolate(frame, [CHIP_POP_START, CHIP_POP_START + 6], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Secondary sustain: slow jar glow pulse (beat1 lasts 178f — keeps it alive after fill)
  // loopSafePulse with 178f local window, ~2 cycles
  const glowPulse = interpolate(
    Math.sin((frame / 178) * Math.PI * 2 * 2),
    [-1, 1],
    [0, 1],
  );

  return (
    <AbsoluteFill>
      <HoneyJar fillProgress={fillProgress} glowPulse={glowPulse} />

      {/* HONEY hero */}
      <div
        style={{
          position: "absolute",
          top: Y.hero,
          left: 0,
          width: WIDTH,
          textAlign: "center",
          fontFamily: ANTON,
          fontSize: 380,
          color: COLORS.accent,
          lineHeight: 1,
          transform: heroIn.transform,
          opacity: heroIn.opacity,
          textShadow: `0 0 80px ${COLORS.accent}88`,
        }}
      >
        HONEY
      </div>

      {/* ~0% WATER stat chip */}
      <div
        style={{
          position: "absolute",
          top: Y.chip,
          left: 0,
          width: WIDTH,
          textAlign: "center",
          fontFamily: ARCHIVO_BLACK,
          fontSize: 96,
          color: COLORS.accent,
          letterSpacing: 3,
          transform: `scale(${chipScale})`,
          opacity: chipOpacity,
          textShadow: `0 0 32px ${COLORS.accent}66`,
        }}
      >
        ~0% WATER
      </div>
    </AbsoluteFill>
  );
};
