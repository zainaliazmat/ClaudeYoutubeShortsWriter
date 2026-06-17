import React from "react";
import { AbsoluteFill } from "remotion";
import { COLORS, Y } from "../data";
import { Kicker, YearStamp } from "./parts";

// Scene 2 — Beat 2 (global 259–397). "EGYPT'S LAST QUEEN · CLEOPATRA" + "69 BC".
// Year stamp at local ~90 (global ~349), landing as the VO says "69" (355).
// Cleopatra node lands (global TimelineLayer).
export const Beat2: React.FC = () => (
  <AbsoluteFill>
    <Kicker text="EGYPT'S LAST QUEEN · CLEOPATRA" top={Y.kicker} size={52} />
    <YearStamp text="69 BC" top={Y.hero} color={COLORS.gold} delay={90} />
  </AbsoluteFill>
);
