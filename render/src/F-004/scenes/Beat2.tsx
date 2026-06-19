import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { COLORS, ARCHIVO_BLACK, Y, WIDTH } from "../data";
import { HoneyJar } from "./HoneyJar";

// Beat2 (frames 287–452): Two stat chips stagger in — ACIDIC (left) + H₂O₂ (right).
// MICROBES DIE wipes in at local f=119 (abs 406).
// Chips are ≥90px per scorecard polish fix #3.

const CHIP_A_START = 2;   // local f — ACIDIC appears immediately
const CHIP_B_START = 8;   // local f — H₂O₂ 6f later
const WIPE_START = 119;   // local f — MICROBES DIE wipe (abs 406)

export const Beat2: React.FC = () => {
  const frame = useCurrentFrame();

  // Chip pop: easeOutBack over 10f
  const chipScaleA = interpolate(frame, [CHIP_A_START, CHIP_A_START + 5, CHIP_A_START + 10], [0.5, 1.05, 1.0], {
    easing: Easing.linear,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const chipOpacityA = interpolate(frame, [CHIP_A_START, CHIP_A_START + 6], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const chipScaleB = interpolate(frame, [CHIP_B_START, CHIP_B_START + 5, CHIP_B_START + 10], [0.5, 1.05, 1.0], {
    easing: Easing.linear,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const chipOpacityB = interpolate(frame, [CHIP_B_START, CHIP_B_START + 6], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // MICROBES DIE wipe: left→right mask over 12f easeOut
  const wipePct = interpolate(frame, [WIPE_START, WIPE_START + 12], [0, 100], {
    easing: Easing.out(Easing.quad),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      {/* Jar at full fill (honey already filled in beat1) */}
      <HoneyJar fillProgress={1} />

      {/* Upper context label — WHY? */}
      <div
        style={{
          position: "absolute",
          top: Y.upper + 40,
          left: 0,
          width: WIDTH,
          textAlign: "center",
          fontFamily: ARCHIVO_BLACK,
          fontSize: 90,
          color: COLORS.accent,
          opacity: 0.65,
          letterSpacing: 6,
        }}
      >
        WHY?
      </div>

      {/* Stat chips row — ACIDIC (left) + H₂O₂ (right) — ≥90px each */}
      <div
        style={{
          position: "absolute",
          top: Y.chip - 30,
          left: 0,
          width: WIDTH,
          display: "flex",
          justifyContent: "center",
          gap: 60,
        }}
      >
        <div
          style={{
            fontFamily: ARCHIVO_BLACK,
            fontSize: 100,
            color: COLORS.payoff,
            transform: `scale(${chipScaleA})`,
            opacity: chipOpacityA,
            textShadow: `0 0 32px ${COLORS.payoff}88`,
            letterSpacing: 2,
          }}
        >
          ACIDIC
        </div>
        <div
          style={{
            fontFamily: ARCHIVO_BLACK,
            fontSize: 100,
            color: COLORS.payoff,
            transform: `scale(${chipScaleB})`,
            opacity: chipOpacityB,
            textShadow: `0 0 32px ${COLORS.payoff}88`,
            letterSpacing: 2,
          }}
        >
          + H₂O₂
        </div>
      </div>

      {/* MICROBES DIE — reveal wipe */}
      <div
        style={{
          position: "absolute",
          top: Y.chip + 110,
          left: 0,
          width: WIDTH,
          textAlign: "center",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            fontFamily: ARCHIVO_BLACK,
            fontSize: 90,
            color: COLORS.hero,
            letterSpacing: 3,
            WebkitMaskImage: `linear-gradient(90deg, black ${wipePct}%, transparent ${wipePct}%)`,
            maskImage: `linear-gradient(90deg, black ${wipePct}%, transparent ${wipePct}%)`,
          }}
        >
          MICROBES DIE
        </div>
      </div>
    </AbsoluteFill>
  );
};
