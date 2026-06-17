import React from "react";
import { Audio } from "@remotion/media";
import { interpolate, Sequence, staticFile } from "remotion";

// VO-lead audio bed — parameterized. VO is the LEAD (~0.95 from frame 0). The
// music bed DUCKS under it via the vo-timing.json envelope keyframes, then swells
// on the silent tail. SFX cues fire at frame offsets. The master step (render-run)
// sets absolute loudness to -14 LUFS; these are balance only.

export type EnvelopePoint = { frame: number; volume: number };
export type SfxCue = {
  file: string;
  from: number;
  durationInFrames: number;
  volume: number;
};

export type AudioSpec = {
  /** voiceover file in public/ (lead) */
  vo: string;
  voVolume?: number;
  /** music bed file in public/ */
  music: string;
  /** ducking envelope: [{frame, volume}] keyframes, linearly interpolated */
  envelope: EnvelopePoint[];
  /** SFX one-shots */
  sfx: SfxCue[];
};

const envVolume = (env: EnvelopePoint[]) => (frame: number): number => {
  if (env.length === 0) return 0;
  if (env.length === 1) return env[0].volume;
  return interpolate(
    frame,
    env.map((p) => p.frame),
    env.map((p) => p.volume),
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
};

export const AudioBed: React.FC<{ spec: AudioSpec; enabled?: boolean }> = ({
  spec,
  enabled = true,
}) => {
  if (!enabled) return null;
  const music = envVolume(spec.envelope);
  const voVol = spec.voVolume ?? 0.95;
  return (
    <>
      <Audio src={staticFile(spec.vo)} volume={() => voVol} />
      <Audio src={staticFile(spec.music)} volume={music} />
      {spec.sfx.map((c, i) => (
        <Sequence key={`${c.file}-${c.from}-${i}`} from={c.from} durationInFrames={c.durationInFrames}>
          <Audio src={staticFile(c.file)} volume={() => c.volume} />
        </Sequence>
      ))}
    </>
  );
};
