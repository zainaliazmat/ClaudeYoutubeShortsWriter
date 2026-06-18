import { WIDTH, HEIGHT, FPS } from "../lib/safeArea";
import type { CaptionStyle } from "../lib/Captions";
import { ANTON } from "../v2kit/parts";
import { TREX } from "../v2kit/Palette";
// FROZEN contracts reused from the shipped F-002 (timing/scenes/audio unchanged).
import { AUDIO_SPEC, SCENES, TOTAL } from "../F-002/data";
import voTiming from "../F-002/vo-timing.json";

export { WIDTH, HEIGHT, FPS, AUDIO_SPEC, SCENES, TOTAL, voTiming };
export const PALETTE = TREX;

export const CAPTION_STYLE: CaptionStyle = {
  fontFamily: ANTON,
  accentBBeats: ["beat4", "beat5", "beat6"], // modern (teal) side
  accentA: TREX.accent1, // amber (deep time)
  accentB: TREX.accent2, // teal (modern)
  text: TREX.text,
  fontSize: 74,
};
