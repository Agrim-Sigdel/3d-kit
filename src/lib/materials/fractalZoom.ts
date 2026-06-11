import { Color } from 'three'
import { type SurfaceMaterial } from './types'
import { hsv2rgb } from '../shaders/chunks'

// Escape-time fractal rendered in the fragment shader. We march the standard
// z -> z^2 + c iteration in screen space; uMouse pans the complex-plane center
// so the cursor explores the set, while uTime drives a slow zoom + Julia morph.
// hsv2rgb maps the smooth (continuous) iteration count to a cyclic palette so
// the banding stays gradient-free even at high iteration counts.

export const fractalZoom: SurfaceMaterial = {
  id: 'fractal-zoom', name: 'Fractal Zoom',
  uniforms: {
    uIterations: { value: 96.0 },
    uZoomSpeed: { value: 0.18 },
    uJulia: { value: 0.0 },
    uInside: { value: new Color('#05060f') },
    uPalette: { value: new Color('#3fa9ff') },
  },
  vertexShader: `
    varying vec2 vUv;
    void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
  `,
  fragmentShader: `${hsv2rgb}
    uniform float uIterations;
    uniform float uZoomSpeed;
    uniform float uJulia;
    uniform vec3  uInside;
    uniform vec3  uPalette;
    varying vec2 vUv;

    void main(){
      // Aspect-correct, recenter UVs to [-0.5,0.5] so the fractal stays round.
      float aspect = uResolution.x / max(uResolution.y, 1.0);
      vec2 p = (vUv - 0.5);
      p.x *= aspect;

      // Exponential zoom keeps detail density constant as we dive inward.
      float zoom = exp(-uTime * uZoomSpeed);
      // Cursor pans the viewport center across the complex plane.
      vec2 center = vec2(-0.745, 0.115) + uMouse * 0.6 * zoom;
      vec2 uvc = p * 3.0 * zoom + center;

      // Mandelbrot uses c = pixel, z0 = 0. Julia uses fixed c, z0 = pixel.
      // uJulia (0..1) blends the seed so the control morphs between the two.
      vec2 jc = vec2(-0.8, 0.156);
      vec2 c = mix(uvc, jc, uJulia);
      vec2 z = mix(vec2(0.0), uvc, uJulia);

      float maxIter = uIterations;
      float iter = 0.0;
      // Bailout radius 4.0 (squared) gives accurate smooth-iteration coloring.
      for (float i = 0.0; i < 512.0; i += 1.0){
        if (i >= maxIter) break;
        z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
        if (dot(z, z) > 16.0) break;
        iter += 1.0;
      }

      if (iter >= maxIter){
        // Interior never escapes: flat tint avoids a noisy black hole.
        gl_FragColor = vec4(uInside, 1.0);
        return;
      }

      // Continuous (fractional) iteration count removes integer banding.
      float smoothIter = iter + 1.0 - log(log(max(length(z), 1.0001))) / log(2.0);
      float t = smoothIter / maxIter;

      // Drive hue around the wheel; palette uniform sets the base hue offset and
      // overall saturation/brightness so the control actually shifts the look.
      float hue = fract(uPalette.r + t * 3.0 + uScroll * 0.5);
      vec3 col = o3s_hsv2rgb(vec3(hue, 0.55 + 0.45 * uPalette.g, 0.4 + 0.6 * uPalette.b));
      col *= sqrt(t);

      gl_FragColor = vec4(col, 1.0);
    }
  `,
  controls: {
    iterations: { value: 96, min: 16, max: 512, step: 1 },
    zoomSpeed: { value: 0.18, min: 0.0, max: 1.0, step: 0.01 },
    julia: { value: 0.0, min: 0.0, max: 1.0, step: 0.01 },
    inside: { value: '#05060f' },
    palette: { value: '#3fa9ff' },
  },
  docs: {
    iterations: 'Maximum escape-time iterations, higher resolves finer boundary detail at more cost',
    zoomSpeed: 'Rate of the exponential dive into the fractal over time',
    julia: 'Blends the seed from Mandelbrot at 0 to a fixed-c Julia set at 1',
    inside: 'Flat tint for interior points that never escape',
    palette: 'Color whose channels set the base hue offset, saturation and brightness of the escape coloring',
  },
  update(u, p){
    if (typeof p.iterations === 'number') u.uIterations.value = p.iterations
    if (typeof p.zoomSpeed === 'number') u.uZoomSpeed.value = p.zoomSpeed
    if (typeof p.julia === 'number') u.uJulia.value = p.julia
    if (typeof p.inside === 'string') (u.uInside.value as Color).set(p.inside)
    if (typeof p.palette === 'string') (u.uPalette.value as Color).set(p.palette)
  },
}
