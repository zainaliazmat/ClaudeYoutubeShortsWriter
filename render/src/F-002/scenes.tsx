import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { ANTON, MONO, COLORS, CONTENT_LEFT, CONTENT_RIGHT, Y } from "./data";
import { wordSlamIn, heroOvershoot, yearStampShake, countUp, crossDissolve } from "../lib/motion";

// Per-video scene layout for F-002 (T. rex vs Stegosaurus), on the shared lib motion
// primitives. Text/hero per beat; the persistent timeline is in Timeline.tsx.

const lane = (top: number): React.CSSProperties => ({
  position: "absolute", top, left: CONTENT_LEFT, right: CONTENT_RIGHT, textAlign: "center",
});

const Kicker: React.FC<{ text: string; color?: string }> = ({ text, color = COLORS.text }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div style={{ ...lane(Y.kicker), fontFamily: ANTON, fontSize: 58, letterSpacing: 3, color, ...wordSlamIn(frame, fps) }}>
      {text}
    </div>
  );
};

const YearHero: React.FC<{ text: string; color: string }> = ({ text, color }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div
      style={{
        ...lane(Y.hero - 170), fontFamily: ANTON, fontSize: 300, lineHeight: 1, color,
        whiteSpace: "nowrap", textShadow: `0 0 40px ${color}66`, ...yearStampShake(frame, fps),
      }}
    >
      {text}
    </div>
  );
};

export const Hook: React.FC<{ frozen?: boolean }> = ({ frozen = false }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const punch = spring({ frame: frame - 18, fps, config: { stiffness: 200, damping: 13 } });
  const youScale = frozen || frame < 18 ? 1 : interpolate(punch, [0, 1], [1.18, 1]);
  return (
    <AbsoluteFill>
      <div style={{ ...lane(Y.kicker), fontFamily: ANTON, fontSize: 64, letterSpacing: 6, color: COLORS.gold }}>
        DEEP TIME
      </div>
      <div style={{ ...lane(720), display: "flex", flexDirection: "column", alignItems: "center", fontFamily: ANTON, lineHeight: 1.0 }}>
        <div style={{ fontSize: 80, color: COLORS.text }}>T. rex is closer to</div>
        <div style={{ fontSize: 230, color: COLORS.gold, transform: `scale(${youScale})`, textShadow: `0 0 48px ${COLORS.gold}99`, margin: "4px 0" }}>
          YOU
        </div>
        <div style={{ fontSize: 84, color: COLORS.gold }}>than to Stegosaurus</div>
      </div>
    </AbsoluteFill>
  );
};

export const Beat1: React.FC = () => (
  <AbsoluteFill><Kicker text="STEGOSAURUS · LATE JURASSIC" color={COLORS.gold} /><YearHero text="150 MYA" color={COLORS.gold} /></AbsoluteFill>
);
export const Beat2: React.FC = () => (
  <AbsoluteFill><Kicker text="TYRANNOSAURUS REX" color={COLORS.gold} /><YearHero text="66 MYA" color={COLORS.gold} /></AbsoluteFill>
);

const GapCount: React.FC<{ kicker: string; target: number; color: string }> = ({ kicker, target, color }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const n = Math.round(countUp(frame, 0, 30, target));
  return (
    <AbsoluteFill>
      <Kicker text={kicker} color={color} />
      <div style={{ ...lane(Y.hero - 180), fontFamily: MONO, fontWeight: 700, fontSize: 300, lineHeight: 1, color, letterSpacing: "-0.04em", ...heroOvershoot(frame, fps) }}>
        {n}
      </div>
      <div style={{ ...lane(Y.hero + 150), fontFamily: ANTON, fontSize: 70, letterSpacing: 4, color: COLORS.text }}>
        MILLION YEARS
      </div>
    </AbsoluteFill>
  );
};

export const Beat3: React.FC = () => <GapCount kicker="STEGOSAURUS → T. REX" target={84} color={COLORS.gold} />;
export const Beat5: React.FC = () => <GapCount kicker="T. REX → TODAY" target={66} color={COLORS.ice} />;

export const Beat4: React.FC = () => (
  <AbsoluteFill><Kicker text="AND TO TODAY" color={COLORS.ice} /><YearHero text="HUMANS" color={COLORS.ice} /></AbsoluteFill>
);

export const Beat6: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <div style={{ ...lane(560), fontFamily: ANTON, fontSize: 76, color: COLORS.text }}>T. REX is</div>
      <div style={{ ...lane(660), fontFamily: ANTON, fontSize: 230, color: COLORS.ice, textShadow: `0 0 48px ${COLORS.ice}99`, ...heroOvershoot(frame, fps) }}>
        ~18M
      </div>
      <div style={{ ...lane(940), fontFamily: ANTON, fontSize: 76, color: COLORS.text }}>YEARS CLOSER to</div>
      <div style={{ ...lane(1040), fontFamily: ANTON, fontSize: 96, color: COLORS.gold }}>YOU</div>
    </AbsoluteFill>
  );
};

export const LoopBack: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = crossDissolve(frame, 0, 60, 0, 1);
  return (
    <AbsoluteFill style={{ opacity }}>
      <Hook frozen />
    </AbsoluteFill>
  );
};
