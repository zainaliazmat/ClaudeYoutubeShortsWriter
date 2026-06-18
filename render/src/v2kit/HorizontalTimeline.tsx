import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { ANTON } from "./parts";
import { Glyph, type GlyphKind } from "./Glyphs";
import { payoffGlow } from "../lib/motion";
import type { V2Palette } from "./Palette";

// Scale-honest horizontal payoff timeline. Three nodes at fractional positions
// (computed from the verified dates); the middle subject sits PAST center so the
// geometry itself shows it is closer to the right (today / the Moon). The gap bars
// (ancient = accent1 left, modern = accent2 right) grow from the subject outward; the
// shorter modern bar is the visual payoff.

export type TLNode = { label: string; sub: string; pos: number; kind: GlyphKind; color: string };

const X0 = 120;
const X1 = 960;
const RULE_Y = 1000;
const span = X1 - X0;
const xAt = (pos: number) => X0 + pos * span;

export const HorizontalTimeline: React.FC<{
  nodes: TLNode[];
  payoffLead: string; // e.g. "~450 YEARS"
  payoffTail: string; // e.g. "CLOSER TO THE MOON"
  palette: V2Palette;
}> = ({ nodes, payoffLead, payoffTail, palette }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const draw = spring({ frame, fps, config: { stiffness: 120, damping: 26 } }); // rule draw 0→1
  const mid = nodes[1];
  const left = nodes[0];
  const right = nodes[2];

  // bars grow from the subject outward, slightly after the rule draws
  const barP = spring({ frame: frame - 14, fps, config: { stiffness: 110, damping: 24 } });
  const glow = payoffGlow(frame, 30, 50);

  const midX = xAt(mid.pos);
  const leftW = (midX - xAt(left.pos)) * barP;
  const rightW = (xAt(right.pos) - midX) * barP;

  const nodeIn = (pos: number) =>
    spring({ frame: frame - 6 - pos * 10, fps, config: { stiffness: 200, damping: 16 } });

  return (
    <>
      {/* base rule, draws left→right */}
      <div
        style={{
          position: "absolute",
          left: X0,
          top: RULE_Y - 4,
          width: span * draw,
          height: 8,
          background: palette.textDim,
          opacity: 0.5,
          borderRadius: 4,
        }}
      />
      {/* gap bars from subject outward */}
      <div
        style={{
          position: "absolute",
          left: midX - leftW,
          top: RULE_Y - 9,
          width: leftW,
          height: 18,
          background: left.color,
          borderRadius: 9,
          boxShadow: `0 0 18px ${left.color}88`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: midX,
          top: RULE_Y - 9,
          width: rightW,
          height: 18,
          background: right.color,
          borderRadius: 9,
          boxShadow: `0 0 ${glow.blur}px ${right.color}`,
        }}
      />

      {nodes.map((n, i) => {
        const x = xAt(n.pos);
        const p = nodeIn(n.pos);
        const op = interpolate(p, [0, 1], [0, 1], { extrapolateRight: "clamp" });
        const isSubject = i === 1;
        return (
          <React.Fragment key={n.label}>
            <div style={{ position: "absolute", left: x - 110, top: RULE_Y - 320, width: 220, textAlign: "center", opacity: op }}>
              <Glyph kind={n.kind} cx={110} cy={130} size={isSubject ? 230 : 180} color={n.color} glow={isSubject ? 26 : 16} />
            </div>
            {/* node dot */}
            <div
              style={{
                position: "absolute",
                left: x - (isSubject ? 20 : 14),
                top: RULE_Y - (isSubject ? 20 : 14),
                width: isSubject ? 40 : 28,
                height: isSubject ? 40 : 28,
                borderRadius: "50%",
                background: isSubject ? palette.text : n.color,
                opacity: op,
                boxShadow: `0 0 ${isSubject ? 22 : 12}px ${isSubject ? palette.text : n.color}`,
              }}
            />
            <div
              style={{
                position: "absolute",
                left: x - 150,
                top: RULE_Y + 26,
                width: 300,
                textAlign: "center",
                opacity: op,
                fontFamily: ANTON,
              }}
            >
              <div style={{ fontSize: isSubject ? 46 : 38, color: palette.text, letterSpacing: 2 }}>{n.label}</div>
              <div style={{ fontSize: 34, color: n.color, marginTop: 4 }}>{n.sub}</div>
            </div>
          </React.Fragment>
        );
      })}

      {/* payoff line */}
      <div
        style={{
          position: "absolute",
          left: 60,
          right: 60,
          top: RULE_Y + 210,
          textAlign: "center",
          fontFamily: ANTON,
          lineHeight: 1.02,
        }}
      >
        <div style={{ fontSize: 168, color: right.color, textShadow: `0 0 ${glow.blur + 8}px ${right.color}, 0 6px 18px rgba(0,0,0,0.5)` }}>
          {payoffLead}
        </div>
        <div style={{ fontSize: 72, color: palette.text, letterSpacing: 3, marginTop: 6 }}>{payoffTail}</div>
      </div>
    </>
  );
};
