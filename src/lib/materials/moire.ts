import { Color } from 'three'
import { type SurfaceMaterial } from './types'

// Moiré arises when two periodic line gratings are superimposed at a small
// relative angle: the spatial beat between their frequencies forms low-frequency
// interference fringes. We render two analytic gratings in UV space, each rotated
// by ±half the spread, then multiply their visibility so the fringes emerge from
// the product rather than a sum (product gives the characteristic dark/light beat).
export const moire: SurfaceMaterial = {
  id: 'moire',
  name: 'Moiré',
  uniforms: {
    uColorA: { value: new Color('#05060a') },
    uColorB: { value: new Color('#7df9ff') },
    uFrequency: { value: 80.0 },
    uAngle: { value: 0.08 },
    uSharpness: { value: 2.2 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
  `,
  fragmentShader: `
    precision highp float;
    varying vec2 vUv;
    uniform vec3 uColorA;
    uniform vec3 uColorB;
    uniform float uFrequency; // base line density (lines across the surface)
    uniform float uAngle;     // angular spread between the two gratings (radians)
    uniform float uSharpness; // contrast exponent on each grating's profile

    // One rotated sinusoidal line grating sampled at p. Rotating the sample
    // coordinate by 'a' is equivalent to rotating the grating, and is cheaper
    // than rotating with a mat2 build per call.
    float grating(vec2 p, float a, float freq){
      float s = sin(a);
      float c = cos(a);
      // Project onto the grating's normal direction; only one axis carries phase.
      float coord = p.x * c - p.y * s;
      return 0.5 + 0.5 * sin(coord * freq);
    }

    void main(){
      // Center UVs and apply aspect correction so fringes stay isotropic on
      // non-square surfaces; mouse adds a subtle parallax shear to the pivot.
      vec2 p = vUv - 0.5;
      p.x *= uResolution.x / max(uResolution.y, 1.0);
      p += uMouse * 0.05;

      // Drift one grating's phase with time/scroll so the beat pattern crawls.
      float drift = uTime * 0.15 + uScroll * 3.1415926;

      float g1 = grating(p, -uAngle * 0.5, uFrequency);
      float g2 = grating(p + vec2(drift * 0.002, 0.0), uAngle * 0.5, uFrequency);

      // Product of the two visibilities is the moiré field; sharpen for contrast.
      float m = pow(g1 * g2, uSharpness);

      vec3 col = mix(uColorA, uColorB, m);
      gl_FragColor = vec4(col, 1.0);
    }
  `,
  controls: {
    colorA: { value: '#05060a' },
    colorB: { value: '#7df9ff' },
    frequency: { value: 80, min: 10, max: 200, step: 1 },
    angle: { value: 0.08, min: 0.0, max: 0.6, step: 0.005 },
    sharpness: { value: 2.2, min: 0.5, max: 6, step: 0.1 },
  },
  docs: {
    colorA: 'Color of the dark interference troughs',
    colorB: 'Color of the bright interference fringes',
    frequency: 'Line density of both gratings, higher packs more lines and finer beats',
    angle: 'Angular spread between the two gratings in radians, which sets the fringe spacing',
    sharpness: 'Contrast exponent on the grating product, higher gives crisper fringes',
  },
  update(u, p) {
    if (typeof p.colorA === 'string') (u.uColorA.value as Color).set(p.colorA)
    if (typeof p.colorB === 'string') (u.uColorB.value as Color).set(p.colorB)
    if (typeof p.frequency === 'number') u.uFrequency.value = p.frequency
    if (typeof p.angle === 'number') u.uAngle.value = p.angle
    if (typeof p.sharpness === 'number') u.uSharpness.value = p.sharpness
  },
}
