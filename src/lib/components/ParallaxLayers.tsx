import { useRef, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Group, Color } from 'three'

export interface ParallaxLayersProps {
  /** Base tint; each layer is darkened by depth for atmospheric falloff. */
  color?: string
  /** Cursor-follow lerp rate. Higher = snappier parallax. */
  speed?: number
  /** Number of depth layers (clamped to a sane range). */
  layers?: number
  /** Quads per layer; more = denser scene. */
  density?: number
  /** Horizontal parallax travel of the nearest layer, in world units. */
  spread?: number
}

// Deterministic sin-hash: cheap pseudo-random in [0,1) keyed by an integer.
// Used instead of an RNG so layouts are stable across renders/reloads.
function hash(n: number): number {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return s - Math.floor(s)
}

export function ParallaxLayers({
  color = '#5fa8ff',
  speed = 2,
  layers = 5,
  density = 14,
  spread = 1.4,
}: ParallaxLayersProps) {
  // A layer renders far behind the camera plane (z negative) and the deeper
  // it sits the smaller its parallax response — that depth cue is the effect.
  const layerCount = Math.max(2, Math.min(6, Math.round(layers)))

  const root = useRef<Group>(null)
  // Per-layer group refs so we can offset each independently in useFrame.
  const layerRefs = useRef<(Group | null)[]>([])

  // Precompute static placement once. Geometry/positions never change, only
  // the per-layer group offset does, which keeps the frame loop allocation-free.
  const built = useMemo(() => {
    const base = new Color(color)
    return Array.from({ length: layerCount }, (_, li) => {
      // Normalized depth 0 (front) .. 1 (back).
      const depth = li / (layerCount - 1)
      // Darken with depth to fake aerial perspective.
      const tint = base.clone().multiplyScalar(1.0 - depth * 0.55)
      const z = -depth * 6.0 - 1.0
      // Front layers parallax most; scale by (1 - depth).
      const parallax = spread * (1.0 - depth * 0.8)
      // Back layers slightly larger/fainter quads to read as distant.
      const scale = 0.35 + depth * 0.9

      const quads = Array.from({ length: density }, (_, qi) => {
        const seed = li * 97.0 + qi * 13.0
        // Spread quads across a wide plane; deeper layers cover more area.
        const x = (hash(seed) - 0.5) * 16.0 * (0.6 + depth)
        const y = (hash(seed + 1.0) - 0.5) * 9.0 * (0.6 + depth)
        const s = scale * (0.6 + hash(seed + 2.0) * 0.8)
        // Static z-roll so identical quads don't visually overlap as one sprite.
        const roll = hash(seed + 3.0) * Math.PI
        return { x, y, s, roll, key: qi }
      })

      return { li, z, parallax, color: `#${tint.getHexString()}`, quads }
    })
  }, [color, layerCount, density, spread])

  const { pointer } = useThree()
  // Smoothed cursor target so motion eases rather than snapping to raw pointer.
  const smooth = useRef({ x: 0, y: 0 })

  useFrame((_, delta) => {
    // Frame-rate independent damping toward the current pointer position.
    const k = 1.0 - Math.exp(-speed * delta)
    smooth.current.x += (pointer.x - smooth.current.x) * k
    smooth.current.y += (pointer.y - smooth.current.y) * k

    for (let i = 0; i < built.length; i++) {
      const g = layerRefs.current[i]
      if (!g) continue
      const p = built[i].parallax
      // Counter-move layers against the cursor for the 2.5D shift.
      g.position.x = -smooth.current.x * p
      g.position.y = -smooth.current.y * p
    }

    // Subtle whole-scene tilt reinforces the depth without a full camera rig.
    if (root.current) {
      root.current.rotation.y = smooth.current.x * 0.05
      root.current.rotation.x = -smooth.current.y * 0.05
    }
  })

  return (
    <group ref={root}>
      {built.map((layer) => (
        <group
          key={layer.li}
          ref={(el) => {
            layerRefs.current[layer.li] = el
          }}
          position={[0, 0, layer.z]}
        >
          {layer.quads.map((q) => (
            <mesh key={q.key} position={[q.x, q.y, 0]} rotation={[0, 0, q.roll]}>
              <planeGeometry args={[q.s, q.s]} />
              <meshStandardMaterial
                color={layer.color}
                transparent
                opacity={0.85}
                roughness={0.9}
                metalness={0.0}
              />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  )
}