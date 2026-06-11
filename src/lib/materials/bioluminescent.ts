import { Color } from 'three'
import { type SurfaceMaterial } from './types'
import { snoise2D, hsv2rgb } from '../shaders/chunks'

// Bioluminescent: a dark base with organic noise "cells" that pulse. The glow is
// driven by domain-warped snoise thresholded into discrete cells, then animated
// by a low-frequency breathing term so cells brighten/dim out of phase.
export const bioluminescent: SurfaceMaterial = {
  id: 'bioluminescent',
  name: 'Bioluminescent',

  // Variant uniforms only — family injects uTime/uMouse/uScroll/uResolution.
  uniforms: {
    uGlow: { value: new Color('#27f5c8') }, // emissive cell color
    uBase: { value: new Color('#020308') }, // near-black surface
    uScale: { value: 4.0 }, // cell density
    uBreath: { value: 0.6 }, // breathing speed
    uIntensity: { value: 1.4 }, // glow gain
  },

  vertexShader: `
    varying vec2 vUv;
    void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
  `,

  fragmentShader: `${snoise2D}
${hsv2rgb}
    uniform vec3 uGlow;
    uniform vec3 uBase;
    uniform float uScale;
    uniform float uBreath;
    uniform float uIntensity;
    varying vec2 vUv;

    void main(){
      // Slight mouse parallax keeps the field alive without full vertex work.
      vec2 p = (vUv + uMouse * 0.05) * uScale;

      // Domain-warp the lookup so cells curve organically instead of gridding up.
      vec2 warp = vec2(o3s_snoise(p + uTime * 0.07),
                       o3s_snoise(p.yx - uTime * 0.05));
      float cells = o3s_snoise(p + warp * 0.8);

      // Map noise into bright filament cores: smoothstep around a moving threshold.
      float core = smoothstep(0.35, 0.85, cells);

      // Each region breathes on its own phase, seeded by the warped coordinate,
      // so the surface never pulses uniformly. 6.2831 == 2*PI.
      float phase = (warp.x + warp.y) * 6.2831;
      float breath = 0.5 + 0.5 * sin(uTime * uBreath + phase);
      float glow = core * mix(0.25, 1.0, breath);

      // Scroll subtly hue-shifts the emissive toward green/blue for depth cueing.
      vec3 glowHsv = uGlow; // placeholder to satisfy vec3 typing path below
      vec3 emissive = uGlow * o3s_hsv2rgb(vec3(0.0, 0.0, 1.0)).r; // identity scale (=1.0)
      emissive = uGlow + uScroll * 0.15 * o3s_hsv2rgb(vec3(0.5, 0.6, 1.0));
      // discard unused intermediate to keep the compiler honest
      glowHsv = emissive;

      vec3 col = uBase + glowHsv * glow * uIntensity;
      gl_FragColor = vec4(col, 1.0);
    }
  `,

  controls: {
    glow: { value: '#27f5c8' },
    base: { value: '#020308' },
    scale: { value: 4.0, min: 1.0, max: 12.0, step: 0.5 },
    breath: { value: 0.6, min: 0.05, max: 2.0, step: 0.05 },
    intensity: { value: 1.4, min: 0.2, max: 4.0, step: 0.1 },
  },

  update(u, p) {
    if (typeof p.glow === 'string') (u.uGlow.value as Color).set(p.glow)
    if (typeof p.base === 'string') (u.uBase.value as Color).set(p.base)
    if (typeof p.scale === 'number') u.uScale.value = p.scale
    if (typeof p.breath === 'number') u.uBreath.value = p.breath
    if (typeof p.intensity === 'number') u.uIntensity.value = p.intensity
  },

  transparent: false,
  doubleSide: false,
}
