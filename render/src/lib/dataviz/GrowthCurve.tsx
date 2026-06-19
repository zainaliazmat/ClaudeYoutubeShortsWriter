import React from "react";
import { useCurrentFrame, interpolate, Easing } from "remotion";
import { WIDTH, HEIGHT } from "../safeArea";
import { linearScale, type ChartBox } from "./scales";
import {
  revealPoints,
  linePath,
  areaPath,
  curveMonotoneX,
  type CurveFactory,
  type Pt,
} from "./paths";

// GrowthCurve — an area/line curve that "grows" left->right as the frame advances.
// Pure function of frame: the reveal cutoff `t` is interpolated from the frame and
// fed to `revealPoints`; the path strings are pure functions of those points. No
// d3.transition, no wall clock. y is computed via a linear scale (scale-honest
// through the domain), never a hand-picked pixel.

export const GrowthCurve: React.FC<{
  /** y-values in data space; x is the index 0..n-1 */
  series: number[];
  box: ChartBox;
  /** y-axis domain [min,max]; defaults to [0, max(series)] */
  domainY?: [number, number];
  color: string;
  /** reveal window in frames (curve grows across [startFrame,endFrame]) */
  startFrame?: number;
  endFrame?: number;
  strokeWidth?: number;
  fillOpacity?: number;
  curve?: CurveFactory;
}> = ({
  series,
  box,
  domainY,
  color,
  startFrame = 0,
  endFrame = 60,
  strokeWidth = 8,
  fillOpacity = 0.18,
  curve = curveMonotoneX,
}) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [startFrame, endFrame], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const n = Math.max(1, series.length - 1);
  const maxY = domainY ? domainY[1] : Math.max(1, ...series);
  const minY = domainY ? domainY[0] : 0;
  const xs = linearScale([0, n], [box.x, box.x + box.w]);
  const ys = linearScale([minY, maxY], [box.y + box.h, box.y]);
  const pts: Pt[] = series.map((v, i) => ({ x: xs(i), y: ys(v) }));
  const shown = revealPoints(pts, t);
  const dArea = areaPath(shown, box.y + box.h, curve);
  const dLine = linePath(shown, curve);
  return (
    <svg width={WIDTH} height={HEIGHT} style={{ position: "absolute", inset: 0 }}>
      <path d={dArea} fill={color} fillOpacity={fillOpacity} />
      <path
        d={dLine}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
