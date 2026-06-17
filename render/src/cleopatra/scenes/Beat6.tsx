import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { ANTON, COLORS, CONTENT_LEFT, CONTENT_RIGHT } from "../theme";
import { crossDissolve, heroOvershoot, payoffGlow, wordSlamIn } from "../motion";

// Scene 6 — Beat 6 / Payoff (global 702–855, sequence extended to 930 for the
// cross-dissolve). The two gaps (2,500 vs 2,000) flash, a shared-baseline
// comparison resolves (design §5 — gold up 660px, blue down 540px from the
// Cleopatra node), then "~450 YEARS CLOSER" stamps and glows. Local frames:
// flash 0–44, hero "~450" @26 (when the VO says "450"), "Moon landing" @85,
// "Pyramids" @113. Exit-fades 153–228 (global 855–930) into the Hook.

// Shared-baseline comparison: a single column split at a baseline — gold rises
// (Pyramid gap, 660px) above, ice drops (Moon gap, 540px) below, both to the
// same px/yr scale so the shorter ice bar makes "~450 closer" read at a glance.
const CMP_X = 980;
const CMP_W = 36;
const CMP_BASE = 950;
const CMP_SCALE = 0.55;
const GOLD_LEN = 660 * CMP_SCALE;
const ICE_LEN = 540 * CMP_SCALE;

const ComparisonBars: React.FC<{ opacity: number; iceGlow: number }> = ({
  opacity,
  iceGlow,
}) => (
  <div style={{ opacity }}>
    {/* Gold gap — rises above the shared baseline. */}
    <div
      style={{
        position: "absolute",
        left: CMP_X - CMP_W / 2,
        top: CMP_BASE - GOLD_LEN,
        width: CMP_W,
        height: GOLD_LEN,
        backgroundColor: COLORS.gold,
        borderRadius: CMP_W / 2,
        boxShadow: `0 0 16px ${COLORS.gold}88`,
      }}
    />
    {/* Ice gap — drops below the shared baseline (visibly shorter), glow-pulses. */}
    <div
      style={{
        position: "absolute",
        left: CMP_X - CMP_W / 2,
        top: CMP_BASE,
        width: CMP_W,
        height: ICE_LEN,
        backgroundColor: COLORS.ice,
        borderRadius: CMP_W / 2,
        boxShadow: `0 0 ${iceGlow}px ${COLORS.ice}`,
      }}
    />
    {/* Shared baseline tick. */}
    <div
      style={{
        position: "absolute",
        left: CMP_X - CMP_W,
        top: CMP_BASE - 2,
        width: CMP_W * 2,
        height: 4,
        backgroundColor: COLORS.text,
        borderRadius: 2,
      }}
    />
    {/* Length labels (left of the column, inside the safe band). */}
    <div
      style={{
        position: "absolute",
        left: CMP_X - 250,
        top: CMP_BASE - GOLD_LEN - 6,
        width: 210,
        textAlign: "right",
        fontFamily: ANTON,
        fontSize: 40,
        color: COLORS.gold,
      }}
    >
      2,500
    </div>
    <div
      style={{
        position: "absolute",
        left: CMP_X - 250,
        top: CMP_BASE + ICE_LEN - 36,
        width: 210,
        textAlign: "right",
        fontFamily: ANTON,
        fontSize: 40,
        color: COLORS.ice,
      }}
    >
      2,000
    </div>
  </div>
);

export const Beat6: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const exit = crossDissolve(frame, 153, 228, 1, 0);
  const glow = payoffGlow(frame, 0, 55);
  const heroPop = heroOvershoot(frame, fps, 26);
  const flash = crossDissolve(frame, 0, 8, 0, 1) * crossDissolve(frame, 32, 44, 1, 0);
  const cmpOpacity = crossDissolve(frame, 40, 58, 0, 1);

  const line = (size: number, color: string = COLORS.text): React.CSSProperties => ({
    fontFamily: ANTON,
    fontSize: size,
    letterSpacing: 2,
    color,
    textAlign: "center",
    lineHeight: 1.05,
  });

  return (
    <AbsoluteFill style={{ opacity: exit }}>
      {/* Shared-baseline comparison (design §5). */}
      <ComparisonBars opacity={cmpOpacity} iceGlow={glow.blur} />

      {/* The two gaps flash first. */}
      <div
        style={{
          position: "absolute",
          top: 470,
          left: CONTENT_LEFT,
          right: CONTENT_RIGHT,
          textAlign: "center",
          opacity: flash,
          fontFamily: ANTON,
          fontSize: 96,
          letterSpacing: 4,
        }}
      >
        <span style={{ color: COLORS.gold }}>2,500</span>
        <span style={{ color: COLORS.text, fontSize: 56 }}> vs </span>
        <span style={{ color: COLORS.ice }}>2,000</span>
      </div>

      {/* Payoff, centered. */}
      <div
        style={{
          position: "absolute",
          top: 700,
          left: CONTENT_LEFT,
          right: CONTENT_RIGHT,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div style={{ ...line(64), ...wordSlamIn(frame, fps, 26) }}>SHE&apos;S</div>
        <div
          style={{
            ...line(280, COLORS.ice),
            transform: heroPop.transform,
            opacity: heroPop.opacity,
            textShadow: `0 0 ${glow.blur}px ${COLORS.ice}`,
            lineHeight: 1,
          }}
        >
          ~450
        </div>
        <div style={{ ...line(64), ...wordSlamIn(frame, fps, 26) }}>
          YEARS CLOSER
        </div>
        <div
          style={{
            ...line(68, COLORS.ice),
            marginTop: 24,
            ...wordSlamIn(frame, fps, 85),
          }}
        >
          to the Moon landing
        </div>
        <div
          style={{ ...line(68, COLORS.gold), ...wordSlamIn(frame, fps, 113) }}
        >
          than the Pyramids
        </div>
      </div>
    </AbsoluteFill>
  );
};
