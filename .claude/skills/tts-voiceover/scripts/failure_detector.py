"""Alignment failure detector (spec §3.6). Any failure -> trip the fallback;
a second failure aborts the run. Stdlib only."""


def check_alignment(words, wav_len_frames, n_tokens, min_w=2, max_w=45,
                    cov_tol=0.05):
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

    covered = sum(w["end"] - w["start"] for w in words)
    if wav_len_frames > 0:
        ratio = covered / float(wav_len_frames)
        if abs(1.0 - ratio) > cov_tol:
            reasons.append("coverage off: %.1f%% of wav covered"
                           % (ratio * 100))

    return {"ok": len(reasons) == 0, "reasons": reasons}
