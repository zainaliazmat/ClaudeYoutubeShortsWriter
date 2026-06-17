# Setup — Fathom Shorts factory

One repo: the `/short` agentic pipeline (spec generator) **plus** the Remotion renderer
under `render/`. This file gets a fresh clone from zero to a rendered F-001 baseline.

## TL;DR

```bash
bash scripts/bootstrap.sh        # venv + render/node_modules + seed F-001 public
make doctor                      # assert everything is present
make render-f001                 # render + master F-001 -> output/F-001.../final.mp4
```

## Prerequisites (the bootstrap checks these; the doctor names any gap)

| Need | Why | Install |
|---|---|---|
| Node 18+ / npm | Remotion render (`render/`) | `nvm install --lts` |
| ffmpeg + ffprobe | silence-trim, ducking envelope, two-pass `loudnorm` master, QA probes | `sudo apt-get install -y ffmpeg` · macOS `brew install ffmpeg` |
| python3 3.10+ | TTS timing scripts (stdlib) + Kokoro | system python |
| `.venv-tts` (Kokoro, misaki, soundfile, numpy) | local voiceover (free, offline) | `bash scripts/bootstrap.sh` |
| espeak-ng | phonemizer for Kokoro | **ships inside misaki's `espeakng-loader` wheel — no apt needed**; the engine sets `PHONEMIZER_ESPEAK_LIBRARY` from it |

`.venv-tts/` and `render/node_modules/` are **gitignored** — they are rebuilt by bootstrap,
never committed. Kokoro-82M weights (Apache-2.0) auto-download from Hugging Face on first VO run.

## What bootstrap does (idempotent — safe to re-run)

1. Create `.venv-tts` and `pip install kokoro misaki soundfile numpy` (skips if present).
2. `npm install` in `render/` (skips if `node_modules/remotion` present).
3. **Seed `render/public/`** for the default F-001 composition (`scripts/seed-public.sh`):
   copy + CLEAN — wipe run-scoped files, then copy the run's `vo.wav` + `output/F-NNN/assets/*`.
4. Run `scripts/doctor.sh`.

## The `render/public/` strategy (copy + clean, not symlink)

`render/public/` holds **run-scoped** files only (`vo.wav`, music, SFX) and is **gitignored**
(except `.gitkeep`). Every render repopulates it fresh from the active run folder via
`scripts/seed-public.sh` / `scripts/render-run.sh`, so there is never cross-run staleness.
The canonical copies live under the run folder: `output/F-NNN/vo.wav` and
`output/F-NNN/assets/<music|sfx>.mp3`. New videos' music/SFX are a documented **human
download step** (monetization-safe sourcing) — the pre-render asset gate halts with the
checklist from `04-audio.md` if a binary is missing.

## Rendering

- Baseline (raw): `cd render && npx remotion render F-001-cleopatra-vs-pyramids out/F-001.mp4`
- Full mastered: `scripts/render-run.sh output/F-001-cleopatra-vs-pyramids`
  (validate id → copy+clean assets → asset gate → render → two-pass `loudnorm` to
  −14 LUFS / ≤ −1 dBTP → `output/F-NNN/final.mp4`).

## Troubleshooting

- `make doctor` prints every gap as `MISS X -> install with Y`. Start there.
- Kokoro first run downloads weights — slow once, cached after.
- A brand-new skill (e.g. `remotion-codegen`) needs a **Claude Code reload** before its
  first run — newly-added `.claude/skills/*` and `.claude/agents/*` don't register mid-session.
