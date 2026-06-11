import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Group, Mesh, Vector3 } from 'three'

export interface MagneticGroupProps {
  /** Base hue color shared by all meshes. */
  color?: string
  /** Global animation/return-spring speed multiplier. */
  speed?: number
  /** Number of magnetic meshes. */
  count?: number
  /** Base radius of each sphere; per-mesh size varies deterministically. */
  size?: number
  /** Spread radius of the rest-position ring on the XY plane. */
  spread?: number
  /** How strongly meshes are pulled toward the cursor (world units). */
  strength?: number
}

// Deterministic per-index pseudo-random in [0,1). A sin-hash keeps layout stable
// across renders without an RNG or wall-clock, so SSR/CSR and reloads agree.
function hash(i: number, salt: number): number {
  const v = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453
  return v - Math.floor(v)
}

export function MagneticGroup({
  color = '#5fa8ff',
  speed = 1,
  count = 6,
  size = 0.35,
  spread = 3,
  strength = 1.4,
}: MagneticGroupProps) {
  const group = useRef<Group>(null)
  // Pointer is read inside useFrame so we never trigger React re-renders.
  const pointer = useThree((s) => s.pointer)
  const viewport = useThree((s) => s.viewport)

  // Precompute rest positions and per-mesh variety once. Memo keyed on the
  // layout-affecting props avoids recomputing every frame.
  const items = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2.0
      const radius = spread * (0.55 + 0.45 * hash(i, 1.0))
      return {
        rest: new Vector3(
          Math.cos(angle) * radius,
          Math.sin(angle) * radius,
          (hash(i, 2.0) - 0.5) * spread * 0.5,
        ),
        // Scale and per-mesh phase give each sphere its own feel.
        scale: size * (0.7 + 0.6 * hash(i, 3.0)),
        // Closer meshes feel "stronger"; bias attraction per index.
        pull: 0.6 + 0.8 * hash(i, 4.0),
      }
    })
  }, [count, spread, size])

  // Scratch vectors reused across frames to avoid per-frame allocations.
  const cursor = useRef(new Vector3())
  const target = useRef(new Vector3())

  useFrame((_, delta) => {
    const g = group.current
    if (!g) return

    // Map normalized pointer (-1..1) to world space on the group's Z plane.
    // viewport width/height are in world units at z=0, matching the scene.
    cursor.current.set(
      (pointer.x * viewport.width) / 2.0,
      (pointer.y * viewport.height) / 2.0,
      0.0,
    )

    // Frame-rate independent easing: convert a per-second rate into a per-frame
    // lerp factor so the spring feels identical at 30 or 144 fps.
    const ease = 1.0 - Math.pow(0.0025, delta * speed)

    for (let i = 0; i < g.children.length; i++) {
      const mesh = g.children[i] as Mesh
      const item = items[i]
      if (!item) continue

      // Attraction strength falls off with distance so far meshes barely react,
      // producing a localized "magnetic" pocket around the cursor.
      const dist = cursor.current.distanceTo(item.rest)
      const falloff = strength / (1.0 + dist * dist * 0.25)
      target.current
        .copy(item.rest)
        .lerp(cursor.current, Math.min(falloff * item.pull, 0.95))

      mesh.position.lerp(target.current, ease)
    }
  })

  return (
    <group ref={group}>
      {items.map((item, i) => (
        <mesh key={i} position={item.rest} scale={item.scale}>
          <sphereGeometry args={[1, 24, 24]} />
          <meshStandardMaterial
            color={color}
            roughness={0.35}
            metalness={0.2}
            emissive={color}
            emissiveIntensity={0.15 + 0.2 * hash(i, 5.0)}
          />
        </mesh>
      ))}
    </group>
  )
}