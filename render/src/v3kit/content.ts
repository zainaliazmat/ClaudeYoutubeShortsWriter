import type { GlyphKind } from "../v2kit/Glyphs";
import { CLEO, TREX, type V2Palette } from "../v2kit/Palette";
import type { ClaimLine } from "../v2kit/parts";
import type { TLNode } from "../v2kit/HorizontalTimeline";

// Per-video content model shared by all three v3 styles. Plain data only (glyphs are
// string kinds). Each style component renders this content in its own visual language;
// timing/VO/audio/captions stay frozen (see frozen.ts).

export type Beat =
  | { t: "year"; chip: string; sub: string; year: string; glyph: GlyphKind; side: "a" | "b"; rocket?: boolean }
  | { t: "gap"; chip: string; target: number; unit: string; side: "a" | "b"; left?: GlyphKind; right?: GlyphKind }
  | { t: "word"; chip: string; sub: string; word: string; glyph: GlyphKind; side: "a" | "b" }
  | { t: "payoff"; chipTop: string; nodes: TLNode[]; lead: string; tail: string };

export type Content = {
  base: V2Palette;
  hook: ClaimLine[];
  // keyed by scene name beat1..beat6
  beats: Record<string, Beat>;
};

export type VideoKey = "F-001" | "F-002";

export const CONTENT: Record<VideoKey, Content> = {
  "F-001": {
    base: CLEO,
    hook: [
      { text: "CLEOPATRA", size: 150 },
      { text: "IS CLOSER TO", size: 84 },
      { text: "YOU", size: 280, accent: 2, punch: true },
      { text: "THAN PYRAMIDS", size: 112, accent: 1 },
    ],
    beats: {
      beat1: { t: "year", chip: "THE GREAT PYRAMID", sub: "KHUFU · OLD KINGDOM", year: "2560 BC", glyph: "pyramid", side: "a" },
      beat2: { t: "year", chip: "EGYPT'S LAST QUEEN", sub: "CLEOPATRA VII", year: "69 BC", glyph: "cleo", side: "a" },
      beat3: { t: "gap", chip: "PYRAMID → CLEOPATRA", target: 2500, unit: "YEARS", side: "a", left: "pyramid", right: "cleo" },
      beat4: { t: "year", chip: "FIRST MOON LANDING", sub: "APOLLO 11", year: "1969", glyph: "moon", side: "b", rocket: true },
      beat5: { t: "gap", chip: "CLEOPATRA → MOON", target: 2000, unit: "YEARS", side: "b", left: "cleo", right: "moon" },
      beat6: {
        t: "payoff",
        chipTop: "CLOSER TO US THAN TO THEM",
        lead: "~450 YRS",
        tail: "CLOSER TO THE MOON",
        nodes: [
          { label: "PYRAMID", sub: "2560 BC", pos: 0, kind: "pyramid", color: CLEO.accent1 },
          { label: "CLEOPATRA", sub: "69 BC", pos: 0.55, kind: "cleo", color: CLEO.text },
          { label: "MOON", sub: "1969", pos: 1, kind: "moon", color: CLEO.accent2 },
        ],
      },
    },
  },
  "F-002": {
    base: TREX,
    hook: [
      { text: "T-REX LIVED", size: 124 },
      { text: "CLOSER TO", size: 84 },
      { text: "YOU", size: 280, accent: 2, punch: true },
      { text: "THAN STEGOSAURUS", size: 86, accent: 1 },
    ],
    beats: {
      beat1: { t: "year", chip: "STEGOSAURUS", sub: "LATE JURASSIC", year: "150 MYA", glyph: "stego", side: "a" },
      beat2: { t: "year", chip: "TYRANNOSAURUS REX", sub: "END-CRETACEOUS", year: "66 MYA", glyph: "trex", side: "a" },
      beat3: { t: "gap", chip: "STEGOSAURUS → T-REX", target: 84, unit: "MILLION YEARS", side: "a", left: "stego", right: "trex" },
      beat4: { t: "word", chip: "AND TO TODAY?", sub: "HUMANS", word: "TODAY", glyph: "human", side: "b" },
      beat5: { t: "gap", chip: "T-REX → TODAY", target: 66, unit: "MILLION YEARS", side: "b", left: "trex", right: "human" },
      beat6: {
        t: "payoff",
        chipTop: "CLOSER TO YOU THAN TO STEGOSAURUS",
        lead: "~18M YRS",
        tail: "CLOSER TO YOU",
        nodes: [
          { label: "STEGOSAURUS", sub: "150 MYA", pos: 0, kind: "stego", color: TREX.accent1 },
          { label: "T-REX", sub: "66 MYA", pos: 0.56, kind: "trex", color: TREX.text },
          { label: "TODAY", sub: "0", pos: 1, kind: "human", color: TREX.accent2 },
        ],
      },
    },
  },
};
