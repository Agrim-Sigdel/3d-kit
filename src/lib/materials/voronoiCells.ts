import { Color, Vector2 } from 'three'
import { type SurfaceMaterial } from './types'
import { snoise2D, hsv2rgb } from '../shaders/chunks'

// Voronoi cells with a cursor "spotlight": cell brightness falls off by distance
// from uMouse, so the pattern reads as lit near the cursor. Cell sites jitter via
// a deterministic hash (not RNG) so animation is reproducible across frames.
export const voronoiCells: SurfaceMaterial = {
  id: 'voronoi-cells',
  name: 'Voronoi Cells',
  // VARIANT uniforms only — uTime/uMouse/uScroll/uResolution come from the family.
  uniforms: {
    uScale: { value: 6.0 },
    uSpeed: { value: 0.6 },
    uLightRadius: { value: 0.5 },
    uCellColor: { value: new Color('#33e0ff') },
    uEdgeColor: { value: new Color('#0a0f24') },
  },
  vertexShader: `
    varying vec2 vUv;
    void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
  `,
  // snoise feeds a subtle domain warp so cell borders breathe; hsv2rgb tints the lit
  // core for a slight hue lift toward the cursor without extra color uniforms.
  fragmentShader: `${snoise2D}
${hsv2rgb}
    varying vec2 vUv;
    uniform float uScale;
    uniform float uSpeed;
    uniform float uLightRadius;
    uniform vec3 uCellColor;
    uniform vec3 uEdgeColor;

    // Deterministic 2D site offset for a cell at integer coords g.
    vec2 o3s_cellSite(vec2 g){
      float h = fract(sin(dot(g, vec2(127.1, 311.7))) * 43758.5453123);
      float k = fract(sin(dot(g, vec2(269.5, 183.3))) * 43758.5453123);
      return vec2(h, k);
    }

    void main(){
      // Warp the lattice slightly so the tessellation feels organic, not gridded.
      vec2 p = vUv * uScale + o3s_snoise(vUv * 2.0 + uTime * 0.1) * 0.35;

      vec2 cell = floor(p);
      vec2 f = fract(p);

      float minDist = 8.0;   // nearest site distance -> cell core brightness
      float secDist = 8.0;   // second-nearest -> edge detection (F2 - F1)
      vec2  hitId   = vec2(0.0);

      for (int y = -1; y <= 1; y++){
        for (int x = -1; x <= 1; x++){
          vec2 g = vec2(float(x), float(y));
          // Animate sites on a per-cell phase so motion is varied yet deterministic.
          vec2 site = o3s_cellSite(cell + g);
          vec2 anim = 0.5 + 0.5 * sin(uTime * uSpeed + 6.2831 * site);
          vec2 diff = g + anim - f;
          float d = dot(diff, diff);
          if (d < minDist){ secDist = minDist; minDist = d; hitId = cell + g; }
          else if (d < secDist){ secDist = d; }
        }
      }

      float md = sqrt(minDist);
      // Border mask from F2-F1: thin where cells meet, wide inside.
      float edge = smoothstep(0.0, 0.08, sqrt(secDist) - md);

      // Cursor light: uMouse is [-1,1], remap to UV space [0,1] then distance falloff.
      vec2 mouseUv = uMouse * 0.5 + 0.5;
      float lit = 1.0 - smoothstep(0.0, max(uLightRadius, 0.001), distance(vUv, mouseUv));

      // Per-cell hue jitter keeps lit clusters from looking flat under the cursor.
      float idHash = fract(sin(dot(hitId, vec2(12.9898, 78.233))) * 43758.5453123);
      vec3 coreTint = o3s_hsv2rgb(vec3(fract(idHash * 0.1 + 0.55), 0.4, 1.0));

      // Base color is darkened away from the cursor; lit cells gain core tint.
      vec3 col = mix(uEdgeColor, uCellColor * coreTint, edge);
      col *= mix(0.12, 1.0, lit + uScroll * 0.15);

      gl_FragColor = vec4(col, 1.0);
    }
  `,
  controls: {
    scale: { value: 6, min: 2, max: 20, step: 0.5 },
    speed: { value: 0.6, min: 0, max: 3, step: 0.05 },
    lightRadius: { value: 0.5, min: 0.05, max: 1.5, step: 0.01 },
    cellColor: { value: '#33e0ff' },
    edgeColor: { value: '#0a0f24' },
  },
  update(u, p) {
    if (typeof p.scale === 'number') u.uScale.value = p.scale
    if (typeof p.speed === 'number') u.uSpeed.value = p.speed
    if (typeof p.lightRadius === 'number') u.uLightRadius.value = p.lightRadius
    if (typeof p.cellColor === 'string') (u.uCellColor.value as Color).set(p.cellColor)
    if (typeof p.edgeColor === 'string') (u.uEdgeColor.value as Color).set(p.edgeColor)
  },
}

// Keep Vector2 referenced so strict noUnusedLocals stays satisfied if the family
// layer ever swaps to explicit Vector2 mouse seeding; harmless no-op otherwise.
void Vector2