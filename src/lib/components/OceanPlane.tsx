import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { ShaderMaterial, Color, PlaneGeometry } from 'three'

export interface OceanPlaneProps {
  /** Base water color. */
  color?: string
  /** Crest highlight color blended in at wave peaks. */
  crestColor?: string
  /** Plane edge length in world units (square). */
  size?: number
  /** Vertex resolution per side; higher = smoother crests, costlier. */
  segments?: number
  /** Global time multiplier for wave motion. */
  speed?: number
  /** Number of summed Gerstner-ish wave octaves (clamped 1..6). */
  waveCount?: number
}

// Gerstner waves are normally horizontal-displacing; we approximate the visual
// with stacked directional sines on Y plus analytic normals derived from the
// same partial derivatives, which is cheap and avoids per-frame CPU work.
const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform int uWaveCount;
  varying vec3 vWorldNormal;
  varying float vCrest;

  // Deterministic per-octave variety via a sin-hash of the octave index, so
  // directions/frequencies are stable across frames and platforms (no RNG).
  vec2 hashDir(float i){
    float a = fract(sin(i * 12.9898) * 43758.5453) * 6.2831853;
    return vec2(cos(a), sin(a));
  }

  void main(){
    vec3 pos = position;
    // Accumulate height and its gradient to build a consistent normal.
    float h = 0.0;
    vec2 grad = vec2(0.0);
    for(int i = 0; i < 6; i++){
      if(i >= uWaveCount) break;
      float fi = float(i);
      vec2 dir = hashDir(fi);
      // Higher octaves: shorter wavelength, lower amplitude, faster phase.
      float freq = 0.6 + fi * 0.7;
      float amp = 0.35 / (1.0 + fi * 0.9);
      float speed = 1.0 + fi * 0.35;
      float phase = dot(dir, pos.xz) * freq + uTime * speed;
      h += sin(phase) * amp;
      // d/dx and d/dz of the height term for the analytic normal.
      grad += dir * cos(phase) * amp * freq;
    }
    pos.y += h;
    vCrest = clamp(h * 1.5 + 0.5, 0.0, 1.0);

    // Surface normal from the height gradient (tangent-space cross product).
    vec3 n = normalize(vec3(-grad.x, 1.0, -grad.y));
    vWorldNormal = normalize(mat3(modelMatrix) * n);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uCrestColor;
  varying vec3 vWorldNormal;
  varying float vCrest;

  void main(){
    // Simple hemispheric-ish diffuse from a fixed key light keeps it readable
    // without depending on scene lights (raw ShaderMaterial ignores them).
    vec3 lightDir = normalize(vec3(0.4, 0.9, 0.3));
    float diff = clamp(dot(normalize(vWorldNormal), lightDir), 0.0, 1.0);
    float ambient = 0.35;
    vec3 base = mix(uColor, uCrestColor, vCrest);
    vec3 col = base * (ambient + diff * 0.85);
    gl_FragColor = vec4(col, 1.0);
  }
`

export function OceanPlane({
  color = '#1b6ea5',
  crestColor = '#bfe6ff',
  size = 20,
  segments = 128,
  speed = 1,
  waveCount = 4,
}: OceanPlaneProps) {
  const mat = useRef<ShaderMaterial>(null)

  // Geometry and uniforms are memoized so resizing props rebuilds them but the
  // per-frame loop only mutates uTime, never reallocates.
  const geometry = useMemo(() => new PlaneGeometry(size, size, segments, segments), [size, segments])

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uWaveCount: { value: Math.max(1, Math.min(6, Math.floor(waveCount))) },
      uColor: { value: new Color(color) },
      uCrestColor: { value: new Color(crestColor) },
    }),
    [],
  )

  // Keep color/count uniforms in sync when props change between renders.
  uniforms.uColor.value.set(color)
  uniforms.uCrestColor.value.set(crestColor)
  uniforms.uWaveCount.value = Math.max(1, Math.min(6, Math.floor(waveCount)))

  useFrame((_, delta) => {
    if (mat.current) {
      mat.current.uniforms.uTime.value += delta * speed
    }
  })

  return (
    <mesh geometry={geometry} rotation-x={-Math.PI / 2}>
      <shaderMaterial
        ref={mat}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
      />
    </mesh>
  )
}