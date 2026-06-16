# Cross-run lessons — `/short` pipeline

Dated, specific, actionable learnings. The `/short` run reads this at the start (also injected via the SessionStart hook) and `short-assembly` appends to it at the end. Keep each entry to one concrete line.

<!-- format: - F-NNN: <what happened> → <what to do next time>. YYYY-MM-DD -->

- Seed: keep facts to ONLY what's in `01-verified-facts.md`; the writer must not invent claims. 2026-06-16
- Seed: prefer YouTube Audio Library for music (no Content-ID claims); record the exact CC-BY credit string when a track requires it. 2026-06-16
- Seed: frame ranges are half-open and 0-indexed (`next.start == prev.end`); trust the reviewer's validator over manual math. 2026-06-16
- Pipeline note: newly-added `.claude/agents/*` (e.g. asset-scout) don't register in an already-running Claude Code session — reload Claude Code before relying on a new subagent. 2026-06-16
- F-001: deep-research's adversarial verify earned its keep — it killed the "pyramid completed 2580 BC" (that's the START) and the AERA "85 yrs / 2504 BC" misread; keep ~2560 BC for completion. 2026-06-16
- F-001: for "X is closer to us than to Y" time-gap facts, anchor the comparison on Cleopatra's BIRTH (69 BC) for the cleanest ~2,500-vs-~2,000 framing, and NEVER show her death day (Aug 10 vs 12 is genuinely disputed) — years only. 2026-06-16
- F-001: deep-research workflow journal can go stale / TaskOutput 404 before delivering a synthesized report — recover by extracting the per-claim verify results (verbatim quote + source URL + refuted flag) straight from journal.jsonl. 2026-06-16
- F-001: number-reveal typography reads best with a monospace digit face (Space Mono) so count-up animations don't jitter width; pair with a heavy grotesque display face. Reusable Fathom signature. 2026-06-16
- F-001: shipped at **-30.6 LUFS** (near-silent in-feed) — the spec ducked the bed to `volume=0.11` "under dialogue" but these videos have NO VO. Fix: no-VO ⇒ music bed is the LEAD (~0.7), and ALWAYS master the render to **-14 LUFS / ≤ -1 dBTP** via two-pass `loudnorm` + verify. YouTube never boosts quiet masters. See `asset-sourcing/references/audio-mastering.md`. 2026-06-17
- F-001: frame 1 was a ~0.3s black fade-in → weak thumbnail/first-frame. Open directly on the hook (no black lead-in); first frame must be legible. 2026-06-17
