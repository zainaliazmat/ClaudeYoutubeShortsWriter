import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { ANTON, COLORS, CONTENT_LEFT, CONTENT_RIGHT, Y } from "../theme";

// Scene 0 — Hook (frames 0–45). Frame 0 is FULLY LIT with the complete claim
// (incl. "YOU") — no fade-in (fixes the v2 black-open). Only "YOU" emphasis
// punches in at frame 24. Also reused (frozen) as the loop-back target, so
// frame 840 pixel-matches frame 0.
export const Hook: React.FC<{ frozen?: boolean }> = ({ frozen = false }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // "YOU" stays at scale 1 until frame 24, then a quick overshoot punch settles
  // back to 1 — the word is on screen at full size the whole time.
  const punch = spring({
    frame: frame - 24,
    fps,
    config: { stiffness: 200, damping: 13 },
  });
  const youScale = frozen || frame < 24 ? 1 : interpolate(punch, [0, 1], [1.18, 1]);

  return (
    <AbsoluteFill>
      {/* Context kicker */}
      <div
        style={{
          position: "absolute",
          top: Y.kicker,
          left: CONTENT_LEFT,
          right: CONTENT_RIGHT,
          textAlign: "center",
          fontFamily: ANTON,
          fontSize: 70,
          letterSpacing: 6,
          color: COLORS.gold,
        }}
      >
        EGYPT&apos;S QUEEN
      </div>

      {/* Hero claim — stacked lines, "YOU" dominant. */}
      <div
        style={{
          position: "absolute",
          top: 700,
          left: CONTENT_LEFT,
          right: CONTENT_RIGHT,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          fontFamily: ANTON,
          textAlign: "center",
          lineHeight: 1.0,
        }}
      >
        <div style={{ fontSize: 76, color: COLORS.text }}>
          Cleopatra is closer to
        </div>
        <div
          style={{
            fontSize: 220,
            color: COLORS.gold,
            display: "inline-block",
            transform: `scale(${youScale})`,
            textShadow: `0 0 48px ${COLORS.gold}99`,
            margin: "4px 0",
          }}
        >
          YOU
        </div>
        <div style={{ fontSize: 96, color: COLORS.gold }}>
          than the Pyramids
        </div>
      </div>
    </AbsoluteFill>
  );
};
