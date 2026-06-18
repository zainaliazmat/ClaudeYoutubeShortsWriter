# Remotion + Claude Code — Usage Guide

**Goal of this guide:** which animation library to pair with Remotion, *when* to use each, and *how* to prompt Claude Code so the output actually works. Distilled from the video "Everything Claude Code + Remotion Can Do," with the install/render specifics checked against Remotion's official docs.

> **The one rule that governs everything:** Remotion renders a **fixed, frame-deterministic timeline** — it is not a live, interactive web page. Every frame must be reproducible from a frame number. Pick the library whose model matches that, and you get clean output; fight it, and you get jitter.

---

## 0. One-time setup

```bash
npx create-video@latest          # pick "Blank", say yes to Tailwind + Skills
npx skills add remotion-dev/skills   # installs the Remotion agent skill
claude                            # start Claude Code in the project
npm install && npm run dev        # deps + live preview
```

The skill loads Remotion's component patterns, transition types, animation primitives, and rendering best practices into Claude's context automatically. **Always confirm the skill is installed before prompting** — the same prompt without it produces generic, jittery, mis-positioned output.

> ✅ Verified: `npx skills add remotion-dev/skills` is the official command ([Remotion docs](https://www.remotion.dev/docs/ai/skills)).

---

## 1. The decision map — when to use what

| You want to make… | Use | Why this one |
|---|---|---|
| Animated slide-deck / SaaS intro / launch video / structured walkthrough | **GSAP** | Precise timeline choreography maps perfectly onto Remotion's fixed frame timeline |
| Charts, graphs, data-driven visuals, animated diagrams | **D3** | Turns static data into animated data; the data *is* the content |
| 3D — product rotations, environment flythroughs, 3D explainers | **Three.js (vanilla)** or **R3F** | Renders 3D scenes to video frames |
| Lightweight, short, looping, branded clips (Reels/TikTok/Stories), app onboarding, icon/status micro-animations | **Lottie** | Smallest scope → fastest, most reliable one-shot output |
| Interactive UI demo / prototype (hover, drag, layout reflow) | **Framer Motion** | ...but note: this is for *interactive* UI, not for *rendered* video (see §2) |

### Quick mental model
- **Fixed sequence, you control the timing** → GSAP
- **The content is data** → D3
- **The content is 3D** → Three.js / R3F
- **Small, fast, looping** → Lottie
- **Driven by user input** → Framer Motion (and usually *not* the right tool for a rendered video)

---

## 2. The libraries in depth

### GSAP — structured timeline animation
**Best for:** SaaS intros, launch videos, structured walkthroughs, "animated slide deck" style videos.
**Why it fits Remotion:** GSAP gives precise timeline control — "A finishes → B starts 0.3s later → C overlaps B by 0.1s." That fixed choreography maps naturally onto Remotion's frame-based model. You get scroll-trigger-style reveals, smooth easing, staggered entrances, no jittery cuts.

**How to prompt (the pattern shown):**
1. Ask Claude to generate a landing page first.
2. Then ask it to "turn it into an animation" where each section reveals in sequence.

> **GSAP vs Framer Motion** — pick by what you're building, not what's trendy:
> - **GSAP** → fixed choreography, frame-based, deterministic → **wins for rendered Remotion video.**
> - **Framer Motion** → physics-based, reactive (hover, drag, layout reflows), driven by user input → better for **prototypes and UI demos**, not rendered video.

### D3 — data visualization
**Best for:** animated charts, demographic-change graphs, system-architecture diagrams (nodes appear in sequence, connector lines draw themselves).
**Why it fits Remotion:** static data becomes animated data — bars enter with easing, labels stay legible, each data point gets screen time before the next enters.
**Key insight:** *the data is the content.* You don't need to design anything — just supply clean data + a clear description of what to communicate, and Claude handles the rest.

**How to prompt:**
- Give Claude the data (it can even fetch public/open data itself), then describe the chart and the message.
- Reference D3's official example gallery — find an example you like and ask Claude to recreate it as a Remotion composition.

### Three.js / R3F — 3D scenes rendered to video
**Best for:** product rotations, environment flythroughs, 3D explainer animations.
**How to prompt:** give Claude an image + a directive (e.g. "animate this model with a slow rotation and camera orbit"). It builds the model, lights the scene, orbits the camera; Remotion writes it to file.

**Vanilla Three.js vs React Three Fiber (R3F):**
| | Vanilla Three.js | React Three Fiber (R3F) |
|---|---|---|
| Control | Direct WebGL pipeline — you own scene/camera/renderer | 3D in JSX |
| Frame timing | Tie animation directly to frame count, no abstraction layer | Adds an abstraction layer |
| Composition | — | Composable, hooks for lifecycle, integrates with 2D Remotion layers |
| Claude reliability | Generates it **more reliably** (well-documented API, heavy in training data) | Slightly less |
| **Caveat** | — | In Remotion every frame must be deterministic; the extra layer can occasionally introduce **timing/consistency issues** |

> **Verdict:** Simple, self-contained 3D scene → **vanilla Three.js.** Real composition / shared state across 3D elements → **R3F.**

### Lottie — lightweight & fast
**Best for:** social clips (Reels, TikTok, Stories), app onboarding, micro-content (icons in motion, status states, empty-state illustrations).
**Why it fits:** the scope is small enough that Claude doesn't overcomplicate it — output is almost always production-ready on the **first try.** Fastest path from prompt to usable output.
**How to prompt:** describe what you want in one prompt (e.g. "an animation of scanning a barcode at a convenience-store checkout"), or pull a reference from Lottie's community library, describe it, and have Claude recreate it inside your Remotion composition.

---

## 3. Two production tricks

**1 — Motion-path control.** Don't describe a curve in words. **Draw a line on a white image and feed it to Claude** — it traces the exact path and generates animation that follows your trajectory. Far more precise.

**2 — Transparent rendering** (for title cards / overlays that composite onto footage). On-screen settings:
```
Codec:  ProRes 4444 XQ
Picture (image format): PNG
Format: last option in the dropdown
```
> ⚠️ **Important addition the video omits:** Remotion's official docs also require **`--pixel-format=yuva444p10le`** (and no background set) for the alpha channel to actually survive. The full reliable CLI is:
> ```bash
> npx remotion render <id> out.mov \
>   --codec=prores --prores-profile=4444 \
>   --image-format=png --pixel-format=yuva444p10le
> ```
> Without the pixel-format step the alpha channel flattens and you lose transparency. ([Remotion — transparent videos](https://www.remotion.dev/docs/transparent-videos))

---

## 4. How to prompt Claude Code well (applies to all five)

1. **Install the skill first** — non-negotiable; it's the difference between clean and jittery.
2. **Start simple.** Generate a basic skeleton, not the finished masterpiece, on prompt #1.
3. **Iterate in the *same* session.** The best outputs take 3–4 turns in one conversation — Claude keeps the context, so quality compounds with each turn. Do **not** expect a one-shot result.
4. **Tell Claude to read the Remotion dev skill docs before writing code**, so it uses the correct project structure, utilities, and best practices for the frame-based environment.
5. **Match the tool to the motion** (use §1) before you prompt — wrong library = fighting the renderer.
6. **Render with the right settings** (especially transparency — see §3).

---

## 5. Cheat sheet

```
Slide-deck / SaaS intro / launch ........ GSAP        (generate page → animate sections in sequence)
Charts / diagrams / any data ............ D3          (give data + message; reference D3 gallery)
3D, simple self-contained scene ......... Three.js    (vanilla; ties to frame count, most reliable)
3D, complex / composed / shared state ... R3F         (watch for determinism quirks)
Social / onboarding / micro-content ..... Lottie      (one prompt; reference community library)
Interactive UI demo (NOT rendered video)  Framer Motion

Always: install skill → start simple → iterate same session → render with correct settings.
Transparency: prores + 4444(-xq) + image-format=png + pixel-format=yuva444p10le
```

### Sources
- [Remotion — Agent Skills](https://www.remotion.dev/docs/ai/skills)
- [Remotion — Prompting videos with Claude Code](https://www.remotion.dev/docs/ai/claude-code)
- [Remotion — Rendering transparent videos](https://www.remotion.dev/docs/transparent-videos)
- *Video:* "Everything Claude Code + Remotion Can Do" (analyzed transcript + on-screen slides)
