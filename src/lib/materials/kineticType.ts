import { Color } from 'three'
import { type SurfaceMaterial } from './types'
import { snoise2D } from '../shaders/chunks'

// Kinetic Type: a procedural stripe field whose phase is warped by a flowing
// noise distortion. The cursor acts as a local lens — stripes bend toward/away
// from uMouse so the pattern feels physically pushed by the pointer.
export const kineticType: SurfaceMaterial = {
  id: 'kinetic-type',
  name: 'Kinetic Type',
  uniforms: {
    uInk: { value: new Color('#0a0a0a') },
    uPaper: { value: new Color('#f5f2e8') },
    uFreq: { value: 24.0 },
    uWarp: { value: 0.35 },
    uPull: { value: 0.6 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
  `,
  fragmentShader: `${snoise2D}
    varying vec2 vUv;
    uniform vec3 uInk;
    uniform vec3 uPaper;
    uniform float uFreq;   // stripe density across UV
    uniform float uWarp;   // amplitude of the noise-driven phase warp
    uniform float uPull;   // strength of the cursor lensing

    void main(){
      // Map mouse from [-1,1] into UV space so distance math stays in 0..1.
      vec2 m = uMouse * 0.5 + 0.5;
      vec2 d = vUv - m;
      float dist = length(d);

      // Cursor lens: a soft radial falloff pushes UVs outward from the pointer.
      // Squaring the falloff keeps the effect tight near the cursor.
      float lens = exp(-dist * dist * 8.0) * uPull;
      vec2 p = vUv + normalize(d + 1e-4) * lens * 0.15;

      // Flowing noise field — uScroll advances it so the warp drifts on scroll,
      // uTime gives the ambient breathing motion independent of input.
      float n = o3s_snoise(p * 3.0 + vec2(uTime * 0.15, uScroll * 2.0));

      // Diagonal stripe coordinate; warp displaces the phase by the noise field.
      float coord = (p.x + p.y) * uFreq + n * uWarp * 10.0;

      // Antialiased stripe edges via the screen-space derivative of the phase.
      float s = sin(coord);
      float aa = fwidth(coord) * 1.5 + 1e-4;
      float stripe = smoothstep(-aa, aa, s);

      vec3 col = mix(uInk, uPaper, stripe);
      gl_FragColor = vec4(col, 1.0);
    }
  `,
  controls: {
    ink: { value: '#0a0a0a' },
    paper: { value: '#f5f2e8' },
    freq: { value: 24, min: 4, max: 60, step: 1 },
    warp: { value: 0.35, min: 0, max: 1, step: 0.01 },
    pull: { value: 0.6, min: 0, max: 2, step: 0.01 },
  },
  update(u, p) {
    if (typeof p.ink === 'string') u.uInk.value.set(p.ink)
    if (typeof p.paper === 'string') u.uPaper.value.set(p.paper)
    if (typeof p.freq === 'number') u.uFreq.value = p.freq
    if (typeof p.warp === 'number') u.uWarp.value = p.warp
    if (typeof p.pull === 'number') u.uPull.value = p.pull
  },
}
