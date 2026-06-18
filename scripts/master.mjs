// master.mjs — master-chain selection + gain math (pure; no ffmpeg, no fs). render-run
// performs the ffmpeg I/O using these decisions.
//
// Two chains:
//  - "limiter" (DEFAULT, for voice-led shorts): one LINEAR makeup gain to the loudness
//    target, then a true-peak limiter at the ceiling. A linear gain preserves the
//    pre-master loudness range; the limiter only tames isolated transients. Proven on the
//    SAME unchanged F-001 mix: final LRA ~8.6 (vs 3.0 under loudnorm), I/TP on target.
//  - "loudnorm" (flagged): the original two-pass loudnorm (linear=false). Its time-varying
//    gain reacts to the continuous narration and crushes LRA to ~3 on a voice-led short.
//    Kept reachable for non-voice / bed-led material where dynamic normalization is fine.

export const MASTER_MODES = ["limiter", "loudnorm"];
export const DEFAULT_MASTER_MODE = "limiter";

// resolveMasterMode — pick the chain. Explicit opt wins; else the FATHOM_MASTER env flag;
// else the default. Case-insensitive. Throws on an unrecognized value (fail loud, not silent).
export function resolveMasterMode(opt, env = {}) {
  const raw = opt ?? env.FATHOM_MASTER ?? "";
  const v = String(raw).trim().toLowerCase();
  if (v === "") return DEFAULT_MASTER_MODE;
  if (MASTER_MODES.includes(v)) return v;
  throw new Error(`unknown master mode "${v}" (expected ${MASTER_MODES.join(" | ")})`);
}

// linearGainDb — the makeup gain (dB) to move the measured integrated loudness to the
// target. The limiter that follows pulls the result down a little (it clamps transients),
// so render-run measures the output and applies one residual correction to land on target.
export function linearGainDb(measuredI, targetI) {
  if (!Number.isFinite(measuredI) || !Number.isFinite(targetI))
    throw new Error(`linearGainDb needs finite numbers (measuredI=${measuredI}, targetI=${targetI})`);
  return Math.round((targetI - measuredI) * 100) / 100;
}

// limiterAf — the ffmpeg -af for the limiter chain: linear gain FIRST, then the true-peak
// limiter LAST (so nothing after it can push a peak back over the ceiling). asc=1 smooths
// the release so the limiting is transparent on the music body.
export function limiterAf(gainDb, limitDb) {
  return `volume=${gainDb}dB,alimiter=limit=${limitDb}dB:level=false:asc=1`;
}
