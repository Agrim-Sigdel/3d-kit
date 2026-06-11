import { Color } from 'three'
import { type SurfaceMaterial } from './types'
import { snoise2D, hsv2rgb } from '../shaders/chunks'

// Liquid blob: a handful of moving metaballs summed into a scalar field, merged
// with a polynomial smooth-min so they fuse organically instead of intersecting
// as hard circles. The field's iso-band drives the surface; noise warps the UVs
// for a wobbly, liquid edge rather than perfect ellipses.
export const liquidBlob: SurfaceMaterial = {
  id: 'liquid-blob',
  name: 'Liquid Blob',
  // VARIANT uniforms only — uTime/uMouse/uScroll/uResolution are family-injected.
  uniforms: {
    uCount: { value: 5.0 },
    uSmooth: { value: 0.35 },
    uSpeed: { value: 0.6 },
    uColorA: { value: new Color('#0a1 fff'.replace(' ', '')) },
    uColorB: { value: new Color('#ff2d95') },
  },
  vertexShader: `
    varying vec2 vUv;
    void main(){
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
    }
  `,
  fragmentShader: `${snoise2D}
${hsv2rgb}
    varying vec2 vUv;
    uniform float uCount;
    uniform float uSmooth;
    uniform float uSpeed;
    uniform vec3 uColorA;
    uniform vec3 uColorB;

    // Polynomial smooth-min: blends two distances with a continuous seam of
    // width k, the core of the metaball "fusing" look.
    float smin(float a, float b, float k){
      float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
      return mix(b, a, h) - k * h * (1.0 - h);
    }

    // Deterministic per-index variety via sin-hash — no RNG, no wall-clock.
    float h11(float n){ return fract(sin(n * 127.1) * 43758.5453123); }

    void main(){
      // Center UVs and correct for aspect so blobs stay round, not stretched.
      vec2 p = vUv * 2.0 - 1.0;
      p.x *= uResolution.x / max(uResolution.y, 1.0);

      // Warp space with low-freq noise so blob edges ripple like a liquid film.
      vec2 warp = vec2(o3s_snoise(p * 1.5 + uTime * 0.1),
                       o3s_snoise(p * 1.5 - uTime * 0.1));
      p += warp * 0.15;

      // Mouse acts as an attractor offset, nudging the whole field.
      p -= uMouse * 0.25;

      // Accumulate metaball distances via smooth-min. Seed first ball large so
      // the very first smin has a sane operand.
      float field = 10.0;
      float t = uTime * uSpeed;
      for (float i = 0.0; i < 12.0; i += 1.0){
        if (i >= uCount) break;
        // Per-ball orbit: distinct phase/radius/freq from the index hash.
        float a = h11(i) * 6.2831853;
        float r = 0.35 + 0.4 * h11(i + 11.0);
        float f = 0.5 + h11(i + 23.0);
        vec2 c = vec2(cos(a + t * f), sin(a * 1.3 + t * f)) * r;
        float rad = 0.18 + 0.12 * h11(i + 37.0);
        float d = length(p - c) - rad;
        field = smin(field, d, uSmooth);
      }

      // Convert signed field to a soft 0..1 mask at the iso-surface.
      float mask = smoothstep(0.04, -0.02, field);

      // Hue cycles along the field gradient + scroll for an oily sheen; the two
      // controls bracket the palette endpoints.
      float hueMix = clamp(0.5 + 0.5 * sin(field * 6.0 - uScroll * 3.1416), 0.0, 1.0);
      vec3 sheen = o3s_hsv2rgb(vec3(fract(hueMix + uScroll), 0.6, 1.0));
      vec3 base = mix(uColorA, uColorB, hueMix);
      vec3 col = mix(base, base + sheen * 0.4, smoothstep(0.0, 0.08, -field));

      // Background stays dark; alpha follows the mask so blobs read as fluid.
      gl_FragColor = vec4(col * mask, mask);
    }
  `,
  controls: {
    count: { value: 5, min: 1, max: 12, step: 1 },
    smooth: { value: 0.35, min: 0.05, max: 1.0, step: 0.01 },
    speed: { value: 0.6, min: 0.0, max: 3.0, step: 0.1 },
    colorA: { value: '#0a1fff' },
    colorB: { value: '#ff2d95' },
  },
  update(u, p) {
    if (typeof p.count === 'number') u.uCount.value = p.count
    if (typeof p.smooth === 'number') u.uSmooth.value = p.smooth
    if (typeof p.speed === 'number') u.uSpeed.value = p.speed
    if (typeof p.colorA === 'string') (u.uColorA.value as Color).set(p.colorA)
    if (typeof p.colorB === 'string') (u.uColorB.value as Color).set(p.colorB)
  },
  transparent: true,
}
