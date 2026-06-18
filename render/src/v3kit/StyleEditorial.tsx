import React from "react";
import { AbsoluteFill, interpolate, Sequence, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { AudioBed } from "../lib/AudioBed";
import { Captions, type CaptionStyle } from "../lib/Captions";
import { SAFE_INSET_X } from "../lib/safeArea";
import { wordSlamIn, countUp } from "../lib/motion";
import { ANTON, withCommas } from "../v2kit/parts";
import { Glyph } from "../v2kit/Glyphs";
import { HorizontalTimeline } from "../v2kit/HorizontalTimeline";
import { CONTENT, type Beat, type VideoKey } from "./content";
import { FROZEN } from "./frozen";

// v3-2 — EDITORIAL INFOGRAPHIC. 3-level type hierarchy (section tag / heading / hero),
// display (Anton) + clean sans (Inter), flat bars, bordered stat cards, one bright accent
// for categorization, restrained slate ground. Reads "credible / authoritative".

const { fontFamily: INTER } = loadInter("normal", { weights: ["400", "600", "800"], subsets: ["latin"] });

const SECTION: Record<string, string> = { beat1: "01", beat2: "02", beat3: "03", beat4: "04", beat5: "05", beat6: "06" };

export const makeEditorialShort = (video: VideoKey) => {
  const Comp: React.FC<{ audio: boolean }> = ({ audio }) => {
    const fz = FROZEN[video];
    const c = CONTENT[video];
    const ink = "#ECEFF3";
    const dim = "#93A0AF";
    const cap: CaptionStyle = {
      fontFamily: INTER,
      accentBBeats: ["beat4", "beat5", "beat6"],
      accentA: c.base.accent1,
      accentB: c.base.accent2,
      text: ink,
      fontSize: 56,
    };
    return (
      <AbsoluteFill style={{ backgroundColor: "#0F1218" }}>
        <Ground />
        {Object.entries(fz.scenes).map(([name, s]) => (
          <Sequence key={name} from={s.from} durationInFrames={s.duration}>
            {name === "hook" || name === "loopBack" ? (
              <TitleCard video={video} ink={ink} dim={dim} />
            ) : (
              <BeatCard beat={c.beats[name]} section={SECTION[name] ?? ""} accent={accentFor(c, name)} ink={ink} dim={dim} />
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

const Ground: React.FC = () => (
  <AbsoluteFill>
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #131722 0%, #0C0F15 100%)" }} />
    {/* faint grid lines for the "data" feel */}
    <AbsoluteFill
      style={{
        backgroundImage:
          "repeating-linear-gradient(0deg, rgba(255,255,255,0.022) 0 1px, transparent 1px 96px)",
      }}
    />
  </AbsoluteFill>
);

const HeaderRule: React.FC<{ section: string; accent: string; label: string; dim: string }> = ({ section, accent, label, dim }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div style={{ position: "absolute", top: 230, left: SAFE_INSET_X, right: SAFE_INSET_X, ...wordSlamIn(frame, fps, 0) }}>
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <span style={{ fontFamily: ANTON, fontSize: 40, color: accent, letterSpacing: 2 }}>{section}</span>
        <span style={{ flex: 1, height: 3, background: accent, opacity: 0.6 }} />
        <span style={{ fontFamily: INTER, fontWeight: 600, fontSize: 30, color: dim, letterSpacing: 4 }}>{label}</span>
      </div>
    </div>
  );
};

const TitleCard: React.FC<{ video: VideoKey; ink: string; dim: string }> = ({ video, ink, dim }) => {
  const c = CONTENT[video];
  const accent = c.base.accent1;
  return (
    <AbsoluteFill>
      <HeaderRule section="—" accent={accent} label="DID YOU KNOW" dim={dim} />
      <div style={{ position: "absolute", top: 560, left: SAFE_INSET_X, right: SAFE_INSET_X, fontFamily: ANTON, lineHeight: 1.0 }}>
        {c.hook.map((l, i) => (
          <div
            key={i}
            style={{
              fontSize: l.size * 0.92,
              color: l.accent === 1 ? c.base.accent1 : l.accent === 2 ? c.base.accent2 : ink,
              textAlign: "left",
            }}
          >
            {l.text}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

const Card: React.FC<{ accent: string; children: React.ReactNode; top?: number; height?: number }> = ({
  accent,
  children,
  top = 470,
  height = 760,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div
      style={{
        position: "absolute",
        top,
        left: SAFE_INSET_X,
        right: SAFE_INSET_X,
        height,
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

const BeatCard: React.FC<{ beat: Beat; section: string; accent: string; ink: string; dim: string }> = ({
  beat,
  section,
  accent,
  ink,
  dim,
}) => {
  const frame = useCurrentFrame();
  const label = beat.t === "payoff" ? beat.chipTop : beat.chip;
  if (beat.t === "payoff") {
    return (
      <AbsoluteFill>
        <HeaderRule section={section} accent={accent} label="THE PAYOFF" dim={dim} />
        <HorizontalTimeline palette={{ ...CARD_PAL, accent1: accent, text: ink }} nodes={beat.nodes} payoffLead={beat.lead} payoffTail={beat.tail} />
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill>
      <HeaderRule section={section} accent={accent} label={label} dim={dim} />
      <Card accent={accent}>
        <div style={{ position: "absolute", inset: 0, padding: 56, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          {beat.t === "year" && (
            <>
              <div style={{ fontFamily: INTER, fontWeight: 600, fontSize: 38, color: dim, letterSpacing: 2 }}>{beat.sub}</div>
              <div style={{ fontFamily: ANTON, fontSize: 250, color: accent, lineHeight: 0.95, marginTop: 8, textShadow: `0 0 40px ${accent}55` }}>{beat.year}</div>
              <Glyph kind={beat.glyph} cx={900} cy={250} size={200} color={accent} opacity={0.9} glow={12} />
            </>
          )}
          {beat.t === "word" && (
            <>
              <div style={{ fontFamily: INTER, fontWeight: 600, fontSize: 38, color: dim, letterSpacing: 2 }}>{beat.sub}</div>
              <div style={{ fontFamily: ANTON, fontSize: 220, color: accent, lineHeight: 0.95, marginTop: 8 }}>{beat.word}</div>
              <Glyph kind={beat.glyph} cx={900} cy={250} size={200} color={accent} opacity={0.9} glow={12} />
            </>
          )}
          {beat.t === "gap" && <GapBlock beat={beat} accent={accent} ink={ink} dim={dim} frame={frame} />}
        </div>
      </Card>
    </AbsoluteFill>
  );
};

const GapBlock: React.FC<{ beat: Extract<Beat, { t: "gap" }>; accent: string; ink: string; dim: string; frame: number }> = ({
  beat,
  accent,
  ink,
  dim,
  frame,
}) => {
  const value = Math.round(countUp(frame, 6, 36, beat.target));
  const barP = interpolate(frame, [10, 40], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <>
      <div style={{ fontFamily: INTER, fontWeight: 600, fontSize: 36, color: dim, letterSpacing: 2 }}>{beat.chip}</div>
      <div style={{ fontFamily: ANTON, fontSize: 230, color: accent, lineHeight: 0.95, marginTop: 6, textShadow: `0 0 40px ${accent}55` }}>
        ~{withCommas(value)}
      </div>
      <div style={{ fontFamily: INTER, fontWeight: 800, fontSize: 56, color: ink, letterSpacing: 3 }}>{beat.unit}</div>
      {/* flat proportion bar */}
      <div style={{ marginTop: 36, height: 26, background: "rgba(255,255,255,0.08)", borderRadius: 13 }}>
        <div style={{ width: `${barP * 100}%`, height: "100%", background: accent, borderRadius: 13, boxShadow: `0 0 20px ${accent}88` }} />
      </div>
    </>
  );
};

const CARD_PAL = {
  bgTop: "#0F1218",
  bgBottom: "#0C0F15",
  glow: "#000000",
  vignette: "#000000",
  text: "#ECEFF3",
  textDim: "#93A0AF",
  accent1: "#FFFFFF",
  accent2: "#FFFFFF",
  chipBg: "rgba(255,255,255,0.05)",
  mote: "#FFFFFF",
};
