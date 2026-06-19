# F-003 — The Birthday Paradox (23 people → 50%)

- **Slug:** birthday-paradox
- **Niche:** Facts / Kinetic Typography (data-shaped → candidate for the new D3 growth-curve style)
- **Core hook (working):** "23 people. 50% two share a birthday."
- **Why it's fresh:** not in the VIDEO_LOG dedupe list (F-001 Cleopatra, F-002 T. rex); backlog item #23, never scripted.
- **Why it stops the swipe:** the number feels impossibly low — intuition says you'd need ~183 people (half of 365), but it's 23. The gap between intuition and the real curve IS the hook.
- **Source for the topic:** backlog #23, steered to a data-shaped fact to exercise the D3 data-viz style.

## Why this is a D3 (data-viz) fact, not a single number
The payoff is a **curve**, not one statistic: P(at least two people share a birthday) rises steeply
with group size and crosses 50% at n=23. That's ≥3 sourced numeric points forming a monotonic trend —
exactly the row-1 shape that routes to `effective_style: d3` (a GrowthCurve revealing left→right, the
50% line crossing at 23 as the visual payoff). The "feels like it should be ~183" misconception is the
emotional arc.

## Candidates considered
1. **Birthday paradox (chosen)** — a real probability curve with multiple computable, widely-sourced
   points; surprising threshold (23 → 50%); perfect GrowthCurve fit.
2. More stars than grains of sand — only ~2 magnitudes with a huge dynamic range (would need a log
   scale); fails the ≥3-points rule, weaker D3 fit.
3. Every planet fits between Earth and the Moon — categorical (8 diameters) but the payoff is a sum
   fitting a gap, less clean as a chart; also needs careful mean-distance verification.

## Handoff to research (step 2)
- **Research question:** "For the birthday problem (365 equally likely birthdays, ignoring leap years
  and twins), what is the probability that at least two people in a group of n share a birthday, for
  n = 5, 10, 20, 23, 30, 40, 50, 70? Confirm the standard threshold that n=23 gives ≈50%."
- **Must verify (the claims the curve hinges on):**
  1. n=23 → ≈50.7% (the famous 50% threshold) — the payoff.
  2. The monotonic shape: n=10 ≈11–12%, n=30 ≈70%, n=50 ≈97%, n=70 ≈99.9% (so the curve reads as a
     steep S that flattens near 100%).
  3. The standard assumptions (uniform 365-day distribution; the formula
     P = 1 − 365!/((365−n)!·365ⁿ)) so the on-screen values are honest, not hand-waved.
  4. The common misconception anchor (people guess ~183, i.e. half of 365) — for the hook framing.
