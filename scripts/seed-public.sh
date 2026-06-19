#!/usr/bin/env bash
# seed-public.sh <output/F-NNN-slug> [TARGET_PUBLIC_DIR] — copy + CLEAN a public/
# dir for one run. Wipes run-scoped files (vo.wav + audio binaries) from the target,
# then copies the run's vo.wav + output/F-NNN/assets/* (audio + Lottie accent .json) fresh.
# Deterministic; no cross-run staleness. Truly-static public files (none today) preserved by
# name allowlist.
#
# TARGET_PUBLIC_DIR defaults to render/public (studio/dev). render-run.mjs passes a
# per-run isolated dir (render/.public-runs/<id>) so concurrent renders never clobber
# each other's staged binaries (audit #7).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

RUN="${1:?usage: seed-public.sh output/F-NNN-slug [TARGET_PUBLIC_DIR]}"
# Accept either an absolute path or a repo-relative one.
case "$RUN" in
  /*) RUN_DIR="$RUN" ;;
  *)  RUN_DIR="$ROOT/$RUN" ;;
esac
[ -d "$RUN_DIR" ] || { echo "seed-public: run folder not found: $RUN_DIR" >&2; exit 1; }

# Optional explicit target public dir (absolute or repo-relative); default render/public.
TARGET="${2:-$ROOT/render/public}"
case "$TARGET" in
  /*) RENDER_PUBLIC="$TARGET" ;;
  *)  RENDER_PUBLIC="$ROOT/$TARGET" ;;
esac

mkdir -p "$RENDER_PUBLIC"

# --- clean run-scoped files (keep .gitkeep and any allowlisted static file) ---
find "$RENDER_PUBLIC" -maxdepth 1 -type f ! -name '.gitkeep' -delete

# --- copy vo.wav (required) ---
if [ -f "$RUN_DIR/vo.wav" ]; then
  cp "$RUN_DIR/vo.wav" "$RENDER_PUBLIC/vo.wav"
else
  echo "seed-public: WARNING no vo.wav in $RUN_DIR (VO-driven render will fail)" >&2
fi

# --- copy audio binaries from the run's assets/ (music + SFX) ---
if [ -d "$RUN_DIR/assets" ]; then
  find "$RUN_DIR/assets" -maxdepth 1 -type f \( -name '*.mp3' -o -name '*.wav' -o -name '*.m4a' -o -name '*.json' \) \
    -exec cp {} "$RENDER_PUBLIC/" \;
fi

echo "seed-public: ${RENDER_PUBLIC#$ROOT/} seeded from $(basename "$RUN_DIR"):"
ls -1 "$RENDER_PUBLIC" | grep -v '^.gitkeep$' | sed 's/^/    /' || true
