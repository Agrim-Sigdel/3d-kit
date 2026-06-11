import { snoise2D, hsv2rgb } from '../shaders/chunks'
import { type SurfaceMaterial } from './types'

/**
 * Thermal Vision — heatmap ramp driven by animated noise, hottest near cursor.
 * Variant module for <InteractiveSurface>.
 */
export const thermalVision: SurfaceMaterial = {
  id: 'thermal-vision',
  name: 'Thermal Vision',
  uniforms: {
    uIntensity: { value: 1.0 },
    uScaleN: { value: 3.0 },
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
    uniform float uIntensity;
    uniform float uScaleN;
    varying vec2  vUv;

    void main() {
      vec2 m = uMouse * 0.5 + 0.5;
      float heat = o3s_snoise(vUv * uScaleN + uTime * 0.2) * 0.5 + 0.5;
      // Cursor adds a hot spot.
      heat += smoothstep(0.5, 0.0, distance(vUv, m)) * 0.8;
      heat = clamp(heat * uIntensity, 0.0, 1.0);
      // Map heat 0..1 across the thermal hue range (blue→red→white).
      float hue = mix(0.66, 0.0, heat);          // blue→red
      vec3 col = o3s_hsv2rgb(vec3(hue, 1.0, heat));
      col = mix(col, vec3(1.0), smoothstep(0.85, 1.0, heat)); // white-hot tip
      gl_FragColor = vec4(col, 1.0);
    }
  `,
  controls: {
    intensity: { value: 1.0, min: 0.2, max: 2.5, step: 0.1 },
    noiseScale: { value: 3.0, min: 0.5, max: 8, step: 0.5 },
  },
  docs: {
    intensity: 'Overall heat gain, pushing more of the surface toward the red and white-hot end of the ramp',
    noiseScale: 'Spatial frequency of the heat noise, higher values give smaller hot patches',
  },
  update(u, p) {
    if (typeof p.intensity === 'number') u.uIntensity.value = p.intensity
    if (typeof p.noiseScale === 'number') u.uScaleN.value = p.noiseScale
  },
}
