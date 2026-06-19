// colors — a deterministic categorical color ramp derived from the palette accent
// hue, so asset-sourcing need not pre-plan N category colors. Pure: hex -> HSL ->
// rotate hue by the golden angle -> hex. No Math.random, no d3-color (kept a
// direct-dep-honest hand roll: only d3-scale + d3-shape are installed as direct
// deps). Adjacent categories are guaranteed a visible contrast delta (asserted by
// the unit test) via the golden-angle hue step + an alternating lightness nudge.

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

function hexToHsl(hex: string): [number, number, number] {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) throw new Error(`colors: bad hex ${hex}`);
  const n = parseInt(m[1], 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  let h: number;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  h *= 60;
  if (h < 0) h += 360;
  return [h, s, l];
}

function hslToHex(h: number, s: number, l: number): string {
  const hh = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((hh / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (hh < 60) [r, g, b] = [c, x, 0];
  else if (hh < 120) [r, g, b] = [x, c, 0];
  else if (hh < 180) [r, g, b] = [0, c, x];
  else if (hh < 240) [r, g, b] = [0, x, c];
  else if (hh < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const to = (v: number) =>
    Math.round(clamp01(v + m) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
}

const GOLDEN_ANGLE = 137.508;

/** N deterministic category colors derived from `accentHex`. Same input -> same output. */
export function categoricalRamp(accentHex: string, n: number): string[] {
  if (n <= 0) return [];
  const [h, s, l] = hexToHsl(accentHex);
  const sat = Math.max(0.45, s);
  return Array.from({ length: n }, (_, i) => {
    const hue = h + GOLDEN_ANGLE * i;
    // alternating lightness nudge so neighbours never collide even if hues are close
    const li = clamp01(Math.max(0.32, Math.min(0.68, l + (i % 2 === 0 ? 0.0 : -0.1))));
    return hslToHex(hue, sat, li);
  });
}
