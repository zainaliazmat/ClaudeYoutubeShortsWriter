import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { heroOvershoot, countUp } from "../lib/motion";
import { COLORS, ANTON, MONO, Y, WIDTH } from "./data";

// Per-scene overlays — the hero number (upper band) + a kicker line. The curve furniture
// (Chart.tsx) is the persistent visual; these scenes carry the per-beat headline number.
// Local (scene-relative) frame drives the animations.

const Centered: React.FC<{ top: number; children: React.ReactNode }> = ({ top, children }) => (
  <div style={{ position: "absolute", top, left: 0, width: WIDTH, textAlign: "center" }}>{children}</div>
);

const Kicker: React.FC<{ text: string }> = ({ text }) => (
  <Centered top={Y.kicker}>
    <div style={{ fontFamily: ANTON, fontSize: 38, color: COLORS.text, opacity: 0.82, letterSpacing: 2 }}>
      {text}
    </div>
  </Centered>
);

// Big Anton hero (e.g. "23")
const Hero: React.FC<{ value: string; color?: string }> = ({ value, color = COLORS.text }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const o = heroOvershoot(frame, fps, 0);
  return (
    <Centered top={Y.hero}>
      <div
        style={{
          fontFamily: ANTON,
          fontSize: 300,
          color,
          transform: o.transform,
          opacity: o.opacity,
          textShadow: `0 0 56px ${color}66`,
          lineHeight: 1,
        }}
      >
        {value}
      </div>
    </Centered>
  );
};

// Counting percentage hero (Space Mono — stable digit width, clamp ≥0)
const HeroPct: React.FC<{ target: number; decimals?: number; color?: string }> = ({
  target,
  decimals = 0,
  color = COLORS.accent,
}) => {
  const frame = useCurrentFrame();
  const v = countUp(frame, 0, 24, target);
  return (
    <Centered top={Y.hero}>
      <div
        style={{
          fontFamily: MONO,
          fontWeight: 700,
          fontSize: 268,
          color,
          textShadow: `0 0 56px ${color}66`,
          lineHeight: 1,
        }}
      >
        {v.toFixed(decimals)}%
      </div>
    </Centered>
  );
};

export const Hook: React.FC = () => (
  <>
    <Hero value="23" color={COLORS.gold} />
    <Kicker text="50% CHANCE TWO SHARE A BIRTHDAY" />
  </>
);

export const Beat1: React.FC = () => <Kicker text="FEELS LIKE HUNDREDS — IT'S NOT" />;

export const Beat2: React.FC = () => (
  <>
    <HeroPct target={12} />
    <Kicker text="10 PEOPLE" />
  </>
);

export const Beat3: React.FC = () => (
  <>
    <HeroPct target={97} />
    <Kicker text="30 → 71%   ·   50 → 97%" />
  </>
);

export const Beat4: React.FC = () => (
  <>
    <HeroPct target={99.9} decimals={1} color={COLORS.gold} />
    <Kicker text="70 PEOPLE — PRACTICALLY GUARANTEED" />
  </>
);

export const Beat5: React.FC = () => (
  <>
    <Hero value="23" color={COLORS.gold} />
    <Kicker text="THE MAGIC NUMBER" />
  </>
);

export const LoopBack: React.FC = () => (
  <>
    <Hero value="23" color={COLORS.gold} />
    <Kicker text="50% CHANCE TWO SHARE A BIRTHDAY" />
  </>
);
