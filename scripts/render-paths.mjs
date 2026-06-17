// render-paths.mjs — PURE path derivation for run-scoped render staging (audit #7).
// The render reads its assets (vo.wav, music, SFX) via Remotion staticFile(), which
// resolves against a "public" directory. Historically every render seeded a SINGLE
// shared render/public, so two concurrent (or a resumed-then-restarted) run would
// clobber each other's staged binaries mid-render. The fix: give each run its OWN
// public dir and point `remotion render --public-dir` at it. These derivations are
// pure so the path logic is unit-tested without staging anything.

import path from "node:path";

// Where a run stages its public assets. Per-run + isolated so concurrent renders
// never share mutable state. Lives UNDER render/ (so Remotion's bundler can read it)
// but in a dedicated, gitignored sibling of the shared public/.
export function publicDirForRun(renderRoot, id) {
  if (!/^F-\d{3}-[a-z0-9-]+$/.test(id))
    throw new Error(`publicDirForRun: refusing unsafe id "${id}"`);
  return path.join(renderRoot, ".public-runs", id);
}

// The shared, default public dir (studio/dev + backward compat). seed-public.sh
// targets this when no explicit per-run dir is passed.
export function defaultPublicDir(renderRoot) {
  return path.join(renderRoot, "public");
}

// The directory that holds all per-run public dirs.
export const PUBLIC_RUNS_DIRNAME = ".public-runs";
export function publicRunsRoot(renderRoot) {
  return path.join(renderRoot, PUBLIC_RUNS_DIRNAME);
}

// How old an orphaned per-run dir must be before the startup sweep deletes it.
// The render-time finally already removes a run's own dir on throw; this catches
// dirs orphaned by an UNCATCHABLE exit (SIGKILL / power loss / `kill -9`), where
// no finally runs. 6h is comfortably longer than any single render.
export const STALE_RUN_MAX_AGE_MS = 6 * 60 * 60 * 1000;

// PURE decision for the startup sweep: given the `.public-runs/*` entries
// ([{ name, mtimeMs }]), the currently-active run id, and `now`, return the names
// safe to delete. A dir is deleted iff it is NOT the active run AND it is stale
// (older than maxAgeMs, or has no usable mtime). A *recent* dir is left alone — it
// may belong to a concurrent render whose finally hasn't fired yet.
export function staleRunDirs(entries, { activeId = null, now, maxAgeMs = STALE_RUN_MAX_AGE_MS } = {}) {
  return (entries || [])
    .filter((e) => e && typeof e.name === "string")
    .filter((e) => e.name !== activeId)
    .filter((e) => (Number.isFinite(e.mtimeMs) ? now - e.mtimeMs > maxAgeMs : true))
    .map((e) => e.name);
}
