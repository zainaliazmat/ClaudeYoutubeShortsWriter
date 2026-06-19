import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { Background } from "../lib/Background";
import { Captions } from "../lib/Captions";
import { AudioBed } from "../lib/AudioBed";
import type { Word } from "../lib/captions-core";
import { COLORS, SCENES, TOTAL, Y, WIDTH, HEIGHT, FPS, CAPTION_STYLE, AUDIO_SPEC } from "./data";
import voTiming from "./vo-timing.json";
import { Chart } from "./Chart";
import { Hook, Beat1, Beat2, Beat3, Beat4, Beat5, LoopBack } from "./scenes";

export type ShortProps = { audio: boolean };

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
        loopSafe
      />
      <Chart />

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
      <Sequence from={SCENES.loopBack.from} durationInFrames={SCENES.loopBack.duration}>
        <LoopBack />
      </Sequence>

      <Captions words={words} style={CAPTION_STYLE} />
      <AudioBed spec={AUDIO_SPEC} enabled={audio} />
    </AbsoluteFill>
  );
};
