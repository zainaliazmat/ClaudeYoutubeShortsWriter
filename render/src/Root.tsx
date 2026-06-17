import "./index.css";
import { Composition } from "remotion";
import { Short, calculateMetadata } from "./F-001/Short";
import { WIDTH, HEIGHT, FPS } from "./lib/safeArea";

// Compositions are generated per video by remotion-codegen under src/F-NNN/.
// durationInFrames here is a placeholder Remotion overrides via calculateMetadata
// (which reads vo-timing.json `total`) — never a hardcoded duration const.
export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="F-001-cleopatra-vs-pyramids"
      component={Short}
      calculateMetadata={calculateMetadata}
      durationInFrames={1}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
      defaultProps={{ audio: true }}
    />
  );
};
