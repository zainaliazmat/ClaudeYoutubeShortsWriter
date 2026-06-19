# F-003 — Verified Facts (the birthday paradox)

**Method:** the birthday problem is deterministic, so each value is **computed exactly** from the
standard formula AND cross-checked against the authoritative reference (Wikipedia, "Birthday
problem"). Computed and quoted values agree to the decimal. **Cite-or-abstain:** the script may use
ONLY the claims in this table.

Formula (verified): `p(n) = 1 − 365! / (365ⁿ · (365−n)!)` — the probability that at least two of n
people share a birthday, assuming 365 equally likely birthdays (ignoring Feb 29 and twins).
> Wikipedia: "p(n) = 1 − p̄(n)" where "p̄(n) = 365!/(365ⁿ(365−n)!)".

| # | Claim (on-screen / spoken) | Value (exact, computed) | Source quote | URL | Confidence |
|---|---|---|---|---|---|
| 1 | **23 people → ~50%** chance two share a birthday (THE payoff) | 50.7297% | "P(B) = 1 − P(A) ≈ 1 − 0.492703 = 0.507297 (50.7297%)"; "only 23 people are needed for that probability to exceed 50%" | https://en.wikipedia.org/wiki/Birthday_problem | High |
| 2 | n=10 → ~12% | 11.695% | table: "10 — 11.7%" | https://en.wikipedia.org/wiki/Birthday_problem | High |
| 3 | n=20 → ~41% | 41.144% | table: "20 — 41.1%" | https://en.wikipedia.org/wiki/Birthday_problem | High |
| 4 | n=30 → ~71% | 70.632% | table: "30 — 70.6%" | https://en.wikipedia.org/wiki/Birthday_problem | High |
| 5 | n=40 → ~89% | 89.123% | table: "40 — 89.1%" | https://en.wikipedia.org/wiki/Birthday_problem | High |
| 6 | n=50 → ~97% | 97.037% | table: "50 — 97.0%" | https://en.wikipedia.org/wiki/Birthday_problem | High |
| 7 | n=60 → ~99% | 99.412% | table: "60 — 99.4%" | https://en.wikipedia.org/wiki/Birthday_problem | High |
| 8 | **n=70 → ~99.9%** (near-certain) | 99.916% | table: "70 — 99.9%" | https://en.wikipedia.org/wiki/Birthday_problem | High |
| 9 | The threshold is **counterintuitively small** — 23 is less than 1/15th of 365 days | 23 / 365 ≈ 6.3% | "it may seem surprising that only 23 individuals are required to reach a 50% probability … (the number being less than 1/15th of the number of days in a year)" | https://en.wikipedia.org/wiki/Birthday_problem | High |

## The curve (the D3 data points — all High confidence, exact)
For the GrowthCurve / chart-spec. x = group size, y = probability %:
`(5, 2.7), (10, 11.7), (20, 41.1), (23, 50.7), (30, 70.6), (40, 89.1), (50, 97.0), (60, 99.4), (70, 99.9)`
Shape: a steep S-curve that crosses **50% at n=23** and flattens toward ~100% by ~70. Monotonic →
`curveMonotoneX`. The 50% line crossing 23 is the visual payoff.

## Abstained / NOT to assert
- **"People expect ~183 (half of 365)."** This common framing is NOT directly sourced in the
  reference (Wikipedia says "less than 1/15th of 365 days", not "people expect 183"). Do NOT state
  "people think you need 183" as a fact. The verified intuition anchor is *"less than 1/15th of a
  year"* / *"it feels like you'd need hundreds"* (rhetorical framing, not a statistic).
- Leap years / Feb 29 / non-uniform real birthday distributions are deliberately out of scope (the
  classic 365-uniform model) — do not muddy the payoff with caveats.

## Sparse-facts gate
9 distinct High-confidence claims (≥5 floor ✓). Every planned beat (hook → the curve climbs →
50% at 23 → near-certain by 70 → loop) is coverable by ≥1 real claim — no padding, no stretching.
