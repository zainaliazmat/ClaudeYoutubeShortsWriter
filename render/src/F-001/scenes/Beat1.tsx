import React from "react";
import { AbsoluteFill } from "remotion";
import { COLORS, Y } from "../data";
import { Kicker, YearStamp } from "./parts";

// Scene 1 — Beat 1 (global 109–259). "THE GREAT PYRAMID" + "2560 BC".
// Year stamp shakes in at local ~50 (global ~159), landing as the VO says
// "2560" (162). Tick SFX @109.
export const Beat1: React.FC = () => (
  <AbsoluteFill>
    <Kicker text="THE GREAT PYRAMID" top={Y.kicker} size={64} />
    <Kicker text="KHUFU · OLD KINGDOM" top={Y.kicker + 78} size={36} color={COLORS.gold} delay={6} />
    <YearStamp text="2560 BC" top={Y.hero} color={COLORS.gold} delay={50} />
  </AbsoluteFill>
);
