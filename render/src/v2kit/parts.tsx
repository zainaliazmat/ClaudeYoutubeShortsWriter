import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont as loadAnton } from "@remotion/google-fonts/Anton";
import { SAFE_INSET_X } from "../lib/safeArea";
import { interpolate, spring } from "remotion";
import { wordSlamIn, yearStampShake, countUp } from "../lib/motion";
import type { V2Palette } from "./Palette";

export const { fontFamily: ANTON } = loadAnton("normal", { weights: ["400"], subsets: ["latin"] });

// Deterministic thousands formatter.
export const withCommas = (n: number): string =>
  Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

const lane = (top: number): React.CSSProperties => ({
  position: "absolute",
  top,
  left: SAFE_INSET_X,
  right: SAFE_INSET_X,
  textAlign: "center",
});

// Kicker chip — pill-framed eyebrow, top band, slam-in.
export const Chip: React.FC<{ text: string; palette: V2Palette; delay?: number; top?: number }> = ({
  text,
  palette,
  delay = 0,
  top = 250,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div style={{ ...lane(top), ...wordSlamIn(frame, fps, delay) }}>
      <span
        style={{
          fontFamily: ANTON,
          fontSize: 46,
          letterSpacing: 6,
          color: palette.text,
          background: palette.chipBg,
          border: `2px solid ${palette.accent1}66`,
          padding: "12px 28px",
          borderRadius: 999,
        }}
      >
        {text}
      </span>
    </div>
  );
};

// Small dim sub-label beneath the chip.
export const SubLabel: React.FC<{ text: string; palette: V2Palette; delay?: number; top?: number }> = ({
  text,
  palette,
  delay = 6,
  top = 332,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div
      style={{
        ...lane(top),
        ...wordSlamIn(frame, fps, delay),
        fontFamily: ANTON,
        fontSize: 40,
        letterSpacing: 4,
        color: palette.textDim,
      }}
    >
      {text}
    </div>
  );
};

// Huge year/era stamp — stone-impact shake.
export const YearHero: React.FC<{
  text: string;
  color: string;
  delay?: number;
  size?: number;
  top?: number;
}> = ({ text, color, delay = 8, size = 320, top = 720 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div
      style={{
        ...lane(top),
        ...yearStampShake(frame, fps, delay),
        fontFamily: ANTON,
        fontSize: size,
        lineHeight: 0.92,
        color,
        whiteSpace: "nowrap",
        textShadow: `0 0 48px ${color}77, 0 6px 18px rgba(0,0,0,0.5)`,
      }}
    >
      {text}
    </div>
  );
};

// Count-up hero: number (count 0→target, ease-out, ≤36f) + unit line.
export const CountHero: React.FC<{
  target: number;
  unit: string;
  color: string;
  prefix?: string;
  delay?: number;
  top?: number;
}> = ({ target, unit, color, prefix = "", delay = 6, top = 640 }) => {
  const frame = useCurrentFrame();
  const value = Math.round(countUp(frame, delay, delay + 30, target));
  return (
    <div style={lane(top)}>
      <div
        style={{
          fontFamily: ANTON,
          fontSize: 300,
          lineHeight: 0.9,
          color,
          textShadow: `0 0 50px ${color}77, 0 6px 18px rgba(0,0,0,0.5)`,
        }}
      >
        {prefix}
        {withCommas(value)}
      </div>
      <div style={{ fontFamily: ANTON, fontSize: 84, letterSpacing: 4, color, marginTop: 8 }}>{unit}</div>
    </div>
  );
};

// Hook claim — stacked lines with accent-keyword highlight + a punch on the hero word.
export type ClaimLine = { text: string; size: number; accent?: 1 | 2; punch?: boolean };

export const HookClaim: React.FC<{ lines: ClaimLine[]; palette: V2Palette; top?: number }> = ({
  lines,
  palette,
  top = 520,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  // Fully lit at frame 0 (no fade-in): the punch is a late scale emphasis that
  // starts and settles at 1.0, so frame 0 and the frozen loop-back pose match.
  const punchSpring = spring({ frame: frame - 16, fps, config: { stiffness: 200, damping: 13 } });
  const punchScale = frame < 16 ? 1 : interpolate(punchSpring, [0, 1], [1.16, 1]);
  return (
    <div
      style={{
        position: "absolute",
        top,
        left: SAFE_INSET_X,
        right: SAFE_INSET_X,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
        fontFamily: ANTON,
        textAlign: "center",
        lineHeight: 1.0,
      }}
    >
      {lines.map((l, i) => {
        const color = l.accent === 1 ? palette.accent1 : l.accent === 2 ? palette.accent2 : palette.text;
        return (
          <div
            key={i}
            style={{
              fontSize: l.size,
              color,
              textShadow: l.accent != null ? `0 0 36px ${color}88` : "0 4px 12px rgba(0,0,0,0.5)",
              transform: l.punch ? `scale(${punchScale})` : undefined,
            }}
          >
            {l.text}
          </div>
        );
      })}
    </div>
  );
};
