import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { Background } from "../lib/Background";
import { Captions } from "../lib/Captions";
import { AudioBed } from "../lib/AudioBed";
import type { Word } from "../lib/captions-core";
import { COLORS, SCENES, TOTAL, WIDTH, HEIGHT, FPS, CAPTION_STYLE, AUDIO_SPEC } from "./data";
import voTiming from "./vo-timing.json";
import { Hook } from "./scenes/Hook";
import { Beat1 } from "./scenes/Beat1";
import { Beat2 } from "./scenes/Beat2";
import { Beat3 } from "./scenes/Beat3";
import { Beat4 } from "./scenes/Beat4";
import { Loop } from "./scenes/Loop";

// F-004 — Honey Never Spoils
// kinetic-typography + first Lottie accent (beat3 payoff).
// Duration comes exclusively from calculateMetadata (reads vo-timing.json total).
// No DURATION const; no durationInFrames numeric literal on any scene Sequence.

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
      {/* Persistent depth background — gradient + glow + nebula + stars (loop-safe) */}
      <Background
        colors={{
          bgTop: COLORS.bgTop,
          bgBottom: COLORS.bgBottom,
          glow: COLORS.glow,
          nebula: COLORS.nebula,
          star: COLORS.star,
        }}
        totalFrames={TOTAL}
        heroY={900}
        loopSafe
      />

      {/* Per-scene overlays */}
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
      <Sequence from={SCENES.loop.from} durationInFrames={SCENES.loop.duration}>
        <Loop />
      </Sequence>

      {/* Burned-in word-by-word captions from vo-timing.json */}
      <Captions words={words} style={CAPTION_STYLE} />

      {/* VO lead + envelope-ducked music bed + 3 SFX cues */}
      <AudioBed spec={AUDIO_SPEC} enabled={audio} />
    </AbsoluteFill>
  );
};
