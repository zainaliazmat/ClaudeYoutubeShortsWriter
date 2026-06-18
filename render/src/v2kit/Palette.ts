// v2 brand spine — shared visual grammar for the repainted videos. Same structural
// language (warm gradient + glow + vignette + drifting motes, kicker chip, accent-keyword
// type, big silhouette hero, scale-honest payoff timeline); only the accent HUES differ
// per video. This is the "reusable visual grammar" the CEO review asked for.

export type V2Palette = {
  bgTop: string;
  bgBottom: string;
  glow: string;
  vignette: string;
  text: string;
  textDim: string;
  accent1: string; // ancient / deep-time (warm)
  accent2: string; // modern / today (cool)
  chipBg: string;
  mote: string;
};

// F-001 Cleopatra — golden-hour desert.
export const CLEO: V2Palette = {
  bgTop: "#241606",
  bgBottom: "#5A3A14",
  glow: "#D29A33",
  vignette: "#120A02",
  text: "#F8F1E2",
  textDim: "#D8C5A0",
  accent1: "#F4B53C", // gold (ancient)
  accent2: "#76C4F2", // lapis (modern)
  chipBg: "rgba(244,181,60,0.18)",
  mote: "#F4D79A",
};

// F-002 T-Rex — museum slate → warm earth.
export const TREX: V2Palette = {
  bgTop: "#0E191D",
  bgBottom: "#3E2912",
  glow: "#CC7E30",
  vignette: "#070C0E",
  text: "#F5F0E5",
  textDim: "#CDBBA0",
  accent1: "#F2893C", // amber/rust (deep time)
  accent2: "#3FD0C9", // teal (modern)
  chipBg: "rgba(242,137,60,0.18)",
  mote: "#F2C58A",
};
