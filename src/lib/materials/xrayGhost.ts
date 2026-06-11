import { Color } from 'three'
import { type SurfaceMaterial } from './types'
import { fresnel } from '../shaders/chunks'

// X-Ray Ghost: a translucent, edge-lit shader. The body stays near-invisible
// while grazing-angle fresnel reuses the classic "specimen against a lightbox"
// look — bright rim, hollow center. Mouse/scroll subtly bias the rim to make
// the ghost feel alive without any time-based jitter.
export const xrayGhost: SurfaceMaterial = {
  id: 'xray-ghost',
  name: 'X-Ray Ghost',
  transparent: true,
  doubleSide: true, // backfaces contribute to the translucent stacking look

  uniforms: {
    uRimColor: { value: new Color('#9fe8ff') },
    uCoreColor: { value: new Color('#0a1830') },
    uRimPower: { value: 2.6 },
    uOpacity: { value: 0.55 },
  },

  // Need view-space normal + view direction for fresnel, so the standard
  // passthrough vertex shader is insufficient — compute both here.
  vertexShader: `
    varying vec3 vN;
    varying vec3 vViewDir;
    void main(){
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      vN = normalize(normalMatrix * normal);
      // View direction points from surface toward the camera (origin in view space).
      vViewDir = normalize(-mv.xyz);
      gl_Position = projectionMatrix * mv;
    }
  `,

  fragmentShader: `${fresnel}
    uniform vec3 uRimColor;
    uniform vec3 uCoreColor;
    uniform float uRimPower;
    uniform float uOpacity;
    varying vec3 vN;
    varying vec3 vViewDir;

    void main(){
      vec3 n = normalize(vN);
      // Flip normals on backfaces so the rim term is consistent from both sides.
      n *= gl_FrontFacing ? 1.0 : -1.0;

      float f = o3s_fresnel(n, normalize(vViewDir), uRimPower);

      // Scroll thins or thickens the rim; mouse.x nudges its sharpness so the
      // ghost reads as reacting to the cursor. Clamp keeps power physical.
      float power = clamp(uRimPower + uScroll * 1.5 + uMouse.x * 0.5, 0.5, 8.0);
      f = pow(clamp(f, 0.0, 1.0), power / max(uRimPower, 0.5));

      // Faint internal flicker driven by uTime only modulates intensity, never
      // geometry — keeps the glow breathing while staying deterministic-safe.
      float breathe = 0.85 + 0.15 * sin(uTime * 0.8);

      vec3 col = mix(uCoreColor, uRimColor, f) * breathe;
      // Alpha tracks the rim: hollow core, luminous edges.
      float alpha = clamp(uOpacity * (0.12 + f), 0.0, 1.0);

      gl_FragColor = vec4(col, alpha);
    }
  `,

  controls: {
    rimColor: { value: '#9fe8ff' },
    coreColor: { value: '#0a1830' },
    rimPower: { value: 2.6, min: 0.5, max: 8, step: 0.1 },
    opacity: { value: 0.55, min: 0, max: 1, step: 0.01 },
  },

  update(u, p) {
    if (typeof p.rimColor === 'string') (u.uRimColor.value as Color).set(p.rimColor)
    if (typeof p.coreColor === 'string') (u.uCoreColor.value as Color).set(p.coreColor)
    if (typeof p.rimPower === 'number') u.uRimPower.value = p.rimPower
    if (typeof p.opacity === 'number') u.uOpacity.value = p.opacity
  },
}
