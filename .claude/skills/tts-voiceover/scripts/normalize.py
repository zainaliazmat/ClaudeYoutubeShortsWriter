"""Text normalization: display tokens -> spoken tokens, with beat mapping.
Stdlib only. Covers integers 0..9999 (small counts), natural year-style for bare
4-digit years (1000..2999), and BC/BCE/AD.

Year vs count disambiguation: a BARE 4-digit integer (no comma/tilde) is read as a
YEAR ("1969" -> "nineteen sixty-nine", "2560" -> "twenty-five sixty"), the way a
narrator says it. A number written with a comma/tilde ("~2,500") is a COUNT and is
read cardinally ("two thousand five hundred"). This matches how the writer types
them: years bare, magnitudes comma-grouped."""
import re

_ONES = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight",
         "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen",
         "sixteen", "seventeen", "eighteen", "nineteen"]
_TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy",
         "eighty", "ninety"]
_ABBR = {"BC": "B C", "BCE": "B C E", "AD": "A D", "CE": "C E"}

# Sentence punctuation that Kokoro emits as its OWN timed tokens. We strip it from
# the surface of each display token before number/abbrev detection (so "1969." and
# "BC," still normalize), keep the cleaned word for captions + alignment, and
# re-attach it only in the text fed to Kokoro (so its prosody still pauses at
# sentence boundaries). Internal "," / "~" survive cleaning so a count like
# "~2,500" is still recognized. Apostrophes are NOT stripped (keep "Egypt's").
_EDGE_PUNCT = ".,;:!?\"()[]…—"


def _two(n):
    if n < 20:
        return _ONES[n]
    t, o = divmod(n, 10)
    return _TENS[t] + ("-" + _ONES[o] if o else "")


def int_to_words(n):
    if n < 0 or n > 9999:
        raise ValueError("int_to_words supports 0..9999, got %d" % n)
    if n < 100:
        return _two(n)
    if n < 1000:
        h, r = divmod(n, 100)
        return _ONES[h] + " hundred" + (" " + _two(r) if r else "")
    th, r = divmod(n, 1000)
    out = _ONES[th] + " thousand"
    if r:
        out += " " + (int_to_words(r) if r >= 100 else _two(r))
    return out


def year_to_words(n):
    """Read a 4-digit year the way a narrator says it.
    1969 -> 'nineteen sixty-nine'; 2560 -> 'twenty-five sixty';
    1900 -> 'nineteen hundred'; 2005 -> 'twenty oh five'."""
    if n < 1000 or n > 2999:
        raise ValueError("year_to_words supports 1000..2999, got %d" % n)
    hi, lo = divmod(n, 100)
    if lo == 0:
        return _two(hi) + " hundred"
    if lo < 10:
        return _two(hi) + " oh " + _ONES[lo]
    return _two(hi) + " " + _two(lo)


def _split_edges(raw):
    """Split a display token into (lead_punct, core, trail_punct), where core has
    no surrounding sentence punctuation. Internal chars (commas, ~, apostrophes,
    hyphens) stay in core."""
    core = raw.strip(_EDGE_PUNCT)
    lead = raw[:len(raw) - len(raw.lstrip(_EDGE_PUNCT))]
    trail = raw[len(raw.rstrip(_EDGE_PUNCT)):]
    return lead, core, trail


def normalize_token(raw):
    """Expand ONE display token to its spoken word(s) — punctuation-clean.
    Surrounding sentence punctuation is ignored here; a bare 4-digit 1000..2999 is
    a year (year-style); a comma/tilde-marked number is a count (cardinal)."""
    _, core, _ = _split_edges(raw)
    if core in _ABBR:
        return _ABBR[core]
    had_marker = ("~" in core) or ("," in core)
    stripped = core.replace("~", "").replace(",", "")
    if re.fullmatch(r"\d+", stripped):
        n = int(stripped)
        if not had_marker and 1000 <= n <= 2999:
            return year_to_words(n)
        return int_to_words(n)
    return core


def normalize_narration(beats):
    """beats: [{'id': str, 'lines': [str]}] -> {'spoken_text', 'tokens'}.

    `tokens` are punctuation-clean word tokens (one per spoken word) carrying
    display + beat — the 1:1 alignment target. `spoken_text` is what Kokoro speaks:
    the expanded words WITH the original surrounding punctuation re-attached, so
    Kokoro still pauses at sentence boundaries. (Kokoro emits punctuation as its own
    timed tokens; kokoro_io filters those so the word streams line up 1:1.)"""
    tokens = []
    pieces = []
    i = 0
    for beat in beats:
        for line in beat["lines"]:
            for disp in line.split():
                lead, core, trail = _split_edges(disp)
                spoken = normalize_token(disp)
                pieces.append(lead + spoken + trail)
                for word in spoken.split():
                    tokens.append({"i": i, "spoken": word,
                                   "display": core, "beat": beat["id"]})
                    i += 1
    spoken_text = " ".join(pieces)
    return {"spoken_text": spoken_text, "tokens": tokens}
