import { Color } from 'three'
import { type SurfaceMaterial } from './types'
import { snoise2D, fresnel, hsv2rgb } from '../shaders/chunks'

// Holographic foil: rainbow sheen whose hue rotates with the view/cursor angle,
// overlaid with a sharp anisotropic specular streak. The hue is driven by a
// view-dependent fresnel term so the rainbow "tilts" as the surface or cursor
// moves, mimicking real diffraction-grating foil.
export const holographicFoil: SurfaceMaterial = {
  id: 'holographic-foil',
  name: 'Holographic Foil',

  // VARIANT uniforms only — family injects uTime/uMouse/uScroll/uResolution.
  uniforms: {
    uTint: { value: new Color('#ffffff') }, // overall foil tint multiplier
    uHueScale: { value: 3.0 }, // rainbow cycles across the fresnel sweep
    uStreakSharp: { value: 24.0 }, // specular streak tightness (higher = sharper)
    uGrain: { value: 0.15 }, // micro-noise that breaks up the bands
  },

  vertexShader: `
    varying vec2 vUv;
    varying vec3 vViewNormal;
    varying vec3 vViewDir;
    void main(){
      vUv = uv;
      // Work in view space so fresnel/streak track the camera consistently.
      vViewNormal = normalize(normalMatrix * normal);
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      vViewDir = normalize(-mv.xyz);
      gl_Position = projectionMatrix * mv;
    }
  `,

  fragmentShader: `${snoise2D}\n${fresnel}\n${hsv2rgb}
    varying vec2 vUv;
    varying vec3 vViewNormal;
    varying vec3 vViewDir;

    uniform vec3 uTint;
    uniform float uHueScale;
    uniform float uStreakSharp;
    uniform float uGrain;

    void main(){
      vec3 n = normalize(vViewNormal);
      vec3 v = normalize(vViewDir);

      // Cursor nudges the apparent viewing angle so the rainbow shifts with it.
      vec3 vMouse = normalize(v + vec3(uMouse * 0.6, 0.0));

      // Fresnel sweep is the diffraction driver: grazing angles cycle hue fastest.
      float f = o3s_fresnel(n, vMouse, 2.0);

      // Break up the otherwise-perfect bands with low-amplitude surface grain.
      float grain = o3s_snoise(vUv * 8.0 + uTime * 0.05) * uGrain;

      // Hue scrolls with fresnel, scroll position and a slow time drift.
      float hue = fract(f * uHueScale + uScroll * 0.5 + uTime * 0.03 + grain);
      vec3 rainbow = o3s_hsv2rgb(vec3(hue, 0.85, 1.0));

      // Sharp specular streak: anisotropic highlight along the U axis that the
      // cursor steers. pow() with uStreakSharp collapses it into a thin band.
      float streakCoord = vUv.x - 0.5 - uMouse.x * 0.25;
      float streak = pow(max(0.0, 1.0 - abs(streakCoord) * 4.0), uStreakSharp);

      // Foil reads brightest at edges; lift the rainbow by fresnel, then add streak.
      vec3 col = rainbow * (0.35 + 0.65 * f) * uTint;
      col += vec3(streak) * (0.5 + 0.5 * f);

      gl_FragColor = vec4(col, 1.0);
    }
  `,

  controls: {
    tint: { value: '#ffffff' },
    hueScale: { value: 3.0, min: 0.5, max: 8.0, step: 0.1 },
    streakSharp: { value: 24.0, min: 4.0, max: 64.0, step: 1.0 },
    grain: { value: 0.15, min: 0.0, max: 0.6, step: 0.01 },
  },

  update(u, p) {
    if (typeof p.tint === 'string') u.uTint.value.set(p.tint as string)
    if (typeof p.hueScale === 'number') u.uHueScale.value = p.hueScale
    if (typeof p.streakSharp === 'number') u.uStreakSharp.value = p.streakSharp
    if (typeof p.grain === 'number') u.uGrain.value = p.grain
  },
}
