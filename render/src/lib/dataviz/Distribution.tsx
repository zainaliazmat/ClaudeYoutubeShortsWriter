import React from "react";
import { useCurrentFrame, interpolate, Easing } from "remotion";
import { WIDTH, HEIGHT } from "../safeArea";
import { linearScale, type ChartBox } from "./scales";
import { revealPoints, areaPath, curveMonotoneX, type Pt } from "./paths";

// Distribution — a histogram / bell as a filled area over bin heights. Revealed
// left->right by a frame-driven cutoff. Pure function of frame; the smooth curve
// uses curveMonotoneX (a valid line; for a non-monotonic shape pass curveLinear
// upstream). y via a linear scale (scale-honest).

export const Distribution: React.FC<{
  /** bin heights (counts / densities), left to right */
  bins: number[];
  box: ChartBox;
  color: string;
  domainMax?: number;
  startFrame?: number;
  endFrame?: number;
  fillOpacity?: number;
}> = ({
  bins,
  box,
  color,
  domainMax,
  startFrame = 0,
  endFrame = 45,
  fillOpacity = 0.7,
}) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [startFrame, endFrame], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const n = Math.max(1, bins.length - 1);
  const maxV = domainMax ?? Math.max(1, ...bins);
  const xs = linearScale([0, n], [box.x, box.x + box.w]);
  const ys = linearScale([0, maxV], [box.y + box.h, box.y]);
  const pts: Pt[] = bins.map((v, i) => ({ x: xs(i), y: ys(v) }));
  const shown = revealPoints(pts, t);
  const d = areaPath(shown, box.y + box.h, curveMonotoneX);
  return (
    <svg width={WIDTH} height={HEIGHT} style={{ position: "absolute", inset: 0 }}>
      <path d={d} fill={color} fillOpacity={fillOpacity} />
    </svg>
  );
};
