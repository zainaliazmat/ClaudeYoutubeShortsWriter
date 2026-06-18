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

const HookScene: React.FC = () => (
  <AbsoluteFill>
    <Glyph kind="trex" cx={WIDTH / 2} cy={1340} size={460} color={P.accent1} opacity={0.2} glow={0} />
    <Chip text="FACT" palette={P} />
    <HookClaim
      palette={P}
      top={500}
      lines={[
        { text: "T-REX LIVED", size: 124 },
        { text: "CLOSER TO", size: 84 },
        { text: "YOU", size: 280, accent: 2, punch: true },
        { text: "THAN STEGOSAURUS", size: 86, accent: 1 },
      ]}
    />
  </AbsoluteFill>
);

const YearScene: React.FC<{
  chip: string;
  sub: string;
  year: string;
  kind: "stego" | "trex" | "human";
  color: string;
  size?: number;
}> = ({ chip, sub, year, kind, color, size = 320 }) => (
  <AbsoluteFill>
    <Chip text={chip} palette={P} />
    <SubLabel text={sub} palette={P} />
    <YearHero text={year} color={color} top={640} size={size} />
    <Glyph kind={kind} cx={WIDTH / 2} cy={1330} size={360} color={color} opacity={0.95} />
  </AbsoluteFill>
);

// Gap reveal with a side-by-side scaled comparison of the two endpoints.
const GapScene: React.FC<{
  chip: string;
  target: number;
  color: string;
  left?: "stego" | "trex" | "human";
  right?: "stego" | "trex" | "human";
}> = ({ chip, target, color, left, right }) => (
  <AbsoluteFill>
    <Chip text={chip} palette={P} />
    <CountHero target={target} unit="MILLION YEARS" prefix="~" color={color} top={600} />
    {left && <Glyph kind={left} cx={WIDTH / 2 - 320} cy={1340} size={300} color={P.accent1} opacity={0.85} />}
    {right && <Glyph kind={right} cx={WIDTH / 2 + 320} cy={1340} size={300} color={P.accent2} opacity={0.85} />}
  </AbsoluteFill>
);

const PayoffScene: React.FC = () => (
  <AbsoluteFill>
    <Chip text="CLOSER TO YOU THAN TO STEGOSAURUS" palette={P} top={210} />
    <HorizontalTimeline
      palette={P}
      nodes={[
        { label: "STEGOSAURUS", sub: "150 MYA", pos: 0, kind: "stego", color: P.accent1 },
        { label: "T-REX", sub: "66 MYA", pos: 0.56, kind: "trex", color: P.text },
        { label: "TODAY", sub: "0", pos: 1, kind: "human", color: P.accent2 },
      ]}
      payoffLead="~18M YRS"
      payoffTail="CLOSER TO YOU"
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
        <YearScene chip="STEGOSAURUS" sub="LATE JURASSIC" year="150 MYA" kind="stego" color={P.accent1} />
      </Sequence>
      <Sequence from={SCENES.beat2.from} durationInFrames={SCENES.beat2.duration}>
        <YearScene chip="TYRANNOSAURUS REX" sub="END-CRETACEOUS" year="66 MYA" kind="trex" color={P.accent1} />
      </Sequence>
      <Sequence from={SCENES.beat3.from} durationInFrames={SCENES.beat3.duration}>
        <GapScene chip="STEGOSAURUS → T-REX" target={84} color={P.accent1} left="stego" right="trex" />
      </Sequence>
      <Sequence from={SCENES.beat4.from} durationInFrames={SCENES.beat4.duration}>
        <YearScene chip="AND TO TODAY?" sub="HUMANS" year="TODAY" kind="human" color={P.accent2} size={240} />
      </Sequence>
      <Sequence from={SCENES.beat5.from} durationInFrames={SCENES.beat5.duration}>
        <GapScene chip="T-REX → TODAY" target={66} color={P.accent2} left="trex" right="human" />
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
