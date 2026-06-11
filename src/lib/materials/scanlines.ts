import { Color } from 'three'
import { type SurfaceMaterial } from './types'
import { hash } from '../shaders/chunks'

// CRT projection: horizontal scanlines, a tiny RGB split that grows toward the
// edges, plus a low-level flicker. Sampled UVs are driven entirely by uTime/uUv
// so nothing here depends on wall-clock or RNG. The base "image" is a procedural
// vignette tint — the effect is meant to overlay a surface, so we keep the
// underlying color simple and let the CRT artifacts carry the look.
export const scanlines: SurfaceMaterial = {
  id: 'scanlines', name: 'Scanlines',
  uniforms: {
    uTint: { value: new Color('#39ff66') },
    uDark: { value: new Color('#02060a') },
    uLineFreq: { value: 220.0 },
    uAberration: { value: 0.004 },
    uFlicker: { value: 0.08 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
  `,
  fragmentShader: `${hash}
    varying vec2 vUv;
    uniform vec3 uTint;
    uniform vec3 uDark;
    uniform float uLineFreq;
    uniform float uAberration;
    uniform float uFlicker;

    // Procedural luminance for a channel sampled at offset uv. Cheap radial
    // pattern so the chromatic split is actually visible without a texture.
    float lum(vec2 uv){
      vec2 c = uv - 0.5;
      float r = length(c);
      // soft rings + a faint static grain keyed by hash for CRT texture
      float rings = 0.5 + 0.5 * cos(r * 18.0 - uTime * 0.6);
      float grain = o3s_hash(floor(uv * uResolution * 0.5) + floor(uTime * 24.0));
      return mix(rings, grain, 0.06);
    }

    void main(){
      // Aberration grows with distance from center, like a real tube's edges.
      vec2 c = vUv - 0.5;
      vec2 off = c * uAberration * (1.0 + dot(c, c) * 4.0);

      float r = lum(vUv + off);
      float g = lum(vUv);
      float b = lum(vUv - off);
      vec3 img = vec3(r, g, b);

      // Tint the monochrome-ish image toward the phosphor color.
      vec3 col = uTint * img;

      // Scanlines: darken every other row. Scroll slowly so they feel alive.
      float line = 0.5 + 0.5 * sin((vUv.y + uTime * 0.02) * uLineFreq * 3.14159);
      col *= mix(0.65, 1.0, line);

      // Flicker: global brightness wobble, two beats for a non-periodic feel.
      float fl = 1.0 - uFlicker * (0.5 + 0.5 * sin(uTime * 47.0)) * (0.5 + 0.5 * sin(uTime * 11.3));
      col *= fl;

      // Vignette toward the dark frame color at the edges.
      float vig = smoothstep(0.85, 0.35, length(c));
      col = mix(uDark, col, vig);

      gl_FragColor = vec4(col, 1.0);
    }
  `,
  controls: {
    tint: { value: '#39ff66' },
    dark: { value: '#02060a' },
    lineFreq: { value: 220, min: 40, max: 600, step: 1 },
    aberration: { value: 0.004, min: 0.0, max: 0.02, step: 0.0005 },
    flicker: { value: 0.08, min: 0.0, max: 0.4, step: 0.01 },
  },
  update(u, p) {
    if (typeof p.tint === 'string') (u.uTint.value as Color).set(p.tint)
    if (typeof p.dark === 'string') (u.uDark.value as Color).set(p.dark)
    if (typeof p.lineFreq === 'number') u.uLineFreq.value = p.lineFreq
    if (typeof p.aberration === 'number') u.uAberration.value = p.aberration
    if (typeof p.flicker === 'number') u.uFlicker.value = p.flicker
  },
}