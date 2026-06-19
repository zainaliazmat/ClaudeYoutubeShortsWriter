import { loadFont as loadAnton } from "@remotion/google-fonts/Anton";
import { loadFont as loadArchivoBlack } from "@remotion/google-fonts/ArchivoBlack";
import { WIDTH, HEIGHT, FPS } from "../lib/safeArea";
import type { CaptionStyle } from "../lib/Captions";
import type { AudioSpec } from "../lib/AudioBed";
import voTiming from "./vo-timing.json";
import sceneOrder from "./scenes.json";

// F-004 — Honey Never Spoils. Kinetic-typography + first Lottie accent (beat3 payoff).
// Duration via calculateMetadata(vo-timing.total) — no DURATION const.

export { WIDTH, HEIGHT, FPS };
export const TOTAL: number = voTiming.total;

export const { fontFamily: ANTON } = loadAnton("normal", { weights: ["400"], subsets: ["latin"] });
export const { fontFamily: ARCHIVO_BLACK } = loadArchivoBlack("normal", {
  weights: ["400"],
  subsets: ["latin"],
});

// ---- Colors (warm honey-amber on deep amber-brown gradient) ----
export const COLORS = {
  bgTop: "#2B1200",
  bgBottom: "#5C2800",
  glow: "#8B4A00",
  nebula: "#3D1A00",
  star: "#FDF3DC",
  hero: "#FDF3DC",       // primary / off-white parchment
  accent: "#F5B731",     // honey-gold
  payoff: "#FFD966",     // lighter amber-gold for STILL PRESERVED
  caution: "#E07B39",    // warm orange-amber for beat4 caveat
  jar: "#3D1A00",        // jar dark fill
  jarStroke: "#F5B731",  // jar lit amber stroke
} as const;

// ---- Y positions (upper / center / lower bands) ----
export const Y = {
  upper: 260,        // upper band — context labels
  hero: 580,         // center band — hero word
  jar: 900,          // jar silhouette center
  chip: 1260,        // lower band — stat chips
  chip2: 1380,       // second chip row
} as const;

// ---- Scene ranges read STRAIGHT from scenes.json (single source; check-tiling validates) ----
type SceneName = "hook" | "beat1" | "beat2" | "beat3" | "beat4" | "loop";
const buildScenes = (): Record<SceneName, { from: number; duration: number }> => {
  const out = {} as Record<SceneName, { from: number; duration: number }>;
  for (const s of sceneOrder.order) out[s.name as SceneName] = { from: s.from, duration: s.duration };
  return out;
};
export const SCENES = buildScenes();

// ---- Caption style ----
export const CAPTION_STYLE: CaptionStyle = {
  fontFamily: ANTON,
  accentBBeats: [],
  accentA: COLORS.accent,
  accentB: COLORS.payoff,
  text: COLORS.hero,
  fontSize: 72,
};

// ---- Audio spec (VO lead + envelope-ducked bed + 3 SFX) ----
// Beat3 payoff micro-swell included (f611→0.30, back to 0.22 at f640).
export const AUDIO_SPEC: AudioSpec = {
  vo: "vo.wav",
  voVolume: 0.95,
  music: "music-inspiring-cinematic-ambient.mp3",
  envelope: [
    { frame: 0,    volume: 0.22 },
    { frame: 603,  volume: 0.22 },
    { frame: 611,  volume: 0.30 },  // beat3 payoff micro-swell
    { frame: 638,  volume: 0.30 },
    { frame: 640,  volume: 0.22 },  // return to ducked
    { frame: 840,  volume: 0.22 },
    { frame: 849,  volume: 0.72 },  // swell on silent loop tail
    { frame: 905,  volume: 0.72 },
    { frame: 915,  volume: 0.0  },  // loop seam fade to 0
  ],
  sfx: [
    { file: "sfx-reveal-bloom.mp3", from: 611, durationInFrames: 45, volume: 0.65 },
    { file: "sfx-soft-chime.mp3",   from: 620, durationInFrames: 45, volume: 0.75 },
    { file: "sfx-lid-pop.mp3",      from: 681, durationInFrames: 30, volume: 0.50 },
  ],
};
