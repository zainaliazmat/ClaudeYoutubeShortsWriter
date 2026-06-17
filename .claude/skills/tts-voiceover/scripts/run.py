"""Orchestrator: normalize -> synth/align (+fallback) -> timing -> envelope ->
write vo.wav + vo-timing.json -> patch 02-script.md. Stdlib + sibling modules."""
import json
import os
import sys

# Allow `python3 scripts/run.py ...` (the documented CLI): when run as a script,
# Python puts scripts/ on sys.path, not the skill root, so `import scripts.X`
# fails. Put the skill root (parent of scripts/) on the path first.
if __package__ in (None, ""):
    sys.path.insert(0,
                    os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scripts.normalize import normalize_narration
from scripts.timing import build_timing
from scripts.failure_detector import check_alignment
from scripts.envelope import build_duck_envelope
from scripts.framemap import render_frame_map_table, patch_script_frame_map


def align_with_fallback(primary, fallback, tokens, fps, wav_len_frames):
    """primary/fallback are zero-arg callables returning [(start_s,end_s)].
    wav_len_frames is a zero-arg callable returning the synthesized WAV length in
    frames (measured AFTER an aligner produced vo.wav). Returns the first aligner
    whose alignment passes check_alignment; a raising aligner counts as a failed
    attempt (spec 3.6). Raises RuntimeError (carrying each aligner's actual cause,
    so a missing-dep doesn't masquerade as a generic 'alignment failed') if
    neither works."""
    errors = []
    for name, getter in (("primary", primary), ("fallback", fallback)):
        try:
            times = getter()
        except Exception as e:
            errors.append("%s raised: %s" % (name, e))
            continue
        res = check_alignment(build_timing(times, tokens, fps=fps)["words"],
                              wav_len_frames(), len(tokens))
        if res["ok"]:
            return times
        errors.append("%s misaligned: %s" % (name, "; ".join(res["reasons"])))
    raise RuntimeError("alignment failed on both primary and fallback -- "
                       + " | ".join(errors))


def _parse_narration(script_path):
    """Read the 'Narration' beats from 02-script.md between markers.
    Expects lines like '- [beat_id] spoken line text' under NARRATION:START."""
    import re
    with open(script_path) as f:
        text = f.read()
    m = re.search(r"<!-- NARRATION:START -->(.*?)<!-- NARRATION:END -->",
                  text, re.DOTALL)
    if not m:
        raise ValueError("narration markers not found in script")
    beats, cur = [], None
    for line in m.group(1).splitlines():
        bm = re.match(r"\s*-\s*\[([^\]]+)\]\s*(.+)", line)
        if bm:
            bid, content = bm.group(1), bm.group(2).strip()
            if cur is None or cur["id"] != bid:
                cur = {"id": bid, "lines": []}
                beats.append(cur)
            cur["lines"].append(content)
    return beats


def run(run_dir, fps=30, voice=None, speed=1.0):
    """voice is a Kokoro voice NAME (e.g. 'am_michael'), not a file path."""
    from scripts.kokoro_io import synth_and_durations, aeneas_align
    script_path = os.path.join(run_dir, "02-script.md")
    out_wav = os.path.join(run_dir, "vo.wav")

    beats = _parse_narration(script_path)
    norm = normalize_narration(beats)
    spoken, tokens = norm["spoken_text"], norm["tokens"]

    if not tokens:
        raise ValueError("narration is empty -- nothing to synthesize")

    def _wav_len_frames():
        import wave
        with wave.open(out_wav) as w:
            return int(round(w.getnframes() / w.getframerate() * fps))

    def primary():
        return synth_and_durations(spoken, voice, speed, out_wav)

    def fallback():
        if not os.path.isfile(out_wav):
            raise RuntimeError("no vo.wav for aeneas fallback (kokoro failed)")
        return aeneas_align(spoken, out_wav)

    times = align_with_fallback(primary, fallback, tokens, fps, _wav_len_frames)

    timing = build_timing(times, tokens, fps=fps, voice=voice or "",
                          speed=speed)
    timing["envelope"] = build_duck_envelope(timing["speech_regions"],
                                             timing["total"])
    with open(os.path.join(run_dir, "vo-timing.json"), "w") as f:
        json.dump(timing, f, indent=2)

    table = render_frame_map_table(timing["beats"])
    with open(script_path) as f:
        patched = patch_script_frame_map(f.read(), table)
    with open(script_path, "w") as f:
        f.write(patched)
    return timing


def _cli(argv=None):
    import argparse
    from scripts.kokoro_io import preflight, KNOWN_VOICES
    p = argparse.ArgumentParser(
        prog="run.py",
        description="tts-voiceover (step 3.5): narration -> vo.wav + "
                    "vo-timing.json + frame-map patch.")
    p.add_argument("run_dir", help="run folder containing 02-script.md")
    p.add_argument("voice", nargs="?", default="am_michael",
                   help="Kokoro voice NAME (default: am_michael). "
                        "e.g. am_michael / bm_george / af_bella")
    p.add_argument("--fps", type=int, default=30, help="comp fps (default 30)")
    p.add_argument("--speed", type=float, default=1.0,
                   help="Kokoro speed; >1.0 = faster/shorter (default 1.0)")
    args = p.parse_args(argv)

    if args.voice not in KNOWN_VOICES:
        p.error("unknown voice %r. Known voices: %s"
                % (args.voice, ", ".join(sorted(KNOWN_VOICES))))

    # The Kokoro native-timing path is PRIMARY; aeneas is only the fallback
    # aligner (and is hard to build). So don't hard-require it — preflight the
    # primary deps, and just NOTE whether the fallback is available. If the
    # primary path later fails AND aeneas is missing, the run aborts with a
    # clear error from align_with_fallback (never ships bad/faked sync).
    pf = preflight(args.voice, need_aligner=False)
    if not pf["ok"]:
        sys.stderr.write("tts-voiceover preflight failed -- install/fix:\n")
        for m in pf["missing"]:
            sys.stderr.write("  - %s\n" % m)
        sys.exit(1)
    try:
        import aeneas  # noqa: F401
    except Exception:
        sys.stderr.write("note: aeneas fallback aligner not installed; relying on "
                         "Kokoro native timing (primary). The run aborts if that "
                         "fails the §3.6 detector.\n")

    out = run(args.run_dir, fps=args.fps, voice=args.voice, speed=args.speed)
    print("vo-timing.json total=%d frames, %d beats"
          % (out["total"], len(out["beats"])))


if __name__ == "__main__":
    _cli()
