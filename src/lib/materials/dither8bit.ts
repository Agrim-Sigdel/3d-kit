import { Color } from 'three'
import { type SurfaceMaterial } from './types'
import { hsv2rgb } from '../shaders/chunks'

// Ordered-dither / Bayer posterizer. The retro look comes from quantizing a
// smooth gradient into a tiny palette of brightness levels, then using a 4x4
// Bayer threshold map to spatially diffuse the quantization error so that
// gradients read as stippled steps rather than hard bands.
export const dither8bit: SurfaceMaterial = {
  id: 'dither8bit',
  name: 'Dither 8-bit',
  // VARIANT uniforms only — family injects uTime/uMouse/uScroll/uResolution.
  uniforms: {
    uDark: { value: new Color('#0b1d3a') },
    uLight: { value: new Color('#7fe3ff') },
    uLevels: { value: 4.0 },
    uPixel: { value: 96.0 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
  `,
  // hsv2rgb chunk is interpolated so we can add a subtle animated hue drift on
  // the light tone without exposing it as a control (keeps the palette retro).
  fragmentShader: `${hsv2rgb}
    precision highp float;
    varying vec2 vUv;
    uniform vec3 uDark;
    uniform vec3 uLight;
    uniform float uLevels;
    uniform float uPixel;

    // Classic 4x4 ordered Bayer matrix, normalized to [0,1). Indexed by the
    // fragment's position within its logical pixel cell.
    float o3s_bayer(vec2 p){
      int x = int(mod(p.x, 4.0));
      int y = int(mod(p.y, 4.0));
      int i = x + y * 4;
      float m[16];
      m[0]=0.0;  m[1]=8.0;  m[2]=2.0;  m[3]=10.0;
      m[4]=12.0; m[5]=4.0;  m[6]=14.0; m[7]=6.0;
      m[8]=3.0;  m[9]=11.0; m[10]=1.0; m[11]=9.0;
      m[12]=15.0;m[13]=7.0; m[14]=13.0;m[15]=5.0;
      float v = 0.0;
      // GLSL ES forbids dynamic array indexing in some profiles, so resolve by scan.
      for(int k=0;k<16;k++){ if(k==i) v = m[k]; }
      return (v + 0.5) / 16.0;
    }

    void main(){
      // Snap UVs to a coarse pixel grid for the chunky low-res feel; mouse adds
      // a small parallax tilt so the panel feels reactive.
      vec2 grid = floor(vUv * uPixel + uMouse * 4.0);
      vec2 cell = grid / uPixel;

      // Diagonal scroll-driven gradient is the raw signal we posterize.
      float g = dot(cell, vec2(0.6, 0.4)) + uScroll * 0.5 + sin(uTime * 0.3) * 0.1;
      g = fract(g);

      // Ordered dithering: bias the value by the Bayer threshold before
      // quantizing so neighbouring cells alternate between adjacent levels.
      float threshold = o3s_bayer(grid);
      float steps = max(uLevels, 1.0);
      float q = floor(g * steps + threshold) / steps;
      q = clamp(q, 0.0, 1.0);

      // Animate the light tone's hue slightly for a CRT-phosphor shimmer.
      vec3 lightHsv = vec3(fract(uTime * 0.02) * 0.05 + 0.55, 0.4, 1.0);
      vec3 light = uLight * o3s_hsv2rgb(lightHsv);

      vec3 col = mix(uDark, light, q);
      gl_FragColor = vec4(col, 1.0);
    }
  `,
  controls: {
    dark: { value: '#0b1d3a' },
    light: { value: '#7fe3ff' },
    levels: { value: 4, min: 2, max: 12, step: 1 },
    pixel: { value: 96, min: 16, max: 256, step: 1 },
  },
  docs: {
    dark: 'Palette endpoint for the lowest quantized levels',
    light: 'Palette endpoint for the brightest levels, with a slow built-in hue shimmer',
    levels: 'Number of brightness steps the gradient is posterized into',
    pixel: 'Logical pixel-grid resolution, lower gives chunkier retro blocks',
  },
  update(u, p) {
    if (typeof p.dark === 'string') (u.uDark.value as Color).set(p.dark)
    if (typeof p.light === 'string') (u.uLight.value as Color).set(p.light)
    if (typeof p.levels === 'number') u.uLevels.value = p.levels
    if (typeof p.pixel === 'number') u.uPixel.value = p.pixel
  },
}
