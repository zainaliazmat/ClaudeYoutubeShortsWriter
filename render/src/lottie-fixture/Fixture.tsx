// render/src/lottie-fixture/Fixture.tsx
// Isolated accent-only composition for the render-hash determinism check — no
// captions, no gradient, no audio. The accent uses the in-memory `animationData`
// path (imported .json, stable identity) so the check needs no public/ seeding. The
// box is placed in-safe-area by construction (accentBoxStyle). Mirrors dataviz-fixture.
import React from "react";
import { AbsoluteFill } from "remotion";
import type { LottieAnimationData } from "@remotion/lottie";
import { LottieAccent } from "../lib/lottie";
import successCheck from "../lib/lottie/__fixtures__/success-check.json";

export const LottieFixture: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#0b0f1a" }}>
      <LottieAccent
        animationData={successCheck as unknown as LottieAnimationData}
        placement={{ anchor: "center", sizePx: 320 }}
        windowFrames={30}
      />
    </AbsoluteFill>
  );
};
