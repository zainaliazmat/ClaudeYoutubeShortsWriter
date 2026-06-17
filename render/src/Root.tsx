import "./index.css";
import { Composition } from "remotion";
import { CleopatraShort } from "./cleopatra/CleopatraShort";
import { DURATION, FPS, WIDTH, HEIGHT } from "./cleopatra/theme";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="F-001-cleopatra-vs-pyramids"
      component={CleopatraShort}
      durationInFrames={DURATION}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
      defaultProps={{ audio: true }}
    />
  );
};
