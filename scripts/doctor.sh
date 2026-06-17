#!/usr/bin/env bash
# doctor.sh — assert every prerequisite for the Fathom factory is present.
# Prints each gap as "missing X -> install with Y". Exit 0 = ready, 1 = gaps.
# Agent bash cwd resets between calls, so resolve the repo root from this file.
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
VENV="$ROOT/.venv-tts"
RENDER="$ROOT/render"

gaps=0
ok()   { printf '  \033[32mok\033[0m   %s\n' "$1"; }
miss() { printf '  \033[31mMISS\033[0m %s\n     -> %s\n' "$1" "$2"; gaps=$((gaps+1)); }

echo "Fathom factory doctor — checking prerequisites"
echo

# --- system binaries ---
command -v node    >/dev/null 2>&1 && ok "node $(node --version)"        || miss "node"    "install Node 18+ (nvm install --lts)"
command -v npm     >/dev/null 2>&1 && ok "npm $(npm --version)"          || miss "npm"     "ships with Node"
command -v ffmpeg  >/dev/null 2>&1 && ok "ffmpeg"                        || miss "ffmpeg"  "sudo apt-get install -y ffmpeg  (macOS: brew install ffmpeg)"
command -v ffprobe >/dev/null 2>&1 && ok "ffprobe"                       || miss "ffprobe" "ships with ffmpeg"
command -v python3 >/dev/null 2>&1 && ok "python3 $(python3 --version 2>&1 | awk '{print $2}')" || miss "python3" "install Python 3.10+"

# --- TTS virtualenv (Kokoro + deps); espeak ships inside the espeakng-loader wheel ---
if [ -x "$VENV/bin/python" ]; then
  if "$VENV/bin/python" -c "import kokoro, misaki, soundfile, numpy" >/dev/null 2>&1; then
    ok ".venv-tts (kokoro, misaki, soundfile, numpy)"
  else
    miss ".venv-tts python deps" "run scripts/bootstrap.sh  (or: .venv-tts/bin/pip install kokoro misaki soundfile numpy)"
  fi
  if "$VENV/bin/python" -c "import espeakng_loader; espeakng_loader.get_library_path()" >/dev/null 2>&1; then
    ok "espeak-ng (via espeakng_loader wheel — no apt needed)"
  else
    miss "espeak-ng" "comes with misaki's espeakng-loader; reinstall: .venv-tts/bin/pip install espeakng-loader  (or sudo apt-get install -y espeak-ng)"
  fi
else
  miss ".venv-tts" "run scripts/bootstrap.sh  (creates .venv-tts and installs Kokoro)"
fi

# --- render/ node_modules ---
if [ -d "$RENDER/node_modules/remotion" ]; then
  ok "render/node_modules (remotion installed)"
else
  miss "render/node_modules" "cd render && npm install  (or run scripts/bootstrap.sh)"
fi

echo
if [ "$gaps" -eq 0 ]; then
  echo -e "\033[32mAll prerequisites satisfied.\033[0m  Next: make render (or scripts/render-run.sh output/F-001-cleopatra-vs-pyramids)"
  exit 0
else
  echo -e "\033[31m$gaps gap(s) above.\033[0m  Fix them, then re-run: make doctor"
  exit 1
fi
