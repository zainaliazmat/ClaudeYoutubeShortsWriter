#!/usr/bin/env python3
"""
validate_frame_budget.py — deterministic frame-math validator for Remotion short scripts.

Why this exists: language models are unreliable at arithmetic over many frame ranges.
This script does the counting so the reviewer never has to. It parses the declared
total runtime, every per-section frame range, and the loop-back, then checks that the
sections tile the timeline exactly — no gaps, no overlaps, starting at 0 and ending at
the declared total. Errors are verbose and specific so the reviewer can quote them.

Frame model (matches Remotion + the youtube-shorts-writer template):
  - Frames are 0-indexed. A section written "frames A–B" occupies the half-open
    interval [A, B): it represents (B - A) frames of DURATION and the next section
    should start at B, not B+1. So Hook 0–45 then Beat1 45–135 tile cleanly.
  - Total: "Ns = F frames @ fps"  →  F must equal round(N * fps).
  - The last section (loop-back / final beat) must end exactly at F.

Usage:
    python3 validate_frame_budget.py <script-file>
    cat script.md | python3 validate_frame_budget.py -

Exit code 0 = no blocking errors, 1 = blocking errors found, 2 = could not parse.
Dependency-free (standard library only) so it runs anywhere.
"""

import json
import os
import re
import sys

# Dash characters that scripts use interchangeably in ranges: hyphen, en-dash,
# em-dash, minus sign. Normalize them all so "0–45", "0-45", "0—45" parse alike.
DASHES = "-–—−"
DASH_CLASS = f"[{DASHES}]"

# VO-driven flow: tts-voiceover patches the authoritative frame map (a table)
# between these markers, and writes durationInFrames as `total` in vo-timing.json.
FRAMEMAP_START = "<!-- FRAME-MAP:START -->"
FRAMEMAP_END = "<!-- FRAME-MAP:END -->"


def parse_vo_timing(script_path):
    """If a sibling vo-timing.json exists (VO-driven run), read the authoritative
    durationInFrames (`total`) and fps from it. Returns (total, fps) or (None,
    None). Stdin input ('-') has no directory, so VO-total is unavailable there."""
    if not script_path or script_path == "-":
        return None, None
    cand = os.path.join(os.path.dirname(os.path.abspath(script_path)),
                        "vo-timing.json")
    if not os.path.isfile(cand):
        return None, None
    try:
        with open(cand, encoding="utf-8") as f:
            data = json.load(f)
        total = data.get("total")
        fps = data.get("fps")
        return (int(total) if total is not None else None,
                float(fps) if fps is not None else None)
    except (OSError, ValueError, TypeError):
        return None, None


# A frame-map table row: "| label | start | end | frames |". The Total row uses
# **bold** digits ("| **Total** | **0** | **900** | **900** |") so its columns
# aren't bare ints — it won't match — and the separator row is dashes. Both are
# excluded naturally; we also skip any label containing "total" defensively.
TABLE_ROW_RE = re.compile(
    r"^\|\s*([^|]+?)\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|", re.IGNORECASE)


def parse_framemap_table(text):
    """Parse the VO-derived frame-map table BETWEEN the FRAME-MAP markers into
    (label, start, end, line_no, raw) sections. Scoped to the marker block so
    other tables in the script can't be mistaken for the frame map. Returns []
    if the markers/table are absent (then the caller falls back to heading
    ranges, the no-VO path)."""
    if FRAMEMAP_START not in text or FRAMEMAP_END not in text:
        return []
    lines = text.splitlines()
    in_block = False
    sections = []
    for i, line in enumerate(lines):
        if FRAMEMAP_START in line:
            in_block = True
            continue
        if FRAMEMAP_END in line:
            break
        if not in_block:
            continue
        m = TABLE_ROW_RE.match(line.strip())
        if not m:
            continue
        label = m.group(1).strip()
        if "total" in label.lower():
            continue
        sections.append((label, int(m.group(2)), int(m.group(3)),
                         i + 1, line.strip()))
    return sections


def normalize(text):
    """Collapse the various dash glyphs to a plain hyphen for stable regexes."""
    for d in "–—−":
        text = text.replace(d, "-")
    return text


def parse_total(text):
    """
    Find the declared total. Accepts forms like:
      "Total runtime: 28 s  (= 840 frames @ 30fps)"
      "30s = 900 frames @ 30 fps"
      "Total: 24 seconds (720 frames, 30 fps)"
    Returns (seconds, frames, fps, raw_line) with any piece None if absent.
    """
    fps = None
    m_fps = re.search(r"(\d+(?:\.\d+)?)\s*fps", text, re.IGNORECASE)
    if m_fps:
        fps = float(m_fps.group(1))

    seconds = None
    frames = None
    raw = None

    # Prefer a line that mentions both a duration and a frame count.
    for line in text.splitlines():
        low = line.lower()
        if "frame" not in low:
            continue
        if not re.search(r"(runtime|total|duration|length|=|@)", low):
            continue
        m_frames = re.search(r"(\d+)\s*frames?", low)
        m_secs = re.search(r"(\d+(?:\.\d+)?)\s*(?:s\b|sec|second)", low)
        if m_frames:
            frames = int(m_frames.group(1))
            raw = line.strip()
            if m_secs:
                seconds = float(m_secs.group(1))
            ml_fps = re.search(r"(\d+(?:\.\d+)?)\s*fps", low)
            if ml_fps:
                fps = float(ml_fps.group(1))
            break

    return seconds, frames, fps, raw


