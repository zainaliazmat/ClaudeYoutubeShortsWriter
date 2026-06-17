"""Render the VO-derived frame-map table and patch it into 02-script.md
between explicit markers. Stdlib only."""
import re

START = "<!-- FRAME-MAP:START -->"
END = "<!-- FRAME-MAP:END -->"


def render_frame_map_table(beats):
    lines = ["| Segment | start | end | frames |",
             "|---------|-------|-----|--------|"]
    for b in beats:
        lines.append("| %s | %d | %d | %d |"
                     % (b["id"], b["start"], b["end"], b["end"] - b["start"]))
    total = beats[-1]["end"] if beats else 0
    lines.append("| **Total** | **0** | **%d** | **%d** |" % (total, total))
    return "\n".join(lines)


def patch_script_frame_map(script_text, table_md):
    if START not in script_text or END not in script_text:
        raise ValueError("frame-map markers not found in script")
    pattern = re.compile(re.escape(START) + r".*?" + re.escape(END), re.DOTALL)
    return pattern.sub(START + "\n" + table_md + "\n" + END, script_text)
