# Platform Safe Zones — 1080×1920 vertical

Load this when scoring Platform Compliance (category 7) or when a script places text near
an edge. The canvas is **1080×1920 (9:16)**. Platform UI (captions, buttons, the action
column, usernames) overlays the edges and will cover anything you put there.

> **Caveat — read this before quoting numbers.** These pixel values are community-reported
> and platforms change their UI 3–5× per year. Named sources diverge widely (TikTok's
> bottom margin is cited anywhere from 320px to 484px). Treat them as **conservative
> guidance dated mid-2026**, not exact platform specs. When in doubt, recommend the common
> safe area below and tell the user to verify against a current screenshot.

## Per-platform margins (conservative, mid-2026)

| Platform | Top | Bottom | Left | Right | Notes |
|---|---|---|---|---|---|
| **TikTok** (organic) | 108px | 320px | 60px | 120px | Right margin is the action column (like/comment/share). |
| **TikTok** (in-feed ads) | 150px | 440px | 60px | 120px | Tighter bottom — re-flag CTAs if the script targets ads. |
| **Instagram / FB Reels** (boosted) | 220px | 420px | — | — | Usable area ≈ 1010×1280. |
| **YouTube Shorts** | ~180px | ~350px | ~40px | ~120px | Usable ≈ 920×1390; visual center shifts ~40px LEFT (right action column). |

## The cross-platform common area (use this as the default)

If the script targets more than one platform (or doesn't say), recommend keeping all
critical text and CTAs inside the **~900×1400 centered region**:

- **x: roughly 90 → 990**
- **y: roughly 260 → 1660**

Anything outside this risks being covered on at least one platform.

## What to flag

- **Critical text near any edge** — titles, the hook, CTAs, key stats. Major if it's in a
  known UI band (especially the bottom ~320–440px and the right action column).
- **Captions in the bottom UI band** — burned-in captions must clear the bottom ~15–20%
  or the platform's own caption/CTA UI sits on top of them. This is the most common real
  failure. Recommend captions sit around y: 1300–1500 (above the bottom band, below center).
- **Centered composition that ignores the left-shift** — on Shorts the right ~120px is the
  action column, so a dead-centered layout reads slightly off; note it if precision matters.

## Thresholds that change the recommendation

- **Ads vs. organic:** ads tighten the bottom zone (~370–440px). If the brief mentions
  paid/boosted, re-check every bottom-placed element against the tighter band.
- **Single-platform briefs:** if the script names only one platform, use that platform's
  row instead of the conservative common area — you can use more of the screen.
