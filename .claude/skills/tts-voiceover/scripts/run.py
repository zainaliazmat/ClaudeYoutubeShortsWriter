"""Orchestrator: normalize -> synth/align (+fallback) -> timing -> envelope ->
write vo.wav + vo-timing.json -> patch 02-script.md. Stdlib + sibling modules."""
import json
import os
import sys

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
    attempt (spec 3.6). Raises RuntimeError if neither works."""
    for getter in (primary, fallback):
        try:
            times = getter()
        except Exception:
            continue
        words = build_timing(times, tokens, fps=fps)["words"]
        if check_alignment(words, wav_len_frames(), len(tokens))["ok"]:
            return times
    raise RuntimeError("alignment failed on both primary and fallback")


def _parse_narration(script_path):
    """Read the 'Narration' beats from 02-script.md between markers.
    Expects lines like '- [beat_id] spoken line text' under NARRATION:START."""
    import re
    text = open(script_path).read()
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


def run(run_dir, fps=30, voice_path=None, speed=1.0, voice=None):
    """voice is an alias for voice_path (short-form convenience)."""
    from scripts.kokoro_io import synth_and_durations, aeneas_align
    if voice is not None and voice_path is None:
        voice_path = voice
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
        return synth_and_durations(spoken, voice_path, speed, out_wav)

    def fallback():
        if not os.path.isfile(out_wav):
            raise RuntimeError("no vo.wav for aeneas fallback (kokoro failed)")
        return aeneas_align(spoken, out_wav)

    times = align_with_fallback(primary, fallback, tokens, fps, _wav_len_frames)

    timing = build_timing(times, tokens, fps=fps, voice=voice_path or "",
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


if __name__ == "__main__":
    rd = sys.argv[1]
    vp = sys.argv[2] if len(sys.argv) > 2 else None
    out = run(rd, voice_path=vp)
    print("vo-timing.json total=%d frames, %d beats"
          % (out["total"], len(out["beats"])))
