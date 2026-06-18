import React from "react";
import { AbsoluteFill } from "remotion";
import { loadFont as loadAnton } from "@remotion/google-fonts/Anton";
import { WIDTH } from "../lib/safeArea";

// First-frame / thumbnail LAB. Each composition renders ONE static scroll-stopper
// (frame 0 = the thumbnail). Self-contained — does not touch F-001/F-002 code.
// Rendered as PNG via `npx remotion still <id> out.png`. Every on-screen claim is
// sourced from the video's 01-verified-facts.md (cite-or-abstain).

const { fontFamily: ANTON } = loadAnton("normal", { weights: ["400"], subsets: ["latin"] });

export type Token = { t: string; accent?: 1 | 2 }; // accent 1 = primary, 2 = secondary
export type Line = { tokens: Token[]; size: number };

export type Palette = {
  bgTop: string;
  bgBottom: string;
  glow: string;
  text: string;
  accent1: string; // primary highlight (ancient / hot)
  accent2: string; // secondary highlight (modern / cool)
  chipBg: string;
};

export type HookProps = {
  palette: Palette;
  kicker: string;
  lines: Line[];
  motif: "pyramid" | "moon" | "trex" | "stego" | "none";
};

const Motif: React.FC<{ kind: HookProps["motif"]; palette: Palette }> = ({ kind, palette }) => {
  // Large, low-opacity silhouette anchored bottom-right so text stays dominant
  // (mobile legibility: one focal idea, decoration never competes with the words).
  const common: React.CSSProperties = {
    position: "absolute",
    right: -60,
    bottom: -40,
    opacity: 0.16,
  };
  if (kind === "none") return null;
  if (kind === "pyramid")
    return (
      <svg width={820} height={820} viewBox="0 0 100 100" style={common}>
        <polygon points="50,14 94,86 6,86" fill={palette.accent1} />
        <polygon points="50,14 94,86 50,86" fill="rgba(0,0,0,0.25)" />
      </svg>
    );
  if (kind === "moon")
    return (
      <svg width={760} height={760} viewBox="0 0 100 100" style={common}>
        <circle cx="50" cy="50" r="42" fill={palette.accent2} />
        <circle cx="40" cy="38" r="7" fill="rgba(0,0,0,0.18)" />
        <circle cx="64" cy="54" r="9" fill="rgba(0,0,0,0.15)" />
        <circle cx="46" cy="66" r="5" fill="rgba(0,0,0,0.16)" />
      </svg>
    );
  if (kind === "trex")
    return (
      <svg width={880} height={880} viewBox="0 0 100 100" style={common}>
        {/* compact T-rex silhouette */}
        <path
          d="M18 70 Q14 60 22 58 L40 56 Q44 44 56 40 L60 26 Q64 22 66 28 L64 40 Q74 42 78 52 L88 54 Q92 56 86 60 L74 60 Q70 70 60 72 L62 84 L54 84 L52 72 L40 72 L42 86 L34 86 L30 70 Z"
          fill={palette.accent1}
        />
      </svg>
    );
  // stego
  return (
    <svg width={880} height={880} viewBox="0 0 100 100" style={common}>
      <path
        d="M10 72 Q8 64 16 64 L30 62 Q38 46 58 48 Q78 50 86 64 L92 66 Q96 70 90 72 L80 72 Q76 80 68 80 L70 88 L62 88 L60 80 L40 80 L42 88 L34 88 L32 72 Z"
        fill={palette.accent1}
      />
      {/* back plates */}
      <path d="M40 50 l5 -12 5 12 z M52 48 l6 -14 6 14 z M66 50 l5 -12 5 12 z" fill={palette.accent2} />
    </svg>
  );
};

export const HookCard: React.FC<HookProps> = ({ palette, kicker, lines, motif }) => {
  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(165deg, ${palette.bgTop} 0%, ${palette.bgBottom} 100%)`,
        fontFamily: ANTON,
      }}
    >
      {/* hero glow */}
      <div
        style={{
          position: "absolute",
          left: WIDTH / 2 - 520,
          top: 360,
          width: 1040,
          height: 1040,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${palette.glow} 0%, rgba(0,0,0,0) 66%)`,
          opacity: 0.5,
        }}
      />
      <Motif kind={motif} palette={palette} />

      {/* kicker chip */}
      <div
        style={{
          position: "absolute",
          top: 250,
          left: 80,
          background: palette.chipBg,
          color: palette.text,
          fontSize: 46,
          letterSpacing: 6,
          padding: "14px 30px",
          borderRadius: 10,
        }}
      >
        {kicker}
      </div>

      {/* hero stacked lines, color-accented keywords */}
      <div
        style={{
          position: "absolute",
          top: 470,
          left: 80,
          right: 80,
          display: "flex",
          flexDirection: "column",
          gap: 6,
          lineHeight: 1.02,
        }}
      >
        {lines.map((line, i) => (
          <div key={i} style={{ fontSize: line.size }}>
            {line.tokens.map((tok, j) => (
              <span
                key={j}
                style={{
                  color:
                    tok.accent === 1
                      ? palette.accent1
                      : tok.accent === 2
                        ? palette.accent2
                        : palette.text,
                  textShadow:
                    tok.accent != null ? `0 0 36px ${tok.accent === 1 ? palette.accent1 : palette.accent2}88` : "none",
                }}
              >
                {tok.t}
              </span>
            ))}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
