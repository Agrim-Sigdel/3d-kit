import { Color } from 'three'
import { type SurfaceMaterial } from './types'
import { hsv2rgb } from '../shaders/chunks'

// Classic demoscene plasma: a sum of phase-shifted sines in screen/uv space,
// folded into a hue and mapped through HSV so the palette stays vivid without
// per-channel tuning. uTime drives the motion; uMouse warps the field so it
// feels interactive. Two tint colors let the otherwise-rainbow output be biased
// toward a brand palette by mixing into the HSV-derived color.
export const plasma: SurfaceMaterial = {
  id: 'plasma',
  name: 'Plasma',
  // VARIANT uniforms only — family injects uTime/uMouse/uScroll/uResolution.
  uniforms: {
    uScale: { value: 8.0 },
    uSpeed: { value: 0.6 },
    uColorA: { value: new Color('#ff2d75') },
    uColorB: { value: new Color('#1fa2ff') },
  },
  vertexShader: `
    varying vec2 vUv;
    void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
  `,
  fragmentShader: `${hsv2rgb}
    varying vec2 vUv;
    uniform float uScale;
    uniform float uSpeed;
    uniform vec3 uColorA;
    uniform vec3 uColorB;

    void main(){
      // Aspect-correct so the pattern is not stretched on non-square targets.
      vec2 p = vUv * uScale;
      p.x *= max(uResolution.x, 1.0) / max(uResolution.y, 1.0);

      // Mouse nudges the spatial phase; subtle so it perturbs rather than slides.
      p += uMouse * 0.75;

      float t = uTime * uSpeed;

      // Four classic plasma terms: axis sines, a radial ripple, and a rotated
      // diagonal. Summing decorrelated frequencies yields the organic interference.
      float v = 0.0;
      v += sin(p.x + t);
      v += sin(p.y + t * 1.3);
      v += sin((p.x + p.y) * 0.5 + t * 0.8);
      float cx = p.x + 0.5 * sin(t * 0.4);
      float cy = p.y + 0.5 * cos(t * 0.5);
      v += sin(sqrt(cx * cx + cy * cy) + t);

      // v spans roughly [-4,4]; fold to [0,1] for a continuously cycling hue.
      float hue = fract(v * 0.125 + 0.5);

      // Scroll shifts saturation/brightness slightly for depth as the page moves.
      vec3 rainbow = o3s_hsv2rgb(vec3(hue, 0.85, 1.0 - uScroll * 0.25));

      // Bias the pure rainbow toward the brand tints using the same fold value
      // so the mix tracks the wave crests instead of being a flat overlay.
      vec3 tint = mix(uColorA, uColorB, fract(v * 0.25));
      vec3 col = mix(rainbow, rainbow * tint * 2.0, 0.4);

      gl_FragColor = vec4(col, 1.0);
    }
  `,
  controls: {
    scale: { value: 8, min: 2, max: 24, step: 0.5 },
    speed: { value: 0.6, min: 0, max: 3, step: 0.05 },
    colorA: { value: '#ff2d75' },
    colorB: { value: '#1fa2ff' },
  },
  docs: {
    scale: 'Spatial frequency of the summed sine waves, higher packs more swirls into the surface',
    speed: 'How fast the plasma interference pattern flows',
    colorA: 'First brand tint the rainbow output is biased toward on the wave crests',
    colorB: 'Second brand tint mixed in along the wave fold',
  },
  update(u, p) {
    if (typeof p.scale === 'number') u.uScale.value = p.scale
    if (typeof p.speed === 'number') u.uSpeed.value = p.speed
    if (typeof p.colorA === 'string') (u.uColorA.value as Color).set(p.colorA)
    if (typeof p.colorB === 'string') (u.uColorB.value as Color).set(p.colorB)
  },
}
