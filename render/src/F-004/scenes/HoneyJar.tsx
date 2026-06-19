import React from "react";
import { random } from "remotion";
import { COLORS, WIDTH, Y } from "../data";

// Persistent honey-jar SVG silhouette (~500px tall, center/lower-center band).
// Dark fill #3D1A00 + lit amber stroke #F5B731 @60% from frame 0.
// fillProgress: 0..1 drives the animated gold clipPath (beat1 fill animation).
// glowPulse: 0..1 drives the jar glow for beat1/beat4 sustain motion.

const JAR_W = 320;
const JAR_H = 500;
const JAR_X = (WIDTH - JAR_W) / 2;
const JAR_Y = Y.jar - JAR_H / 2;

// Seeded grain particles for a crystalline honey texture (no Math.random)
const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  x: JAR_X + 40 + random(`jar-p-x-${i}`) * (JAR_W - 80),
  y: JAR_Y + 80 + random(`jar-p-y-${i}`) * (JAR_H - 140),
  r: 1.5 + random(`jar-p-r-${i}`) * 2.5,
  o: 0.12 + random(`jar-p-o-${i}`) * 0.18,
}));

export const HoneyJar: React.FC<{
  fillProgress?: number;
  glowPulse?: number;
}> = ({ fillProgress = 0, glowPulse = 0 }) => {
  // clipPath y: fill rises bottom→top. JAR body inner top ≈ JAR_Y+80; bottom ≈ JAR_Y+JAR_H-30.
  const innerTop = JAR_Y + 80;
  const innerBottom = JAR_Y + JAR_H - 30;
  const innerHeight = innerBottom - innerTop;
  const fillClipY = innerBottom - fillProgress * innerHeight;

  // Glow halo behind jar (sustain motion for beat1/beat4)
  const glowOpacity = 0.12 + glowPulse * 0.22;
  const glowScale = 1 + glowPulse * 0.06;

  return (
    <svg
      width={WIDTH}
      height={1920}
      viewBox={`0 0 ${WIDTH} 1920`}
      style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
    >
      <defs>
        {/* Clip path for honey fill (bottom→top) */}
        <clipPath id="jar-honey-clip">
          <rect x={JAR_X + 16} y={fillClipY} width={JAR_W - 32} height={innerBottom - fillClipY} />
        </clipPath>
        {/* Jar body silhouette clip */}
        <clipPath id="jar-body-clip">
          {/* Round-shouldered jar body (bezier) */}
          <path
            d={`
              M ${JAR_X + 60} ${JAR_Y + 80}
              Q ${JAR_X} ${JAR_Y + 80} ${JAR_X + 10} ${JAR_Y + 200}
              L ${JAR_X + 10} ${JAR_Y + JAR_H - 40}
              Q ${JAR_X + 10} ${JAR_Y + JAR_H} ${JAR_X + 50} ${JAR_Y + JAR_H}
              L ${JAR_X + JAR_W - 50} ${JAR_Y + JAR_H}
              Q ${JAR_X + JAR_W - 10} ${JAR_Y + JAR_H} ${JAR_X + JAR_W - 10} ${JAR_Y + JAR_H - 40}
              L ${JAR_X + JAR_W - 10} ${JAR_Y + 200}
              Q ${JAR_X + JAR_W} ${JAR_Y + 80} ${JAR_X + JAR_W - 60} ${JAR_Y + 80}
              Z
            `}
          />
        </clipPath>
      </defs>

      {/* Ambient glow halo behind jar (sustain motion) */}
      <ellipse
        cx={WIDTH / 2}
        cy={Y.jar + 20}
        rx={240 * glowScale}
        ry={200 * glowScale}
        fill={COLORS.accent}
        opacity={glowOpacity}
        style={{ filter: "blur(48px)" }}
      />

      {/* Jar body — dark fill */}
      <path
        d={`
          M ${JAR_X + 60} ${JAR_Y + 80}
          Q ${JAR_X} ${JAR_Y + 80} ${JAR_X + 10} ${JAR_Y + 200}
          L ${JAR_X + 10} ${JAR_Y + JAR_H - 40}
          Q ${JAR_X + 10} ${JAR_Y + JAR_H} ${JAR_X + 50} ${JAR_Y + JAR_H}
          L ${JAR_X + JAR_W - 50} ${JAR_Y + JAR_H}
          Q ${JAR_X + JAR_W - 10} ${JAR_Y + JAR_H} ${JAR_X + JAR_W - 10} ${JAR_Y + JAR_H - 40}
          L ${JAR_X + JAR_W - 10} ${JAR_Y + 200}
          Q ${JAR_X + JAR_W} ${JAR_Y + 80} ${JAR_X + JAR_W - 60} ${JAR_Y + 80}
          Z
        `}
        fill={COLORS.jar}
        stroke={COLORS.jarStroke}
        strokeWidth={3}
        strokeOpacity={0.6}
      />

      {/* Honey fill — clips to jar body, animates with fillProgress */}
      {fillProgress > 0 && (
        <rect
          x={JAR_X + 12}
          y={fillClipY}
          width={JAR_W - 24}
          height={innerBottom - fillClipY}
          fill={COLORS.accent}
          opacity={0.82}
          clipPath="url(#jar-body-clip)"
        />
      )}

      {/* Honey sheen line at fill surface */}
      {fillProgress > 0.02 && (
        <line
          x1={JAR_X + 16}
          y1={fillClipY}
          x2={JAR_X + JAR_W - 16}
          y2={fillClipY}
          stroke={COLORS.payoff}
          strokeWidth={2}
          opacity={0.7}
        />
      )}

      {/* Grain particles (crystalline honey texture) */}
      {PARTICLES.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={p.r} fill={COLORS.hero} opacity={p.o * fillProgress} />
      ))}

      {/* Jar neck + mouth */}
      <rect
        x={JAR_X + 90}
        y={JAR_Y + 30}
        width={JAR_W - 180}
        height={54}
        rx={8}
        fill={COLORS.jar}
        stroke={COLORS.jarStroke}
        strokeWidth={3}
        strokeOpacity={0.6}
      />
      {/* Jar lip rim */}
      <rect
        x={JAR_X + 75}
        y={JAR_Y + 24}
        width={JAR_W - 150}
        height={14}
        rx={5}
        fill={COLORS.jar}
        stroke={COLORS.jarStroke}
        strokeWidth={2.5}
        strokeOpacity={0.7}
      />
    </svg>
  );
};
