import React from "react";
import { useCurrentFrame, interpolate, Easing } from "remotion";
import { WIDTH, HEIGHT } from "../safeArea";
import { linearScale, type ChartBox } from "./scales";
import { lengthFor } from "./scaleHonest";

// GapBars — horizontal scale-honest bars for comparing N magnitudes (e.g. two time
// gaps). Every bar's width is `lengthFor(value, domainMax, box.w)` (one shared
// px-per-unit factor → scale-honest by construction: the shorter gap reads shorter),
// multiplied by a frame-driven reveal. Pure function of frame; d3-scale only (axis
// ticks via linearScale.ticks). No transitions, no wall-clock.

export type GapItem = { label: string; value: number; color: string; display?: string };

export const GapBars: React.FC<{
  items: GapItem[];
  domainMax: number;
  box: ChartBox;
  fontFamily: string;
  startFrame?: number;
  endFrame?: number;
  ink?: string;
  dim?: string;
  /** draw faint x-axis gridlines from the d3 scale ticks */
  ticks?: boolean;
}> = ({
  items,
  domainMax,
  box,
  fontFamily,
  startFrame = 6,
  endFrame = 34,
  ink = "#ECEFF3",
  dim = "#93A0AF",
  ticks = true,
}) => {
  const frame = useCurrentFrame();
  const grow = interpolate(frame, [startFrame, endFrame], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const x = linearScale([0, domainMax], [box.x, box.x + box.w]);
  const rowH = box.h / items.length;
  const barH = Math.min(96, rowH * 0.46);

  return (
    <svg width={WIDTH} height={HEIGHT} style={{ position: "absolute", inset: 0 }}>
      {ticks &&
        x.ticks(4).map((tv) => (
          <line key={`t${tv}`} x1={x(tv)} y1={box.y} x2={x(tv)} y2={box.y + box.h} stroke={dim} strokeWidth={1} opacity={0.18} />
        ))}
      {items.map((it, i) => {
        const cy = box.y + rowH * i + rowH / 2;
        const full = lengthFor(it.value, domainMax, box.w);
        const w = Math.max(0, full * grow);
        const labelY = cy - barH / 2 - 18;
        return (
          <g key={it.label}>
            <text x={box.x} y={labelY} fill={dim} fontFamily={fontFamily} fontSize={34} fontWeight={600}>
              {it.label}
            </text>
            {/* track */}
            <rect x={box.x} y={cy - barH / 2} width={box.w} height={barH} rx={barH / 2} fill="rgba(255,255,255,0.06)" />
            {/* value bar */}
            <rect x={box.x} y={cy - barH / 2} width={w} height={barH} rx={barH / 2} fill={it.color} />
            <text
              x={box.x + w + (w < box.w - 200 ? 20 : -20)}
              y={cy + 18}
              fill={ink}
              fontFamily={fontFamily}
              fontSize={54}
              fontWeight={800}
              textAnchor={w < box.w - 200 ? "start" : "end"}
            >
              {it.display ?? String(it.value)}
            </text>
          </g>
        );
      })}
    </svg>
  );
};
