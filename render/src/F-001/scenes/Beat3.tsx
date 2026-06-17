import React from "react";
import { AbsoluteFill } from "remotion";
import { COLORS, Y } from "../data";
import { Kicker } from "./parts";
import { GapReveal } from "./GapReveal";

// Scene 3 — Beat 3 (frames 255–375) · first gap. "PYRAMID → CLEOPATRA" + ~2,500.
// Counter 0→2,500 over ~30f ease-out; gold segment grows in sync (TimelineLayer).
export const Beat3: React.FC = () => (
  <AbsoluteFill>
    <Kicker text="PYRAMID → CLEOPATRA" top={Y.kicker} size={56} />
    <GapReveal target={2500} color={COLORS.gold} />
  </AbsoluteFill>
);
