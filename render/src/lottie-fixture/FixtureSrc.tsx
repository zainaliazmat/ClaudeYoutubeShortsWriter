import React from "react";
import { AbsoluteFill } from "remotion";
import { LottieAccent } from "../lib/lottie";

// Isolated accent composition exercising the FILE-BACKED src= path (staticFile + fetch +
// delayRender + the module-level animationCache) — the path every real video uses, and the
// only one that exercises the cache's identity stabilization. The accent .json is seeded into
// public/ by scripts/check-determinism-lottie-src.mjs at check time (public/ is gitignored /
// run-scoped — never commit an asset there). Mirrors lottie-fixture but via src= instead of
// in-memory animationData, so byte-repro here guards the cache + the no-runtime-mutation invariant.
export const LottieFixtureSrc: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#0b0f1a" }}>
      <LottieAccent
        src="lottie-src-fixture.json"
        placement={{ anchor: "center", sizePx: 320 }}
        windowFrames={30}
      />
    </AbsoluteFill>
  );
};
