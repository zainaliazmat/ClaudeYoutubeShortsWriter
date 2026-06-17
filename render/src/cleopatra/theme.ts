import { loadFont as loadAnton } from "@remotion/google-fonts/Anton";
import { loadFont as loadSpaceMono } from "@remotion/google-fonts/SpaceMono";

// ---- Composition dimensions (pinned by spec) ----
export const WIDTH = 1080;
export const HEIGHT = 1920;
export const FPS = 30;
export const DURATION = 930; // 31s — VO-driven (= vo-timing.json `total`)

// ---- Fonts (v3) ----
// Anton — display / hero numbers / year stamps / payoff. Condensed, dominant.
export const { fontFamily: ANTON } = loadAnton("normal", {
  weights: ["400"],
  subsets: ["latin"],
});

// Space Mono — live rolling count-up digits only (settled hero numbers use Anton).
export const { fontFamily: MONO } = loadSpaceMono("normal", {
  weights: ["400", "700"],
  subsets: ["latin"],
});

// ---- Colors (v3 — navy/indigo depth, gold ancient / ice modern) ----
export const COLORS = {
  bgTop: "#0B1430", // gradient top (Pyramid / ancient end)
  bgBottom: "#1C2A55", // gradient bottom (Moon / modern end)
  glow: "#2E4A8C", // ~900px radial behind center hero
  nebula: "#3A2C6B", // faint upper-left wash
  text: "#F4F1E8", // captions / context
  gold: "#F2B53C", // ancient side — Pyramid years + Pyramid→Cleopatra segment
  ice: "#6FD3FF", // modern side — 1969, Cleopatra→Moon segment, payoff pulse
  rule: "#5B6BA8", // timeline spine
} as const;

// ---- Vertical timeline geometry (SCALE-HONEST, computed from the years) ----
// span = 2560 BC → 1969 = 4,529 yrs over 1200px ⇒ 0.2650 px/yr
export const SPINE_X = 170; // left lane (x 120–300)
export const SPINE_W = 14; // ≥12px thick
export const PYRAMID_Y = 300; // 2560 BC (top node)
export const CLEO_Y = 960; // 69 BC = 2,491 yr after pyramid → 55% down
export const MOON_Y = 1500; // 1969 (bottom node)
// Segment lengths: Pyramid→Cleopatra = 660px (2,491 yr); Cleopatra→Moon = 540px
// (2,038 yr) → 660/540 = 1.22 = the real ratio.

// ---- Content lane (text / hero numbers — clear of the spine lane) ----
export const CONTENT_LEFT = 300; // text lives x 300–1040, centered at ~670
export const CONTENT_RIGHT = 40; // right padding

// Vertical bands (all text within safe area y 154–1632)
export const Y = {
  kicker: 360, // context kicker, upper third
  hero: 900, // hero number / payoff, vertical center
} as const;

// ---- Scene frame ranges (global, half-open, contiguous · v4 — VO-patched
// from vo-timing.json beats; loop tail 855–930 silent) ----
export const SCENES = {
  hook: { from: 0, duration: 109 },
  beat1: { from: 109, duration: 150 },
  beat2: { from: 259, duration: 138 },
  beat3: { from: 397, duration: 96 },
  beat4: { from: 493, duration: 99 },
  beat5: { from: 592, duration: 110 },
  beat6: { from: 702, duration: 153 },
  loopBack: { from: 855, duration: 75 },
} as const;
