# Building a Single-Command Agentic Content Pipeline in Claude Code

## TL;DR
- **Build ONE orchestrator slash command (`/short <niche>`) that chains several focused, single-purpose Agent Skills** (niche-memory → deep-research → fact-check → asset-sourcing → script → Remotion-prompt → review → assembly) rather than one mega-skill, and run heavy/parallelizable steps (research, fact-check, asset-sourcing) as context-isolated subagents via the Agent/Task tool. This is the architecture Anthropic's "Building Effective Agents" guidance and the Claude Code docs explicitly recommend.
- **Anti-hallucination is a prompting + verification-loop problem, not a model problem**: enforce Anthropic's three documented techniques (allow "I don't know," require citations, ground claims in verbatim quotes) plus Chain-of-Verification (CoVe) and a separate fact-check subagent that must retract any claim it cannot tie to a real fetched source; gate the run with a PostToolUse/Stop hook so the rule is enforced, not merely advised.
- **Use two memory layers for self-improvement**: in-run, an evaluator-optimizer (review → revise) loop that re-runs until output passes a rubric; across runs, a committed `memory/lessons.md` that the command reads at the start of every run and appends to at the end. Source assets from API-driven, monetization-safe libraries (Pexels/Pixabay for B-roll; YouTube Audio Library/Pixabay/Uppbeat/Epidemic Sound for music) and generate the video with Remotion's official Agent Skills + the official TikTok caption template.

---

## Key Findings

