import { WIDTH, HEIGHT, FPS } from "../lib/safeArea";
import type { CaptionStyle } from "../lib/Captions";
import { ANTON } from "../v2kit/parts";
import { CLEO } from "../v2kit/Palette";
// FROZEN contracts reused from the shipped F-001 (timing/scenes/audio unchanged) —
// this is a VISUAL repaint only.
import { AUDIO_SPEC, SCENES, TOTAL } from "../F-001/data";
import voTiming from "../F-001/vo-timing.json";

export { WIDTH, HEIGHT, FPS, AUDIO_SPEC, SCENES, TOTAL, voTiming };
export const PALETTE = CLEO;

export const CAPTION_STYLE: CaptionStyle = {
  fontFamily: ANTON,
  accentBBeats: ["beat4", "beat5", "beat6"], // modern (lapis) side
  accentA: CLEO.accent1, // gold (ancient)
  accentB: CLEO.accent2, // lapis (modern)
  text: CLEO.text,
  overrides: { "2,500": "~2,500", "2,000": "~2,000", "450": "~450" },
  fontSize: 74,
};
