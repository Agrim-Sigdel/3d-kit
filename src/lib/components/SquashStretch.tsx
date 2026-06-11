import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Group, Mesh } from 'three'

export interface SquashStretchProps {
  /** Base tint of the bouncing spheres. */
  color?: string
  /** Bounce cycles per second (drives the time phase). */
  speed?: number
  /** Number of spheres laid out along X. */
  count?: number
  /** Radius of each sphere's source geometry. */
  size?: number
  /** Peak hop height in world units. */
  bounceHeight?: number
  /** Max squash/stretch deformation (0 = rigid, 0.5 = strong). */
  intensity?: number
}

// Deterministic per-index hash. Using sin avoids any RNG/clock dependency so
// renders stay reproducible and SSR-stable while still looking varied.
function hash(i: number): number {
  const s = Math.sin(i * 12.9898) * 43758.5453
  return s - Math.floor(s)
}

export function SquashStretch({
  color = '#5fa8ff',
  speed = 1,
  count = 5,
  size = 0.6,
  bounceHeight = 1.4,
  intensity = 0.35,
}: SquashStretchProps) {
  const group = useRef<Group>(null)
  // Refs are stored once; useFrame mutates transforms directly (never setState).
  const meshes = useRef<(Mesh | null)[]>([])

  // Per-sphere static layout + phase. Memoized so it survives re-renders and
  // the array length tracks `count`.
  const items = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const h = hash(i)
        return {
          // Centered row along X.
          x: (i - (count - 1) / 2) * (size * 2.6),
          // Phase offset staggers the bounces; hash keeps it deterministic.
          phase: h * Math.PI * 2.0,
          // Slight per-sphere speed variance for a livelier group.
          rate: 0.85 + h * 0.4,
        }
      }),
    [count, size],
  )

  useFrame((state) => {
    const t = state.clock.elapsedTime * speed
    for (let i = 0; i < items.length; i++) {
      const m = meshes.current[i]
      if (!m) continue
      const it = items[i]

      // abs(sin) gives a ground-contact bounce (never dips below the floor).
      const wave = Math.abs(Math.sin(t * it.rate + it.phase))
      m.position.y = wave * bounceHeight

      // Squash on contact (wave near 0), stretch at apex (wave near 1).
      // Volume is roughly preserved: Y scales up, X/Z compensate by sqrt.
      const stretch = 1.0 + (wave - 0.5) * 2.0 * intensity
      const lateral = 1.0 / Math.sqrt(stretch)
      m.scale.set(lateral, stretch, lateral)
    }
  })

  return (
    <group ref={group}>
      {items.map((it, i) => (
        <mesh
          key={i}
          ref={(el) => {
            meshes.current[i] = el
          }}
          position={[it.x, 0, 0]}
        >
          {/* Enough segments to keep the silhouette smooth under deformation. */}
          <sphereGeometry args={[size, 32, 24]} />
          <meshStandardMaterial color={color} roughness={0.35} metalness={0.1} />
        </mesh>
      ))}
    </group>
  )
}