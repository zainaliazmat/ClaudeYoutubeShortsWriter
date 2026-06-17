import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  ANTON,
  CLEO_Y,
  COLORS,
  MOON_Y,
  PYRAMID_Y,
  SPINE_W,
  SPINE_X,
} from "./data";
import { MoonGlyph, PyramidGlyph, RocketGlyph } from "./Glyphs";
import { nodeNudge, payoffGlow, segmentGrow } from "../lib/motion";

// The vertical timeline — the spine of every scene. Global frame so furniture
// accumulates and stays put. SCALE-HONEST: node positions computed from the
// verified years (0.265 px/yr). v4 adds the design-§5 denser visuals: date
// ticks + anchor/era labels filling the right band, and a brighter rest-state
// pyramid. Hook shows a faint preview (no segments); loop-back (855→930)
// returns to that preview so frame 929 matches frame 0.

const PREVIEW = 0.4;
const PYRAMID_PREVIEW = 0.62; // brighter rest-state pyramid (render-qa §03 polish)
const LOOP_START = 855;
const LOOP_END = 930;

const clamp = (frame: number, a: number, b: number, from: number, to: number) =>
  interpolate(frame, [a, b], [from, to], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

// Furniture opacity: faint preview → bright when its beat lands → faint again
// on loop-back. `floor` is the rest-state opacity (raised for the pyramid).
const furnitureOpacity = (frame: number, brightenAt: number, floor = PREVIEW) => {
  const bright = clamp(frame, brightenAt, brightenAt + 18, floor, 1);
  const loop = clamp(frame, LOOP_START, LOOP_END, 1, floor);
  return Math.min(bright, loop);
};

// A collinear vertical segment on the spine, grown top→bottom via scaleY.
const Segment: React.FC<{
  topY: number;
  bottomY: number;
  color: string;
  progress: number;
  opacity: number;
  glowBlur?: number;
}> = ({ topY, bottomY, color, progress, opacity, glowBlur = 0 }) => (
  <div
    style={{
      position: "absolute",
      left: SPINE_X - SPINE_W / 2,
      top: topY,
      width: SPINE_W,
      height: bottomY - topY,
      backgroundColor: color,
      transformOrigin: "top center",
      transform: `scaleY(${Math.max(0, progress)})`,
      opacity: progress <= 0.01 ? 0 : opacity,
      boxShadow: glowBlur > 0 ? `0 0 ${glowBlur}px ${color}` : "none",
      borderRadius: SPINE_W / 2,
    }}
  />
);

// Date ticks: faint scale-honest marks down the spine (design §5). Regular
// 120px intervals across the 2560 BC→1969 span fill the otherwise-sparse band.
const TICKS = Array.from(
  { length: Math.floor((MOON_Y - PYRAMID_Y) / 120) + 1 },
  (_, i) => PYRAMID_Y + i * 120,
);

// Small label set beside the spine (anchor years + era names).
const SpineLabel: React.FC<{
  text: string;
  y: number;
  size: number;
  color: string;
  opacity: number;
  weight?: number;
}> = ({ text, y, size, color, opacity }) => (
  <div
    style={{
      position: "absolute",
      left: SPINE_X + 26,
      top: y,
      fontFamily: ANTON,
      fontSize: size,
      letterSpacing: 2,
      color,
      opacity,
      whiteSpace: "nowrap",
      textShadow: "0 2px 8px rgba(0,0,0,0.5)",
    }}
  >
    {text}
  </div>
);

export const TimelineLayer: React.FC = () => {
  const frame = useCurrentFrame(); // global
  const { fps } = useVideoConfig();

  // Spine + ticks: faint preview in the hook, brightens as Beat 1 establishes.
  const spineOpacity = furnitureOpacity(frame, 109);
  const pyramidOpacity = furnitureOpacity(frame, 109, PYRAMID_PREVIEW);
  const cleoOpacity = furnitureOpacity(frame, 259);
  const moonOpacity = furnitureOpacity(frame, 493);
  const rocketOpacity =
    frame < 493
      ? 0
      : Math.min(clamp(frame, 493, 499, 0, 1), clamp(frame, LOOP_START, LOOP_END, 1, 0));

  // Era labels ride in with the node they annotate, persist faintly after.
  const oldKingdomOp = furnitureOpacity(frame, 109);
  const ptolemaicOp = furnitureOpacity(frame, 259);
  const spaceAgeOp = furnitureOpacity(frame, 493);

  // Cleopatra node nudges toward the Moon during the Beat 6 payoff.
  const cleoY = CLEO_Y + nodeNudge(frame, fps, 702);

  // Segments grow during their gap beats; gone by the loop-back.
  const segLoopFade = clamp(frame, LOOP_START, LOOP_END, 1, 0);
  const goldProgress = segmentGrow(frame, fps, 397);
  const iceProgress = segmentGrow(frame, fps, 592);

  // Beat 6: the ice (Moon-side) segment glow-pulses continuously.
  const glow = payoffGlow(frame, 702, 55);
  const iceGlow = frame >= 702 && frame < LOOP_START ? glow.blur : 0;

  return (
    <AbsoluteFill>
      {/* Spine (full height, faint preview → bright). */}
      <div
        style={{
          position: "absolute",
          left: SPINE_X - SPINE_W / 2,
          top: PYRAMID_Y,
          width: SPINE_W,
          height: MOON_Y - PYRAMID_Y,
          backgroundColor: COLORS.rule,
          opacity: spineOpacity,
          borderRadius: SPINE_W / 2,
          boxShadow: `0 0 18px rgba(91,107,168,0.5)`,
        }}
      />

      {/* Scale-honest date ticks down the spine. */}
      {TICKS.map((ty) => (
        <div
          key={`tick-${ty}`}
          style={{
            position: "absolute",
            left: SPINE_X - 12,
            top: ty,
            width: 24,
            height: 3,
            backgroundColor: COLORS.rule,
            opacity: spineOpacity * 0.45,
            borderRadius: 2,
          }}
        />
      ))}

      {/* Scale-honest collinear segments (gold above ice, meeting at Cleopatra). */}
      <Segment
        topY={PYRAMID_Y}
        bottomY={CLEO_Y}
        color={COLORS.gold}
        progress={goldProgress}
        opacity={segLoopFade}
      />
      <Segment
        topY={CLEO_Y}
        bottomY={MOON_Y}
        color={COLORS.ice}
        progress={iceProgress}
        opacity={segLoopFade}
        glowBlur={iceGlow}
      />

      {/* Node glyphs. */}
      <PyramidGlyph cx={SPINE_X} cy={PYRAMID_Y} opacity={pyramidOpacity} />
      <MoonGlyph cx={SPINE_X} cy={MOON_Y} opacity={moonOpacity} />
      <RocketGlyph cx={SPINE_X + 150} cy={MOON_Y - 250} opacity={rocketOpacity} />

      {/* Anchor year labels (top / bottom) + era labels beside the spine. */}
      <SpineLabel text="2560 BC" y={PYRAMID_Y - 30} size={30} color={COLORS.gold} opacity={pyramidOpacity} />
      <SpineLabel text="Old Kingdom" y={PYRAMID_Y + 12} size={38} color={COLORS.text} opacity={oldKingdomOp * 0.85} />
      <SpineLabel text="1969" y={MOON_Y + 28} size={30} color={COLORS.ice} opacity={moonOpacity} />
      <SpineLabel text="Space Age" y={MOON_Y - 58} size={38} color={COLORS.text} opacity={spaceAgeOp * 0.85} />

      {/* Cleopatra node marker + compact label + era + anchor year. */}
      <div
        style={{
          position: "absolute",
          left: SPINE_X - 16,
          top: cleoY - 16,
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: COLORS.text,
          opacity: cleoOpacity,
          boxShadow: `0 0 16px ${COLORS.text}`,
        }}
      />
      <SpineLabel text="CLEOPATRA" y={cleoY - 52} size={30} color={COLORS.text} opacity={cleoOpacity} />
      <SpineLabel text="69 BC · Ptolemaic" y={cleoY + 20} size={28} color={COLORS.text} opacity={ptolemaicOp * 0.85} />
    </AbsoluteFill>
  );
};
