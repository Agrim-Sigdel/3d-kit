import { Color } from 'three'
import { type SurfaceMaterial } from './types'

// Neon line-art grid: distance-to-grid-line shaping gives crisp wireframe edges,
// then an additive emissive bloom pulse makes lines feel like glowing tubes.
export const neonLineArt: SurfaceMaterial = {
  id: 'neon-line-art',
  name: 'Neon Line Art',
  uniforms: {
    uLineColor: { value: new Color('#00ffd5') },
    uBgColor: { value: new Color('#04060a') },
    uDensity: { value: 14.0 },
    uThickness: { value: 0.04 },
    uPulse: { value: 1.0 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main(){
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
    }
  `,
  fragmentShader: `
    varying vec2 vUv;
    uniform vec3 uLineColor;
    uniform vec3 uBgColor;
    uniform float uDensity;   // grid cells across the surface
    uniform float uThickness; // half-width of a line in cell space
    uniform float uPulse;     // global brightness multiplier for the pulse

    // Symmetric distance to the nearest grid line on one axis, normalized so that
    // fwidth-based antialiasing reads consistently regardless of density.
    float o3s_lineMask(float coord, float thickness){
      float g = abs(fract(coord) - 0.5);   // 0 at cell center, 0.5 at the line
      float d = 0.5 - g;                    // 0 at the line, grows inward
      float aa = fwidth(coord) + 1e-4;      // screen-space derivative for crisp edges
      return 1.0 - smoothstep(thickness, thickness + aa, d);
    }

    void main(){
      // Scroll-driven drift keeps the grid alive even when the camera is static.
      vec2 g = vUv * uDensity + vec2(uScroll * 2.0, uTime * 0.15);

      float mask = max(o3s_lineMask(g.x, uThickness), o3s_lineMask(g.y, uThickness));

      // Travelling sine wave along the diagonal so intersections glow in sequence;
      // mouse nudges the phase so it reacts to pointer movement.
      float wave = 0.5 + 0.5 * sin((g.x + g.y) * 0.7 - uTime * 2.0 + uMouse.x * 3.14159);
      float glow = mask * (0.6 + 0.4 * wave) * uPulse;

      // Additive feel: emissive lines stacked over a near-black backdrop. Squaring
      // the mask for the core fakes an inner hot streak inside the soft halo.
      vec3 col = uBgColor + uLineColor * glow + uLineColor * mask * mask * 0.5 * uPulse;

      gl_FragColor = vec4(col, 1.0);
    }
  `,
  controls: {
    lineColor: { value: '#00ffd5' },
    bgColor: { value: '#04060a' },
    density: { value: 14, min: 4, max: 40, step: 1 },
    thickness: { value: 0.04, min: 0.005, max: 0.2, step: 0.005 },
    pulse: { value: 1, min: 0, max: 3, step: 0.05 },
  },
  docs: {
    lineColor: 'Emissive color of the glowing grid tubes',
    bgColor: 'Near-black backdrop the lines are added over',
    density: 'Number of grid cells across the surface',
    thickness: 'Half-width of each line in cell space',
    pulse: 'Global brightness multiplier on the travelling glow wave',
  },
  update(u, p) {
    if (typeof p.lineColor === 'string') u.uLineColor.value.set(p.lineColor)
    if (typeof p.bgColor === 'string') u.uBgColor.value.set(p.bgColor)
    if (typeof p.density === 'number') u.uDensity.value = p.density
    if (typeof p.thickness === 'number') u.uThickness.value = p.thickness
    if (typeof p.pulse === 'number') u.uPulse.value = p.pulse
  },
  transparent: false,
  doubleSide: true,
}
