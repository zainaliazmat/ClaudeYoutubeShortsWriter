import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { wordSlamIn } from "../../lib/motion";
import { COLORS, ANTON, ARCHIVO_BLACK, Y, WIDTH } from "../data";
import { HoneyJar } from "./HoneyJar";
import { JarLid } from "./JarLid";

// Beat4 (frames 638–840): caveat — KEEP IT SEALED + lid snap + CRYSTALS ≠ SPOILED
// Local f=0  → abs 638
// Local f=43 → abs 681 — "sealed" spoken, lid snap
// Local f=141→ abs 779 — CRYSTALS ≠ SPOILED chip pops
// Polish fix: slow chip drift as secondary sustain for the long 202f beat

const SEALED_IN = 2;       // KEEP IT SEALED in at start
const LID_SNAP_F = 43;     // abs 681 — lid seating snap (8f bounce)
const CRYSTALS_F = 141;    // abs 779 — CRYSTALS ≠ SPOILED pop

export const Beat4: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // KEEP IT SEALED in
  const sealedIn = wordSlamIn(frame, fps, SEALED_IN);

  // Lid snap: scale bounce 1.0→1.15→1.0 over 8f
  const lidSnap = interpolate(
    frame,
    [LID_SNAP_F, LID_SNAP_F + 4, LID_SNAP_F + 8],
    [1.0, 1.15, 1.0],
    {
      easing: Easing.linear,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  // CRYSTALS ≠ SPOILED chip pop
  const crystalScale = interpolate(
    frame,
    [CRYSTALS_F, CRYSTALS_F + 5, CRYSTALS_F + 10],
    [0.5, 1.05, 1.0],
    {
      easing: Easing.linear,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );
  const crystalOpacity = interpolate(frame, [CRYSTALS_F, CRYSTALS_F + 6], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Secondary sustain: slow chip drift (±12px sine over 202f) — prevents static stretch
  const chipDrift = 12 * Math.sin((frame / 202) * Math.PI * 2 * 1.5);

  // Jar glow pulse as sustain (steady pulse over beat4)
  const glowPulse = (Math.sin((frame / 60) * Math.PI * 2) + 1) / 2;

  // Settle toward hook layout by f=182 (abs 820): fade SEALED up slightly
  const settleY = interpolate(frame, [160, 202], [0, -30], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      <HoneyJar fillProgress={1} glowPulse={glowPulse * 0.4} />
      <JarLid scale={lidSnap} />

      {/* KEEP IT SEALED */}
      <div
        style={{
          position: "absolute",
          top: Y.hero + settleY,
          left: 0,
          width: WIDTH,
          textAlign: "center",
          fontFamily: ANTON,
          fontSize: 300,
          color: COLORS.hero,
          lineHeight: 1,
          transform: sealedIn.transform,
          opacity: sealedIn.opacity,
          textShadow: `0 0 56px ${COLORS.hero}44`,
        }}
      >
        KEEP IT
        {"\n"}SEALED
      </div>

      {/* CRYSTALS ≠ SPOILED chip */}
      <div
        style={{
          position: "absolute",
          top: Y.chip,
          left: 0,
          width: WIDTH,
          textAlign: "center",
          fontFamily: ARCHIVO_BLACK,
          fontSize: 100,
          color: COLORS.caution,
          transform: `scale(${crystalScale}) translateX(${chipDrift}px)`,
          opacity: crystalOpacity,
          letterSpacing: 2,
          textShadow: `0 0 32px ${COLORS.caution}66`,
        }}
      >
        CRYSTALS ≠ SPOILED
      </div>
    </AbsoluteFill>
  );
};
