import React from "react";
import { Audio } from "@remotion/media";
import { interpolate, Sequence, staticFile } from "remotion";

// Frame-exact audio — v4 (VO-driven) per 05-remotion-prompt.md / 04-audio.md.
//
// VO is the LEAD (`vo.wav` ~0.95, from frame 0). The music bed DUCKS under the
// voice via the `vo-timing.json` envelope: 0.22 across the single speech region
// (0→855), releases 0.22→0.72 over 855→864, swells at 0.72 through the silent
// tail, then a short fade toward 0 by 930 for a clean loop seam.
//
// Expected files in public/: vo.wav, music-dark-tension.mp3, sfx-tick.mp3,
// sfx-whoosh.mp3, sfx-reveal-hit.mp3.

const musicVolume = (frame: number): number =>
  interpolate(
    frame,
    [0, 855, 864, 922, 930],
    [0.22, 0.22, 0.72, 0.72, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

export const AudioBed: React.FC<{ enabled: boolean }> = ({ enabled }) => {
  if (!enabled) return null;
  return (
    <>
      {/* VO — the lead. Speaks from frame 0; full length. */}
      <Audio src={staticFile("vo.wav")} volume={0.95} />

      {/* Music bed: ducked under the VO, swells on the silent tail. */}
      <Audio src={staticFile("music-dark-tension.mp3")} volume={musicVolume} />

      {/* Year-stamp ticks at each year beat start (109, 259, 493). */}
      {[109, 259, 493].map((f) => (
        <Sequence key={`tick-${f}`} from={f} durationInFrames={30}>
          <Audio src={staticFile("sfx-tick.mp3")} volume={0.6} />
        </Sequence>
      ))}

      {/* Bracket whooshes on the gap beats (397, 592). */}
      {[397, 592].map((f) => (
        <Sequence key={`whoosh-${f}`} from={f} durationInFrames={45}>
          <Audio src={staticFile("sfx-whoosh.mp3")} volume={0.5} />
        </Sequence>
      ))}

      {/* Low reveal hit at the payoff (frame 702). */}
      <Sequence from={702} durationInFrames={60}>
        <Audio src={staticFile("sfx-reveal-hit.mp3")} volume={0.95} />
      </Sequence>
    </>
  );
};
