import { Color } from 'three'
import { type SurfaceMaterial } from './types'
import { snoise2D, fresnel } from '../shaders/chunks'

// Frosted glass: a translucent panel whose visible color is gathered by sampling
// a procedural noise field at jittered offsets — emulating the multi-tap blur a
// real frosted surface produces. The noise also wobbles the sample center to read
// as light bending through the imperfect glass (cheap fake refraction).
export const frostedGlass: SurfaceMaterial = {
  id: 'frosted-glass',
  name: 'Frosted Glass',
  // VARIANT uniforms only — uTime/uMouse/uScroll/uResolution are family-injected.
  uniforms: {
    uTint: { value: new Color('#cfe6ff') },
    uHighlight: { value: new Color('#ffffff') },
    uFrost: { value: 1.6 },
    uRefract: { value: 0.18 },
    uOpacity: { value: 0.55 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
  `,
  fragmentShader: `${snoise2D}\n${fresnel}\n
    uniform vec3 uTint;
    uniform vec3 uHighlight;
    uniform float uFrost;     // blur tap spread, in uv units
    uniform float uRefract;   // strength of noise-driven uv wobble
    uniform float uOpacity;   // base panel opacity
    varying vec2 vUv;

    // Single frost sample: low-frequency noise gives the smoky density variation
    // that makes the glass look unevenly ground.
    float frostSample(vec2 uv){
      return o3s_snoise(uv * 4.0 + uTime * 0.05) * 0.5 + 0.5;
    }

    void main(){
      // Refraction wobble: displace the read position by a slow noise gradient so
      // the frost pattern appears to swim as if seen through bent glass. Mouse adds
      // a parallax-like push so the panel feels reactive.
      vec2 wob = vec2(
        o3s_snoise(vUv * 3.0 + uTime * 0.07),
        o3s_snoise(vUv * 3.0 - uTime * 0.06 + 11.3)
      );
      vec2 uv = vUv + wob * uRefract * 0.05 + uMouse * uRefract * 0.02;

      // Fixed 5-tap rosette blur. Spread scales with uFrost and is aspect-corrected
      // so the frost grain stays round regardless of panel proportions on screen.
      float aspect = max(uResolution.x / max(uResolution.y, 1.0), 1.0);
      vec2 px = vec2(uFrost * 0.01 / aspect, uFrost * 0.01);
      float acc = frostSample(uv);
      acc += frostSample(uv + vec2( px.x,  0.0));
      acc += frostSample(uv + vec2(-px.x,  0.0));
      acc += frostSample(uv + vec2( 0.0,  px.y));
      acc += frostSample(uv + vec2( 0.0, -px.y));
      float density = acc / 5.0;

      // Tint shifts toward the highlight in the brighter, less-dense frost regions —
      // mimics light scattering toward the viewer where the grind is finer.
      vec3 col = mix(uTint, uHighlight, smoothstep(0.4, 0.85, density));

      // Edge sheen: approximate normal/view from the density gradient so the rim of
      // the panel catches light like real glass thickness. Scroll lifts the edge
      // glow as the user moves down the page.
      vec3 n = normalize(vec3(dFdx(density), dFdy(density), 1.0));
      vec3 v = vec3(0.0, 0.0, 1.0);
      float rim = o3s_fresnel(n, v, 3.0);
      col += uHighlight * rim * (0.25 + uScroll * 0.35);

      // Denser frost is more opaque; the rim stays solid so edges read crisp.
      float alpha = clamp(uOpacity + density * 0.25 + rim * 0.3, 0.0, 1.0);
      gl_FragColor = vec4(col, alpha);
    }
  `,
  controls: {
    tint: { value: '#cfe6ff' },
    highlight: { value: '#ffffff' },
    frost: { value: 1.6, min: 0.2, max: 5.0, step: 0.1 },
    refract: { value: 0.18, min: 0.0, max: 1.0, step: 0.01 },
    opacity: { value: 0.55, min: 0.0, max: 1.0, step: 0.01 },
  },
  docs: {
    tint: 'Base panel color in the denser frost regions',
    highlight: 'Color the frost shifts toward in brighter regions and along the rim sheen',
    frost: 'Spread of the 5-tap blur rosette, wider taps read as coarser grinding',
    refract: 'Strength of the noise-driven UV wobble that makes the frost swim like bent glass',
    opacity: 'Base panel opacity before frost density and rim glow add to it',
  },
  update(u, p) {
    if (typeof p.tint === 'string') (u.uTint.value as Color).set(p.tint)
    if (typeof p.highlight === 'string') (u.uHighlight.value as Color).set(p.highlight)
    if (typeof p.frost === 'number') u.uFrost.value = p.frost
    if (typeof p.refract === 'number') u.uRefract.value = p.refract
    if (typeof p.opacity === 'number') u.uOpacity.value = p.opacity
  },
  transparent: true,
}
