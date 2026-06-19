import "./index.css";
import { Composition } from "remotion";
import { Short as F001, calculateMetadata as f001Meta } from "./F-001/Short";
import { Short as F002, calculateMetadata as f002Meta } from "./F-002/Short";
import { Short as F003, calculateMetadata as f003Meta } from "./F-003/Short";
import { WIDTH, HEIGHT, FPS } from "./lib/safeArea";
import { HookCard } from "./hooks-lab/HookCard";
import { VARIANTS } from "./hooks-lab/variants";
import { Short as F001v2, calculateMetadata as f001v2Meta } from "./F-001-v2/Short";
import { Short as F002v2, calculateMetadata as f002v2Meta } from "./F-002-v2/Short";
import { makeCaptionShort } from "./v3kit/StyleCaption";
import { makeEditorialShort } from "./v3kit/StyleEditorial";
import { makeMotionShort } from "./v3kit/StyleMotion";
import { FROZEN } from "./v3kit/frozen";
import { DatavizFixture } from "./dataviz-fixture/Fixture";
import { LottieFixture } from "./lottie-fixture/Fixture";
import { LottieFixtureSrc } from "./lottie-fixture/FixtureSrc";

// v3 — three distinct aesthetic directions, each for both videos. Frozen timing/VO/audio.
const V3 = [
  { suffix: "v3-1", make: makeCaptionShort },
  { suffix: "v3-2", make: makeEditorialShort },
  { suffix: "v3-3", make: makeMotionShort },
] as const;
const V3_VIDEOS = ["F-001", "F-002"] as const;
const v3Meta = (video: "F-001" | "F-002") => () => ({
  durationInFrames: FROZEN[video].total,
  fps: FPS,
  width: WIDTH,
  height: HEIGHT,
});

// Compositions are generated per video by remotion-codegen under src/F-NNN/.
// durationInFrames here is a placeholder Remotion overrides via calculateMetadata
// (which reads vo-timing.json `total`) — never a hardcoded duration const.
export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="F-001-cleopatra-vs-pyramids"
        component={F001}
        calculateMetadata={f001Meta}
        durationInFrames={1}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={{ audio: true }}
      />
      <Composition
        id="F-002-trex-closer-than-stegosaurus"
        component={F002}
        calculateMetadata={f002Meta}
        durationInFrames={1}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={{ audio: true }}
      />

      {/* F-003 — the birthday paradox: the first effective_style: d3 video (lib/dataviz
          GrowthCurve). Audio reuses F-001/F-002's licensed Pixabay binaries. */}
      <Composition
        id="F-003-birthday-paradox"
        component={F003}
        calculateMetadata={f003Meta}
        durationInFrames={1}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={{ audio: true }}
      />

      {/* Repainted v2 videos (warm brand spine + silhouettes). Same frozen
          timing/VO/audio/captions as F-001/F-002; visuals only. */}
      <Composition
        id="F-001-v2"
        component={F001v2}
        calculateMetadata={f001v2Meta}
        durationInFrames={1}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={{ audio: true }}
      />
      <Composition
        id="F-002-v2"
        component={F002v2}
        calculateMetadata={f002v2Meta}
        durationInFrames={1}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={{ audio: true }}
      />

      {/* v3 — three aesthetic directions × two videos (6 compositions). */}
      {V3_VIDEOS.flatMap((video) =>
        V3.map((s) => {
          const Comp = s.make(video);
          return (
            <Composition
              key={`${video}-${s.suffix}`}
              id={`${video}-${s.suffix}`}
              component={Comp}
              calculateMetadata={v3Meta(video)}
              durationInFrames={1}
              fps={FPS}
              width={WIDTH}
              height={HEIGHT}
              defaultProps={{ audio: true }}
            />
          );
        }),
      )}

      {/* D3 dataviz fixture — isolated chart-only composition (no captions/bg/audio)
          used by scripts/check-determinism.mjs to prove the chart geometry renders
          byte-identically. Fixed durationInFrames (a fixture, not a /short video, so
          the calculateMetadata-no-const rule does not apply). */}
      <Composition
        id="dataviz-fixture"
        component={DatavizFixture}
        durationInFrames={90}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="lottie-fixture"
        component={LottieFixture}
        durationInFrames={30}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="lottie-fixture-src"
        component={LottieFixtureSrc}
        durationInFrames={30}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />

      {/* Hooks lab — static first-frame / thumbnail variants (render with
          `npx remotion still <id> out.png`). Self-contained; does not affect the
          F-001/F-002 video compositions. */}
      {Object.entries(VARIANTS).map(([id, props]) => (
        <Composition
          key={id}
          id={id}
          component={HookCard}
          durationInFrames={1}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
          defaultProps={props}
        />
      ))}
    </>
  );
};
