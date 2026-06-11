import { Color } from 'three'
import { type SurfaceMaterial } from './types'
import { fresnel } from '../shaders/chunks'

// Cel shading quantizes a continuous Lambert term into discrete bands, then
// darkens grazing-angle pixels via fresnel to fake the inked outline an artist
// would draw around a silhouette. Both effects live in the fragment shader so
// the standard pass-through vertex shader is enough.
export const toonCel: SurfaceMaterial = {
  id: 'toon-cel',
  name: 'Toon Cel',
  uniforms: {
    uBase: { value: new Color('#4f9dde') },
    uShadow: { value: new Color('#1b3a5c') },
    uSteps: { value: 4.0 },
    uOutline: { value: 2.5 },
  },
  vertexShader: `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vView;
    void main(){
      vUv = uv;
      // World-space normal/view so the rim term is stable as the mesh rotates.
      vNormal = normalize(mat3(modelMatrix) * normal);
      vec4 wp = modelMatrix * vec4(position, 1.0);
      vView = normalize(cameraPosition - wp.xyz);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `${fresnel}
    uniform vec3 uBase;
    uniform vec3 uShadow;
    uniform float uSteps;
    uniform float uOutline;
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vView;
    void main(){
      vec3 n = normalize(vNormal);
      // Animate the key light slowly and steer it with the mouse so the bands
      // visibly sweep across the surface rather than sitting static.
      vec3 lightDir = normalize(vec3(uMouse.x, uMouse.y, 1.0) + vec3(sin(uTime * 0.3), cos(uTime * 0.2), 0.0) * 0.4);
      float diff = max(dot(n, lightDir), 0.0);
      // Quantize the diffuse term into uSteps flat bands — the signature cel look.
      float steps = max(uSteps, 1.0);
      float quantized = floor(diff * steps) / steps;
      vec3 col = mix(uShadow, uBase, quantized);
      // Fresnel rim darkened toward black draws the outline on silhouette edges.
      float rim = o3s_fresnel(n, normalize(vView), uOutline);
      col = mix(col, vec3(0.0), rim);
      gl_FragColor = vec4(col, 1.0);
    }
  `,
  controls: {
    base: { value: '#4f9dde' },
    shadow: { value: '#1b3a5c' },
    steps: { value: 4, min: 2, max: 8, step: 1 },
    outline: { value: 2.5, min: 0.5, max: 6, step: 0.1 },
  },
  update(u, p) {
    if (typeof p.base === 'string') (u.uBase.value as Color).set(p.base)
    if (typeof p.shadow === 'string') (u.uShadow.value as Color).set(p.shadow)
    if (typeof p.steps === 'number') u.uSteps.value = p.steps
    if (typeof p.outline === 'number') u.uOutline.value = p.outline
  },
}
