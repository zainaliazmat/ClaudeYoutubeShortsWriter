import React from "react";
import { AbsoluteFill } from "remotion";
import { BarChart, GrowthCurve, Distribution } from "../lib/dataviz";

// Isolated chart-only composition for the render-hash determinism check (ENG-3):
// no captions, no gradient background, no audio — JUST the D3 primitive on a flat
// fill. That isolation is the whole point: the chart geometry (pure paths + rects)
// is byte-reproducible, while burned-in caption TEXT is NOT bit-stable across
// Chromium runs, so we never hash a full composited frame. check-determinism.mjs
// renders frames 0 / mid / last of THIS composition twice and asserts the PNGs are
// byte-identical.
export const DatavizFixture: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#0b0f1a" }}>
      <GrowthCurve
        series={[10, 35, 30, 60, 50, 90]}
        box={{ x: 120, y: 220, w: 840, h: 460 }}
        color="#46c6ff"
        startFrame={0}
        endFrame={60}
      />
      <BarChart
        values={[84, 66, 150]}
        labels={["A", "B", "C"]}
        box={{ x: 120, y: 760, w: 840, h: 460 }}
        accentHex="#E0B100"
        startFrame={0}
        endFrame={30}
      />
      <Distribution
        bins={[2, 6, 12, 20, 24, 20, 12, 6, 2]}
        box={{ x: 120, y: 1300, w: 840, h: 320 }}
        color="#7d5cff"
        startFrame={0}
        endFrame={45}
      />
    </AbsoluteFill>
  );
};
