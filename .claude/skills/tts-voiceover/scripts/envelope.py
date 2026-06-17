"""Deterministic music-ducking envelope from merged speech regions (spec §4).
Attack begins before region start; release after region end. Stdlib only."""


def build_duck_envelope(speech_regions, total, base=0.72, duck=0.22,
                        attack_frames=2, release_frames=9):
    kf = {0: base}
    for r in speech_regions:
        a0 = max(0, r["start"] - attack_frames)
        kf[a0] = base
        kf[r["start"]] = duck
        kf[r["end"]] = duck
        rel = min(total, r["end"] + release_frames)
        kf[rel] = base
    kf.setdefault(total, base)
    return [{"frame": f, "vol": kf[f]} for f in sorted(kf)]
