import React from "react";

// Large FILLED in-code silhouettes (hybrid type + vector). Centered on (cx, cy),
// viewBox 0..100. Soft glow via drop-shadow. All drawn in code — no footage, no
// raster assets.

type GlyphProps = { cx: number; cy: number; size?: number; color: string; opacity?: number; glow?: number };

const wrap = (cx: number, cy: number, size: number, opacity: number, glow: number, color: string): React.CSSProperties => ({
  position: "absolute",
  left: cx - size / 2,
  top: cy - size / 2,
  opacity,
  filter: glow > 0 ? `drop-shadow(0 0 ${glow}px ${color})` : "none",
});

export type GlyphKind = "pyramid" | "moon" | "rocket" | "cleo" | "trex" | "stego" | "human";

export const Pyramid: React.FC<GlyphProps> = ({ cx, cy, size = 300, color, opacity = 1, glow = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={wrap(cx, cy, size, opacity, glow, color)}>
    {/* a trio of pyramids for the Giza feel */}
    <polygon points="50,16 90,84 10,84" fill={color} />
    <polygon points="50,16 90,84 50,84" fill="rgba(0,0,0,0.22)" />
    <polygon points="22,44 46,84 -2,84" fill={color} opacity={0.85} />
    <polygon points="78,50 98,84 58,84" fill={color} opacity={0.75} />
  </svg>
);

export const Moon: React.FC<GlyphProps> = ({ cx, cy, size = 300, color, opacity = 1, glow = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={wrap(cx, cy, size, opacity, glow, color)}>
    <defs>
      <radialGradient id="v2moon" cx="38%" cy="36%" r="70%">
        <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
        <stop offset="100%" stopColor={color} />
      </radialGradient>
    </defs>
    <circle cx="50" cy="50" r="40" fill="url(#v2moon)" />
    <circle cx="40" cy="38" r="6" fill="rgba(0,0,0,0.16)" />
    <circle cx="62" cy="52" r="8" fill="rgba(0,0,0,0.14)" />
    <circle cx="46" cy="64" r="5" fill="rgba(0,0,0,0.15)" />
  </svg>
);

export const Rocket: React.FC<GlyphProps> = ({ cx, cy, size = 120, color, opacity = 1, glow = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={wrap(cx, cy, size, opacity, glow, color)}>
    <path d="M50 8 C62 20 66 40 66 58 L34 58 C34 40 38 20 50 8 Z" fill={color} />
    <circle cx="50" cy="34" r="7" fill="rgba(0,0,0,0.3)" />
    <path d="M34 58 L22 74 L34 70 Z M66 58 L78 74 L66 70 Z" fill={color} />
    <path d="M44 70 L50 92 L56 70 Z" fill="#FF8A3C" opacity={0.9} />
  </svg>
);

// Stylized Egyptian queen bust (nemes headdress + profile). Clean silhouette.
export const Cleo: React.FC<GlyphProps> = ({ cx, cy, size = 300, color, opacity = 1, glow = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={wrap(cx, cy, size, opacity, glow, color)}>
    {/* headdress */}
    <path d="M30 30 Q50 8 70 30 L74 64 Q72 72 64 72 L36 72 Q28 72 26 64 Z" fill={color} />
    {/* face cut-out (profile facing right) */}
    <path d="M48 30 Q66 30 66 50 Q66 64 52 66 L52 58 Q58 56 58 50 Q58 38 48 38 Z" fill="rgba(0,0,0,0.28)" />
    {/* cobra (uraeus) */}
    <circle cx="50" cy="20" r="5" fill={color} />
    {/* collar / shoulders */}
    <path d="M22 78 Q50 70 78 78 L82 92 L18 92 Z" fill={color} />
  </svg>
);

export const Trex: React.FC<GlyphProps> = ({ cx, cy, size = 320, color, opacity = 1, glow = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={wrap(cx, cy, size, opacity, glow, color)}>
    <path
      d="M16 66 Q12 56 20 54 L40 51 Q42 38 56 33 L62 18 Q66 13 68 20 L66 33 Q78 35 82 47 L92 49 Q97 51 90 56 L76 56 Q72 68 60 70 L63 86 L53 86 L51 70 L40 70 L43 88 L33 88 L29 66 Z"
      fill={color}
    />
    <circle cx="62" cy="28" r="2.6" fill="rgba(0,0,0,0.5)" />
  </svg>
);

export const Stego: React.FC<GlyphProps> = ({ cx, cy, size = 320, color, opacity = 1, glow = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={wrap(cx, cy, size, opacity, glow, color)}>
    <path
      d="M8 68 Q6 60 14 60 L26 58 Q34 44 56 46 Q80 48 90 62 L95 64 Q99 68 92 70 L82 70 Q78 80 70 80 L72 90 L63 90 L61 80 L40 80 L42 90 L33 90 L31 70 Q18 70 14 70 Z"
      fill={color}
    />
    {/* back plates */}
    <path d="M34 48 l5 -13 5 13 z M48 45 l6 -15 6 15 z M64 47 l5 -13 5 13 z" fill={color} opacity={0.7} />
  </svg>
);

export const Human: React.FC<GlyphProps> = ({ cx, cy, size = 300, color, opacity = 1, glow = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={wrap(cx, cy, size, opacity, glow, color)}>
    <circle cx="50" cy="26" r="13" fill={color} />
    <path d="M30 92 Q30 50 50 50 Q70 50 70 92 Z" fill={color} />
  </svg>
);

export const Glyph: React.FC<GlyphProps & { kind: GlyphKind }> = ({ kind, ...p }) => {
  switch (kind) {
    case "pyramid": return <Pyramid {...p} />;
    case "moon": return <Moon {...p} />;
    case "rocket": return <Rocket {...p} />;
    case "cleo": return <Cleo {...p} />;
    case "trex": return <Trex {...p} />;
    case "stego": return <Stego {...p} />;
    case "human": return <Human {...p} />;
  }
};
