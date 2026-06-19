import React from "react";
import { useCurrentFrame, interpolate, Easing } from "remotion";
import { WIDTH, HEIGHT } from "../safeArea";
import { bandScale, type ChartBox } from "./scales";
import { lengthFor } from "./scaleHonest";
import { categoricalRamp } from "./colors";

// BarChart — categorical bars that grow from a frame-driven height. Each bar's
// FULL height is `lengthFor(value, domainMax, box.h)` (scale-honest by
// construction: the length ratio equals the data ratio), multiplied by the
// frame-driven `grow` factor for the reveal. Colors come from the deterministic
// palette ramp. Pure function of frame.

export const BarChart: React.FC<{
  values: number[];
  labels: string[];
  box: ChartBox;
  /** y-axis max; defaults to max(values). Bars are scale-honest through 0. */
  domainMax?: number;
  /** accent hex the categorical ramp is derived from */
  accentHex: string;
  startFrame?: number;
  endFrame?: number;
  cornerRadius?: number;
}> = ({
  values,
  labels,
  box,
  domainMax,
  accentHex,
  startFrame = 0,
  endFrame = 30,
  cornerRadius = 8,
}) => {
  const frame = useCurrentFrame();
  const grow = interpolate(frame, [startFrame, endFrame], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const x = bandScale(labels, [box.x, box.x + box.w]);
  const maxV = domainMax ?? Math.max(1, ...values);
  const colors = categoricalRamp(accentHex, values.length);
  const bw = x.bandwidth();
  return (
    <svg width={WIDTH} height={HEIGHT} style={{ position: "absolute", inset: 0 }}>
      {values.map((v, i) => {
        const fullH = lengthFor(v, maxV, box.h);
        const h = Math.max(0, fullH * grow);
        const bx = x(labels[i]) ?? box.x;
        const by = box.y + box.h - h;
        return (
          <rect
            key={labels[i]}
            x={bx}
            y={by}
            width={bw}
            height={h}
            rx={cornerRadius}
            fill={colors[i]}
          />
        );
      })}
    </svg>
  );
};
