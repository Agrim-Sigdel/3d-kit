import { Color } from 'three'
import { type SurfaceMaterial } from './types'
import { hash } from '../shaders/chunks'

// Rain on glass: a column-based streak field plus discrete droplets that fall
// and leave fading trails. We derive everything from a deterministic hash of
// the column index so the layout is stable across frames and resolution-
// independent — only uTime drives motion.
export const rainStreaks: SurfaceMaterial = {
  id: 'rain-streaks',
  name: 'Rain Streaks',
  uniforms: {
    uGlassColor: { value: new Color('#0a1822') },
    uStreakColor: { value: new Color('#aaccdd') },
    uDensity: { value: 40.0 },
    uSpeed: { value: 0.6 },
    uBlur: { value: 0.35 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
  `,
  fragmentShader: `${hash}
    uniform vec3 uGlassColor;
    uniform vec3 uStreakColor;
    uniform float uDensity;  // number of vertical columns
    uniform float uSpeed;    // fall speed multiplier
    uniform float uBlur;     // horizontal softness of each streak
    varying vec2 vUv;

    // One droplet running down a single column. The column owns a per-column
    // phase/speed (from the hash) so columns never march in lockstep.
    float column(float colId, vec2 p){
      float r = o3s_hash(vec2(colId, 7.0));
      float phase = o3s_hash(vec2(colId, 19.0));
      // Slight per-column speed variance keeps the rain from looking gridded.
      float spd = (0.6 + 0.8 * r) * uSpeed;
      // Vertical head position wraps 0..1; +phase decorrelates the columns.
      float head = fract(p.y * 0.0 + (uTime * spd) + phase);

      // Distance of the fragment below the droplet head (going downward = -y).
      // Glass coords: y grows upward, droplets fall so the head is the lowest
      // bright point with a trail above it.
      float dy = head - (1.0 - p.y);
      // Trail above the head fades; nothing renders below the head.
      float trail = smoothstep(0.0, 0.45, dy) * (1.0 - smoothstep(0.45, 0.5, dy));

      // Compact bright droplet bead at the head.
      float bead = exp(-pow(dy * 24.0, 2.0));

      return max(trail * 0.6, bead);
    }

    void main(){
      // Mouse parallax tilts the streaks slightly for a tactile feel.
      vec2 p = vUv;
      p.x += uMouse.x * 0.02;

      float cols = max(uDensity, 1.0);
      float fx = p.x * cols;
      float colId = floor(fx);
      float local = fract(fx) - 0.5; // -0.5..0.5 within the column

      float acc = 0.0;
      // Sample this column and its two neighbours so beads can sit anywhere
      // horizontally within a column without hard seams.
      for(float k = -1.0; k <= 1.0; k += 1.0){
        float cid = colId + k;
        // Per-column horizontal offset so droplets aren't centered identically.
        float ox = (o3s_hash(vec2(cid, 3.0)) - 0.5) * 0.8;
        float dist = abs((local - k) - ox);
        // uBlur widens the lateral gaussian, softening the glass refraction.
        float lateral = exp(-pow(dist / max(uBlur, 0.02), 2.0));
        acc += column(cid, p) * lateral;
      }
      acc = clamp(acc, 0.0, 1.0);

      // Subtle static haze on the glass below scroll progress (condensation).
      float haze = (1.0 - p.y) * 0.06 * uScroll;

      vec3 col = mix(uGlassColor, uStreakColor, acc);
      col += uStreakColor * haze;
      gl_FragColor = vec4(col, 1.0);
    }
  `,
  controls: {
    glassColor: { value: '#0a1822' },
    streakColor: { value: '#aaccdd' },
    density: { value: 40, min: 8, max: 120, step: 1 },
    speed: { value: 0.6, min: 0.1, max: 2.0, step: 0.05 },
    blur: { value: 0.35, min: 0.05, max: 1.0, step: 0.01 },
  },
  update(u, p) {
    if (typeof p.glassColor === 'string') u.uGlassColor.value.set(p.glassColor)
    if (typeof p.streakColor === 'string') u.uStreakColor.value.set(p.streakColor)
    if (typeof p.density === 'number') u.uDensity.value = p.density
    if (typeof p.speed === 'number') u.uSpeed.value = p.speed
    if (typeof p.blur === 'number') u.uBlur.value = p.blur
  },
  transparent: false,
}