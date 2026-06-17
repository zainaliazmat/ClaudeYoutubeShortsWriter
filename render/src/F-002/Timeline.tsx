import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, ANTON, SPINE_X, SPINE_W, STEGO_Y, TREX_Y, NOW_Y, SCENES } from "./data";
import { segmentGrow, payoffGlow } from "../lib/motion";

// Persistent vertical deep-time spine (all frames). Three nodes (Stegosaurus top,
// T. rex mid, Today bottom) + two scale-honest gap bars: gold Stego->T.rex (672px,
// 84 My) grows on beat3, ice T.rex->today (528px, 66 My) grows on beat5 and
// glow-pulses on the payoff. Geometry is computed from the dates (8 px/My).

const Node: React.FC<{ y: number; color: string; label: string; sub?: string; lit: boolean }> = ({
  y, color, label, sub, lit,
}) => (
  <>
    <div
      style={{
        position: "absolute", left: SPINE_X - 21, top: y - 21, width: 42, height: 42,
        borderRadius: "50%", background: lit ? color : "#2A3766",
        boxShadow: lit ? `0 0 36px ${color}cc` : "none", border: `4px solid ${color}`,
      }}
    />
    <div
      style={{
        position: "absolute", left: SPINE_X + 44, top: y - 30, width: 520,
        fontFamily: ANTON, color: lit ? color : "#8FA0C8", lineHeight: 1.05,
      }}
    >
      <div style={{ fontSize: 46, letterSpacing: 1 }}>{label}</div>
      {sub ? <div style={{ fontSize: 26, color: COLORS.text, opacity: 0.7 }}>{sub}</div> : null}
    </div>
  </>
);

export const Timeline: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const goldGrow = segmentGrow(frame, fps, SCENES.beat3.from);
  const iceGrow = segmentGrow(frame, fps, SCENES.beat5.from);
  const glow = payoffGlow(frame, SCENES.beat6.from);
  const inPayoff = frame >= SCENES.beat6.from;

  const goldH = (TREX_Y - STEGO_Y) * goldGrow;
  const iceH = (NOW_Y - TREX_Y) * iceGrow;

  return (
    <>
      {/* faint full spine */}
      <div
        style={{
          position: "absolute", left: SPINE_X - SPINE_W / 2, top: STEGO_Y, width: SPINE_W,
          height: NOW_Y - STEGO_Y, background: COLORS.rule, opacity: 0.4, borderRadius: SPINE_W,
        }}
      />
      {/* gold gap bar Stego->T.rex */}
      <div
        style={{
          position: "absolute", left: SPINE_X - SPINE_W / 2, top: STEGO_Y, width: SPINE_W,
          height: goldH, background: COLORS.gold, borderRadius: SPINE_W,
          boxShadow: `0 0 20px ${COLORS.gold}99`,
        }}
      />
      {/* ice gap bar T.rex->today */}
      <div
        style={{
          position: "absolute", left: SPINE_X - SPINE_W / 2, top: TREX_Y, width: SPINE_W,
          height: iceH, background: COLORS.ice, borderRadius: SPINE_W,
          boxShadow: inPayoff
            ? `0 0 ${glow.blur}px ${COLORS.ice}`
            : `0 0 20px ${COLORS.ice}99`,
          opacity: inPayoff ? glow.opacity : 1,
        }}
      />
      <Node y={STEGO_Y} color={COLORS.gold} label="STEGOSAURUS" sub="150 MYA" lit={frame >= SCENES.beat1.from} />
      <Node y={TREX_Y} color={COLORS.gold} label="T. REX" sub="66 MYA" lit={frame >= SCENES.beat2.from} />
      <Node y={NOW_Y} color={COLORS.ice} label="TODAY" sub="HUMANS" lit={frame >= SCENES.beat4.from} />
    </>
  );
};
