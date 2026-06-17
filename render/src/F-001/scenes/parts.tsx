import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { ANTON, COLORS, CONTENT_LEFT, CONTENT_RIGHT } from "../data";
import { wordSlamIn, yearStampShake } from "../../lib/motion";

// Deterministic thousands formatter (no locale dependence).
export const withCommas = (n: number): string => {
  const s = Math.round(n).toString();
  return s.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

// Content lane: centered in the region right of the spine (x 300–1040).
export const laneBlock = (top: number): React.CSSProperties => ({
  position: "absolute",
  top,
  left: CONTENT_LEFT,
  right: CONTENT_RIGHT,
  textAlign: "center",
});

// Context kicker — Anton, upper third, slam-in.
export const Kicker: React.FC<{
  text: string;
  top: number;
  size?: number;
  color?: string;
  delay?: number;
}> = ({ text, top, size = 64, color = COLORS.text, delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div
      style={{
        ...laneBlock(top),
        fontFamily: ANTON,
        fontSize: size,
        letterSpacing: 3,
        color,
        ...wordSlamIn(frame, fps, delay),
      }}
    >
      {text}
    </div>
  );
};

// Hero year stamp — Anton, huge, stone-impact shake. Vertically centered on top.
export const YearStamp: React.FC<{
  text: string;
  top: number;
  color?: string;
  size?: number;
  delay?: number;
}> = ({ text, top, color = COLORS.gold, size = 220, delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const shake = yearStampShake(frame, fps, delay);
  return (
    <div
      style={{
        ...laneBlock(top - size * 0.6),
        fontFamily: ANTON,
        fontSize: size,
        lineHeight: 1,
        color,
        whiteSpace: "nowrap",
        textShadow: `0 0 40px ${color}66`,
        ...shake,
      }}
    >
      {text}
    </div>
  );
};
