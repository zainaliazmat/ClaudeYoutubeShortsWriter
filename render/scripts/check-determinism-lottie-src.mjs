// Seeds the committed accent .json into public/ (public/ is gitignored / run-scoped — never
// committed), then runs the byte-repro determinism check on the FILE-BACKED src= composition,
// then removes the seeded file. This is the ONLY render-time coverage of the src= path
// (fetch + delayRender + module-cache identity stability + the no-runtime-mutation invariant).
// Reuses check-determinism.mjs rather than duplicating its render/hash logic.
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const SRC = join(root, "src/lib/lottie/__fixtures__/success-check.json");
const PUB_DIR = join(root, "public");
const PUB = join(PUB_DIR, "lottie-src-fixture.json");

mkdirSync(PUB_DIR, { recursive: true });
copyFileSync(SRC, PUB);
console.log(`[check-determinism-lottie-src] seeded ${PUB} from committed fixture`);
try {
  execFileSync("node", ["scripts/check-determinism.mjs", "lottie-fixture-src"], {
    cwd: root,
    stdio: "inherit",
  });
} finally {
  rmSync(PUB, { force: true });
  console.log(`[check-determinism-lottie-src] removed seeded ${PUB}`);
}
