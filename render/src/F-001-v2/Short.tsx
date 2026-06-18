import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { Captions } from "../lib/Captions";
import { AudioBed } from "../lib/AudioBed";
import type { Word } from "../lib/captions-core";
import { V2Background } from "../v2kit/Background";
import { Chip, SubLabel, YearHero, CountHero, HookClaim } from "../v2kit/parts";
import { Glyph } from "../v2kit/Glyphs";
import { HorizontalTimeline } from "../v2kit/HorizontalTimeline";
import {
  PALETTE,
  CAPTION_STYLE,
  AUDIO_SPEC,
  SCENES,
  TOTAL,
  WIDTH,
  HEIGHT,
  FPS,
  voTiming,
} from "./data";

export type ShortProps = { audio: boolean };

export const calculateMetadata = () => ({
  durationInFrames: voTiming.total,
  fps: voTiming.fps ?? FPS,
  width: WIDTH,
  height: HEIGHT,
});

const P = PALETTE;

// Hook (also frozen loop-back pose). Fully lit at frame 0.
const HookScene: React.FC = () => (
  <AbsoluteFill>
    <Glyph kind="pyramid" cx={WIDTH / 2} cy={1330} size={420} color={P.accent1} opacity={0.22} glow={0} />
    <Chip text="FACT" palette={P} />
    <HookClaim
      palette={P}
      top={500}
      lines={[
        { text: "CLEOPATRA", size: 150 },
        { text: "IS CLOSER TO", size: 84 },
        { text: "YOU", size: 280, accent: 2, punch: true },
        { text: "THAN PYRAMIDS", size: 112, accent: 1 },
      ]}
    />
  </AbsoluteFill>
);

const YearScene: React.FC<{
  chip: string;
  sub: string;
  year: string;
  kind: "pyramid" | "cleo" | "moon";
  color: string;
  rocket?: boolean;
}> = ({ chip, sub, year, kind, color, rocket }) => (
  <AbsoluteFill>
    <Chip text={chip} palette={P} />
    <SubLabel text={sub} palette={P} />
    <YearHero text={year} color={color} top={640} />
    <Glyph kind={kind} cx={WIDTH / 2} cy={1320} size={360} color={color} opacity={0.95} />
    {rocket && <Glyph kind="rocket" cx={WIDTH / 2 + 250} cy={1120} size={150} color={color} />}
  </AbsoluteFill>
);

const GapScene: React.FC<{ chip: string; target: number; color: string; kind: "pyramid" | "moon" }> = ({
  chip,
  target,
  color,
  kind,
}) => (
  <AbsoluteFill>
    <Chip text={chip} palette={P} />
    <CountHero target={target} unit="YEARS" prefix="~" color={color} top={600} />
    <Glyph kind={kind} cx={WIDTH / 2} cy={1340} size={300} color={color} opacity={0.2} glow={0} />
  </AbsoluteFill>
);

const PayoffScene: React.FC = () => (
  <AbsoluteFill>
    <Chip text="CLOSER TO US THAN TO THEM" palette={P} top={210} />
    <HorizontalTimeline
      palette={P}
      nodes={[
        { label: "PYRAMID", sub: "2560 BC", pos: 0, kind: "pyramid", color: P.accent1 },
        { label: "CLEOPATRA", sub: "69 BC", pos: 0.55, kind: "cleo", color: P.text },
        { label: "MOON", sub: "1969", pos: 1, kind: "moon", color: P.accent2 },
      ]}
      payoffLead="~450 YRS"
      payoffTail="CLOSER TO THE MOON"
    />
  </AbsoluteFill>
);

export const Short: React.FC<ShortProps> = ({ audio }) => {
  const words = voTiming.words as Word[];
  return (
    <AbsoluteFill style={{ backgroundColor: P.bgTop }}>
      <V2Background palette={P} total={TOTAL} heroY={820} />

      <Sequence from={SCENES.hook.from} durationInFrames={SCENES.hook.duration}>
        <HookScene />
      </Sequence>
      <Sequence from={SCENES.beat1.from} durationInFrames={SCENES.beat1.duration}>
        <YearScene chip="THE GREAT PYRAMID" sub="KHUFU · OLD KINGDOM" year="2560 BC" kind="pyramid" color={P.accent1} />
      </Sequence>
      <Sequence from={SCENES.beat2.from} durationInFrames={SCENES.beat2.duration}>
        <YearScene chip="EGYPT'S LAST QUEEN" sub="CLEOPATRA VII" year="69 BC" kind="cleo" color={P.accent1} />
      </Sequence>
      <Sequence from={SCENES.beat3.from} durationInFrames={SCENES.beat3.duration}>
        <GapScene chip="PYRAMID → CLEOPATRA" target={2500} color={P.accent1} kind="pyramid" />
      </Sequence>
      <Sequence from={SCENES.beat4.from} durationInFrames={SCENES.beat4.duration}>
        <YearScene chip="FIRST MOON LANDING" sub="APOLLO 11" year="1969" kind="moon" color={P.accent2} rocket />
      </Sequence>
      <Sequence from={SCENES.beat5.from} durationInFrames={SCENES.beat5.duration}>
        <GapScene chip="CLEOPATRA → MOON" target={2000} color={P.accent2} kind="moon" />
      </Sequence>
      <Sequence from={SCENES.beat6.from} durationInFrames={SCENES.beat6.duration}>
        <PayoffScene />
      </Sequence>
      <Sequence from={SCENES.loopBack.from} durationInFrames={SCENES.loopBack.duration}>
        <HookScene />
      </Sequence>

      <Captions words={words} style={CAPTION_STYLE} />
      <AudioBed spec={AUDIO_SPEC} enabled={audio} />
    </AbsoluteFill>
  );
};
