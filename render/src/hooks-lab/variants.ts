import type { HookProps, Palette } from "./HookCard";

// Warm per-video palettes (shared "brand spine": Anton, chip kicker, accent-keyword
// highlight, glow + low-opacity silhouette motif). Only the accent hues differ.
const CLEO: Palette = {
  bgTop: "#1B1206",
  bgBottom: "#4A2E10",
  glow: "#C9892B",
  text: "#F7EFE0",
  accent1: "#F4B53C", // gold (ancient)
  accent2: "#6FC0F0", // lapis (modern)
  chipBg: "rgba(244,181,60,0.20)",
};

const TREX: Palette = {
  bgTop: "#0E1A1C",
  bgBottom: "#3A2410",
  glow: "#C77A2E",
  text: "#F4EFE4",
  accent1: "#F0883C", // amber/rust (deep time)
  accent2: "#3FCEC8", // teal (modern)
  chipBg: "rgba(240,136,60,0.20)",
};

// Each variant = one first-frame framing. All claims sourced from 01-verified-facts.md.
export const VARIANTS: Record<string, HookProps> = {
  // ---------- F-001 Cleopatra ----------
  "hook-f001-you": {
    palette: CLEO,
    kicker: "FACT",
    motif: "pyramid",
    lines: [
      { tokens: [{ t: "CLEOPATRA" }], size: 150 },
      { tokens: [{ t: "IS CLOSER TO" }], size: 92 },
      { tokens: [{ t: "YOU", accent: 2 }], size: 300 },
      { tokens: [{ t: "THAN PYRAMIDS", accent: 1 }], size: 112 },
    ],
  },
  "hook-f001-moon": {
    palette: CLEO,
    kicker: "DID YOU KNOW",
    motif: "moon",
    lines: [
      { tokens: [{ t: "CLEOPATRA" }], size: 132 },
      { tokens: [{ t: "LIVED CLOSER TO" }], size: 78 },
      { tokens: [{ t: "THE MOON", accent: 2 }], size: 150 },
      { tokens: [{ t: "LANDING", accent: 2 }], size: 150 },
      { tokens: [{ t: "THAN PYRAMIDS", accent: 1 }], size: 104 },
    ],
  },
  "hook-f001-number": {
    palette: CLEO,
    kicker: "THE REAL TIMELINE",
    motif: "pyramid",
    lines: [
      { tokens: [{ t: "AFTER PYRAMIDS:" }], size: 70 },
      { tokens: [{ t: "2,500 YRS", accent: 1 }], size: 156 },
      { tokens: [{ t: "BEFORE THE MOON:" }], size: 70 },
      { tokens: [{ t: "2,000 YRS", accent: 2 }], size: 156 },
      { tokens: [{ t: "SAME QUEEN." }], size: 92 },
    ],
  },

  // ---------- F-002 T-Rex ----------
  "hook-f002-you": {
    palette: TREX,
    kicker: "FACT",
    motif: "trex",
    lines: [
      { tokens: [{ t: "T-REX LIVED" }], size: 124 },
      { tokens: [{ t: "CLOSER TO" }], size: 92 },
      { tokens: [{ t: "YOU", accent: 2 }], size: 300 },
      { tokens: [{ t: "THAN STEGOSAURUS", accent: 1 }], size: 86 },
    ],
  },
  "hook-f002-number": {
    palette: TREX,
    kicker: "DEEP TIME",
    motif: "trex",
    lines: [
      { tokens: [{ t: "T-REX IS" }], size: 124 },
      { tokens: [{ t: "18M YEARS", accent: 2 }], size: 156 },
      { tokens: [{ t: "CLOSER TO YOU" }], size: 90 },
      { tokens: [{ t: "THAN STEGOSAURUS", accent: 1 }], size: 86 },
    ],
  },
  "hook-f002-compare": {
    palette: TREX,
    kicker: "WHO'S OLDER?",
    motif: "stego",
    lines: [
      { tokens: [{ t: "STEGO TO T-REX" }], size: 80 },
      { tokens: [{ t: "84M YEARS", accent: 1 }], size: 148 },
      { tokens: [{ t: "T-REX TO YOU" }], size: 80 },
      { tokens: [{ t: "66M YEARS", accent: 2 }], size: 148 },
      { tokens: [{ t: "YOU'RE CLOSER.", accent: 2 }], size: 84 },
    ],
  },
};
