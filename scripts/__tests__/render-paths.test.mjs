import { test } from "node:test";
import assert from "node:assert";
import path from "node:path";
import { publicDirForRun, defaultPublicDir, staleRunDirs, STALE_RUN_MAX_AGE_MS } from "../render-paths.mjs";

const RENDER = "/repo/render";
const HOUR = 60 * 60 * 1000;

test("publicDirForRun: each run gets a distinct, isolated public dir under render/.public-runs", () => {
  const a = publicDirForRun(RENDER, "F-001-cleopatra-vs-pyramids");
  const b = publicDirForRun(RENDER, "F-002-trex-closer-than-stegosaurus");
  assert.notEqual(a, b, "two runs must not share a public dir");
  assert.equal(a, path.join(RENDER, ".public-runs", "F-001-cleopatra-vs-pyramids"));
  // must live under render/ so Remotion's bundler can read it
  assert.ok(a.startsWith(path.join(RENDER, ".public-runs") + path.sep));
});

test("publicDirForRun: is NOT the shared default public dir (no clobber)", () => {
  const run = publicDirForRun(RENDER, "F-001-cleopatra-vs-pyramids");
  assert.notEqual(run, defaultPublicDir(RENDER));
});

test("publicDirForRun: rejects an unsafe id (injection guard)", () => {
  assert.throws(() => publicDirForRun(RENDER, "../../etc"), /unsafe id/);
  assert.throws(() => publicDirForRun(RENDER, "F-1-x"), /unsafe id/);
  assert.throws(() => publicDirForRun(RENDER, "F-001-Caps"), /unsafe id/);
});

test("defaultPublicDir: resolves to render/public", () => {
  assert.equal(defaultPublicDir(RENDER), path.join(RENDER, "public"));
});

// ---- startup sweep of orphaned .public-runs (interruption / SIGKILL leaves these) ----
test("staleRunDirs: deletes old dirs, keeps fresh ones and the active run", () => {
  const now = 100 * HOUR;
  const entries = [
    { name: "F-001-old", mtimeMs: now - 10 * HOUR },     // stale -> delete
    { name: "F-002-fresh", mtimeMs: now - 1 * HOUR },    // recent (concurrent render) -> keep
    { name: "F-003-active", mtimeMs: now - 50 * HOUR },  // ancient but ACTIVE -> keep
  ];
  const del = staleRunDirs(entries, { activeId: "F-003-active", now, maxAgeMs: 6 * HOUR });
  assert.deepEqual(del, ["F-001-old"]);
});

test("staleRunDirs: a dir with no usable mtime is treated as stale (deleted) unless active", () => {
  const now = 100 * HOUR;
  const entries = [
    { name: "F-001-nomtime", mtimeMs: NaN },
    { name: "F-002-active", mtimeMs: NaN },
  ];
  assert.deepEqual(staleRunDirs(entries, { activeId: "F-002-active", now }), ["F-001-nomtime"]);
});

test("staleRunDirs: empty / degenerate input is safe", () => {
  assert.deepEqual(staleRunDirs([], { now: 0 }), []);
  assert.deepEqual(staleRunDirs(undefined, { now: 0 }), []);
  assert.ok(STALE_RUN_MAX_AGE_MS > 0);
});
