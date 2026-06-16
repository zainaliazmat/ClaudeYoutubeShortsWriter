---
name: youtube-shorts-writer
description: Use whenever the user wants to write, script, plan, or spec a YouTube Short (or vertical short-form video) that will be rendered programmatically with Remotion — especially for a faceless/no-camera channel. Triggers on "write me a short", "script for a YouTube short", "shorts idea", "make a Remotion short", "viral short script", kinetic typography / data-viz / ranking / countdown / explainer short, or any request to turn a topic, fact, list, or dataset into a vertical short-form script. Use it even when the user just gives a topic and says "make this a short."
version: 1.0.0
allowed-tools: Read, Write
user-invocable: true
---

# YouTube Shorts Writer (Remotion-native)

Write viral-optimized scripts for **faceless YouTube Shorts that will be rendered in Remotion** (React → MP4). This skill encodes what was *actually verified* about Shorts virality — separating real mechanics from marketing myths — and shapes every script around Remotion's strengths.

The full evidence base lives in `YOUTUBE_SHORTS_RESEARCH_REPORT.md` in the project root. Read it when the user wants sourcing or pushes back on a recommendation. The condensed, load-bearing facts are below so you usually don't need to.

## Why this skill exists

A brand-new channel with zero subscribers can still go viral on its *first* upload, because YouTube seeds **every** Short to a small test audience regardless of channel size, then expands distribution based purely on viewer behavior — not your sub count. That means each Short is an independent shot, and the script is the single biggest lever you control. Your job is to write scripts that win the seed-audience test: hook instantly, hold attention with pace, and loop.

## The five verified principles (build every script on these)

1. **Subs don't gate distribution — the video does.** YouTube judges each Short on click-through, average view duration, and retention, *not* subscriber count. Don't write "subscribe!" begging into the hook; spend that attention on content. (Verified, high confidence.)
2. **The first ~1 second is the thumbnail.** Most viewers swipe-or-stay within 1–3 seconds, and they can't even parse a frame faster than ~0.5s. Frame 1 must be instantly legible *and* promise a payoff. No logos, no slow fades, no "hey guys." In Remotion you control frame 1 exactly — exploit that. (Verified, high confidence.)
3. **Design for the loop.** Since March 31, 2025 every loop/replay counts as a new view, and Shorts auto-loop. A Short whose last frame flows seamlessly back into its first frame compounds its own view count. **Caveat:** looped views are a *vanity* metric — monetization uses "engaged views" which excludes loops. So loop for reach and retention signal, never claim looped views = money or audience size. (Verified, high confidence.)
4. **Pace aggressively.** ~1 cut every 2–4 seconds; a new beat every 5–7 seconds for narrative. Build the script as discrete timed beats so the Remotion composition enforces this automatically. (Verified, medium confidence — directional heuristic, not law.)
5. **Let data choose length, not gurus.** Every "optimal length" number floating around (13s, 15–30s, 20–25s, "dies after 45s") was *refuted* in verification. There is no verified magic duration. Default to **20–34s**, then tell the user to read their own Analytics retention curve and adjust. (Refuted myths — see report.)

Do **not** reproduce refuted folklore (specific retention-lift %s, "5 proven hook types," "70% retention = 3× promotion"). The mechanisms are real; the precise numbers attached to them mostly aren't.

## Step 1 — Pick a Remotion-native format

Remotion's superpower is *deterministic, data-driven motion graphics and typography*. Steer the user toward formats where the value is **information rendered as motion + text** (Remotion wins) and away from formats whose value is a **human face, real footage, or a live trend** (Remotion loses).

**🟢 Build here (Remotion-native):**
- **Kinetic typography** — word-by-word animated quotes, facts, "did you know" reveals
- **Data viz / rankings** — bar-chart races, "Top 5 X by Y", animated counters (one data file → infinite episodes)
- **List / countdown** — "5 things you didn't know", tier lists (each item = one timed beat → free pacing)
- **Explainer motion graphics** — how a concept/finance term/mechanism works, animated step-by-step
- **Code explainers** — animated syntax-highlighted walkthroughs (Remotion has first-class code support)
- **Comparisons** — "this vs that" side-by-side stat battles (loop beautifully)

**🔴 Avoid / outsource (poor Remotion fit):**
- Talking-head, reaction, vlog, face-driven content (Remotion isn't a camera)
- Dance / lip-sync / meme-format-of-the-week (needs real footage + live trend-riding)
- Cinematic b-roll storytelling (you're just sequencing stock clips — lose the edge, keep the render cost)
- ASMR / satisfying real-world footage (filmed, not coded)

If the user's topic only works as a poor-fit format, say so plainly and offer the nearest Remotion-native angle (e.g. reframe a "reaction" as a kinetic-typography breakdown of the same facts).

## Step 2 — Gather what you need

Get these before writing (ask only for what's missing — infer the rest and state your assumptions):
- **Topic / data** — the facts, list, quote, or dataset
- **Niche** — so episodes stay consistent and defensible (a recognizable template + steady niche is the moat, not trend-chasing)
- **Target length** — default 20–34s if unspecified
- **Brand constraints** — fonts, colors, music vibe, any channel name to end-card (keep it out of the hook)

## Step 3 — Write the script using the output template

Produce a structured, render-ready spec — not prose. Read `templates/short-script-template.md` and fill every section. The template gives Remotion-ready timing, on-screen text, and visual direction per beat. Key rules while filling it:

- **Hook frame (0–1.5s):** the single most legible, payoff-promising frame. Write the exact on-screen text and the visual. It must read as a "thumbnail."
- **Beats (~3s each):** each beat = one cut. Give on-screen text (short, punchy, caption-style) + a one-line visual/animation direction Remotion can implement (e.g. "bars race left-to-right, value counts up").
- **Loop-back:** explicitly describe how the final frame matches the first (same composition/colors/text position) so the auto-loop is invisible.
- **Captions:** specify burned-in, large, high-contrast, word-by-word captions — faceless content lives on on-screen text. Note Remotion can auto-generate them (`@remotion/captions` / Whisper).
- **Audio:** suggest a low-bed trending or royalty-free track; never let it bury the captions.
- **Total runtime + frame count:** give both seconds and frames at 30fps (e.g. 30s = 900 frames) so it drops straight into a Remotion composition.

## Step 4 — Close with production guidance

End every script with a short "Channel notes" block:
- Suggested length test (e.g. "render 20s and 35s cuts, compare retention curves")
- Posting cadence reminder: aim 1×/day, never below 3–4×/week — consistency feeds the seed-audience lottery, and programmatic generation is what makes daily feasible solo
- A one-line reminder to optimize for *engaged views / retention*, not loop-inflated vanity counts

## Tone of the scripts themselves

Short-form copy is punchy, concrete, and front-loaded. Lead with the most surprising element. Cut filler words. Every beat should either advance information or escalate curiosity — if a beat does neither, delete it. Write text the way it will appear on screen (fragments, not sentences), because that's what the viewer reads.
