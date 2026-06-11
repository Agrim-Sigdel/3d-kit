import { Color } from 'three'
import { type SurfaceMaterial } from './types'

// Grid lines fade into a solid fill driven by a combined scroll+time "morph"
// factor. We compute distance to the nearest grid line in UV space, then
// threshold it; widening the threshold toward 1.0 floods the cell with fill.
export const wireframeMorph: SurfaceMaterial = {
  id: 'wireframe-morph',
  name: 'Wireframe Morph',
  uniforms: {
    uLineColor: { value: new Color('#39ff14') },
    uFillColor: { value: new Color('#0a1f3c') },
    uDensity: { value: 24.0 },
    uLineWidth: { value: 0.04 },
    uMorphSpeed: { value: 0.5 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
  `,
  fragmentShader: `
    varying vec2 vUv;
    uniform vec3 uLineColor;
    uniform vec3 uFillColor;
    uniform float uDensity;
    uniform float uLineWidth;
    uniform float uMorphSpeed;

    void main(){
      // Repeating cell coordinate; fract gives [0,1) within each grid cell.
      vec2 g = fract(vUv * uDensity);
      // Distance to the nearest cell border on each axis, in [0,0.5].
      vec2 d = min(g, 1.0 - g);
      float edge = min(d.x, d.y);

      // Morph oscillates with time but is biased open by scroll: fully scrolled
      // pages read as solid fill. uMouse nudges the phase for parallax feel.
      float phase = uTime * uMorphSpeed + uMouse.x * 0.5;
      float morph = clamp(uScroll + 0.5 * (0.5 + 0.5 * sin(phase)), 0.0, 1.0);

      // Effective half-width grows with morph so lines bleed into full fill.
      float w = mix(uLineWidth, 0.5, morph);
      // fwidth-based AA keeps the lines crisp at any grid density.
      float aa = fwidth(edge) + 1e-4;
      float line = 1.0 - smoothstep(w - aa, w + aa, edge);

      vec3 col = mix(uFillColor, uLineColor, line);
      gl_FragColor = vec4(col, 1.0);
    }
  `,
  controls: {
    lineColor: { value: '#39ff14' },
    fillColor: { value: '#0a1f3c' },
    density: { value: 24, min: 4, max: 80, step: 1 },
    lineWidth: { value: 0.04, min: 0.005, max: 0.2, step: 0.005 },
    morphSpeed: { value: 0.5, min: 0.0, max: 3.0, step: 0.05 },
  },
  update(u, p) {
    if (typeof p.lineColor === 'string') u.uLineColor.value.set(p.lineColor)
    if (typeof p.fillColor === 'string') u.uFillColor.value.set(p.fillColor)
    if (typeof p.density === 'number') u.uDensity.value = p.density
    if (typeof p.lineWidth === 'number') u.uLineWidth.value = p.lineWidth
    if (typeof p.morphSpeed === 'number') u.uMorphSpeed.value = p.morphSpeed
  },
  doubleSide: true,
}