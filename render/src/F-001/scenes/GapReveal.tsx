import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { ANTON, COLORS, CONTENT_LEFT, CONTENT_RIGHT, MONO, Y } from "../data";
import { countUp, heroOvershoot } from "../../lib/motion";
import { withCommas } from "./parts";

// Shared gap-reveal beat (Beats 3 & 5). A live Space Mono counter ticks 0→target
// over ~30f (ease-OUT, clamped ≥0 — never negative), then the settled Anton hero
// number stamps in with overshoot, "YEARS" below. The spine segment grows in
// sync (driven by TimelineLayer), so the screen is never a lone digit.
const COUNT_END = 30;

export const GapReveal: React.FC<{
  target: number;
  color: string;
}> = ({ target, color }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const counting = frame < COUNT_END;
  const value = countUp(frame, 0, COUNT_END, target);
  const stamp = heroOvershoot(frame, fps, COUNT_END);

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          top: Y.hero - 200,
          left: CONTENT_LEFT,
          right: CONTENT_RIGHT,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <span
          style={{
            fontFamily: counting ? MONO : ANTON,
            fontWeight: counting ? 700 : 400,
            fontSize: counting ? 200 : 300,
            lineHeight: 1,
            color,
            letterSpacing: counting ? "-0.04em" : 0,
            whiteSpace: "nowrap",
            textShadow: `0 0 44px ${color}66`,
            transform: counting ? "none" : stamp.transform,
          }}
        >
          ~{counting ? withCommas(value) : withCommas(target)}
        </span>
        <span
          style={{
            fontFamily: ANTON,
            fontSize: 96,
            letterSpacing: 8,
            color: COLORS.text,
            marginTop: 6,
          }}
        >
          YEARS
        </span>
      </div>
    </AbsoluteFill>
  );
};
