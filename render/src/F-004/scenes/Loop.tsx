import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { COLORS, ANTON, Y, WIDTH } from "../data";
import { HoneyJar } from "./HoneyJar";

// Loop (frames 840–915): cross-dissolve back to the Hook hero composition.
// The outgoing content (prior beat4 state) fades out f840→870 (local f=0→30).
// The Hook hero (ONE FOOD / NEVER EXPIRES) fades in local f=15→45.
// By local f=45 (abs 885) the Hook composition is fully present at full opacity —
// identical to frame 0 (same colors, font, position, jar present).
// The jar is also reset to frame-0 state (fillProgress=0, glowPulse=0).

export const Loop: React.FC = () => {
  const frame = useCurrentFrame();

  // Outgoing dissolve: fade out over local f=0→30
  const outOpacity = interpolate(frame, [0, 30], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Incoming hook: fade in over local f=15→45
  const inOpacity = interpolate(frame, [15, 45], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      {/* Outgoing beat4 residue dissolves out */}
      <AbsoluteFill style={{ opacity: outOpacity }}>
        <div
          style={{
            position: "absolute",
            top: Y.hero,
            left: 0,
            width: WIDTH,
            textAlign: "center",
            fontFamily: ANTON,
            fontSize: 300,
            color: COLORS.hero,
            lineHeight: 1,
          }}
        >
          KEEP IT{"\n"}SEALED
        </div>
      </AbsoluteFill>

      {/* Incoming Hook — identical composition/colors/position to frame 0 */}
      <AbsoluteFill style={{ opacity: inOpacity }}>
        {/* Jar at frame-0 state: no fill, no glow */}
        <HoneyJar fillProgress={0} glowPulse={0} />

        {/* ONE FOOD hero */}
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

        {/* NEVER EXPIRES — matching frame 0 exactly */}
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
    </AbsoluteFill>
  );
};
