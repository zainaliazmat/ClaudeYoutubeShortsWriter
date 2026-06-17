"""VO-driven timing: word times (s) -> integer-frame timing contract.
Rounds seconds->frames exactly ONCE here. Stdlib only."""


def _f(seconds, fps):
    return int(round(seconds * fps))


def build_timing(word_times_s, tokens, fps=30, loop_tail_frames=75,
                 region_gap_ms=300, voice="", speed=1.0):
    if len(word_times_s) != len(tokens):
        raise ValueError("word_times_s (%d) and tokens (%d) must align"
                         % (len(word_times_s), len(tokens)))

    gap_frames = _f(region_gap_ms / 1000.0, fps)

    # 1) words: round once to integer frames, force first word start to 0, and
    #    apply ONLY the benign 0-frame floor (a sub-frame word rounds to
    #    start==end; clamp end to start+1 so it has a real duration). We do NOT
    #    repair monotonicity here: a genuine overlap (word starts before the
    #    previous ends) must survive to check_alignment so the detector can trip
    #    the fallback. The beat-boundary edge (a beat start jumping past a
    #    contained word's frames) only arises from non-monotonic input, which
    #    the detector catches -- so it never reaches a shipped timing contract.
    words = []
    for (s, e), tok in zip(word_times_s, tokens):
        words.append({"i": tok["i"], "display": tok["display"],
                      "spoken": tok["spoken"], "start": _f(s, fps),
                      "end": _f(e, fps), "beat": tok["beat"], "region": None})
    if words:
        words[0]["start"] = 0
    for w in words:
        if w["end"] < w["start"] + 1:
            w["end"] = w["start"] + 1

    # 2) speech regions: merge words whose inter-word gap < gap_frames.
    regions = []
    for w in words:
        if regions and w["start"] - regions[-1]["end"] < gap_frames:
            regions[-1]["end"] = max(regions[-1]["end"], w["end"])
        else:
            regions.append({"start": w["start"], "end": w["end"]})
        w["region"] = len(regions) - 1

    # 3) beats: contiguous partition. beat[k].start = first word of beat k;
    #    beat[k].end = beat[k+1].start; first start forced to 0.
    beats = []
    for w in words:
        if not beats or beats[-1]["id"] != w["beat"]:
            beats.append({"id": w["beat"], "start": w["start"], "end": w["end"]})
        else:
            beats[-1]["end"] = w["end"]
    if beats:
        beats[0]["start"] = 0
        for prev, nxt in zip(beats, beats[1:]):
            nxt["start"] = prev["end"]

    last_word_end = words[-1]["end"] if words else 0
    total = last_word_end + loop_tail_frames
    beats.append({"id": "loop", "start": last_word_end, "end": total})

    return {"fps": fps, "voice": voice, "speed": speed,
            "total": total, "words": words, "beats": beats,
            "speech_regions": regions}
