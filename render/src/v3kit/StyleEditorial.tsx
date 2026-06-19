import React from "react";
import { AbsoluteFill, interpolate, Sequence, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { AudioBed } from "../lib/AudioBed";
import { Captions, type CaptionStyle } from "../lib/Captions";
import { SAFE_INSET_X } from "../lib/safeArea";
import { wordSlamIn, countUp } from "../lib/motion";
import { GapBars, lengthFor, type GapItem } from "../lib/dataviz";
import { ANTON, withCommas } from "../v2kit/parts";
import { Glyph } from "../v2kit/Glyphs";
import { CONTENT, type Beat, type Content, type VideoKey } from "./content";
import { FROZEN } from "./frozen";

// v3-2 — EDITORIAL INFOGRAPHIC, now D3-backed. 3-level type hierarchy (section tag /
// heading / hero), display (Anton) + clean sans (Inter), one bright accent for
// categorization, slate ground. Every magnitude (gap bars + the payoff comparison) is
// drawn through the D3 lib/dataviz primitives — scale-honest by construction
// (`lengthFor` / `linearScale`), pure function of frame, no d3.transition.

const { fontFamily: INTER } = loadInter("normal", { weights: ["400", "600", "800"], subsets: ["latin"] });

const SECTION: Record<string, string> = { beat1: "01", beat2: "02", beat3: "03", beat4: "04", beat5: "05", beat6: "06" };
const INK = "#ECEFF3";
const DIM = "#93A0AF";

// The two time-gaps that the whole video compares (beat3 vs beat5) — the data that
// drives the D3 bars. domainMax shares ONE px-per-unit across every bar in the video.
const gapsOf = (c: Content): GapItem[] => {
  const b3 = c.beats.beat3;
  const b5 = c.beats.beat5;
  if (b3.t !== "gap" || b5.t !== "gap") return [];
  return [
    { label: b3.chip, value: b3.target, color: c.base.accent1, display: `~${withCommas(b3.target)}${b3.unit.includes("MILLION") ? "M" : ""}` },
    { label: b5.chip, value: b5.target, color: c.base.accent2, display: `~${withCommas(b5.target)}${b5.unit.includes("MILLION") ? "M" : ""}` },
  ];
};
const domainMaxOf = (c: Content): number => Math.max(...gapsOf(c).map((g) => g.value), 1);

export const makeEditorialShort = (video: VideoKey) => {
  const Comp: React.FC<{ audio: boolean }> = ({ audio }) => {
    const fz = FROZEN[video];
    const c = CONTENT[video];
    const dmax = domainMaxOf(c);
    const cap: CaptionStyle = {
      fontFamily: INTER,
      accentBBeats: ["beat4", "beat5", "beat6"],
      accentA: c.base.accent1,
      accentB: c.base.accent2,
      text: INK,
      fontSize: 56,
    };
    return (
      <AbsoluteFill style={{ backgroundColor: "#0F1218" }}>
        <Ground />
        {Object.entries(fz.scenes).map(([name, s]) => (
          <Sequence key={name} from={s.from} durationInFrames={s.duration}>
            {name === "hook" || name === "loopBack" ? (
              <TitleCard video={video} />
            ) : (
              <BeatCard beat={c.beats[name]} section={SECTION[name] ?? ""} accent={accentFor(c, name)} domainMax={dmax} gaps={gapsOf(c)} />
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

const accentFor = (c: Content, name: string): string =>
  ["beat4", "beat5", "beat6"].includes(name) ? c.base.accent2 : c.base.accent1;

const Ground: React.FC = () => (
  <AbsoluteFill>
    {/* lifted slate so the composited frame clears the 35 luma floor (still clearly "dark editorial") */}
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #25304A 0%, #1A2231 100%)" }} />
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 40%, rgba(120,150,210,0.10) 0%, rgba(0,0,0,0) 60%)" }} />
    <AbsoluteFill
      style={{ backgroundImage: "repeating-linear-gradient(0deg, rgba(255,255,255,0.03) 0 1px, transparent 1px 96px)" }}
    />
  </AbsoluteFill>
);

const HeaderRule: React.FC<{ section: string; accent: string; label: string }> = ({ section, accent, label }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div style={{ position: "absolute", top: 230, left: SAFE_INSET_X, right: SAFE_INSET_X, ...wordSlamIn(frame, fps, 0) }}>
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <span style={{ fontFamily: ANTON, fontSize: 40, color: accent, letterSpacing: 2 }}>{section}</span>
        <span style={{ flex: 1, height: 3, background: accent, opacity: 0.6 }} />
        <span style={{ fontFamily: INTER, fontWeight: 600, fontSize: 30, color: DIM, letterSpacing: 4 }}>{label}</span>
      </div>
    </div>
  );
};

const TitleCard: React.FC<{ video: VideoKey }> = ({ video }) => {
  const c = CONTENT[video];
  return (
    <AbsoluteFill>
      <HeaderRule section="—" accent={c.base.accent1} label="DID YOU KNOW" />
      <div style={{ position: "absolute", top: 560, left: SAFE_INSET_X, right: SAFE_INSET_X, fontFamily: ANTON, lineHeight: 1.0 }}>
        {c.hook.map((l, i) => (
          <div key={i} style={{ fontSize: l.size * 0.92, color: l.accent === 1 ? c.base.accent1 : l.accent === 2 ? c.base.accent2 : INK, textAlign: "left" }}>
            {l.text}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

const Card: React.FC<{ accent: string; children: React.ReactNode }> = ({ accent, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div
      style={{
        position: "absolute",
        top: 470,
        left: SAFE_INSET_X,
        right: SAFE_INSET_X,
        height: 760,
        background: "rgba(255,255,255,0.035)",
        border: `2px solid ${accent}55`,
        borderRadius: 22,
        boxShadow: `0 0 60px ${accent}18`,
        ...wordSlamIn(frame, fps, 4),
      }}
    >
      {children}
    </div>
  );
};

const BeatCard: React.FC<{ beat: Beat; section: string; accent: string; domainMax: number; gaps: GapItem[] }> = ({
  beat,
  section,
  accent,
  domainMax,
  gaps,
}) => {
  const frame = useCurrentFrame();
  if (beat.t === "payoff") {
    return (
      <AbsoluteFill>
        <HeaderRule section={section} accent={accent} label="THE PAYOFF" />
        {/* D3 scale-honest comparison: the two time-gaps as bars; modern bar shorter = the payoff */}
        <GapBars items={gaps} domainMax={domainMax} box={{ x: 80, y: 560, w: 920, h: 440 }} fontFamily={INTER} ink={INK} dim={DIM} startFrame={6} endFrame={40} />
        <div style={{ position: "absolute", top: 1110, left: 60, right: 60, textAlign: "center", fontFamily: ANTON }}>
          <div style={{ fontSize: 168, color: accent, lineHeight: 1.0, textShadow: `0 0 36px ${accent}66` }}>{beat.lead}</div>
          <div style={{ fontSize: 64, color: INK, letterSpacing: 3, marginTop: 4 }}>{beat.tail}</div>
        </div>
      </AbsoluteFill>
    );
  }
  const label = beat.chip;
  return (
    <AbsoluteFill>
      <HeaderRule section={section} accent={accent} label={label} />
      <Card accent={accent}>
        <div style={{ position: "absolute", inset: 0, padding: 56, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          {beat.t === "year" && (
            <>
              <div style={{ fontFamily: INTER, fontWeight: 600, fontSize: 38, color: DIM, letterSpacing: 2 }}>{beat.sub}</div>
              <div style={{ fontFamily: ANTON, fontSize: 250, color: accent, lineHeight: 0.95, marginTop: 8, textShadow: `0 0 40px ${accent}55` }}>{beat.year}</div>
              <Glyph kind={beat.glyph} cx={900} cy={250} size={200} color={accent} opacity={0.9} glow={12} />
            </>
          )}
          {beat.t === "word" && (
            <>
              <div style={{ fontFamily: INTER, fontWeight: 600, fontSize: 38, color: DIM, letterSpacing: 2 }}>{beat.sub}</div>
              <div style={{ fontFamily: ANTON, fontSize: 220, color: accent, lineHeight: 0.95, marginTop: 8 }}>{beat.word}</div>
              <Glyph kind={beat.glyph} cx={900} cy={250} size={200} color={accent} opacity={0.9} glow={12} />
            </>
          )}
          {beat.t === "gap" && <GapBlock beat={beat} accent={accent} domainMax={domainMax} frame={frame} />}
        </div>
      </Card>
    </AbsoluteFill>
  );
};

const GapBlock: React.FC<{ beat: Extract<Beat, { t: "gap" }>; accent: string; domainMax: number; frame: number }> = ({
  beat,
  accent,
  domainMax,
  frame,
}) => {
  const value = Math.round(countUp(frame, 6, 36, beat.target));
  const grow = interpolate(frame, [10, 40], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  // scale-honest width: shares the video's px-per-unit (beat3's 2,500 bar > beat5's 2,000 bar)
  const fullW = 808;
  const w = lengthFor(beat.target, domainMax, fullW) * grow;
  return (
    <>
      <div style={{ fontFamily: INTER, fontWeight: 600, fontSize: 36, color: DIM, letterSpacing: 2 }}>{beat.chip}</div>
      <div style={{ fontFamily: ANTON, fontSize: 230, color: accent, lineHeight: 0.95, marginTop: 6, textShadow: `0 0 40px ${accent}55` }}>
        ~{withCommas(value)}
      </div>
      <div style={{ fontFamily: INTER, fontWeight: 800, fontSize: 56, color: INK, letterSpacing: 3 }}>{beat.unit}</div>
      <div style={{ marginTop: 36, width: fullW, height: 26, background: "rgba(255,255,255,0.08)", borderRadius: 13 }}>
        <div style={{ width: w, height: "100%", background: accent, borderRadius: 13, boxShadow: `0 0 20px ${accent}88` }} />
      </div>
    </>
  );
};
