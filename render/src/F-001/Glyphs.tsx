import React from "react";
import { Rocket } from "lucide-react";
import { COLORS } from "./data";

// Large FILLED silhouettes anchored on the vertical spine nodes (not tiny line
// icons). Centered on (cx, cy). Soft glow via drop-shadow.

export const PyramidGlyph: React.FC<{
  cx: number;
  cy: number;
  size?: number;
  opacity?: number;
}> = ({ cx, cy, size = 300, opacity = 1 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    style={{
      position: "absolute",
      left: cx - size / 2,
      top: cy - size / 2,
      opacity,
      filter: `drop-shadow(0 0 24px ${COLORS.gold})`,
    }}
  >
    {/* solid pyramid with a shaded right face for depth */}
    <polygon points="50,12 92,86 8,86" fill={COLORS.gold} />
    <polygon points="50,12 92,86 50,86" fill="rgba(0,0,0,0.18)" />
  </svg>
);

export const MoonGlyph: React.FC<{
  cx: number;
  cy: number;
  size?: number;
  opacity?: number;
}> = ({ cx, cy, size = 300, opacity = 1 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    style={{
      position: "absolute",
      left: cx - size / 2,
      top: cy - size / 2,
      opacity,
      filter: `drop-shadow(0 0 26px ${COLORS.ice})`,
    }}
  >
    <defs>
      <radialGradient id="moonFill" cx="38%" cy="36%" r="70%">
        <stop offset="0%" stopColor="#CFEEFF" />
        <stop offset="100%" stopColor={COLORS.ice} />
      </radialGradient>
    </defs>
    <circle cx="50" cy="50" r="40" fill="url(#moonFill)" />
    {/* craters */}
    <circle cx="40" cy="38" r="6" fill="rgba(11,20,48,0.18)" />
    <circle cx="62" cy="52" r="8" fill="rgba(11,20,48,0.15)" />
    <circle cx="46" cy="64" r="5" fill="rgba(11,20,48,0.16)" />
  </svg>
);

// Small rocket beside the moon (launch-flash handled by caller's opacity).
export const RocketGlyph: React.FC<{
  cx: number;
  cy: number;
  size?: number;
  opacity?: number;
}> = ({ cx, cy, size = 120, opacity = 1 }) => (
  <div
    style={{
      position: "absolute",
      left: cx - size / 2,
      top: cy - size / 2,
      opacity,
      filter: `drop-shadow(0 0 14px ${COLORS.ice})`,
    }}
  >
    <Rocket size={size} color={COLORS.ice} strokeWidth={2} />
  </div>
);
