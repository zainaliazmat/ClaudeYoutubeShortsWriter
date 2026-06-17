import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { ANTON, COLORS, CONTENT_LEFT, CONTENT_RIGHT } from "./theme";
import voTiming from "./vo-timing.json";

// Word-by-word captions — v4. Burned-in, synced to the VO from the integer word
// frames in `vo-timing.json` (NOT Whisper, NOT hand-typed). Consecutive words
// that share a `display` are merged into ONE token (e.g. "2560"+"2560",
// "B"+"C", the four words of "2,500"), so a number renders once even though the
// voice speaks it as several words. Body is off-white; the hero number/abbrev
// per beat carries the side accent (gold ancient, ice-blue modern).

type Word = {
  display: string;
  start: number;
  end: number;
  beat: string;
};

type Token = {
  display: string;
  start: number;
  end: number;
  beat: string;
};

// On-screen styling for spoken numerics (matches the script's hero text).
const DISPLAY_OVERRIDE: Record<string, string> = {
  "2,500": "~2,500",
  "2,000": "~2,000",
  "450": "~450",
};

// The modern (ice) side starts at the Moon-landing beat; everything earlier is
// the ancient (gold) side.
const ICE_BEATS = new Set(["beat4", "beat5", "beat6"]);

const buildTokens = (): Token[] => {
  const words = voTiming.words as Word[];
  const tokens: Token[] = [];
  for (const w of words) {
    const display = DISPLAY_OVERRIDE[w.display] ?? w.display;
    const prev = tokens[tokens.length - 1];
    // Merge a run of consecutive words sharing the same display string.
    if (prev && prev.display === display && prev.beat === w.beat) {
      prev.end = w.end;
    } else {
      tokens.push({ display, start: w.start, end: w.end, beat: w.beat });
    }
  }
  return tokens;
};

const TOKENS = buildTokens();

const isNumeric = (display: string): boolean =>
  /\d/.test(display) || display === "BC";

export const Captions: React.FC = () => {
  const frame = useCurrentFrame(); // global

  const token = TOKENS.find((t) => frame >= t.start && frame < t.end);
  if (!token) return null;

  // Quick fade-in as each token lands; full opacity for the rest of its dwell.
  const opacity = interpolate(frame, [token.start, token.start + 3], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const accent = ICE_BEATS.has(token.beat) ? COLORS.ice : COLORS.gold;
  const color = isNumeric(token.display) ? accent : COLORS.text;

  return (
    <div
      style={{
        position: "absolute",
        bottom: 300,
        left: CONTENT_LEFT,
        right: CONTENT_RIGHT,
        textAlign: "center",
        fontFamily: ANTON,
        fontSize: 76,
        letterSpacing: 2,
        color,
        opacity,
        textShadow: isNumeric(token.display)
          ? `0 0 28px ${accent}88, 0 3px 10px rgba(0,0,0,0.55)`
          : "0 3px 10px rgba(0,0,0,0.55)",
      }}
    >
      {token.display}
    </div>
  );
};
