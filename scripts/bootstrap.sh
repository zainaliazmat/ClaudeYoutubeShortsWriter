#!/usr/bin/env bash
# bootstrap.sh — make a fresh clone runnable end-to-end.
#   1. create .venv-tts and install Kokoro TTS deps (idempotent)
#   2. npm install in render/
#   3. seed render/public/ for the default F-001 composition (copy + clean)
#   4. run the doctor and report any remaining gaps
# Agent bash cwd resets between calls, so resolve the repo root from this file.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
VENV="$ROOT/.venv-tts"
RENDER="$ROOT/render"

echo "==> 1/4  TTS virtualenv (.venv-tts)"
if [ ! -x "$VENV/bin/python" ]; then
  echo "    creating $VENV"
  python3 -m venv "$VENV"
fi
if ! "$VENV/bin/python" -c "import kokoro, misaki, soundfile, numpy" >/dev/null 2>&1; then
  echo "    installing Kokoro + deps (torch is multi-GB; first run is slow)"
  "$VENV/bin/pip" install --upgrade pip >/dev/null
  "$VENV/bin/pip" install kokoro misaki soundfile numpy
else
  echo "    deps already present — skipping"
fi

echo "==> 2/4  render/ node_modules"
if [ ! -d "$RENDER/node_modules/remotion" ]; then
  ( cd "$RENDER" && npm install )
else
  echo "    node_modules already present — skipping (run 'cd render && npm ci' to force)"
fi

echo "==> 3/4  seed render/public for the default F-001 composition"
"$SCRIPT_DIR/seed-public.sh" output/F-001-cleopatra-vs-pyramids || {
  echo "    (seed skipped — F-001 assets not found; render-run.sh will populate per-run)"
}

echo "==> 4/4  doctor"
"$SCRIPT_DIR/doctor.sh" || true

echo
echo "Bootstrap complete. To render the F-001 baseline:"
echo "    cd render && npx remotion render F-001-cleopatra-vs-pyramids out/F-001.mp4"
echo "Or the full mastered pipeline:"
echo "    scripts/render-run.sh output/F-001-cleopatra-vs-pyramids"
