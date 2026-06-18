import React from "react";
import { AbsoluteFill, interpolate, random, spring, useCurrentFrame, useVideoConfig, Sequence } from "remotion";
import { AudioBed } from "../lib/AudioBed";
import { Captions, type CaptionStyle } from "../lib/Captions";
import { WIDTH, HEIGHT, SAFE_INSET_X } from "../lib/safeArea";
import { countUp, payoffGlow, loopSafeDrift } from "../lib/motion";
import { ANTON, withCommas } from "../v2kit/parts";
import { Glyph } from "../v2kit/Glyphs";
import { HorizontalTimeline } from "../v2kit/HorizontalTimeline";
import { CONTENT, type Beat, type VideoKey } from "./content";
import { FROZEN } from "./frozen";

// v3-3 — MOTION GRAPHICS. Cinematic dark ground, fast scale+blur scene transitions,
// accent glow pulses on the hero, drifting light streaks/particles, dramatic reveals.

export const makeMotionShort = (video: VideoKey) => {
  const Comp: React.FC<{ audio: boolean }> = ({ audio }) => {
    const fz = FROZEN[video];
    const c = CONTENT[video];
    const cap: CaptionStyle = {
      fontFamily: ANTON,
      accentBBeats: ["beat4", "beat5", "beat6"],
      accentA: c.base.accent1,
      accentB: c.base.accent2,
      text: "#FFFFFF",
      overrides: video === "F-001" ? { "2,500": "~2,500", "2,000": "~2,000", "450": "~450" } : undefined,
      fontSize: 76,
    };
    return (
      <AbsoluteFill style={{ backgroundColor: "#05060A" }}>
        <Cinematic accent={c.base.accent1} total={fz.total} />
        {Object.entries(fz.scenes).map(([name, s]) => (
          <Sequence key={name} from={s.from} durationInFrames={s.duration}>
            {name === "hook" || name === "loopBack" ? (
              <HookCinema video={video} />
            ) : (
              <MotionBeat beat={c.beats[name]} accent={accentFor(c, name)} />
            )}
          </Sequence>
        ))}
        <Captions words={fz.words} style={cap} />
        <AudioBed spec={fz.audio} enabled={audio} />
      </AbsoluteFill>
    );
  };
  return Comp;
};

const accentFor = (c: (typeof CONTENT)[VideoKey], name: string): string =>
  ["beat4", "beat5", "beat6"].includes(name) ? c.base.accent2 : c.base.accent1;

