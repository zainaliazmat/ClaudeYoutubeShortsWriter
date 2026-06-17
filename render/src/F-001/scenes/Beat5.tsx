import React from "react";
import { AbsoluteFill } from "remotion";
import { COLORS, Y } from "../data";
import { Kicker } from "./parts";
import { GapReveal } from "./GapReveal";

// Scene 5 — Beat 5 (frames 480–600) · second gap. "CLEOPATRA → MOON" + ~2,000.
// Counter 0→2,000 over ~30f ease-out; ice segment grows collinear below the gold.
export const Beat5: React.FC = () => (
  <AbsoluteFill>
    <Kicker text="CLEOPATRA → MOON" top={Y.kicker} size={56} />
    <GapReveal target={2000} color={COLORS.ice} />
  </AbsoluteFill>
);
