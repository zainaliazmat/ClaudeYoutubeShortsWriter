# Lottie Accent Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a deterministic Lottie *accent layer* (animated icons / micro-illustrations) that drops into existing Fathom Short compositions, rendered via `@remotion/lottie`, sourced generate-first via the `lottie-master` skill.

**Architecture:** A pure-helper + thin-component split in `render/src/lib/lottie/` (mirrors `lib/dataviz/`): testable helpers (`lottie-helpers.ts`) carry the fps-match / loop-window / safe-area math; `LottieAccent.tsx` composes them around `@remotion/lottie`'s `Lottie`. Accents are `.json` generated at the channel's 30fps. Determinism is guarded three ways: a static `fr===30` JSON scan + the existing forbidden-API scan (gate), a byte-reproducibility render fixture, and an ffmpeg non-blank check over the accent's sustain window. No new `effective_style`; the pipeline skills learn to spec/emit accents as a layer.

**Tech Stack:** Remotion v4 (`@remotion/lottie`), React 19, TypeScript, `node --test`, Python 3 stdlib (`lottie_gen.py`), ffmpeg (`signalstats`).

**Spec:** `docs/superpowers/specs/2026-06-19-lottie-accent-layer-design.md`

## Global Constraints

(Every task's requirements implicitly include these — copied verbatim from the spec.)

- **Version pin:** `@remotion/lottie` is pinned to the **exact** version already used by the other `@remotion/*` packages with the caret stripped. Today that is **`4.0.478`** (`remotion`, `@remotion/cli`, `@remotion/google-fonts`, `@remotion/media` are all `4.0.478`). Skew between `@remotion/*` packages causes flicker.
- **Canonical fps:** the channel renders at **30fps** (`FPS` in `render/src/lib/safeArea.ts`). Every accent `.json` is generated at `fr: 30`.
- **fps mismatch hard-fails the render:** on `getLottieMetadata().fps !== comp fps`, the primitive **throws** (aborts the render). Never a `null`-fallthrough, never a silently-dropped accent, never wrapped in a swallowing `try/catch`.
- **Determinism (lib/lottie):** every frame a pure function of frame; no `Math.random`, `Date.now()`, `new Date()`, `performance.now()`, `requestAnimationFrame`. The dotLottie/ThorVG runtime is **never** in the render path — `@remotion/lottie` (lottie-web, `goToAndStop`) only.
- **Stable identity:** parsed `animationData` is memoized (module-level cache keyed by `src`, or a stable imported module) so Remotion never re-initializes mid-render.
- **Recolor is generate-time only** (`lottie_gen.py --color`); no runtime recolor in 3a.
- **Looping:** an accent either completes once within its frame window, or loops on an **integer-frame period that exactly divides the window**; it must not cross the video's loop seam.
- **Sourcing order:** generate-first (C/B), source-from-LottieFiles only as fallback (A) with a per-file license + reject screen (embedded rasters, non-embedded fonts, expression-driven layers, nested precomps at a differing `fr`).
- **Scope:** accent layer only. No `effective_style: lottie` branch, no `03-style.md` / selector machinery, no `.lottie` bundles/state-machines/runtime-theming.

---

## Reconnaissance (verified against source — do not re-guess)

These were confirmed by reading the actual files; tasks below depend on them.

- **`lottie_gen.py` serialization point:** `main()` builds `anim = fn(**kwargs)` then calls **`anim.save(out, minify=...)`** (which internally calls `self.to_dict()`). There is **no** `--fps` flag yet. Task 2 replaces the save path with `to_dict()` → `resample_fps()` → `json.dump()`.
- **`PRESETS` keys (exact CLI names):** `spinner, pulse, dots, check, cross, progress, heartbeat, bounce, fadein`. The success checkmark preset is **`check`** (the descriptive *filename* `success-check.json` is unrelated to the CLI key). `check` builds at `fps=60, duration_frames=45`, keyframes at frames `0,18,24,40` — all even, so 60→30 scales to clean integers (`0,9,12,20`, op→22).
- **`check` preset keyframe shapes** the resampler must traverse: animated properties appear as `{"a":1,"k":[…]}` inside layer `ks` (transform `r`/`p`) **and** inside shape items (`trim`'s `e` end property). A single recursive walker that scales every `{"a":1,"k":[list]}` node's keyframe `t` covers all of them.
- **qa-probe ffmpeg pattern (reuse this exactly):** its `ff()` helper runs ffmpeg and returns **`stdout + stderr` concatenated** (and on error `(e.stdout||"")+(e.stderr||"")`), then regexes `YAVG=`/`YMIN=`/`YMAX=` out of the combined string. `metadata=print:file=-` + `-f null -`. Task 9 MUST combine both streams — reading stderr alone misses the values.
- **`safeArea.ts` exports (named):** `WIDTH=1080, HEIGHT=1920, FPS=30, SAFE_TOP=154, SAFE_BOTTOM=1632, SAFE_INSET_X=60` (+ `QUALITY_FLOORS`, `hexLuma`, `gradientLuma`). All used by name in Tasks 4/8/9.
- **`check-determinism.mjs` arg contract:** takes an optional composition-id as `process.argv[2]` (default `dataviz-fixture`); renders frames 0/mid/last twice and SHA-compares. Confirmed.
- **Determinism check has NO automated home today:** nothing invokes `check-determinism.mjs` (the dataviz one is manual/slow-lane despite the D3 spec's intent). Task 9b therefore CREATES a `make check-lottie` slow-lane target and wires the proof-of-life to it — we are not retrofitting the pre-existing dataviz gap here.

---

## File Structure

**New:**
- `.claude/skills/lottie-master/**` — the installed skill (canonical copy).
- `render/src/lib/lottie/lottie-helpers.ts` — pure helpers (fps assert, loop-window, safe-area box).
- `render/src/lib/lottie/LottieAccent.tsx` — the component.
- `render/src/lib/lottie/index.ts` — barrel export.
- `render/src/lib/lottie/__fixtures__/success-check.json` — committed 30fps accent (fixture + first real accent).
- `render/src/lib/lottie/__tests__/lottie-helpers.test.ts` — unit tests.
- `render/src/lottie-fixture/Fixture.tsx` — isolated render-hash composition.
- `render/scripts/check-lottie-fps.mjs` — static `fr===30` JSON guard.
- `render/scripts/check-lottie-render.mjs` — byte-repro + non-blank sustain check (ffmpeg).

**Modified:**
- `.claude/skills/lottie-master/scripts/lottie_gen.py` — add `--fps` resample.
- `render/package.json` — add dep; extend `gate`; add `check:determinism:lottie` script.
- `render/scripts/check-dataviz-static.mjs` — add `lib/lottie` to `SCAN_DIRS`.
- `render/src/Root.tsx` — register the `lottie-fixture` composition.
- `Makefile` — add a `check-lottie` slow-lane target (determinism + render).
- `scripts/seed-public.sh` — copy `*.json` accents from the run's `assets/`.
- `.claude/skills/asset-sourcing/SKILL.md`, `.claude/skills/remotion-prompt-generator/SKILL.md`, `.claude/skills/remotion-codegen/SKILL.md` — accent-layer wiring.

---

### Task 1: Install the `lottie-master` skill

**Files:**
- Create: `.claude/skills/lottie-master/**` (copied from the canonical research copy)

- [ ] **Step 1: Diff the two research copies and pick the canonical one**

Run:
```bash
cd "/home/zain-ali/Documents/ScriptWriter/Lottie & dotLottie research"
diff -rq "lottie-master" "lottie-master (2)"
```
Expected: a list of differing/extra files (or "identical"). Choose the copy with the more complete `assets/templates/` and `references/`; if identical, use `lottie-master`.

- [ ] **Step 2: Copy the canonical skill into the project skills dir**

Run (adjust the source dir to the canonical one chosen in Step 1):
```bash
cd /home/zain-ali/Documents/ScriptWriter
cp -R "Lottie & dotLottie research/lottie-master" ".claude/skills/lottie-master"
```

- [ ] **Step 3: Verify the skill is well-formed and the generator runs**

Run:
```bash
cd /home/zain-ali/Documents/ScriptWriter
head -3 .claude/skills/lottie-master/SKILL.md
python3 .claude/skills/lottie-master/scripts/lottie_gen.py list
```
Expected: SKILL.md front-matter (`name: lottie-master`) prints; the preset list (`spinner`, `pulse`, …, `fadein`) prints with no Python error.

- [ ] **Step 4: Commit**

```bash
git add .claude/skills/lottie-master
git commit -m "feat(lottie): install lottie-master skill (canonical copy)"
```

---

### Task 2: Add a `--fps` resample to `lottie_gen.py`

The presets bake `fr=60`; the channel renders at 30. Add a `--fps` flag that rescales the built animation to a target frame rate (scaling `op`, every layer `ip`/`op`, and every keyframe `t`, rounding to integer frames), so accents can be generated natively at 30fps.

**Files:**
- Modify: `.claude/skills/lottie-master/scripts/lottie_gen.py`

**Interfaces:**
- Produces: `python3 lottie_gen.py <preset> --color "#hex" --fps 30 -o out.json` emits a `.json` with top-level `"fr": 30` and integer keyframe times.

**Note on lossiness:** the presets bake keyframes as hard-coded 60fps frame integers, so resampling to 30 is **lossy** — `round()` can in principle collide adjacent keyframes for very tightly-spaced motion (Python banker's rounding: `round(0.5)==0`). The `check` preset's keyframes (`0,18,24,40`) all scale cleanly to integers with no collision, so it is safe; for future fast accents, prefer wide keyframe spacing or author the preset in seconds. Step 4 adds an assertion that catches the dangerous failure mode (a sub-layer left at 60fps timing while `op`/`fr` halve).

- [ ] **Step 1: Add the `resample_fps` helper (single recursive walker)**

Add these module-level functions after the `Lottie` class definition, before the presets:

```python
def _scale_kf_times(node, scale_frame):
    """Recursively scale the keyframe time `t` of every animated property
    ({"a":1,"k":[...]}) anywhere in the dict tree — covers layer transforms (ks),
    shape items (it), and trim/gradient properties alike."""
    if isinstance(node, dict):
        if node.get("a") == 1 and isinstance(node.get("k"), list):
            for kf in node["k"]:
                if isinstance(kf, dict) and "t" in kf:
                    kf["t"] = scale_frame(kf["t"])
        for v in node.values():
            _scale_kf_times(v, scale_frame)
    elif isinstance(node, list):
        for v in node:
            _scale_kf_times(v, scale_frame)


def resample_fps(doc: dict, target_fps: int) -> dict:
    """Rescale a built Lottie dict from its baked fr to target_fps, keeping wall-clock
    duration. Scales doc op/ip, every layer ip/op, and every animated keyframe `t` by
    target/source, rounding to integer frames. Mutates and returns `doc`."""
    src_fps = doc.get("fr", target_fps)
    if src_fps == target_fps:
        return doc
    k = target_fps / src_fps

    def scale_frame(v):
        return round(v * k)

    doc["fr"] = target_fps
    doc["op"] = scale_frame(doc.get("op", 0))
    doc["ip"] = scale_frame(doc.get("ip", 0))
    for layer in doc.get("layers", []):
        layer["ip"] = scale_frame(layer.get("ip", 0))
        layer["op"] = scale_frame(layer.get("op", doc["op"]))
        _scale_kf_times(layer, scale_frame)  # one walker; covers ks + shapes + it
    return doc


def max_kf_time(doc: dict) -> int:
    """Largest keyframe `t` anywhere in the doc — used to assert no sub-layer kept its
    pre-resample (faster) timing."""
    best = 0

    def walk(node):
        nonlocal best
        if isinstance(node, dict):
            if node.get("a") == 1 and isinstance(node.get("k"), list):
                for kf in node["k"]:
                    if isinstance(kf, dict) and isinstance(kf.get("t"), (int, float)):
                        best = max(best, kf["t"])
            for v in node.values():
                walk(v)
        elif isinstance(node, list):
            for v in node:
                walk(v)

    walk(doc)
    return best
```

- [ ] **Step 2: Add the `--fps` CLI argument and rewrite the save path**

In `main()`, after `p.add_argument("--pretty", ...)`, add:

```python
    p.add_argument("--fps", type=int, default=None,
                   help="resample to this frame rate (e.g. 30 for Fathom)")
```

Then replace the serialization block (the lines `anim = fn(**kwargs)` … through the final `print(...)` and `return 0`) with:

```python
    anim = fn(**kwargs)
    doc = anim.to_dict()
    if args.fps is not None:
        doc = resample_fps(doc, args.fps)
    out = args.out or f"{args.preset}.json"
    with open(out, "w") as f:
        if args.pretty:
            json.dump(doc, f, indent=2)
        else:
            json.dump(doc, f, separators=(",", ":"))
    print(f"Wrote {out}  ({doc['w']}x{doc['h']}, "
          f"{doc['op']/doc['fr']:.1f}s @ {doc['fr']}fps, {len(doc['layers'])} layers)")
    return 0
```

- [ ] **Step 3: Generate a 30fps check and verify `fr` + integer keyframes**

Run:
```bash
cd /home/zain-ali/Documents/ScriptWriter
python3 .claude/skills/lottie-master/scripts/lottie_gen.py check --color "#46C6FF" --size 320 --fps 30 -o /tmp/check30.json
python3 -c "
import json
from importlib.util import spec_from_file_location, module_from_spec
s=spec_from_file_location('lg','.claude/skills/lottie-master/scripts/lottie_gen.py'); m=module_from_spec(s); s.loader.exec_module(m)
d=json.load(open('/tmp/check30.json'))
ints=all(isinstance(kf.get('t',0),int) for L in d['layers'] for v in L['ks'].values() if isinstance(v,dict) and v.get('a')==1 for kf in v['k'])
print('fr',d['fr'],'op',d['op'],'integer_kf',ints)
"
```
Expected: `fr 30 op 22 integer_kf True`.

- [ ] **Step 4: Assert no sub-layer kept 60fps timing (the silent half-scale bug)**

Run:
```bash
cd /home/zain-ali/Documents/ScriptWriter
python3 -c "
import json
from importlib.util import spec_from_file_location, module_from_spec
s=spec_from_file_location('lg','.claude/skills/lottie-master/scripts/lottie_gen.py'); m=module_from_spec(s); s.loader.exec_module(m)
d=json.load(open('/tmp/check30.json'))
mx=m.max_kf_time(d)
assert mx<=d['op'], f'keyframe t={mx} exceeds op={d[\"op\"]} -> a sub-layer was not resampled'
print('max_kf_time',mx,'<= op',d['op'],'OK')
"
```
Expected: `max_kf_time 20 <= op 22 OK`. (If this fails, the resampler missed a keyframe location — fix `_scale_kf_times` before proceeding.)

- [ ] **Step 5: Commit**

```bash
git add .claude/skills/lottie-master/scripts/lottie_gen.py
git commit -m "feat(lottie): --fps resample so accents generate at the channel 30fps"
```

---

### Task 3: Add the `@remotion/lottie` dependency

**Files:**
- Modify: `render/package.json`

- [ ] **Step 1: Install pinned to the existing Remotion version**

Run:
```bash
cd /home/zain-ali/Documents/ScriptWriter/render
npm install @remotion/lottie@4.0.478 --save-exact
```
Expected: installs `@remotion/lottie` at exactly `4.0.478`.

- [ ] **Step 2: Verify the pin matches the suite and has no caret**

Run:
```bash
cd /home/zain-ali/Documents/ScriptWriter/render
node -e "const p=require('./package.json');const v=p.dependencies['@remotion/lottie'];console.log('lottie',v,'cli',p.dependencies['@remotion/cli']);if(v!=='4.0.478')process.exit(1)"
```
Expected: `lottie 4.0.478 cli 4.0.478` and exit 0 (no `^`).

- [ ] **Step 3: Verify import + types resolve**

Run:
```bash
cd /home/zain-ali/Documents/ScriptWriter/render
node --input-type=module -e "import('@remotion/lottie').then(m=>console.log('exports', Object.keys(m).join(',')))"
```
Expected: includes `Lottie` and `getLottieMetadata`.

- [ ] **Step 4: Commit**

```bash
git add render/package.json render/package-lock.json
git commit -m "feat(lottie): add @remotion/lottie@4.0.478 (exact, matches the @remotion/* suite)"
```

---

### Task 4: Pure helpers — `lottie-helpers.ts` (TDD)

**Files:**
- Create: `render/src/lib/lottie/lottie-helpers.ts`
- Test: `render/src/lib/lottie/__tests__/lottie-helpers.test.ts`

**Interfaces:**
- Produces:
  - `CANONICAL_FPS = 30`
  - `assertAccentFps(metaFps: number | null | undefined, compFps: number, name: string): void` — throws `Error` on mismatch/missing.
  - `type AccentPlacement = { anchor: "top" | "center" | "above-captions"; sizePx: number }`
  - `accentBoxStyle(p: AccentPlacement): { position: "absolute"; left: number; top: number; width: number; height: number }`
  - `loopForWindow(accentDurationInFrames: number, windowFrames: number): boolean` — `true` iff the accent is shorter than the window AND divides it evenly.

- [ ] **Step 1: Write the failing tests**

```typescript
// render/src/lib/lottie/__tests__/lottie-helpers.test.ts
import { test } from "node:test";
import assert from "node:assert";
import {
  CANONICAL_FPS,
  assertAccentFps,
  accentBoxStyle,
  loopForWindow,
} from "../lottie-helpers.ts";
import { SAFE_TOP, SAFE_BOTTOM, SAFE_INSET_X, WIDTH } from "../../safeArea.ts";

test("CANONICAL_FPS is 30", () => {
  assert.equal(CANONICAL_FPS, 30);
});

test("assertAccentFps: passes when rounded fps equals comp fps", () => {
  assert.doesNotThrow(() => assertAccentFps(30, 30, "a.json"));
  assert.doesNotThrow(() => assertAccentFps(29.97, 30, "a.json")); // rounds to 30
});

test("assertAccentFps: throws hard on mismatch", () => {
  assert.throws(() => assertAccentFps(60, 30, "a.json"), /a\.json.*fps/);
});

test("assertAccentFps: throws when metadata is missing", () => {
  assert.throws(() => assertAccentFps(null, 30, "a.json"), /a\.json.*metadata/);
});

test("accentBoxStyle: box stays inside the safe area for every anchor", () => {
  for (const anchor of ["top", "center", "above-captions"] as const) {
    const s = accentBoxStyle({ anchor, sizePx: 300 });
    assert.ok(s.left >= SAFE_INSET_X, `${anchor} left`);
    assert.ok(s.left + s.width <= WIDTH - SAFE_INSET_X, `${anchor} right`);
    assert.ok(s.top >= SAFE_TOP, `${anchor} top`);
    assert.ok(s.top + s.height <= SAFE_BOTTOM, `${anchor} bottom`);
  }
});

test("loopForWindow: loops only when shorter AND an exact divisor", () => {
  assert.equal(loopForWindow(30, 90), true); // 90 % 30 === 0
  assert.equal(loopForWindow(30, 100), false); // not a divisor -> play once
  assert.equal(loopForWindow(90, 90), false); // equal length -> play once
  assert.equal(loopForWindow(120, 90), false); // longer -> play once
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd render && npm run test:lib`
Expected: FAIL — `Cannot find module '../lottie-helpers.ts'`.

- [ ] **Step 3: Implement the helpers**

```typescript
// render/src/lib/lottie/lottie-helpers.ts
// Pure, frame-independent helpers for the Lottie accent layer. No React, no
// Remotion runtime — unit-testable under node:test. Determinism: pure math only.
import { SAFE_TOP, SAFE_BOTTOM, SAFE_INSET_X, WIDTH } from "../safeArea";

export const CANONICAL_FPS = 30;

/** Hard-fail guard: the accent's natural fps MUST match the composition fps, else
 *  lottie-web's goToAndStop() seeks a mis-scaled timeline (wrong speed + non-integer
 *  loop period). Throws — callers must NOT swallow this. */
export function assertAccentFps(
  metaFps: number | null | undefined,
  compFps: number,
  name: string,
): void {
  if (metaFps == null) {
    throw new Error(`[LottieAccent] ${name}: could not read Lottie metadata (fps).`);
  }
  if (Math.round(metaFps) !== compFps) {
    throw new Error(
      `[LottieAccent] ${name}: accent fps ${metaFps} != composition fps ${compFps}. ` +
        `Regenerate the accent at ${compFps}fps (lottie_gen.py --fps ${compFps}).`,
    );
  }
}

export type AccentPlacement = {
  anchor: "top" | "center" | "above-captions";
  sizePx: number;
};

/** Centered horizontally; vertical position by anchor; the box is clamped to sit
 *  fully inside the safe area regardless of sizePx. */
export function accentBoxStyle(p: AccentPlacement): {
  position: "absolute";
  left: number;
  top: number;
  width: number;
  height: number;
} {
  const maxW = WIDTH - 2 * SAFE_INSET_X;
  const maxH = SAFE_BOTTOM - SAFE_TOP;
  const size = Math.min(p.sizePx, maxW, maxH);
  const left = Math.round((WIDTH - size) / 2);
  let top: number;
  if (p.anchor === "top") {
    top = SAFE_TOP;
  } else if (p.anchor === "above-captions") {
    top = SAFE_BOTTOM - size;
  } else {
    top = Math.round((SAFE_TOP + SAFE_BOTTOM - size) / 2);
  }
  // Clamp (defensive — size is already bounded).
  top = Math.max(SAFE_TOP, Math.min(top, SAFE_BOTTOM - size));
  return { position: "absolute", left, top, width: size, height: size };
}

/** Loop only if the accent is strictly shorter than its window AND divides it
 *  evenly (integer-frame period). Otherwise play once and freeze on the last frame
 *  — never a fractional loop that fights the video seam. */
export function loopForWindow(accentDurationInFrames: number, windowFrames: number): boolean {
  if (accentDurationInFrames <= 0) return false;
  return accentDurationInFrames < windowFrames && windowFrames % accentDurationInFrames === 0;
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd render && npm run test:lib`
Expected: PASS — all `lottie-helpers` tests green.

- [ ] **Step 5: Commit**

```bash
git add render/src/lib/lottie/lottie-helpers.ts render/src/lib/lottie/__tests__/lottie-helpers.test.ts
git commit -m "feat(lottie): pure helpers (fps assert, safe-area box, loop-window) + tests"
```

---

### Task 5: The `LottieAccent` component

**Files:**
- Create: `render/src/lib/lottie/LottieAccent.tsx`
- Create: `render/src/lib/lottie/index.ts`

**Interfaces:**
- Consumes: `assertAccentFps`, `accentBoxStyle`, `loopForWindow`, `AccentPlacement` (Task 4); `Lottie`, `getLottieMetadata`, `LottieAnimationData` (`@remotion/lottie`, Task 3).
- Produces:
  - `type LottieAccentProps = { src?: string; animationData?: LottieAnimationData; placement: AccentPlacement; windowFrames: number; renderer?: "svg" | "canvas" }`
  - `const LottieAccent: React.FC<LottieAccentProps>`
  - barrel `index.ts` re-exporting `LottieAccent`, `lottie-helpers`.

- [ ] **Step 1: Implement the component**

```tsx
// render/src/lib/lottie/LottieAccent.tsx
// Deterministic Lottie accent: @remotion/lottie (lottie-web, goToAndStop) only —
// never the dotLottie/ThorVG autoplay runtime. animationData identity is stabilized
// via a module-level cache so Remotion never re-initializes mid-render.
import React, { useEffect, useMemo, useState } from "react";
import { Lottie, getLottieMetadata, type LottieAnimationData } from "@remotion/lottie";
import { cancelRender, continueRender, delayRender, staticFile, useVideoConfig } from "remotion";
import { assertAccentFps, accentBoxStyle, loopForWindow, type AccentPlacement } from "./lottie-helpers";

export type LottieAccentProps = {
  /** Path under public/ (run-scoped, seeded by seed-public.sh). Mutually exclusive with animationData. */
  src?: string;
  /** In-memory animation (e.g. an imported .json fixture). Mutually exclusive with src. */
  animationData?: LottieAnimationData;
  placement: AccentPlacement;
  /** Frames the accent occupies; drives the loop decision. */
  windowFrames: number;
  renderer?: "svg" | "canvas";
};

const animationCache = new Map<string, LottieAnimationData>();

export const LottieAccent: React.FC<LottieAccentProps> = ({
  src,
  animationData,
  placement,
  windowFrames,
  renderer = "svg",
}) => {
  if ((src == null) === (animationData == null)) {
    throw new Error("[LottieAccent] provide exactly one of `src` or `animationData`.");
  }
  const { fps } = useVideoConfig();

  // Direct (fixture) path: identity is the imported module — already stable.
  const [fetched, setFetched] = useState<LottieAnimationData | null>(
    () => (src ? (animationCache.get(src) ?? null) : null),
  );
  const [handle] = useState(() =>
    src && !animationCache.has(src)
      ? delayRender(`Lottie ${src}`, { retries: 2, timeoutInMilliseconds: 30000 })
      : null,
  );

  useEffect(() => {
    if (handle === null || !src) return; // cache hit or direct path: nothing to load
    let cancelled = false;
    fetch(staticFile(src))
      .then((r) => r.json())
      .then((json: LottieAnimationData) => {
        animationCache.set(src, json);
        if (!cancelled) setFetched(json);
        continueRender(handle);
      })
      .catch((err) => cancelRender(err));
    return () => {
      cancelled = true;
    };
  }, [src, handle]);

  const data = animationData ?? fetched;
  // Hard-fail fps guard + loop decision are pure functions of the (stable) data.
  const decision = useMemo(() => {
    if (!data) return null;
    const meta = getLottieMetadata(data);
    assertAccentFps(meta?.fps, fps, src ?? "animationData"); // throws on mismatch — do NOT catch
    return { loop: loopForWindow(meta!.durationInFrames, windowFrames) };
  }, [data, fps, windowFrames, src]);

  if (!data || !decision) return null;

  return (
    <Lottie
      animationData={data}
      loop={decision.loop}
      renderer={renderer}
      preserveAspectRatio="xMidYMid meet"
      style={accentBoxStyle(placement)}
    />
  );
};
```

- [ ] **Step 2: Create the barrel export**

```typescript
// render/src/lib/lottie/index.ts
// lib/lottie — the Lottie accent-layer primitive. @remotion/lottie (lottie-web,
// goToAndStop) only; never the dotLottie/ThorVG autoplay runtime. Accents are 30fps
// .json, generate-first via the lottie-master skill. Peer to Background/Captions.
export { LottieAccent, type LottieAccentProps } from "./LottieAccent";
export {
  CANONICAL_FPS,
  assertAccentFps,
  accentBoxStyle,
  loopForWindow,
  type AccentPlacement,
} from "./lottie-helpers";
```

- [ ] **Step 3: Verify tsc + eslint pass**

Run: `cd render && npm run lint`
Expected: PASS — no type or lint errors.

- [ ] **Step 4: Commit**

```bash
git add render/src/lib/lottie/LottieAccent.tsx render/src/lib/lottie/index.ts
git commit -m "feat(lottie): LottieAccent component (@remotion/lottie, memoized, hard-fail fps)"
```

---

### Task 6: Generate + commit the fixture accent `.json`

**Files:**
- Create: `render/src/lib/lottie/__fixtures__/success-check.json`

- [ ] **Step 1: Generate a 30fps in-palette success-check**

Run:
```bash
cd /home/zain-ali/Documents/ScriptWriter
mkdir -p render/src/lib/lottie/__fixtures__
python3 .claude/skills/lottie-master/scripts/lottie_gen.py check --color "#46C6FF" --size 320 --fps 30 \
  -o render/src/lib/lottie/__fixtures__/success-check.json
```

- [ ] **Step 2: Verify `fr` is 30**

Run:
```bash
python3 -c "import json;d=json.load(open('render/src/lib/lottie/__fixtures__/success-check.json'));print('fr',d['fr'])"
```
Expected: `fr 30`.

- [ ] **Step 3: Ensure TS can import JSON (resolveJsonModule)**

Run:
```bash
cd /home/zain-ali/Documents/ScriptWriter/render
node -e "const t=require('./tsconfig.json');const o=(t.compilerOptions||{});console.log('resolveJsonModule',o.resolveJsonModule)"
```
Expected: `resolveJsonModule true`. If it prints `undefined`/`false`, add `"resolveJsonModule": true` to `render/tsconfig.json` `compilerOptions` and re-run.

- [ ] **Step 4: Commit**

```bash
git add render/src/lib/lottie/__fixtures__/success-check.json render/tsconfig.json
git commit -m "feat(lottie): committed 30fps success-check accent (fixture + first accent)"
```

---

### Task 7: Static `fr===30` guard + extend the forbidden-API scan

**Files:**
- Create: `render/scripts/check-lottie-fps.mjs`
- Modify: `render/scripts/check-dataviz-static.mjs:21` (add `lib/lottie` to `SCAN_DIRS`)
- Modify: `render/package.json` (extend `gate`)

**Interfaces:**
- Produces: `node scripts/check-lottie-fps.mjs` exits non-zero if any committed accent `.json` under `src/lib/lottie/` has top-level `fr !== 30`.

- [ ] **Step 1: Write the static fps guard**

```javascript
// render/scripts/check-lottie-fps.mjs
// Determinism guard for the Lottie accent layer: every committed accent .json must
// be baked at the channel canonical 30fps. getLottieMetadata reads only the TOP-LEVEL
// fr, so a wrong-fr accent would seek mis-scaled under goToAndStop(). (Nested-precomp
// differing-fr is screened manually in asset-sourcing route A — Lottie exports carry
// a single top-level fr, so this scan covers committed/generated accents.)
//
// TOLERANCE NOTE (intentional difference vs the runtime guard): this static guard is
// STRICT (fr must be exactly 30) because it only scans GENERATED/COMMITTED accents,
// which lottie_gen.py always emits as integer fr:30. The runtime assertAccentFps()
// ROUNDS (Math.round) so a route-A SOURCED file at 29.97 still renders. A sourced
// 29.97 file would pass runtime but fail this static scan — that is desired: sourced
// accents are not committed under src/lib/lottie/, and any that are must be re-baked
// to exactly 30.
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const SCAN = join(ROOT, "src", "lib", "lottie");
const CANONICAL_FPS = 30;

function walk(dir) {
  let out = [];
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "node_modules") continue;
      out = out.concat(walk(p));
    } else if (e.name.endsWith(".json")) {
      out.push(p);
    }
  }
  return out;
}

const files = walk(SCAN);
const violations = [];
for (const f of files) {
  let doc;
  try {
    doc = JSON.parse(readFileSync(f, "utf8"));
  } catch (err) {
    violations.push({ file: relative(ROOT, f), why: `not valid JSON: ${err.message}` });
    continue;
  }
  if (doc.fr !== CANONICAL_FPS) {
    violations.push({ file: relative(ROOT, f), why: `fr is ${doc.fr}, must be ${CANONICAL_FPS}` });
  }
}

if (violations.length > 0) {
  console.error(`\n[check-lottie-fps] ${violations.length} accent(s) not at ${CANONICAL_FPS}fps:\n`);
  for (const v of violations) console.error(`  ${v.file}: ${v.why}`);
  process.exit(1);
}
console.log(`[check-lottie-fps] OK — ${files.length} accent .json at ${CANONICAL_FPS}fps.`);
```

- [ ] **Step 2: Add `lib/lottie` to the forbidden-API scanner**

In `render/scripts/check-dataviz-static.mjs`, change the `SCAN_DIRS` initializer (line ~21):

```javascript
const SCAN_DIRS = [join(SRC, "lib", "dataviz"), join(SRC, "lib", "lottie")];
```

- [ ] **Step 3: Wire both into the gate**

In `render/package.json`, change the `gate` script to:

```json
"gate": "tsc && eslint src && node scripts/check-dataviz-static.mjs && node scripts/check-lottie-fps.mjs",
```

- [ ] **Step 4: Run the gate**

Run: `cd render && npm run gate`
Expected: ends with `[check-dataviz-static] OK …` and `[check-lottie-fps] OK — 1 accent .json at 30fps.`

- [ ] **Step 5: Verify the guard actually fails on a 60fps accent**

Run:
```bash
cd /home/zain-ali/Documents/ScriptWriter
python3 .claude/skills/lottie-master/scripts/lottie_gen.py check --color "#46C6FF" -o render/src/lib/lottie/__fixtures__/_bad60.json
cd render && node scripts/check-lottie-fps.mjs; echo "exit=$?"
rm src/lib/lottie/__fixtures__/_bad60.json
```
Expected: prints `_bad60.json: fr is 60, must be 30` and `exit=1`.

- [ ] **Step 6: Commit**

```bash
git add render/scripts/check-lottie-fps.mjs render/scripts/check-dataviz-static.mjs render/package.json
git commit -m "feat(lottie): static fr===30 guard + extend forbidden-API scan to lib/lottie"
```

---

### Task 8: Render-hash fixture composition + byte-reproducibility

**Files:**
- Create: `render/src/lottie-fixture/Fixture.tsx`
- Modify: `render/src/Root.tsx` (register the composition)
- Modify: `render/package.json` (add `check:determinism:lottie` script)

**Interfaces:**
- Consumes: `LottieAccent` (Task 5), the committed `success-check.json` (Task 6).
- Produces: a Remotion composition `id="lottie-fixture"`, 30fps, `durationInFrames=30`; `node scripts/check-determinism.mjs lottie-fixture` proves byte-reproducibility.

- [ ] **Step 1: Write the isolated fixture composition**

```tsx
// render/src/lottie-fixture/Fixture.tsx
// Isolated accent-only composition for the render-hash determinism check — no
// captions, no gradient, no audio. The accent uses the in-memory `animationData`
// path (imported .json, stable identity) so the check needs no public/ seeding. The
// box is placed in-safe-area by construction (accentBoxStyle). Mirrors dataviz-fixture.
import React from "react";
import { AbsoluteFill } from "remotion";
import type { LottieAnimationData } from "@remotion/lottie";
import { LottieAccent } from "../lib/lottie";
import successCheck from "../lib/lottie/__fixtures__/success-check.json";

export const LottieFixture: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#0b0f1a" }}>
      <LottieAccent
        animationData={successCheck as unknown as LottieAnimationData}
        placement={{ anchor: "center", sizePx: 320 }}
        windowFrames={30}
      />
    </AbsoluteFill>
  );
};
```

- [ ] **Step 2: Register the composition in `Root.tsx`**

Add the import alongside the other fixture import (after line 15):

```tsx
import { LottieFixture } from "./lottie-fixture/Fixture";
```

Add the `<Composition>` next to the `dataviz-fixture` one (after its closing `/>`, ~line 126):

```tsx
      <Composition
        id="lottie-fixture"
        component={LottieFixture}
        durationInFrames={30}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
```

- [ ] **Step 3: Add the determinism script alias**

In `render/package.json` `scripts`, add:

```json
"check:determinism:lottie": "node scripts/check-determinism.mjs lottie-fixture",
```

- [ ] **Step 4: Verify the gate still passes (composition compiles)**

Run: `cd render && npm run gate`
Expected: PASS (tsc/eslint/static guards all green).

- [ ] **Step 5: Run the byte-reproducibility check**

Run: `cd render && npm run check:determinism:lottie`
Expected: `[check-determinism] OK — lottie-fixture is byte-reproducible across 3 frames (0/mid/last).`

- [ ] **Step 6: Commit**

```bash
git add render/src/lottie-fixture/Fixture.tsx render/src/Root.tsx render/package.json
git commit -m "feat(lottie): lottie-fixture composition + byte-reproducibility check"
```

---

### Task 9: Non-blank sustain-window check (ffmpeg)

Reuses the qa-probe ffmpeg `signalstats` mechanism (no new dependency): renders sustain-window frames of `lottie-fixture`, crops to the accent box, and asserts the cropped region is not uniformly background (`YMAX-YMIN` spatial range above a floor — the "not a dead speck" check, ramp frames excluded).

**Files:**
- Create: `render/scripts/check-lottie-render.mjs`
- Modify: `render/package.json` (add `check:render:lottie` script)

**Interfaces:**
- Consumes: `lottie-fixture` composition (Task 8); the accent box is computed by **importing `accentBoxStyle` from the TS source** (run with `node --experimental-strip-types`, as `check-tiling.mjs` already is) — NOT hardcoded — so it tracks `safeArea.ts`. For `{anchor:"center",sizePx:320}` it resolves to `{left:380, top:733, width:320, height:320}` (`(1080-320)/2=380`; `round((154+1632-320)/2)=733`).

**Note:** this script is `.mjs` but imports a `.ts` helper, so it MUST be run via `node --experimental-strip-types` (Step 2 wires that into the npm script and `make` target).

- [ ] **Step 1: Write the non-blank check**

```javascript
// render/scripts/check-lottie-render.mjs
// Quality check for the Lottie accent fixture: renders SUSTAIN-window frames (ramp
// excluded so a fade-in/out isn't flagged), crops to the accent's safe-area box, and
// asserts the region is not uniformly background — spatial luma range (YMAX-YMIN) above
// a floor. Reuses the qa-probe ffmpeg signalstats mechanism (no JS PNG decoder).
// Run via: node --experimental-strip-types scripts/check-lottie-render.mjs
import { bundle } from "@remotion/bundler";
import { getCompositions, renderStill } from "@remotion/renderer";
import { execFile } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
// Import the SAME placement math the component uses, so the crop box tracks safeArea.ts.
import { accentBoxStyle } from "../src/lib/lottie/lottie-helpers.ts";

const execFileP = promisify(execFile);
const COMP_ID = "lottie-fixture";
const ENTRY = new URL("../src/index.ts", import.meta.url).pathname;
const CHROMIUM = { gl: "swiftshader" };
const RANGE_FLOOR = 40; // YMAX-YMIN over the accent box; a blank/flat box ~ 0.
// Accent box = exactly what the fixture renders (placement {anchor:"center", sizePx:320}).
const s = accentBoxStyle({ anchor: "center", sizePx: 320 });
const BOX = { w: s.width, h: s.height, x: s.left, y: s.top };

// Reuse qa-probe's mechanism: ffmpeg writes signalstats metadata across BOTH stdout
// and stderr — concatenate both (and on error too), then regex the values out.
async function ff(args) {
  try {
    const { stdout, stderr } = await execFileP("ffmpeg", args, { maxBuffer: 64 * 1024 * 1024 });
    return stdout + stderr;
  } catch (e) {
    return (e.stdout || "") + (e.stderr || "");
  }
}

async function rangeOverBox(png) {
  const out = await ff([
    "-loglevel", "error", "-i", png,
    "-vf", `crop=${BOX.w}:${BOX.h}:${BOX.x}:${BOX.y},signalstats,metadata=print:file=-`,
    "-frames:v", "1", "-f", "null", "-",
  ]);
  const ymin = Number((out.match(/YMIN=(\d+(?:\.\d+)?)/) || [])[1]);
  const ymax = Number((out.match(/YMAX=(\d+(?:\.\d+)?)/) || [])[1]);
  return Number.isFinite(ymax) && Number.isFinite(ymin) ? ymax - ymin : 0;
}

const tmp = mkdtempSync(join(tmpdir(), "lottie-render-"));
try {
  const serveUrl = await bundle({ entryPoint: ENTRY });
  const comp = (await getCompositions(serveUrl)).find((c) => c.id === COMP_ID);
  if (!comp) {
    console.error(`[check-lottie-render] composition "${COMP_ID}" not found`);
    process.exit(2);
  }
  const dur = comp.durationInFrames; // 30
  // Sustain window: drop the first/last ~20% (entrance/exit ramp).
  const lo = Math.ceil(dur * 0.2);
  const hi = Math.floor(dur * 0.8);
  const frames = [...new Set([lo, Math.floor((lo + hi) / 2), hi])];

  let allOk = true;
  for (const frame of frames) {
    const out = join(tmp, `f${frame}.png`);
    await renderStill({ composition: comp, serveUrl, output: out, frame, chromiumOptions: CHROMIUM, scale: 1 });
    const range = await rangeOverBox(out);
    const ok = range >= RANGE_FLOOR;
    allOk = allOk && ok;
    console.log(`  frame ${frame}: range=${range.toFixed(0)} ${ok ? "OK" : `< ${RANGE_FLOOR} BLANK`}`);
  }
  if (!allOk) {
    console.error(`\n[check-lottie-render] ${COMP_ID}: accent box is blank/flat in the sustain window.`);
    process.exit(1);
  }
  console.log(`\n[check-lottie-render] OK — accent visible (range >= ${RANGE_FLOOR}) across the sustain window.`);
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
```

- [ ] **Step 2: Add the script alias (with `--experimental-strip-types`)**

In `render/package.json` `scripts`, add (the flag is required because the script imports a `.ts` helper):

```json
"check:render:lottie": "node --experimental-strip-types scripts/check-lottie-render.mjs",
```

- [ ] **Step 3: Run the non-blank check**

Run: `cd render && npm run check:render:lottie`
Expected: each sampled frame prints `range=… OK` and the final `[check-lottie-render] OK …`.

- [ ] **Step 4: Commit**

```bash
git add render/scripts/check-lottie-render.mjs render/package.json
git commit -m "feat(lottie): non-blank sustain-window check (ffmpeg signalstats over the accent box)"
```

---

### Task 9b: Give the slow-lane checks a home (`make check-lottie`)

`check:determinism:lottie` (Task 8) and `check:render:lottie` (Task 9) bundle+render, so they're correctly OUT of the fast `gate`. But — confirmed in Reconnaissance — nothing invokes the analogous dataviz check today, so they'd bit-rot unless given an explicit home. Create a Makefile target (matching the repo's existing `make` convention) and wire the proof-of-life to it.

**Files:**
- Modify: `Makefile` (add a `check-lottie` target)

- [ ] **Step 1: Add the target**

Append to `Makefile`:

```makefile
# Slow-lane Lottie accent checks (bundle + render; not in the fast gate).
# Run before landing accent changes and on the proof-of-life render.
check-lottie:
	cd render && npm run gate && npm run test:lib && npm run check:determinism:lottie && npm run check:render:lottie
```

- [ ] **Step 2: Run the aggregate**

Run: `make check-lottie`
Expected: gate OK, lib tests pass, `lottie-fixture` byte-reproducible, accent non-blank — all green in one command.

- [ ] **Step 3: Commit**

```bash
git add Makefile
git commit -m "feat(lottie): make check-lottie — slow-lane home for the determinism + render checks"
```

---

### Task 10: Seed accent `.json` into `public/`

**Files:**
- Modify: `scripts/seed-public.sh:42-46` (extend the asset copy to include `*.json`)

- [ ] **Step 1: Add `.json` to the run-asset copy**

In `scripts/seed-public.sh`, the block that copies audio binaries from `$RUN_DIR/assets` (the `find … \( -name '*.mp3' … \)` command) — extend its extension list to include `*.json`:

```bash
if [ -d "$RUN_DIR/assets" ]; then
  find "$RUN_DIR/assets" -maxdepth 1 -type f \
    \( -name '*.mp3' -o -name '*.wav' -o -name '*.m4a' -o -name '*.json' \) \
    -exec cp {} "$RENDER_PUBLIC/" \;
fi
```

Also update the header comment (line 3) to mention accent JSON: `# then copies the run's vo.wav + output/F-NNN/assets/* (audio + Lottie accent .json) fresh.`

- [ ] **Step 2: Verify a .json in a run's assets gets seeded**

Run:
```bash
cd /home/zain-ali/Documents/ScriptWriter
mkdir -p /tmp/seedtest-public output/_seedtest/assets
cp render/src/lib/lottie/__fixtures__/success-check.json output/_seedtest/assets/accent-x.json
touch output/_seedtest/vo.wav
bash scripts/seed-public.sh output/_seedtest /tmp/seedtest-public
ls /tmp/seedtest-public/accent-x.json && echo SEEDED
rm -rf output/_seedtest /tmp/seedtest-public
```
Expected: prints the path and `SEEDED`.

- [ ] **Step 3: Commit**

```bash
git add scripts/seed-public.sh
git commit -m "feat(lottie): seed-public copies accent .json from the run's assets/"
```

---

### Task 11: Pipeline wiring — asset-sourcing, prompt-generator, codegen

Teaches the three pipeline skills to spec, carry, and emit accents as a layer. These are SKILL.md doc edits — no `effective_style` change.

**Files:**
- Modify: `.claude/skills/asset-sourcing/SKILL.md`
- Modify: `.claude/skills/remotion-prompt-generator/SKILL.md`
- Modify: `.claude/skills/remotion-codegen/SKILL.md`

- [ ] **Step 1: asset-sourcing — add an accent section to `03-assets.md`**

In `asset-sourcing/SKILL.md`, add a subsection documenting an optional **Lottie accent** per beat. Record, for each accent: `beat`, `source` (`generate:<preset>` preferred — run `lottie_gen.py <preset> --color "<palette hex>" --fps 30 -o output/F-NNN/assets/accent-<beat>.json` — or `lottiefiles:<url>` fallback), `placement` (`top` | `center` | `above-captions`), `sizePx`, `frame window`, and **`fps: 30`**. State the generate-first rule and the route-A reject screen verbatim from the spec Global Constraints (rasters, non-embedded fonts, expression-driven layers, nested precomps at a differing `fr`; per-file license). Cross-reference the `lottie-master` skill.

- [ ] **Step 2: prompt-generator — carry the accent into `05-remotion-prompt.md`**

In `remotion-prompt-generator/SKILL.md`, document that any accent from `03-assets.md` is carried into `05` as a layer instruction: which beat/scene, the `accent-<beat>.json` filename, `placement`, `sizePx`, and the `frame window`. Note it is additive to the chosen `effective_style` (kinetic-typography or d3) — accents do NOT change `effective_style`.

- [ ] **Step 3: codegen — emit `LottieAccent` + place the .json**

In `remotion-codegen/SKILL.md`, document: for each accent in `05`, import `LottieAccent` from `../lib/lottie` and render it inside the beat's `<Sequence>` with `src="accent-<beat>.json"` (the seeded public path), `placement`, `windowFrames` = the beat length. Note the `.json` must already be in `output/F-NNN/assets/` (written by asset-sourcing) so `seed-public.sh` copies it. State the determinism contract: accents are 30fps (gate enforces), `src` path only (not absolute), no runtime recolor. **Codegen must also emit a build-time warning if an accent's `getLottieMetadata().durationInFrames > windowFrames`** — `loopForWindow` will play it once and the `<Sequence>` truncates it, which is usually a spec mistake (the accent doesn't finish on screen); surface it so the author shortens the accent or widens the window.

- [ ] **Step 4: Verify no contradictions with the effective_style line**

Run:
```bash
cd /home/zain-ali/Documents/ScriptWriter
grep -n "effective_style" .claude/skills/remotion-prompt-generator/SKILL.md | head
```
Expected: the existing `effective_style: (d3|kinetic-typography)` regex is unchanged (accents added no fourth value).

- [ ] **Step 5: Commit**

```bash
git add .claude/skills/asset-sourcing/SKILL.md .claude/skills/remotion-prompt-generator/SKILL.md .claude/skills/remotion-codegen/SKILL.md
git commit -m "feat(lottie): wire accent layer through asset-sourcing -> prompt-gen -> codegen"
```

---

### Task 12: Proof-of-life — a fresh `/short` run with one accent

**Files:** none (pipeline run; produces a new `output/F-NNN-<slug>/`).

- [ ] **Step 1: Run the full `/short` factory on a fresh topic**

Invoke the `/short` pipeline (steps 1–10). During step 4 (asset-sourcing), spec **one** accent on a beat that benefits (e.g. a `success-check` or `check` confirming a payoff) — generate it at 30fps into the run's `assets/`. Let codegen emit `LottieAccent` and run the render→QA loop.

- [ ] **Step 2: Verify the loop reaches PASS with the accent in-frame**

Confirm `09-iteration-ledger.md` shows **STATUS: PASS** (≥85, no blockers, Cat 9 ≥70%) and the accent renders clear of the safe area (no caption/safe-area collision flagged by qa-probe).

- [ ] **Step 3: Verify the per-run gates AND the slow-lane Lottie checks pass**

Run (substitute the allocated id):
```bash
cd /home/zain-ali/Documents/ScriptWriter
cd render && npm run gate && npm run test:lib && node --experimental-strip-types scripts/check-tiling.mjs F-NNN
cd /home/zain-ali/Documents/ScriptWriter && make check-lottie
```
Expected: all green — fast gate + lib tests + tiling, then `make check-lottie` (byte-repro + non-blank). This is the first run that exercises the slow-lane checks as part of acceptance.

- [ ] **Step 4: Commit the run via short-assembly**

short-assembly (step 9) writes `README.md`, the `VIDEO_LOG.md` row, archives the script, and records the render/QA iterations. Commit the run folder per the existing pipeline convention.

---

## Self-Review

**Spec coverage:**
- Engine `@remotion/lottie` + `.json` → Tasks 3, 5. ✅
- staticFile + delayRender/continueRender + cancelRender + retries → Task 5. ✅
- Memoized animationData identity → Task 5 (module cache + direct-import path). ✅
- fps-match hard-fail in primitive → Task 4 (`assertAccentFps`) + Task 5 (called, not caught). ✅
- fps-match in the static guard → Task 7 (`check-lottie-fps.mjs`). ✅
- Frame-window-aware loop (integer divisor, no seam crossing) → Task 4 (`loopForWindow`). ✅
- renderer svg default + canvas escape hatch → Task 5. ✅
- preserveAspectRatio default → Task 5. ✅
- Generate-time recolor only → Tasks 2/6 (`--color --fps`), enforced by no runtime recolor in Task 5. ✅
- Generate-first sourcing + 30fps generation → Tasks 1, 2, 6, 11. ✅
- Route-A reject screen (rasters/fonts/expressions/nested-precomp/license) → Task 11 Step 1 (documented). ✅
- Forbidden-API determinism scan over lib/lottie → Task 7 Step 2. ✅
- Render-hash byte-repro fixture → Task 8. ✅
- Render-hash quality asserts: (a) fps-match → Tasks 4/7; (b) the accent's *container box* sits in the safe area → Task 4 (`accentBoxStyle` unit test, deterministic math) — note this proves the style box, NOT that rendered Lottie content stays within it (canvas-sized shape accents don't overflow, and Task 9 confirms content is present inside the box, but neither guards content drawn *outside* the box); (c) non-blank sustain window → Task 9 (ffmpeg). ✅
- Slow-lane checks have an explicit home → Task 9b (`make check-lottie`), run in Task 12 Step 3. ✅
- Resample lossiness + half-scale guard → Task 2 (lossiness note + `max_kf_time <= op` assertion, Step 4). ✅
- fps gate tolerance difference (static strict vs runtime rounded) → documented in Task 7 script comment. ✅
- seed-public copies accent .json → Task 10. ✅
- Pipeline wiring (asset-sourcing/prompt-gen/codegen) + accent>window warning → Task 11. ✅
- No new effective_style / selector machinery → Task 11 Step 4 verifies unchanged. ✅
- Proof-of-life on a fresh /short run → Task 12. ✅
- Version pin to existing @remotion/* exact → Task 3. ✅
- Canonical lottie-master copy by content diff → Task 1. ✅

**Placeholder scan:** No TBD/TODO; every code step shows full content; commands have expected output. ✅

**Type consistency:** `assertAccentFps`/`accentBoxStyle`/`loopForWindow`/`AccentPlacement` defined in Task 4 are consumed with identical signatures in Task 5; `LottieAccent` props (`src`/`animationData`/`placement`/`windowFrames`/`renderer`) defined in Task 5 are consumed identically in Task 8; `id="lottie-fixture"` defined in Task 8 is the argument to the scripts in Tasks 8/9. ✅