# A "section" is any line that declares an explicit frame range. We capture a short
# label (the text before the range) so errors can say "Beat 2" not "section 3".
SECTION_RE = re.compile(
    r"frames?\s*(\d+)\s*-\s*(\d+)",
    re.IGNORECASE,
)


def label_for(line):
    """Best-effort human label for a section line (heading text or leading words)."""
    stripped = line.strip().lstrip("#>*-• ").strip()
    # Cut the label off where the timing detail begins.
    cut = re.split(r"\(?\s*frames?\b|\d+(?:\.\d+)?\s*s\b", stripped, maxsplit=1)[0]
    cut = cut.strip(" —-:|").strip()
    return cut if cut else stripped[:40]


def parse_sections(text):
    """
    Return a list of (label, start, end, line_no, raw_line) for every frame range
    found, in document order. Lines may carry their label on the same line (the
    youtube-shorts-writer template puts it in the heading: "Beat 1 — ... (frames 45–135)").
    """
    sections = []
    lines = text.splitlines()
    for i, line in enumerate(lines):
        m = SECTION_RE.search(line)
        if not m:
            continue
        start, end = int(m.group(1)), int(m.group(2))
        label = label_for(line)
        # If the label is empty/uninformative, borrow the nearest preceding heading.
        if not label or label.lower().startswith("frame"):
            for j in range(i - 1, max(-1, i - 4), -1):
                cand = lines[j].strip().lstrip("#>*-• ").strip()
                if cand:
                    label = cand[:40]
                    break
        sections.append((label, start, end, i + 1, line.strip()))
    return sections


