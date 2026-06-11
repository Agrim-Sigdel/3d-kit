import { Color } from 'three'
import { type SurfaceMaterial } from './types'
import { snoise2D } from '../shaders/chunks'

// Heat-haze: a vertical gradient background distorted by a rising, refractive
// shimmer. The "refraction" is faked by sampling the gradient at UVs offset by
// an animated noise field whose magnitude grows toward the bottom (where heat
// pools) — cheaper than true screen-space refraction and self-contained.
export const heatHaze: SurfaceMaterial = {
  id: 'heat-haze',
  name: 'Heat Haze',
  uniforms: {
    uColorTop: { value: new Color('#1b2a4a') },
    uColorBottom: { value: new Color('#ff7a3c') },
    uStrength: { value: 0.04 },
    uSpeed: { value: 1.2 },
    uScale: { value: 5.0 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
  `,
  fragmentShader: `${snoise2D}
    uniform vec3 uColorTop;
    uniform vec3 uColorBottom;
    uniform float uStrength;
    uniform float uSpeed;
    uniform float uScale;
    varying vec2 vUv;

    // Procedural background sampled at a (distorted) uv, so refraction is just
    // a coordinate offset rather than a real texture lookup.
    vec3 gradient(vec2 uv){
      return mix(uColorBottom, uColorTop, clamp(uv.y, 0.0, 1.0));
    }

    void main(){
      // Heat plumes drift upward over time; two octaves give organic wobble.
      float t = uTime * uSpeed;
      float n1 = o3s_snoise(vec2(vUv.x * uScale, vUv.y * uScale - t));
      float n2 = o3s_snoise(vec2(vUv.x * uScale * 2.0 + 7.3, vUv.y * uScale * 2.0 - t * 1.7));
      vec2 wobble = vec2(n1, n2 * 0.6);

      // Haze intensifies near the bottom and reacts subtly to the cursor,
      // so the shimmer feels anchored to a heat source.
      float heat = pow(1.0 - vUv.y, 1.5) * (1.0 + uMouse.y * 0.25);
      vec2 distorted = vUv + wobble * uStrength * heat;

      vec3 col = gradient(distorted);

      // A faint shimmer highlight where the distortion is strongest sells the
      // refractive "air boil" look without an extra pass.
      float shimmer = abs(n1) * heat * 0.15;
      col += shimmer;

      gl_FragColor = vec4(col, 1.0);
    }
  `,
  controls: {
    colorTop: { value: '#1b2a4a' },
    colorBottom: { value: '#ff7a3c' },
    strength: { value: 0.04, min: 0.0, max: 0.2, step: 0.005 },
    speed: { value: 1.2, min: 0.0, max: 4.0, step: 0.1 },
    scale: { value: 5.0, min: 1.0, max: 16.0, step: 0.5 },
  },
  docs: {
    colorTop: 'Gradient color at the cool top of the surface',
    colorBottom: 'Gradient color at the hot bottom where the haze pools',
    strength: 'How far the shimmer displaces the background gradient',
    speed: 'How fast the heat plumes rise',
    scale: 'Spatial frequency of the distortion noise, higher gives finer ripples',
  },
  update(u, p) {
    if (typeof p.colorTop === 'string') (u.uColorTop.value as Color).set(p.colorTop)
    if (typeof p.colorBottom === 'string') (u.uColorBottom.value as Color).set(p.colorBottom)
    if (typeof p.strength === 'number') u.uStrength.value = p.strength
    if (typeof p.speed === 'number') u.uSpeed.value = p.speed
    if (typeof p.scale === 'number') u.uScale.value = p.scale
  },
}
