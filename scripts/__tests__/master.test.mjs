import { test } from "node:test";
import assert from "node:assert";
import {
  MASTER_MODES, DEFAULT_MASTER_MODE, resolveMasterMode, linearGainDb, limiterAf,
} from "../master.mjs";

// The default master for these voice-led shorts is the linear-gain + true-peak-limiter
// chain (preserves LRA); the original two-pass loudnorm stays reachable behind a flag.
test("resolveMasterMode: defaults to the limiter chain; loudnorm only when asked", () => {
  assert.equal(DEFAULT_MASTER_MODE, "limiter");
  assert.deepEqual(MASTER_MODES, ["limiter", "loudnorm"]);
  // nothing set anywhere -> default
  assert.equal(resolveMasterMode(undefined, {}), "limiter");
  assert.equal(resolveMasterMode("", {}), "limiter");
  // explicit opt wins
  assert.equal(resolveMasterMode("loudnorm", {}), "loudnorm");
  assert.equal(resolveMasterMode("limiter", { FATHOM_MASTER: "loudnorm" }), "limiter");
  // env flag when no opt
  assert.equal(resolveMasterMode(undefined, { FATHOM_MASTER: "loudnorm" }), "loudnorm");
  assert.equal(resolveMasterMode(undefined, { FATHOM_MASTER: "LIMITER" }), "limiter");
});

test("resolveMasterMode: rejects an unknown mode", () => {
  assert.throws(() => resolveMasterMode("compressor", {}), /unknown master mode/);
});

test("linearGainDb: makeup gain to hit the target loudness from the measured premaster", () => {
  // real F-001 premaster -20.46 -> target -14.5 needs +5.96 dB (limiter then pulls it down)
  assert.equal(linearGainDb(-20.46, -14.5), 5.96);
  assert.equal(linearGainDb(-14.0, -14.0), 0);
  assert.equal(linearGainDb(-10.0, -14.5), -4.5); // attenuate a too-hot mix
  assert.throws(() => linearGainDb(NaN, -14.5), /finite/);
});

test("limiterAf: linear volume gain THEN a true-peak limiter at the ceiling", () => {
  const af = limiterAf(5.96, -1.5);
  assert.match(af, /^volume=5\.96dB,/);
  assert.match(af, /alimiter=limit=-1\.5dB/);
  // gain must precede the limiter so the limiter is the last thing touching the peaks
  assert.ok(af.indexOf("volume=") < af.indexOf("alimiter="));
});
