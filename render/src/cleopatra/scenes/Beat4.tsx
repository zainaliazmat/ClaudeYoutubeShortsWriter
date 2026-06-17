import React from "react";
import { AbsoluteFill } from "remotion";
import { COLORS, Y } from "../theme";
import { Kicker, YearStamp } from "./parts";

// Scene 4 — Beat 4 (global 493–592). "THE MOON LANDING" + "1969" (ice).
// Year stamp at local ~50 (global ~543), landing as the VO says "1969" (544).
// Moon disc + rocket light up (TimelineLayer). Tick SFX @493.
export const Beat4: React.FC = () => (
  <AbsoluteFill>
    <Kicker text="THE MOON LANDING" top={Y.kicker} size={64} />
    <Kicker text="SPACE AGE" top={Y.kicker + 78} size={36} color={COLORS.ice} delay={6} />
    <YearStamp text="1969" top={Y.hero} color={COLORS.ice} delay={50} />
  </AbsoluteFill>
);
