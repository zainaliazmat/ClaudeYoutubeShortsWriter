# F-002 — Assets (spec)

Reuses the Fathom signature established by F-001 (proven; reviewer 93/Cat9 89%).

- **Fonts:** Anton (display/hero/year stamps/payoff, OFL) + Space Mono (rolling count-up digits, OFL).
- **Palette (navy/indigo depth; gold ancient, ice modern):** bg gradient `#0B1430` (top) → `#1C2A55` (bottom); hero glow `#2E4A8C` @35%; nebula `#3A2C6B` @12%; text `#F4F1E8`; gold `#F2B53C` (Stegosaurus→T.rex / ancient side); ice `#6FD3FF` (T.rex→today / modern side); spine `#5B6BA8` ≥12px.
- **Background (all frames, never flat):** vertical gradient + ~900px breathing radial glow + nebula wash + drifting star field (lib `Background`).
- **Motion signature:** word slam-in, hero overshoot, year-stamp shake, segment grow (≥12px bars), count-up (ease-out, ≤36f, clamp ≥0), payoff glow, cross-dissolve loop (lib `motion`).
- **Spatial frame:** vertical deep-time spine, Stegosaurus pinned TOP (150 Mya), T. rex node ~56% down (66/150), TODAY/HUMANS pinned BOTTOM (0). Node markers + era labels fill the right band; hero numbers ≥ ~300px Anton center.
