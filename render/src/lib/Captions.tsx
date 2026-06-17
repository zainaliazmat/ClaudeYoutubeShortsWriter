import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { buildTokens, isNumeric, tokenAt } from "./captions-core";
import type { Word } from "./captions-core";
import { SAFE_INSET_X, QUALITY_FLOORS } from "./safeArea";

// Word-by-word captions — burned in, synced to the VO from vo-timing.json integer
// word frames. The merge/override/accent rules live in captions-core (one source
// of truth); this component is the renderer, parameterized by resolved tokens +
// styling. The hero number/abbrev per beat carries the side accent; body is off-white.

export type CaptionStyle = {
  fontFamily: string;
  /** beats whose numerics use accentB instead of accentA (e.g. modern side) */
  accentBBeats: string[];
  /** accent for "early"/default-side numerics (#rrggbb) */
  accentA: string;
  /** accent for accentBBeats numerics (#rrggbb) */
  accentB: string;
  /** non-numeric body color */
  text: string;
  /** display overrides applied before merge (e.g. {"2,500":"~2,500"}) */
  overrides?: Record<string, string>;
  fontSize?: number;
};

export const Captions: React.FC<{ words: Word[]; style: CaptionStyle }> = ({
  words,
  style,
}) => {
  const frame = useCurrentFrame();
  const tokens = React.useMemo(
    () => buildTokens(words, style.overrides ?? {}),
    [words, style.overrides],
  );
  const token = tokenAt(tokens, frame);
  if (!token) return null;

  const opacity = interpolate(frame, [token.start, token.start + 3], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const accent = style.accentBBeats.includes(token.beat)
    ? style.accentB
    : style.accentA;
  const numeric = isNumeric(token.display);
  const color = numeric ? accent : style.text;

  return (
    <div
      style={{
        position: "absolute",
        bottom: QUALITY_FLOORS.captionBottomGutterPx,
        left: SAFE_INSET_X,
        right: SAFE_INSET_X,
        textAlign: "center",
        fontFamily: style.fontFamily,
        fontSize: style.fontSize ?? 76,
        letterSpacing: 2,
        color,
        opacity,
        textShadow: numeric
          ? `0 0 28px ${accent}88, 0 3px 10px rgba(0,0,0,0.55)`
          : "0 3px 10px rgba(0,0,0,0.55)",
      }}
    >
      {token.display}
    </div>
  );
};