def main():
    if len(sys.argv) < 2:
        print("ERROR: no input file. Usage: validate_frame_budget.py <file|->")
        return 2

    path = sys.argv[1]
    if path == "-":
        raw_text = sys.stdin.read()
    else:
        try:
            with open(path, "r", encoding="utf-8") as f:
                raw_text = f.read()
        except OSError as e:
            print(f"ERROR: cannot read {path}: {e}")
            return 2

    text = normalize(raw_text)

    seconds, frames, fps, total_raw = parse_total(text)

    errors = []   # blocking
    warnings = []  # non-blocking, worth surfacing
    notes = []    # informational

    # --- VO-driven path: prefer the patched frame-map table + vo-timing.json ---
    # When a Short carries a VO, the writer leaves frame ranges as a target and
    # tts-voiceover patches the AUTHORITATIVE frame map (a table) between the
    # FRAME-MAP markers, with durationInFrames stored as `total` in
    # vo-timing.json. Tile that table against `total`. With no table present we
    # fall back to the heading-range path (the no-VO special case), unchanged.
    table_sections = parse_framemap_table(text)
    vo_total, vo_fps = parse_vo_timing(path)
    vo_mode = bool(table_sections)

    if vo_mode:
        sections = table_sections
        if vo_total is not None:
            frames = vo_total
            total_raw = "vo-timing.json total=%d" % vo_total
            seconds = None   # VO has no declared seconds; total/fps is exact
            if vo_fps:
                fps = vo_fps
            notes.append("VO-driven: durationInFrames=%d read from vo-timing.json; "
                         "tiling the patched frame-map table." % vo_total)
        else:
            warnings.append(
                "Frame-map table present but no readable vo-timing.json beside the "
                "script — tiling the table against the script's declared total. Run "
                "tts-voiceover (step 3.5) so the total is authoritative.")
    else:
        sections = parse_sections(text)

    fps_used = fps if fps else 30.0
    if fps is None:
        warnings.append(
            "No fps declared anywhere. Assuming 30fps for checks — confirm the script "
            "states fps explicitly, since every frame number depends on it."
        )

    # --- Check 1: declared total is internally consistent (F == round(N*fps)) ---
    if frames is None:
        errors.append(
            "No total frame count found. For a VO short, run tts-voiceover (step 3.5) "
            "so vo-timing.json defines the total; otherwise declare runtime as both "
            "seconds and frames (e.g. '28 s = 840 frames @ 30fps')."
        )
    elif seconds is not None:
        expected = round(seconds * fps_used)
        if expected != frames:
            errors.append(
                f"TOTAL MISMATCH: declared {seconds:g}s at {fps_used:g}fps = {expected} frames, "
                f"but the script says {frames} frames (line: '{total_raw}'). "
                f"Either the seconds, the fps, or the frame count is wrong."
            )
        else:
            notes.append(f"Total checks out: {seconds:g}s × {fps_used:g}fps = {frames} frames.")

    # --- Check 2 onward need at least the sections ---
    if not sections:
        errors.append(
            "No per-section frame ranges found (expected forms like 'frames 0–45'). "
            "Cannot verify tiling. Every beat — Hook, each Beat, and the Loop-Back — "
            "needs an explicit frame range."
        )
        return emit(errors, warnings, notes, frames, sections, fps_used)

    # --- Check 2: each range is well-formed (start < end) ---
    for label, start, end, ln, raw in sections:
        if end <= start:
            errors.append(
                f"BAD RANGE in '{label}' (line {ln}): frames {start}-{end} has "
                f"end ≤ start, so it spans {end - start} frames. A section must advance time."
            )

    # --- Check 3: first section starts at 0 ---
    first = sections[0]
    if first[1] != 0:
        errors.append(
            f"DOES NOT START AT 0: first section '{first[0]}' starts at frame {first[1]}, "
            f"not 0. The hook must open at frame 0 so the timeline is fully covered."
        )

    # --- Check 4: contiguous tiling (no gaps, no overlaps) ---
    for prev, cur in zip(sections, sections[1:]):
        p_label, _p_start, p_end, _p_ln, _p_raw = prev
        c_label, c_start, _c_end, c_ln, _c_raw = cur
        if c_start > p_end:
            errors.append(
                f"GAP between '{p_label}' (ends {p_end}) and '{c_label}' (starts {c_start}): "
                f"{c_start - p_end} frames of dead air on line {c_ln}. "
                f"'{c_label}' should start at frame {p_end}."
            )
        elif c_start < p_end:
            errors.append(
                f"OVERLAP between '{p_label}' (ends {p_end}) and '{c_label}' (starts {c_start}): "
                f"{p_end - c_start} frames double-booked on line {c_ln}. "
                f"'{c_label}' should start at frame {p_end}."
            )

    # --- Check 5: last section ends exactly at the declared total ---
    last = sections[-1]
    if frames is not None:
        if last[2] != frames:
            diff = frames - last[2]
            if diff > 0:
                errors.append(
                    f"SHORT OF TOTAL: last section '{last[0]}' ends at frame {last[2]}, "
                    f"but total is {frames}. {diff} frames are unaccounted for at the end "
                    f"(the loop-back must run to frame {frames})."
                )
            else:
                errors.append(
                    f"OVER TOTAL: last section '{last[0]}' ends at frame {last[2]}, "
                    f"which is {-diff} frames past the declared total of {frames}. "
                    f"Trim the last section or raise the total."
                )
        else:
            notes.append(f"Coverage complete: sections tile [0, {frames}] exactly.")

    # --- Heuristic: density / over-animation flag (advisory only) ---
    # Beats are sections that aren't the hook or loop-back. Many tiny beats in a short
    # window is a retention risk worth flagging.
    if frames is not None and fps_used:
        total_secs = frames / fps_used
        beatish = [s for s in sections
                   if not re.search(r"hook|loop|outro|end.?card", s[0], re.IGNORECASE)]
        if total_secs <= 35 and len(beatish) > 8:
            warnings.append(
                f"DENSITY: {len(beatish)} text beats in {total_secs:g}s. Creator consensus is "
                f"~5–8 beats for a 20–30s short; more risks over-animation / lost retention."
            )

    return emit(errors, warnings, notes, frames, sections, fps_used)


def emit(errors, warnings, notes, frames, sections, fps_used):
    print("=" * 64)
    print("FRAME-BUDGET VALIDATION")
    print("=" * 64)

    if sections:
        print(f"\nParsed {len(sections)} timed section(s):")
        for label, start, end, ln, _raw in sections:
            dur = end - start
            secs = dur / fps_used if fps_used else 0
            print(f"  [{start:>5} → {end:<5}]  {dur:>4}f  {secs:5.2f}s   {label}")
    if frames is not None:
        print(f"\nDeclared total: {frames} frames"
              f" ({frames / fps_used:.2f}s @ {fps_used:g}fps)")

    if notes:
        print("\nPASSED:")
        for n in notes:
            print(f"  ✓ {n}")

    if warnings:
        print("\nWARNINGS (non-blocking):")
        for w in warnings:
            print(f"  ⚠ {w}")

    if errors:
        print("\nBLOCKING ERRORS:")
        for e in errors:
            print(f"  ✗ {e}")
        print(f"\nRESULT: FAIL — {len(errors)} blocking frame-budget error(s). "
              f"Cap the Timing & Frame Accuracy category and tag these blocker.")
        print("=" * 64)
        return 1

    print("\nRESULT: PASS — frame budget tiles exactly with no gaps or overlaps.")
    print("=" * 64)
    return 0


if __name__ == "__main__":
    sys.exit(main())
