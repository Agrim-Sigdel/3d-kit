import { Color, Vector2 } from 'three'
import { snoise2D } from '../shaders/chunks'
import { type SurfaceMaterial } from './types'

/**
 * Glassmorphism — frosted translucent surface with a soft refracted blob and a
 * cursor-following highlight. Variant module for <InteractiveSurface>.
 */
export const glassmorphism: SurfaceMaterial = {
  id: 'glassmorphism',
  name: 'Glassmorphism',
  transparent: true,
  uniforms: {
    uTint: { value: new Color('#9ec5ff') },
    uOpacity: { value: 0.55 },
    uBlobScale: { value: 1.4 },
    uMousePx: { value: new Vector2(0, 0) },
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
    uniform vec3  uTint;
    uniform float uOpacity;
    uniform float uBlobScale;
    varying vec2  vUv;

    void main() {
      vec2 m = uMouse * 0.5 + 0.5;
      // Soft animated frost via layered noise.
      float n = o3s_snoise(vUv * uBlobScale + uTime * 0.05) * 0.5 + 0.5;
      n += o3s_snoise(vUv * uBlobScale * 2.3 - uTime * 0.03) * 0.25;
      // Cursor highlight (the glass "sheen").
      float glow = smoothstep(0.45, 0.0, distance(vUv, m));
      vec3 col = mix(uTint * 0.6, uTint, n) + glow * 0.4;
      gl_FragColor = vec4(col, uOpacity + glow * 0.25);
    }
  `,
  controls: {
    tint: '#9ec5ff',
    opacity: { value: 0.55, min: 0.1, max: 1, step: 0.05 },
    blobScale: { value: 1.4, min: 0.3, max: 4, step: 0.1 },
  },
  docs: {
    tint: 'Base glass color the frost noise modulates between its dark and bright shades',
    opacity: 'Baseline translucency of the panel before the cursor sheen adds extra alpha',
    blobScale: 'Spatial frequency of the layered frost noise, higher values give finer grain',
  },
  update(u, p) {
    if (p.tint) (u.uTint.value as Color).set(p.tint as string)
    if (typeof p.opacity === 'number') u.uOpacity.value = p.opacity
    if (typeof p.blobScale === 'number') u.uBlobScale.value = p.blobScale
  },
}
