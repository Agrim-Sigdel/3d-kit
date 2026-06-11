import { useRef, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Group, Mesh, Color } from 'three'

export interface ExplodedViewProps {
  /** Base tint; each layer derives a slight hue offset from this. */
  color?: string
  /** Drives the explode oscillation rate. */
  speed?: number
  /** Number of stacked parts. Clamped to a sane range. */
  count?: number
  /** Max vertical separation each part reaches when fully exploded. */
  spread?: number
  /** Footprint of each slab (X, Z). Thickness is derived from spread/count. */
  size?: number
}

// Deterministic per-index pseudo-variety. A plain sin-hash keeps the layout
// stable across reloads (no RNG, no clock) while still feeling non-uniform.
function hash(i: number): number {
  const s = Math.sin(i * 12.9898) * 43758.5453
  return s - Math.floor(s)
}

export function ExplodedView({
  color = '#5fa8ff',
  speed = 1,
  count = 6,
  spread = 3,
  size = 2,
}: ExplodedViewProps) {
  // Guard against degenerate prop values that would break the layout math.
  const n = Math.max(2, Math.min(12, Math.floor(count)))
  const thickness = (spread / n) * 0.6

  const group = useRef<Group>(null)
  const parts = useRef<Array<Mesh | null>>([])

  // Precompute static per-part data so useFrame stays allocation-free.
  const layers = useMemo(() => {
    const base = new Color(color)
    return Array.from({ length: n }, (_, i) => {
      const t = i / (n - 1)
      // Stacked at rest, centred on origin.
      const restY = (t - 0.5) * thickness * n
      // Hue drift gives the stack visible depth without extra props.
      const c = base.clone().offsetHSL((hash(i) - 0.5) * 0.08, 0, (t - 0.5) * 0.15)
      // Phase offset so parts don't all peak simultaneously.
      const phase = hash(i + 7) * Math.PI * 2
      return { restY, color: c, phase, dir: i < n / 2 ? -1 : 1 }
    })
  }, [n, thickness, color])

  const pointer = useThree((s) => s.pointer)

  useFrame((state, delta) => {
    const time = state.clock.elapsedTime
    // 0..1 explode factor; smooth ease via cosine so it dwells at the extremes.
    const e = (1 - Math.cos(time * speed * 0.6)) * 0.5

    for (let i = 0; i < layers.length; i++) {
      const mesh = parts.current[i]
      if (!mesh) continue
      const l = layers[i]
      // Outer parts travel farther than inner ones for a fanned-out look.
      const reach = spread * Math.abs(l.dir) * (0.4 + Math.abs((i / (layers.length - 1)) - 0.5))
      mesh.position.y = l.restY + l.dir * reach * e + Math.sin(time * speed + l.phase) * 0.04
      // Subtle yaw that scales with explosion so a collapsed stack sits flat.
      mesh.rotation.y = e * (hash(i) - 0.5) * 0.5
    }

    // Gentle pointer-driven tilt for parallax; eased toward target each frame.
    if (group.current) {
      const tx = pointer.y * 0.2
      const ty = pointer.x * 0.3
      group.current.rotation.x += (tx - group.current.rotation.x) * Math.min(1, delta * 4)
      group.current.rotation.y += (ty - group.current.rotation.y) * Math.min(1, delta * 4)
    }
  })

  return (
    <group ref={group}>
      {layers.map((l, i) => (
        <mesh
          key={i}
          ref={(m) => {
            parts.current[i] = m
          }}
        >
          <boxGeometry args={[size, thickness, size]} />
          <meshStandardMaterial color={l.color} metalness={0.2} roughness={0.6} />
        </mesh>
      ))}
    </group>
  )
}
