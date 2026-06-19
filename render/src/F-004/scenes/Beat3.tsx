import React from "react";
import { AbsoluteFill, Easing, interpolate, Sequence, useCurrentFrame, useVideoConfig } from "remotion";
import { wordSlamIn } from "../../lib/motion";
import { LottieAccent } from "../../lib/lottie";
import { COLORS, ANTON, ARCHIVO_BLACK, Y, WIDTH } from "../data";
import { HoneyJar } from "./HoneyJar";

// Beat3 (frames 452–638): REVEAL / PAYOFF
//   local f=0  → abs 452  → ANCIENT EGYPT slides in
//   local f=11 → abs 463  → ANCIENT EGYPT visible
//   local f=117→ abs 569  → 1000s OF YEARS OLD appears
//   local f=159→ abs 611  → STILL PRESERVED wipes in + Lottie accent draws
//
// LottieAccent: accent-beat3.json (fr:30, 22f natural, window=27f)
// loopForWindow(22, 27): 22 < 27 = true BUT 27 % 22 = 5 ≠ 0 → loop=false (plays once, holds)
// 22f < 27f window → no truncation. The animation completes ~local f=181 (abs 633), holds to beat end.
//
// Build-time overrun check: 22f natural < 27f window — no truncation, no warning needed.

// Local frame offsets
const EGYPT_IN = 11;       // "ANCIENT EGYPT" in (abs 463)
const YEARS_IN = 117;      // "1000s OF YEARS OLD" in (abs 569)
const WIPE_START = 159;    // "STILL PRESERVED" wipe starts (abs 611, spoken "preserved")
const LOTTIE_START = 159;  // Lottie accent starts (abs 611)
const LOTTIE_WINDOW = 27;  // frames [611, 638) = 27f

export const Beat3: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ANCIENT EGYPT slides in (wordSlamIn)
  const egyptIn = wordSlamIn(frame, fps, EGYPT_IN);

  // 1000s OF YEARS OLD in
  const yearsIn = wordSlamIn(frame, fps, YEARS_IN);

  // STILL PRESERVED reveal wipe: left→right mask 12f easeOut, starts at local f=159
  const wipePct = interpolate(frame, [WIPE_START, WIPE_START + 12], [0, 100], {
    easing: Easing.out(Easing.quad),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      <HoneyJar fillProgress={1} />

      {/* Upper band: ANCIENT EGYPT context */}
      <div
        style={{
          position: "absolute",
          top: Y.upper + 20,
          left: 0,
          width: WIDTH,
          textAlign: "center",
          fontFamily: ARCHIVO_BLACK,
          fontSize: 88,
          color: COLORS.accent,
          letterSpacing: 4,
          transform: egyptIn.transform,
          opacity: egyptIn.opacity,
          textShadow: `0 0 32px ${COLORS.accent}66`,
        }}
      >
        ANCIENT EGYPT
      </div>

      {/* Center: 1000s OF YEARS OLD */}
      <div
        style={{
          position: "absolute",
          top: Y.hero - 20,
          left: 0,
          width: WIDTH,
          textAlign: "center",
          fontFamily: ANTON,
          fontSize: 260,
          color: COLORS.hero,
          lineHeight: 1,
          transform: yearsIn.transform,
          opacity: yearsIn.opacity,
          textShadow: `0 0 56px ${COLORS.hero}44`,
        }}
      >
        1000s OF
        {"\n"}YEARS OLD
      </div>

      {/* STILL PRESERVED — reveal wipe left→right */}
      <div
        style={{
          position: "absolute",
          top: Y.chip - 60,
          left: 0,
          width: WIDTH,
          textAlign: "center",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            fontFamily: ANTON,
            fontSize: 290,
            color: COLORS.payoff,
            lineHeight: 1,
            textShadow: `0 0 72px ${COLORS.payoff}88`,
            WebkitMaskImage: `linear-gradient(90deg, black ${wipePct}%, transparent ${wipePct}%)`,
            maskImage: `linear-gradient(90deg, black ${wipePct}%, transparent ${wipePct}%)`,
          }}
        >
          STILL
          {"\n"}PRESERVED
        </div>
      </div>

      {/* Lottie accent: accent-beat3.json draws at local f=159 (abs 611, "preserved")
          windowFrames=27 → loopForWindow(22,27)=false → plays once, holds completed check.
          Placed above-captions, sizePx=320. */}
      <Sequence from={LOTTIE_START} durationInFrames={LOTTIE_WINDOW}>
        <LottieAccent
          src="accent-beat3.json"
          placement={{ anchor: "above-captions", sizePx: 320 }}
          windowFrames={LOTTIE_WINDOW}
        />
      </Sequence>
    </AbsoluteFill>
  );
};
