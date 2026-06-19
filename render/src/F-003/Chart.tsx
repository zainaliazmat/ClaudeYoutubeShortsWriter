import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { WIDTH, HEIGHT } from "../lib/safeArea";
import {
  linearScale,
  revealPoints,
  linePath,
  areaPath,
  curveMonotoneX,
  type Pt,
} from "../lib/dataviz";
import { COLORS, CURVE, N_MAX, CROSS_N, NODES, CHART_BOX, ANTON, MONO, SCENES, TOTAL } from "./data";

// Persistent D3 growth-curve furniture (all frames), LOOP-SAFE. The reveal cutoff
// t(frame) holds at x=23 (the 50% crossing = the thumbnail) through hook+beat1, grows
// to x=70 across the climbing beats, holds, then retracts to x=23 at the loop tail — so
// state(0) == state(TOTAL). Scale-honest by construction: x-index == group size (dense
// P(n) sampling), so the gold 50% gridline crosses the curve at the true x=23.

const CROSS_T = CROSS_N / N_MAX; // 23/70 — the reveal frontier that reaches x=23
const GROW_END = 620; // curve fully drawn by mid-beat4

export const Chart: React.FC = () => {
  const frame = useCurrentFrame();

  const t = interpolate(
    frame,
    [0, SCENES.beat2.from, GROW_END, SCENES.loopBack.from, TOTAL],
    [CROSS_T, CROSS_T, 1, 1, CROSS_T],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  const xs = linearScale([0, N_MAX], [CHART_BOX.x, CHART_BOX.x + CHART_BOX.w]);
  const ys = linearScale([0, 100], [CHART_BOX.y + CHART_BOX.h, CHART_BOX.y]);
  const pts: Pt[] = CURVE.map((p, n) => ({ x: xs(n), y: ys(p) }));
  const shown = revealPoints(pts, t);
  const dArea = areaPath(shown, CHART_BOX.y + CHART_BOX.h, curveMonotoneX);
  const dLine = linePath(shown, curveMonotoneX);

  const revealX = t * N_MAX;
  const y50 = ys(50);
  const x23 = xs(CROSS_N);
  const baseY = CHART_BOX.y + CHART_BOX.h;
  const rightX = CHART_BOX.x + CHART_BOX.w;

  return (
    <svg width={WIDTH} height={HEIGHT} style={{ position: "absolute", inset: 0 }}>
      {/* x-axis baseline */}
      <line x1={CHART_BOX.x} y1={baseY} x2={rightX} y2={baseY} stroke={COLORS.rule} strokeWidth={3} />
      {/* gold 50% gridline */}
      <line
        x1={CHART_BOX.x}
        y1={y50}
        x2={rightX}
        y2={y50}
        stroke={COLORS.gold}
        strokeWidth={3}
        strokeDasharray="14 12"
        opacity={0.8}
      />
      <text x={CHART_BOX.x + 6} y={y50 - 16} fill={COLORS.gold} fontFamily={MONO} fontSize={32} fontWeight={700}>
        50%
      </text>
      {/* gold x=23 marker */}
      <line x1={x23} y1={CHART_BOX.y} x2={x23} y2={baseY} stroke={COLORS.gold} strokeWidth={3} opacity={0.65} />
      <text x={x23} y={baseY + 46} fill={COLORS.gold} fontFamily={ANTON} fontSize={42} textAnchor="middle">
        23
      </text>
      {/* area fill + curve stroke */}
      <path d={dArea} fill={COLORS.accent} fillOpacity={0.18} />
      <path
        d={dLine}
        fill="none"
        stroke={COLORS.accent}
        strokeWidth={9}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* sourced node dots — lit once the reveal frontier passes their group size */}
      {NODES.map((node) => {
        const lit = revealX >= node.n - 0.001;
        return (
          <circle
            key={node.n}
            cx={xs(node.n)}
            cy={ys(CURVE[node.n])}
            r={lit ? 11 : 7}
            fill={lit ? COLORS.accent : "#2A3766"}
            stroke={COLORS.accent}
            strokeWidth={3}
            opacity={lit ? 1 : 0.5}
          />
        );
      })}
      {/* the 50%x23 crossing — the gold focal point (matches the hero number) */}
      <circle cx={x23} cy={y50} r={14} fill={COLORS.gold} stroke={COLORS.bgBottom} strokeWidth={3} />
      {/* axis end labels */}
      <text x={rightX} y={baseY + 46} fill={COLORS.text} fontFamily={MONO} fontSize={26} textAnchor="end" opacity={0.6}>
        70 people
      </text>
    </svg>
  );
};
