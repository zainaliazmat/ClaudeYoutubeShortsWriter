"""Text normalization: display tokens -> spoken tokens, with beat mapping.
Stdlib only. Covers integers 0..9999 (years + small counts) and BC/BCE/AD."""
import re

_ONES = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight",
         "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen",
         "sixteen", "seventeen", "eighteen", "nineteen"]
_TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy",
         "eighty", "ninety"]
_ABBR = {"BC": "B C", "BCE": "B C E", "AD": "A D", "CE": "C E"}


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


def normalize_token(raw):
    """Expand ONE display token to its spoken form (may be multiple words)."""
    if raw in _ABBR:
        return _ABBR[raw]
    stripped = raw.replace("~", "").replace(",", "")
    if re.fullmatch(r"\d+", stripped):
        return int_to_words(int(stripped))
    return raw


def normalize_narration(beats):
    """beats: [{'id': str, 'lines': [str]}] -> {'spoken_text', 'tokens'}."""
    tokens = []
    i = 0
    for beat in beats:
        for line in beat["lines"]:
            for disp in line.split():
                spoken = normalize_token(disp)
                for word in spoken.split():
                    tokens.append({"i": i, "spoken": word,
                                   "display": disp, "beat": beat["id"]})
                    i += 1
    spoken_text = " ".join(t["spoken"] for t in tokens)
    return {"spoken_text": spoken_text, "tokens": tokens}
