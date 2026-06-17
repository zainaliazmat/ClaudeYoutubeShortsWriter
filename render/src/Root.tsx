import "./index.css";
import { Composition } from "remotion";
import { Short as F001, calculateMetadata as f001Meta } from "./F-001/Short";
import { Short as F002, calculateMetadata as f002Meta } from "./F-002/Short";
import { WIDTH, HEIGHT, FPS } from "./lib/safeArea";

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
    </>
  );
};
