import { Color } from 'three'
import { type SurfaceMaterial } from './types'
import { snoise2D, fresnel } from '../shaders/chunks'

// Anisotropic brushed metal: streaks run along one screen axis, so we stretch
// the noise lookup heavily on the across-grain axis and keep it tight along the
// grain. The specular term is widened across the grain to mimic the smeared
// highlight you get from microscopic parallel scratches on milled aluminium.
export const brushedMetal: SurfaceMaterial = {
  id: 'brushed-metal',
  name: 'Brushed Metal',
  uniforms: {
    uBase: { value: new Color('#9aa2ad') },
    uSheen: { value: new Color('#f2f5fa') },
    uGrain: { value: 220.0 },
    uAniso: { value: 0.85 },
    uContrast: { value: 0.5 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
  `,
  fragmentShader: `${snoise2D}
${fresnel}
    uniform vec3 uBase;
    uniform vec3 uSheen;
    uniform float uGrain;     // scratch frequency along the grain axis
    uniform float uAniso;     // 0 = isotropic, 1 = fully stretched streaks
    uniform float uContrast;  // streak darkness spread
    varying vec2 vUv;

    void main(){
      // Stretch sampling across the grain (x) far more than along it (y) so the
      // noise degenerates into parallel streaks. Mixing by uAniso lets the user
      // dial between matte isotropic metal and hard brushed lines.
      float across = mix(40.0, 4.0, uAniso);
      vec2 grainUv = vec2(vUv.x * across, vUv.y * uGrain);
      float scratch = o3s_snoise(grainUv) * 0.5 + 0.5;
      scratch = mix(0.5, scratch, uContrast);

      // Anisotropic highlight: drag the light reflection along the grain axis by
      // skewing the sample point with the mouse, then widen it across the grain.
      vec2 hl = vUv - vec2(0.5 + uMouse.x * 0.25, 0.5 + uMouse.y * 0.25);
      float band = exp(-pow(hl.x * 6.0, 2.0)) * exp(-pow(hl.y * 1.0, 2.0));

      // View-dependent rim using the standard fresnel chunk; we have no real
      // normal in 2D, so approximate one from the streak gradient for a subtle
      // metallic edge brighten driven by scroll.
      vec3 n = normalize(vec3(scratch - 0.5, 0.1, 1.0));
      float fr = o3s_fresnel(n, vec3(0.0, 0.0, 1.0), mix(1.5, 4.0, uScroll));

      vec3 col = mix(uBase * (0.6 + 0.4 * scratch), uSheen, band);
      col += uSheen * fr * 0.4;
      col += uSheen * sin(uTime * 0.5 + vUv.y * uGrain * 0.01) * 0.02 * uAniso;

      gl_FragColor = vec4(col, 1.0);
    }
  `,
  controls: {
    base: { value: '#9aa2ad' },
    sheen: { value: '#f2f5fa' },
    grain: { value: 220, min: 40, max: 600, step: 1 },
    aniso: { value: 0.85, min: 0, max: 1, step: 0.01 },
    contrast: { value: 0.5, min: 0, max: 1, step: 0.01 },
  },
  update(u, p) {
    if (typeof p.base === 'string') u.uBase.value.set(p.base)
    if (typeof p.sheen === 'string') u.uSheen.value.set(p.sheen)
    if (typeof p.grain === 'number') u.uGrain.value = p.grain
    if (typeof p.aniso === 'number') u.uAniso.value = p.aniso
    if (typeof p.contrast === 'number') u.uContrast.value = p.contrast
  },
}
