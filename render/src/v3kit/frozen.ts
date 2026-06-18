import type { Word } from "../lib/captions-core";
import type { AudioSpec } from "../lib/AudioBed";
import { AUDIO_SPEC as A1, SCENES as S1, TOTAL as T1 } from "../F-001/data";
import { AUDIO_SPEC as A2, SCENES as S2, TOTAL as T2 } from "../F-002/data";
import vo1 from "../F-001/vo-timing.json";
import vo2 from "../F-002/vo-timing.json";
import type { VideoKey } from "./content";

// Frozen contracts per video — timing/scenes/audio reused unchanged from the shipped
// videos. All v3 styles read through here so they never drift from the VO.

export type Scene = { from: number; duration: number };
export type Frozen = {
  vo: typeof vo1;
  words: Word[];
  scenes: Record<string, Scene>;
  total: number;
  audio: AudioSpec;
};

export const FROZEN: Record<VideoKey, Frozen> = {
  "F-001": { vo: vo1, words: vo1.words as Word[], scenes: S1, total: T1, audio: A1 },
  "F-002": { vo: vo2, words: vo2.words as Word[], scenes: S2, total: T2, audio: A2 },
};