### A. Claude Code is purpose-built for exactly this kind of orchestration
- **Slash commands** are Markdown files in `.claude/commands/` (project) or `~/.claude/commands/` (user). The filename becomes the command. They support YAML frontmatter (`description`, `argument-hint`, `allowed-tools`, `model`), `$ARGUMENTS` (the full trailing string), positional `$1`/`$2`, and `!`-prefixed bash injection that embeds command output into the prompt. The docs now mark `.claude/commands/` as legacy and advise "prefer `.claude/skills/`."
- **Agent Skills** = a folder containing a `SKILL.md` (YAML frontmatter `name`+`description`, then Markdown body). Progressive disclosure means only name/description load at startup; the body loads when triggered; bundled `references/`, `scripts/`, `assets/` load only on demand. Anthropic's authoring docs recommend keeping the body under ~500 lines and splitting overflow into referenced files. Claude auto-selects skills by matching the `description`, so descriptions must contain the words a user would actually say. Two invocation controls matter for a pipeline: `disable-model-invocation: true` (only you can trigger it — good for side-effecting steps) and `user-invocable: false` (only Claude can trigger it — good for background knowledge).
- **Subagents** live in `.claude/agents/*.md` (frontmatter: `name`, `description`, `tools`, `model`) and run in isolated context windows via the Agent tool (renamed from "Task" in Claude Code v2.1.63). A non-fork subagent starts with a fresh context; the only channel from parent to subagent is the prompt string, and the parent receives only the subagent's final message. This is the documented way to keep research/exploration noise out of the main context and to parallelize independent work.
- **CLAUDE.md** is hierarchical persistent memory: `~/.claude/CLAUDE.md` (user/global), `./CLAUDE.md` or `./.claude/CLAUDE.md` (project, committed), nested directory-level files (loaded on demand when Claude reads that directory), and `CLAUDE.local.md` (gitignored). Anthropic recommends keeping files under ~200 lines because longer files consume more context and reduce adherence. There is also **auto memory** (Claude's own notes, stored under `~/.claude/projects/<project>/memory/`) and modular `.claude/rules/*.md` with optional path scoping.
- **Hooks** (configured in `.claude/settings.json`) fire on lifecycle events: PreToolUse (the only hook that can block an action; exit 2 = block), PostToolUse (validate/feedback; cannot undo, but with `continueOnBlock: true` surfaces feedback so Claude can retry), Stop/SubagentStop (can force Claude to keep working), SessionStart (stdout is injected into context), and UserPromptSubmit. Handler types are command, http, prompt (sends a single-turn judgment prompt to a model — Haiku by default), and agent (spawns a verifier subagent). The documented value: "Without hooks, CLAUDE.md rules are advisory. With hooks, they become enforced gates."
- **MCP servers** add grounded research tools beyond built-in WebSearch/WebFetch. Relevant ones: **Tavily** (citation-optimized search + extract, AI-agent-focused), **Exa** (semantic/neural search for exploratory queries), **Brave** (independent, non-Google index), **Firecrawl** (scrape/crawl/structured extract), and combined servers like **mcp-omnisearch**.

### B. Anti-hallucination patterns (well-documented)
- Anthropic's official "Reduce hallucinations" documentation prescribes three core techniques. Verbatim: "**Verify with citations**: Make Claude's response auditable by having it cite quotes and sources for each of its claims… If it can't find a quote, it must retract the claim," and "**Use direct quotes for factual grounding**: For tasks involving long documents (>20K tokens), ask Claude to extract word-for-word quotes first." The third is to "give Claude an out" — explicitly allow it to say "I don't know" or answer only when certain. The docs also recommend putting long documents first and the query last (Anthropic notes this can improve response quality by up to ~30% on complex multi-document inputs), chain-of-thought, and Best-of-N consistency checks.
- **Chain-of-Verification (CoVe)** — arXiv:2309.11495 (submitted 20 Sep 2023; Findings of ACL 2024, pp. 3563–3578) by Shehzaad Dhuliawala, Mojtaba Komeili, Jing Xu, Roberta Raileanu, Xian Li, Asli Celikyilmaz, and Jason Weston (Meta AI). Verbatim: "the model first (i) drafts an initial response; then (ii) plans verification questions to fact-check its draft; (iii) answers those questions independently so the answers are not biased by other responses; and (iv) generates its final verified response." Answering the verification questions independently is what removes confirmation bias and measurably reduces hallucination across list-based, closed-book QA, and long-form tasks.
- Best practice synthesis: implement a **separate fact-check subagent** with web tools whose only job is to take each factual claim in the script, find a real source via search/fetch, and either confirm-with-quote or flag/retract. This maps to Anthropic's "parallelization/voting" and "evaluator-optimizer" workflows from "Building Effective Agents."

### C. Licensing-safe asset sourcing
- **B-roll/footage**: The **Pexels API** and **Pixabay API** both serve photos AND videos via JSON REST, are free, and allow commercial use. The Pexels license requires no attribution (appreciated, not required). Pixabay's license is also no-attribution, but its API terms ask you to show where media came from and to download/cache files rather than hotlink. The Pexels API is rate-limited by default to "200 requests per hour and 20,000 requests per month" (liftable for free with attribution), and Pexels guidance says "24 hours is a good amount of time to cache responses for"; Pixabay similarly requires caching for 24 hours. Both platforms disclaim responsibility for third-party IP (trademarks, identifiable people), so the agent must still screen footage for logos and faces.
- **Music for monetized YouTube**: The **YouTube Audio Library** (in YouTube Studio) is the only library YouTube itself certifies as copyright-safe and that won't be Content-ID-claimed; most tracks need no attribution, while a subset marked "CC BY" require crediting the artist. **Pixabay Music** is free with no attribution. **Uppbeat** offers a limited free monthly download tier. **Epidemic Sound** and **Artlist** are paid but pre-cleared for monetization — Epidemic clears any content published while you're subscribed, and that clearance persists. Critical rules: download from the original source (re-uploads get Content-ID-flagged), keep license receipts, keep paid subscriptions active while videos are public, and avoid CC-BY-NC for any monetized content.
- **YouTube AI disclosure**: YouTube introduced its altered/synthetic-content disclosure tool in March 2024, requiring creators "to disclose to viewers when realistic content – content a viewer could easily mistake for a real person, place, scene, or event – is made with altered or synthetic media, including generative AI." For an AI-voiceover Short, toggle "Altered or synthetic content" in YouTube Studio. YouTube Help states "Disclosing AI content won't limit a video's audience or impact its eligibility to earn money," and AI used only for script/outline production assistance is exempt.

### D. Remotion video generation
- Remotion makes videos from React/TypeScript; each frame is a function of `useCurrentFrame()`. Compositions declare `durationInFrames`, `fps`, `width`, `height` (vertical Shorts = 1080×1920, 9:16). Use `interpolate()`/`spring()` for animation, `<Sequence>`/`<Series>`/`<TransitionSeries>` for timing, and `<Img>`/`<Video>`/`<Audio>` (from `@remotion/media`) for assets in `public/` referenced via `staticFile()`. Randomness must use Remotion's `random(seed)`, never `Math.random()` (renders must be deterministic).
- Remotion publishes an **official LLM system prompt** at `remotion.dev/llms.txt` and **official Agent Skills** (`npx skills add remotion-dev/skills`, or `npx remotion skills` to install/update) — a set of ~28 modular rule files (animations, audio, captions, transitions, fonts, 3D) that install into `.claude/skills/` and measurably improve Claude's Remotion output (it stops suggesting hacky workarounds and uses proper APIs). `npx create-video@latest` scaffolds a project and offers to install Skills automatically.
- **Captions**: `@remotion/captions` + `createTikTokStyleCaptions()` produces word-level "pages"; `combineTokensWithinMilliseconds` controls word-by-word (~500ms, classic TikTok) vs. multi-word pages (~1200ms, calmer/educational). Word-level timing comes from Whisper (OpenAI Whisper API or local Whisper.cpp) — YouTube SRT only has line-level timing, so Whisper is required for true word-level captions. The official **TikTok template** (`remotion-dev/template-tiktok`) wires Whisper.cpp + animated word-by-word captions.
- **Audio/voice**: layer multiple `<Audio>` tracks; `volume` accepts a frame-callback for fades; a documented working range is background music at ~0.10–0.15 under voiceover. **ElevenLabs** is the de-facto TTS for faceless channels and ships official Agent Skills (`text-to-speech`, `sound-effects`, `music`) installable into `.claude/skills/`. A documented gotcha: with `TransitionSeries` scene overlaps you must add an explicit `audioDelay` or voiceover clips stack — keep all durations in a single source-of-truth config file.
- **Render**: `npx remotion render <entry> <comp-id> <out.mp4>` locally; **Remotion Lambda** (`npx remotion lambda render <serve-url> <comp-id> <out>`) renders distributed across many Lambda functions in your own AWS account (Remotion offers no hosted rendering). Per Remotion's official Lambda cost-example page, a 1-minute video that embeds an mp4 costs "$0.017, 18.91sec" on a warm Lambda / "$0.021, 15.52sec" cold, with the note "Rendering a video inside your video increases the cost significantly." (The page summarizes overall that "most of our users render multiple minutes of video for just a few pennies"; treat any longer-render dollar figures as configuration-dependent and re-confirm on that page.)
- **Named starter projects** (from official docs + GitHub): `remotion-dev/template-tiktok` (Whisper word-by-word captions); `remotion-dev/template-prompt-to-video` ("Create a story with images and voiceover from a prompt" — a CLI that generates a script, images, and voiceover via OpenAI + ElevenLabs, builds `timeline.json`, then renders); the **Prompt to Motion Graphics SaaS** starter (`remotion-dev/template-prompt-to-motion-graphics-saas` — an LLM generates Remotion code that's just-in-time Babel-compiled and previewed in the browser); and the **Editor Starter**. OSS faceless pipelines: `gyoridavid/short-video-maker` (Remotion + Kokoro TTS + Whisper.cpp + Pexels, exposed via MCP and REST, MIT-licensed, English-only voiceover) and `SabatinoMasala/faceless-laravel-example` (Laravel + Remotion, local or Lambda render).
- **Remotion licensing** (verbatim from remotion.pro/terms): "Remotion for Automators (Server Renders and Client-Side Renders) - $0.01 per render, $100 per month minimum" and "Remotion for Creators (Seats) - $25 per Seat per month, no minimum"; an Enterprise License carries a $500/month minimum. The free license covers individuals, for-profit organizations with up to 3 employees, and non-profits; an automated pipeline at a company of 4+ falls under the Automators tier.

### E. Self-improvement loops
- **In-run (reflection / evaluator-optimizer)**: Anthropic's "Building Effective Agents" describes the evaluator-optimizer workflow — "one LLM call generates a response while another provides evaluation and feedback in a loop" — best used "when we have clear evaluation criteria, and when iterative refinement provides measurable value." Build the review step as a rubric-scoring skill (e.g., factual grounding, hook strength, pacing, caption sync, copyright safety, scored 1–10 each) that forces revision if any dimension is below threshold. Always set a max-iteration cap to avoid runaway loops (a documented failure mode of iterative skills).
- **Across-run (learnings loop)**: maintain a committed `memory/lessons.md`. The command reads it at the start of every run and appends dated, specific, actionable entries at the end (e.g., "Default to neutral tone when input has no sentiment — failed test on 2026-04-14"). This complements Claude Code's native auto memory (Claude's own `MEMORY.md`-style notes, whose first ~200 lines load at session start). There is a community **Self-Improving Agent** skill that logs failures, user corrections, and capability gaps into a `.learnings/` directory and promotes lessons to project memory. Wire it with a SessionStart hook (inject lessons) and a Stop/SubagentStop hook (prompt Claude to write the run's lessons before finishing).

---

## Details: Recommended architecture

### The single command
Create `.claude/commands/short.md` (or a user-invocable skill named `short`):

```markdown
---
description: End-to-end YouTube Short pipeline for a given niche. Researches a fresh topic, fact-checks, sources licensed assets, writes the script, generates a Remotion prompt, reviews, and outputs one markdown file.
argument-hint: <niche>
allowed-tools: Read, Write, Edit, Glob, Grep, WebSearch, WebFetch, Bash, Agent
model: claude-opus-4-x
---
Niche: $ARGUMENTS
Follow the pipeline defined in CLAUDE.md exactly, in order. Read memory/lessons.md FIRST.
```

### Skills to build vs. reuse
You already have: **script-writing**, **youtube-short-writer**, **remotion-reviewer** — keep these as focused skills. Add these NEW skills (each its own `SKILL.md` folder, single responsibility, with a clear markdown I/O contract):

1. **niche-memory** — reads `niches/<niche>/*.md` archives of past scripts, summarizes what's been covered, and proposes candidate NEW topics that don't repeat. Writes `runs/<date>/candidates.md`.
2. **deep-research** (run as a subagent) — takes the chosen topic, does multi-source web research, extracts verbatim quotes with URLs, and outputs `research.md` as a claims table (claim → source URL → verbatim quote). Enforces "cite or abstain."
3. **fact-check** (separate subagent) — independently verifies each claim in `research.md` via fresh searches (Chain-of-Verification), confirms-with-quote or flags/retracts, and outputs `verified-facts.md` with a confidence column.
4. **asset-sourcing** (subagent) — queries the Pexels/Pixabay APIs for B-roll matching each scene and YouTube Audio Library/Pixabay/Uppbeat for music; records URL, license, attribution requirement, and a copyright-safety note per asset into `assets.md`.
5. **remotion-prompt-generator** — turns the final script + scene list + assets + caption style into a precise prompt (or directly a composition spec) for the Remotion skills: vertical 1080×1920, with caption timing and audio-layering instructions.
6. **final-assembly** — produces the single deliverable markdown: finalized script with scenes, music, voice, and captions explained.
7. **lessons (self-improvement)** — reads/writes `memory/lessons.md`.

Reuse Remotion's **official skills** (`npx skills add remotion-dev/skills`) and ElevenLabs' skills rather than hand-writing Remotion/TTS knowledge.

### Why focused skills + subagents (not one mega-skill)
Anthropic and community guidance converge: mega-skills can't be reused across workflows, are hard to debug, and bloat context; modular skills with clear input/output contracts chain reliably, with the orchestrator (your command + CLAUDE.md) deciding sequencing. Subagents add context isolation so a research step that reads 30 pages doesn't pollute the main window — the parent receives only the clean summary. Run independent steps (research facets, asset search) in parallel subagents; run dependent steps sequentially. Keep the orchestrator prompt focused on coordination, and put domain knowledge in the child skills.

### Recommended folder structure
```
project/
├── .claude/
│   ├── commands/short.md            # the single trigger
│   ├── agents/                      # subagents (isolated context)
│   │   ├── deep-researcher.md
│   │   ├── fact-checker.md
│   │   └── asset-scout.md
│   ├── skills/                      # reused + new skills
│   │   ├── script-writing/
│   │   ├── youtube-short-writer/
│   │   ├── remotion-reviewer/
│   │   ├── niche-memory/
│   │   ├── deep-research/
│   │   ├── fact-check/
│   │   ├── asset-sourcing/
│   │   ├── remotion-prompt-generator/
│   │   ├── final-assembly/
│   │   ├── remotion-best-practices/ # from remotion-dev/skills
│   │   └── lessons/
│   ├── rules/                       # path-scoped rules
│   └── settings.json                # hooks
├── CLAUDE.md                        # pipeline order + standards (<200 lines)
├── memory/
│   └── lessons.md                   # cross-run learnings (committed)
├── niches/
│   └── <niche>/                     # archive of past scripts (.md)
├── runs/
│   └── <date>-<topic>/              # candidates.md, research.md, verified-facts.md, assets.md, script.md, remotion-prompt.md
├── output/
│   └── <date>-<topic>.md            # the single final deliverable
└── remotion/                        # the Remotion project (public/, src/)
```

### Data flow (what each step reads/writes)
1. `/short cosmology` → command reads `memory/lessons.md` + `CLAUDE.md`.
2. **niche-memory** reads `niches/cosmology/*.md` → writes `candidates.md`, picks a fresh topic.
3. **deep-research** subagent → `research.md` (claims + verbatim quotes + URLs).
4. **fact-check** subagent reads `research.md` → `verified-facts.md` (CoVe; retract unverifiable claims).
5. **asset-sourcing** subagent reads the script outline → `assets.md` (licensed B-roll + music with license notes).
6. **script-writing** + **youtube-short-writer** read `verified-facts.md` → `script.md`.
7. **remotion-prompt-generator** reads `script.md` + `assets.md` → `remotion-prompt.md`; Remotion skills generate the composition; render via `npx remotion render`.
8. **remotion-reviewer** + rubric → evaluator-optimizer loop; revise until pass (max N iterations).
9. **final-assembly** → `output/<date>-<topic>.md`.
10. **lessons** appends what failed/worked to `memory/lessons.md`; archive `script.md` into `niches/cosmology/`.

### Hooks to enforce quality
- **SessionStart**: inject `memory/lessons.md` so every run starts informed.
- **PostToolUse (matcher `Write|Edit` on script/output)**: run a validator that checks every factual claim has a citation in `verified-facts.md`; set `continueOnBlock: true` so Claude reads the feedback and self-corrects rather than halting.
- **Stop / SubagentStop (prompt-type)**: ask "Are all claims sourced, all assets license-checked, captions synced, and AI disclosure noted?" — if not, force Claude to keep working.

---

## Recommendations (staged build)

**Phase 1 — MVP (get end-to-end working):** Create the `/short` command and the `CLAUDE.md` pipeline. Wire your three existing skills plus a basic **niche-memory** and **final-assembly**. Install Remotion (`npx create-video@latest`) and `remotion-dev/skills`. Use built-in WebSearch/WebFetch for research. Output the single markdown file. *Benchmark:* a complete, non-repeating Short script with a working Remotion prompt for one niche.

**Phase 2 — Anti-hallucination:** Add the **deep-research** and **fact-check** subagents using Anthropic's three documented prompts + CoVe, and add the PostToolUse citation-validator hook. *Benchmark / threshold to advance:* every factual claim in the output has a named source + verbatim quote, and the fact-checker retracts the unverifiable ones — aim for <1 unsourced claim per script.

**Phase 3 — Asset sourcing:** Add the **asset-sourcing** subagent with Pexels + Pixabay API keys and a music-source policy (YouTube Audio Library/Pixabay/Uppbeat free, or Epidemic Sound if subscribed). Record license + attribution per asset and add the YouTube AI-disclosure note. *Benchmark:* every scene has a licensed, monetization-safe asset with its license recorded.

**Phase 4 — Self-improvement:** Add the rubric-scoring reviewer + evaluator-optimizer loop (with a max-iteration cap), the `memory/lessons.md` learnings loop, and the SessionStart/Stop hooks. Optionally add the community Self-Improving Agent skill. *Benchmark:* rubric score improves run-over-run and repeated mistakes stop recurring.

**Phase 5 — Scale (optional):** Move rendering to Remotion Lambda for parallel/cloud renders; add an MCP search server (Tavily for citations, Exa for exploratory research) for stronger grounding; consider cron-triggering the command for batch production. Confirm the Remotion Company License tier (4+ employees → Automators, $0.01/render, $100/month minimum) before commercial scaling.

**Model routing:** pin cheap/fast models (Haiku) to mechanical skills (niche-memory, assembly) and stronger models (Opus/Sonnet) to research, fact-check, and script-writing, via the `model` frontmatter field.

---

## Caveats
- **CLAUDE.md and skill instructions are guidance, not enforcement.** Claude follows them most but not all of the time; for non-negotiable rules (citation required, no CC-BY-NC music) use hooks or CI, which the docs explicitly recommend over prose.
- **"Royalty-free" ≠ "copyright-free," and stock platforms disclaim third-party IP.** Pexels/Pixabay don't indemnify you against trademarks, logos, or identifiable people in footage; only the YouTube Audio Library is certified copyright-safe by YouTube itself. The agent must still screen assets, and you should keep license records.
- **Hallucination is reduced, never eliminated.** CoVe and citation prompts measurably cut errors but don't remove them; keep a human review gate for anything high-stakes, and prefer "abstain" over guessing. Note one documented trade-off: heavy citation constraints can reduce creative output, so consider a "research mode" toggle rather than applying them to creative copy.
- **Some specifics are version-sensitive or community-sourced.** Tool naming (Task→Agent in v2.1.63), the "legacy" status of `.claude/commands/`, hook event lists, and pricing (ElevenLabs, Epidemic Sound, Remotion) change over time — verify against current official docs. Several orchestration patterns (modular-vs-mega skills, `learnings.md`) are strong community consensus rather than single official mandates, though they align with Anthropic's "Building Effective Agents" principles.
- **Subagent context isolation cuts both ways.** Subagents see only their prompt string, so you must pass file paths and decisions explicitly; they can't read your conversation history. Map dependencies before parallelizing, and cap concurrency to avoid API rate limits.
- **Remotion deterministic constraints.** No `Math.random()`; audio sync requires explicit delays under `TransitionSeries`; and Whisper is required for word-level caption timing (YouTube SRT gives only line-level).
- **Render cost figures are configuration-dependent.** The verified official Lambda example is a 1-minute embedded-video render at ~$0.017 (warm); longer-render dollar estimates vary with composition, memory, and region, and exclude S3/bandwidth/CloudWatch and license costs — re-confirm on Remotion's cost-example page for your setup.