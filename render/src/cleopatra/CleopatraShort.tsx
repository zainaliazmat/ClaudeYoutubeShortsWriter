import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { COLORS, SCENES } from "./theme";
import { Background } from "./Background";
import { TimelineLayer } from "./TimelineLayer";
import { Captions } from "./Captions";
import { AudioBed } from "./AudioBed";
import { Hook } from "./scenes/Hook";
import { Beat1 } from "./scenes/Beat1";
import { Beat2 } from "./scenes/Beat2";
import { Beat3 } from "./scenes/Beat3";
import { Beat4 } from "./scenes/Beat4";
import { Beat5 } from "./scenes/Beat5";
import { Beat6 } from "./scenes/Beat6";
import { LoopBack } from "./scenes/LoopBack";

export type CleopatraProps = {
  // Set true once the four licensed MP3s are placed in public/ (see AudioBed).
  audio: boolean;
};

export const CleopatraShort: React.FC<CleopatraProps> = ({ audio }) => {
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bgTop }}>
      {/* Persistent layers (global frame) */}
      <Background />
      <TimelineLayer />

      {/* Per-scene text */}
      <Sequence from={SCENES.hook.from} durationInFrames={SCENES.hook.duration}>
        <Hook />
      </Sequence>
      <Sequence from={SCENES.beat1.from} durationInFrames={SCENES.beat1.duration}>
        <Beat1 />
      </Sequence>
      <Sequence from={SCENES.beat2.from} durationInFrames={SCENES.beat2.duration}>
        <Beat2 />
      </Sequence>
      <Sequence from={SCENES.beat3.from} durationInFrames={SCENES.beat3.duration}>
        <Beat3 />
      </Sequence>
      <Sequence from={SCENES.beat4.from} durationInFrames={SCENES.beat4.duration}>
        <Beat4 />
      </Sequence>
      <Sequence from={SCENES.beat5.from} durationInFrames={SCENES.beat5.duration}>
        <Beat5 />
      </Sequence>
      {/* Beat 6 extends to frame 930 so its text can cross-dissolve out. */}
      <Sequence from={SCENES.beat6.from} durationInFrames={930 - SCENES.beat6.from}>
        <Beat6 />
      </Sequence>
      <Sequence
        from={SCENES.loopBack.from}
        durationInFrames={SCENES.loopBack.duration}
      >
        <LoopBack />
      </Sequence>

      {/* Word-by-word captions (global frame, from vo-timing.json). */}
      <Captions />

      <AudioBed enabled={audio} />
    </AbsoluteFill>
  );
};