const Cinematic: React.FC<{ accent: string; total: number }> = ({ accent, total }) => {
  const frame = useCurrentFrame();
  const drift = loopSafeDrift(frame, total, 80);
  const streaks = React.useMemo(
    () => new Array(7).fill(0).map((_, i) => ({ x: random(`st-${i}`) * WIDTH, w: 2 + random(`stw-${i}`) * 3, o: 0.05 + random(`sto-${i}`) * 0.08 })),
    [],
  );
  const motes = React.useMemo(
    () => new Array(40).fill(0).map((_, i) => ({ x: random(`mx-${i}`) * WIDTH, y: random(`my-${i}`) * HEIGHT, r: 1 + random(`mr-${i}`) * 2, o: 0.1 + random(`mo-${i}`) * 0.25 })),
    [],
  );
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 38%, #1A1422 0%, #05060A 72%)` }} />
      <div
        style={{
          position: "absolute",
          left: WIDTH / 2 - 560,
          top: 320,
          width: 1120,
          height: 1120,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${accent} 0%, rgba(0,0,0,0) 64%)`,
          opacity: 0.16,
        }}
      />
      <svg width={WIDTH} height={HEIGHT} style={{ position: "absolute", inset: 0 }}>
        {streaks.map((s, i) => (
          <rect key={`s${i}`} x={s.x} y={0} width={s.w} height={HEIGHT} fill={accent} opacity={s.o} transform={`skewX(-12)`} />
        ))}
        {motes.map((m, i) => (
          <circle key={`m${i}`} cx={m.x} cy={(((m.y + drift) % HEIGHT) + HEIGHT) % HEIGHT} r={m.r} fill="#FFFFFF" opacity={m.o} />
        ))}
      </svg>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 46%, rgba(0,0,0,0) 44%, #000 122%)", opacity: 0.82 }} />
    </AbsoluteFill>
  );
};

// Entrance: scale 1.12→1 + blur 14→0 + fade. Used for beats (not the hook, which must be lit at frame 0).
const useEnter = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame, fps, config: { stiffness: 200, damping: 20 } });
  return {
    transform: `scale(${interpolate(p, [0, 1], [1.12, 1])})`,
    filter: `blur(${interpolate(p, [0, 1], [14, 0])}px)`,
    opacity: interpolate(frame, [0, 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
  };
};

const HookCinema: React.FC<{ video: VideoKey }> = ({ video }) => {
  const c = CONTENT[video];
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const punch = frame < 16 ? 1 : interpolate(spring({ frame: frame - 16, fps, config: { stiffness: 200, damping: 13 } }), [0, 1], [1.18, 1]);
  return (
    <AbsoluteFill style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: ANTON }}>
      {c.hook.map((l, i) => {
        const color = l.accent === 1 ? c.base.accent1 : l.accent === 2 ? c.base.accent2 : "#FFFFFF";
        return (
          <div
            key={i}
            style={{
              fontSize: l.size,
              color,
              lineHeight: 1.0,
              transform: l.punch ? `scale(${punch})` : undefined,
              textShadow: l.accent != null ? `0 0 50px ${color}` : "0 6px 18px rgba(0,0,0,0.6)",
            }}
          >
            {l.text}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

const MotionBeat: React.FC<{ beat: Beat; accent: string }> = ({ beat, accent }) => {
  const enter = useEnter();
  const frame = useCurrentFrame();
  const glow = payoffGlow(frame, 0, 40);

  if (beat.t === "payoff") {
    return (
      <AbsoluteFill style={enter}>
        <HorizontalTimeline palette={MOTION_PAL(accent)} nodes={beat.nodes} payoffLead={beat.lead} payoffTail={beat.tail} />
      </AbsoluteFill>
    );
  }

  const chip = beat.chip;
  return (
    <AbsoluteFill style={enter}>
      {/* chip + accent swipe underline */}
      <div style={{ position: "absolute", top: 280, left: SAFE_INSET_X, right: SAFE_INSET_X, textAlign: "center" }}>
        <div style={{ fontFamily: ANTON, fontSize: 48, letterSpacing: 5, color: "#FFFFFF" }}>{chip}</div>
        <div style={{ margin: "14px auto 0", width: `${interpolate(frame, [4, 22], [0, 60], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}%`, height: 6, background: accent, borderRadius: 3, boxShadow: `0 0 16px ${accent}` }} />
      </div>

      <div style={{ position: "absolute", top: 600, left: 56, right: 56, textAlign: "center", fontFamily: ANTON }}>
        {beat.t === "year" && (
          <div style={{ fontSize: 300, color: accent, lineHeight: 0.9, textShadow: `0 0 ${glow.blur + 30}px ${accent}` }}>{beat.year}</div>
        )}
        {beat.t === "word" && (
          <div style={{ fontSize: 260, color: accent, lineHeight: 0.9, textShadow: `0 0 ${glow.blur + 30}px ${accent}` }}>{beat.word}</div>
        )}
        {beat.t === "gap" && (
          <>
            <div style={{ fontSize: 300, color: accent, lineHeight: 0.9, textShadow: `0 0 ${glow.blur + 30}px ${accent}` }}>
              ~{withCommas(Math.round(countUp(frame, 6, 36, beat.target)))}
            </div>
            <div style={{ fontSize: 84, letterSpacing: 4, color: "#FFFFFF", marginTop: 6 }}>{beat.unit}</div>
          </>
        )}
      </div>

      {beat.t !== "gap" && <Glyph kind={beat.glyph} cx={WIDTH / 2} cy={1330} size={380} color={accent} opacity={0.95} glow={26} />}
      {beat.t === "gap" && beat.left && <Glyph kind={beat.left} cx={WIDTH / 2 - 320} cy={1340} size={300} color={accent} opacity={0.8} />}
      {beat.t === "gap" && beat.right && <Glyph kind={beat.right} cx={WIDTH / 2 + 320} cy={1340} size={300} color={accent} opacity={0.8} />}
    </AbsoluteFill>
  );
};

const MOTION_PAL = (accent: string) => ({
  bgTop: "#05060A",
  bgBottom: "#05060A",
  glow: accent,
  vignette: "#000000",
  text: "#FFFFFF",
  textDim: "#AEB6C2",
  accent1: accent,
  accent2: accent,
  chipBg: "rgba(255,255,255,0.06)",
  mote: "#FFFFFF",
});
