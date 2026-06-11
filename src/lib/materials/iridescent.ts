import { snoise2D, hsv2rgb } from '../shaders/chunks'
import { type SurfaceMaterial } from './types'

/**
 * Iridescent — oil-slick / soap-bubble shimmer whose hue shifts with view angle
 * (faked via UV + cursor) and time. Variant module for <InteractiveSurface>.
 */
export const iridescent: SurfaceMaterial = {
  id: 'iridescent',
  name: 'Iridescent',
  uniforms: {
    uBands: { value: 6.0 },
    uShift: { value: 0.3 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    ${snoise2D}
    ${hsv2rgb}
    uniform float uBands;
    uniform float uShift;
    varying vec2  vUv;

    void main() {
      // Warp UVs with noise so the bands ripple like a thin film.
      float warp = o3s_snoise(vUv * 2.0 + uTime * 0.1) * 0.15;
      float angle = (vUv.x + vUv.y) * 0.5 + warp;
      // Cursor tilts the "view angle", shifting the spectrum.
      angle += dot(uMouse, vec2(0.25));
      float hue = fract(angle * uBands + uTime * uShift);
      vec3 col = o3s_hsv2rgb(vec3(hue, 0.7, 1.0));
      gl_FragColor = vec4(col, 1.0);
    }
  `,
  controls: {
    bands: { value: 6.0, min: 1, max: 16, step: 0.5 },
    shiftSpeed: { value: 0.3, min: 0, max: 2, step: 0.05 },
  },
  docs: {
    bands: 'How many rainbow repetitions span the surface diagonal',
    shiftSpeed: 'How fast the hue spectrum drifts across the bands over time',
  },
  update(u, p) {
    if (typeof p.bands === 'number') u.uBands.value = p.bands
    if (typeof p.shiftSpeed === 'number') u.uShift.value = p.shiftSpeed
  },
}
