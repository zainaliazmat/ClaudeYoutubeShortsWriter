import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { crossDissolve } from "../motion";
import { Hook } from "./Hook";

// Scene 7 — Loop-Back (global 855–930). The frozen Hook fades in over the full
// 75f cross-dissolve (local 0–70) while Beat 6 + timeline furniture fade out, so
// frame 929 pixel-matches frame 0 and the auto-loop is invisible. Silent tail.
export const LoopBack: React.FC = () => {
  const frame = useCurrentFrame(); // local to this Sequence (from 855)
  const fadeIn = crossDissolve(frame, 0, 70, 0, 1);
  return (
    <AbsoluteFill style={{ opacity: fadeIn }}>
      <Hook frozen />
    </AbsoluteFill>
  );
};
