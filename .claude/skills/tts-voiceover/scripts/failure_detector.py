"""Alignment failure detector (spec §3.6). Any failure -> trip the fallback;
a second failure aborts the run. Stdlib only."""


def check_alignment(words, wav_len_frames, n_tokens, min_w=1, max_w=45,
                    cov_tol=0.15):
    reasons = []

    if len(words) != n_tokens:
        reasons.append("token count mismatch: %d aligned vs %d spoken"
                       % (len(words), n_tokens))

    prev_end = None
    for w in words:
        if w["end"] < w["start"]:
            reasons.append("monotonicity: word %d end<start" % w["i"])
        if prev_end is not None and w["start"] < prev_end:
            reasons.append("monotonicity: word %d starts before prev end" % w["i"])
        prev_end = w["end"]
        dur = w["end"] - w["start"]
        if dur < min_w or dur > max_w:
            reasons.append("implausible duration: word %d = %df" % (w["i"], dur))

    # Coverage = the SPEECH SPAN (first word start .. last word end) vs the
    # trimmed wav length. Speech has inter-word pauses that belong to NO word,
    # so summing per-word durations structurally undershoots wav length and
    # false-aborts every real run; the span detects dropped/merged words, which
    # is what spec 3.6.2 actually wants to catch.
    if words and wav_len_frames > 0:
        span = words[-1]["end"] - words[0]["start"]
        ratio = span / float(wav_len_frames)
        if abs(1.0 - ratio) > cov_tol:
            reasons.append("coverage off: speech span is %.1f%% of wav"
                           % (ratio * 100))

    return {"ok": len(reasons) == 0, "reasons": reasons}
