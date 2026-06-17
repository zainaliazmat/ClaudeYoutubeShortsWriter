import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { Background } from "../lib/Background";
import { Captions } from "../lib/Captions";
import { AudioBed } from "../lib/AudioBed";
import type { Word } from "../lib/captions-core";
import {
  COLORS,
  SCENES,
  TOTAL,
  Y,
  WIDTH,
  HEIGHT,
  FPS,
  CAPTION_STYLE,
  AUDIO_SPEC,
} from "./data";
import voTiming from "./vo-timing.json";
import { TimelineLayer } from "./TimelineLayer";
import { Hook } from "./scenes/Hook";
import { Beat1 } from "./scenes/Beat1";
import { Beat2 } from "./scenes/Beat2";
import { Beat3 } from "./scenes/Beat3";
import { Beat4 } from "./scenes/Beat4";
import { Beat5 } from "./scenes/Beat5";
import { Beat6 } from "./scenes/Beat6";
import { LoopBack } from "./scenes/LoopBack";

export type ShortProps = { audio: boolean };

// Duration comes from the VO timing contract, never a hardcoded const.
export const calculateMetadata = () => ({
  durationInFrames: voTiming.total,
  fps: voTiming.fps ?? FPS,
  width: WIDTH,
  height: HEIGHT,
});

export const Short: React.FC<ShortProps> = ({ audio }) => {
  const words = voTiming.words as Word[];
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bgTop }}>
      {/* Persistent depth background (never flat single-hex) */}
      <Background
        colors={{
          bgTop: COLORS.bgTop,
          bgBottom: COLORS.bgBottom,
          glow: COLORS.glow,
          nebula: COLORS.nebula,
          star: COLORS.text,
        }}
        totalFrames={TOTAL}
        heroY={Y.hero}
      />
      <TimelineLayer />

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
      <Sequence from={SCENES.beat6.from} durationInFrames={TOTAL - SCENES.beat6.from}>
        <Beat6 />
      </Sequence>
      <Sequence
        from={SCENES.loopBack.from}
        durationInFrames={SCENES.loopBack.duration}
      >
        <LoopBack />
      </Sequence>

      <Captions words={words} style={CAPTION_STYLE} />
      <AudioBed spec={AUDIO_SPEC} enabled={audio} />
    </AbsoluteFill>
  );
};
