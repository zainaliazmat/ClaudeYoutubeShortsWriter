import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig, Sequence } from "remotion";
import { AudioBed } from "../lib/AudioBed";
import { SAFE_INSET_X } from "../lib/safeArea";
import { isNumeric, buildTokens } from "../lib/captions-core";
import { loopSafePulse } from "../lib/motion";
import { ANTON, HookClaim } from "../v2kit/parts";
import { CONTENT, type Content, type VideoKey } from "./content";
import { FROZEN } from "./frozen";

// v3-1 — CAPTION-FORWARD. The VO captions ARE the visual: phrase-accumulating, huge,
// center screen, the meaning-carrying (numeric/era) word highlighted in the one accent.
// Near-black, minimal furniture (research: animate by phrase, emphasize meaning, one accent).

const BG = "#08090C";

export const makeCaptionShort = (video: VideoKey) => {
  const Comp: React.FC<{ audio: boolean }> = ({ audio }) => {
    const fz = FROZEN[video];
    const c = CONTENT[video];
    const accentA = c.base.accent1;
    const accentB = c.base.accent2;
    return (
      <AbsoluteFill style={{ backgroundColor: BG }}>
        <Bg accentA={accentA} total={fz.total} />
        {Object.entries(fz.scenes).map(([name, s]) => (
          <Sequence key={name} from={s.from} durationInFrames={s.duration}>
            {name === "hook" || name === "loopBack" ? (
              <HookClaim palette={{ ...c.base, text: "#FFFFFF" }} top={620} lines={c.hook} />
            ) : (
              <BeatCaptions video={video} beatName={name} from={s.from} accentA={accentA} accentB={accentB} chip={chipFor(c, name)} />
            )}
          </Sequence>
        ))}
        <AudioBed spec={fz.audio} enabled={audio} />
      </AbsoluteFill>
    );
  };
  return Comp;
};

const chipFor = (c: Content, name: string): string => {
  const b = c.beats[name];
  if (!b) return "";
  return b.t === "payoff" ? b.chipTop : b.chip;
};

const Bg: React.FC<{ accentA: string; total: number }> = ({ accentA, total }) => {
  const frame = useCurrentFrame();
  const pulse = loopSafePulse(frame, total, Math.max(1, Math.round(total / 120)), [0.9, 1.06]);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 46%, #16181F 0%, ${BG} 70%)` }} />
      <div
        style={{
          position: "absolute",
          left: 540 - 520,
          top: 900 - 520,
          width: 1040,
          height: 1040,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${accentA} 0%, rgba(0,0,0,0) 64%)`,
          opacity: 0.12,
          transform: `scale(${pulse})`,
        }}
      />
    </AbsoluteFill>
  );
};

// Phrase-accumulating captions for one beat. `from` is the scene's global start so we
// can use a local-ish reveal; we read the GLOBAL frame for word timing (word frames are global).
const BeatCaptions: React.FC<{
  video: VideoKey;
  beatName: string;
  from: number;
  accentA: string;
  accentB: string;
  chip: string;
}> = ({ video, beatName, from, accentA, accentB, chip }) => {
  const frame = useCurrentFrame() + from; // back to global frame
  const { fps } = useVideoConfig();
  const fz = FROZEN[video];
  const accent = ["beat4", "beat5", "beat6"].includes(beatName) ? accentB : accentA;
  // Merge consecutive same-display words (collapses a multi-token spoken number like
  // "2,500" into one) and apply the same display overrides as the burned captions.
  const overrides: Record<string, string> =
    video === "F-001" ? { "2,500": "~2,500", "2,000": "~2,000", "450": "~450" } : {};
  const tokens = buildTokens(fz.words, overrides).filter((t) => t.beat === beatName);
  const visible = tokens.filter((t) => t.start <= frame);
  const localF = frame - from;

  return (
    <AbsoluteFill>
      {/* dim kicker */}
      <div
        style={{
          position: "absolute",
          top: 360,
          left: SAFE_INSET_X,
          right: SAFE_INSET_X,
          textAlign: "center",
          fontFamily: ANTON,
          fontSize: 44,
          letterSpacing: 6,
          color: accent,
          opacity: interpolate(localF, [0, 8], [0, 0.8], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}
      >
        {chip}
      </div>
      {/* big accumulating phrase */}
      <div
        style={{
          position: "absolute",
          top: 640,
          left: 56,
          right: 56,
          textAlign: "center",
          fontFamily: ANTON,
          lineHeight: 1.02,
        }}
      >
        {visible.map((w, i) => {
          const isLast = i === visible.length - 1;
          const num = isNumeric(w.display);
          const pop = isLast
            ? interpolate(spring({ frame: frame - w.start, fps, config: { stiffness: 240, damping: 16 } }), [0, 1], [1.18, 1])
            : 1;
          const color = num ? accent : "#FFFFFF";
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                margin: "0 14px",
                fontSize: num ? 168 : 104,
                color,
                opacity: isLast ? 1 : 0.55,
                transform: `scale(${pop})`,
                textShadow: num ? `0 0 40px ${accent}88` : "0 4px 14px rgba(0,0,0,0.6)",
              }}
            >
              {w.display}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
