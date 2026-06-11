import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Mesh, Vector3, Color, Group } from 'three'

export interface ElasticJiggleProps {
  /** Base material color. */
  color?: string
  /** Spring stiffness — higher reaches the target faster. */
  stiffness?: number
  /** Damping ratio — lower values overshoot more (jiggle). */
  damping?: number
  /** How far the cursor displaces the mesh in world units. */
  amplitude?: number
  /** Number of stacked meshes; each lags the previous for a trailing wobble. */
  count?: number
  /** Edge length of each cube. */
  size?: number
}

// Deterministic per-index variety: a sin-hash keeps results stable across
// renders and frames (no RNG, no wall-clock) so the layout never flickers.
function hash(i: number): number {
  const s = Math.sin(i * 127.1 + 311.7) * 43758.5453
  return s - Math.floor(s)
}

export function ElasticJiggle({
  color = '#5fa8ff',
  stiffness = 120,
  damping = 6,
  amplitude = 1.2,
  count = 5,
  size = 1,
}: ElasticJiggleProps) {
  const group = useRef<Group>(null)
  const meshes = useRef<(Mesh | null)[]>([])

  // Per-mesh spring state. Position is the current offset, velocity drives the
  // overshoot. Separate target per mesh lets each one lag behind the cursor.
  const pos = useRef<Vector3[]>(
    Array.from({ length: count }, () => new Vector3())
  )
  const vel = useRef<Vector3[]>(
    Array.from({ length: count }, () => new Vector3())
  )
  const target = useRef<Vector3[]>(
    Array.from({ length: count }, () => new Vector3())
  )

  const pointer = useThree((s) => s.pointer)

  useFrame((_, delta) => {
    // Clamp dt so a dropped frame can't blow up the explicit integrator.
    const dt = Math.min(delta, 1 / 30)

    // Cursor in normalized device space maps to a world-space target. Earlier
    // meshes track the cursor; later meshes chase the mesh ahead, creating a
    // soft trailing chain.
    const cx = pointer.x * amplitude
    const cy = pointer.y * amplitude

    for (let i = 0; i < count; i++) {
      const tgt = target.current[i]
      if (i === 0) {
        tgt.set(cx, cy, 0)
      } else {
        // Chase the previous mesh's settled position for the chain effect.
        tgt.copy(pos.current[i - 1])
      }

      const p = pos.current[i]
      const v = vel.current[i]

      // Critically-damped-style spring: a = k*(target-p) - c*v. Lowering c
      // below the critical ratio makes the mass overshoot and bounce back —
      // the elastic jiggle. Per-index jitter varies each mesh's feel slightly.
      const k = stiffness * (0.85 + hash(i) * 0.3)
      const c = damping

      v.x += (k * (tgt.x - p.x) - c * v.x) * dt
      v.y += (k * (tgt.y - p.y) - c * v.y) * dt
      v.z += (k * (tgt.z - p.z) - c * v.z) * dt

      p.x += v.x * dt
      p.y += v.y * dt
      p.z += v.z * dt

      const m = meshes.current[i]
      if (m) {
        m.position.copy(p)
        // Stack along z and shrink trailing meshes for depth.
        m.position.z -= i * size * 0.6
        const s = size * (1 - i * 0.12)
        m.scale.setScalar(s > 0.1 ? s : 0.1)
        // Velocity-driven squash exaggerates the springy motion.
        const speed = Math.min(v.length() * 0.08, 0.4)
        m.scale.x *= 1 + speed
        m.scale.y *= 1 - speed * 0.5
      }
    }
  })

  const base = new Color(color)

  return (
    <group ref={group}>
      {Array.from({ length: count }).map((_, i) => {
        // Shift hue subtly per mesh so the trail reads as distinct layers.
        const col = base.clone().offsetHSL(hash(i) * 0.08 - 0.04, 0, 0)
        return (
          <mesh
            key={i}
            ref={(el) => {
              meshes.current[i] = el
            }}
          >
            <boxGeometry args={[size, size, size]} />
            <meshStandardMaterial
              color={col}
              roughness={0.35}
              metalness={0.15}
              transparent
              opacity={1 - i * 0.12}
            />
          </mesh>
        )
      })}
    </group>
  )
}