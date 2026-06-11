import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Group, Color, MathUtils } from 'three'

export interface CameraFlythroughProps {
  /** Number of gates streaming toward the camera. */
  count?: number
  /** Forward travel speed in world units per second. */
  speed?: number
  /** Base color of the gate rings; per-gate hue is offset deterministically. */
  color?: string
  /** Outer radius of each ring. */
  radius?: number
  /** Spacing between consecutive gates along Z. */
  spacing?: number
}

// Deterministic per-index pseudo-random in [0,1). Avoids RNG/time so SSR and
// hot-reload stay stable, and every client renders the identical layout.
function hash(i: number): number {
  const s = Math.sin(i * 127.1 + 311.7) * 43758.5453
  return s - Math.floor(s)
}

export function CameraFlythrough({
  count = 8,
  speed = 6,
  color = '#5fa8ff',
  radius = 2.2,
  spacing = 7,
}: CameraFlythroughProps) {
  const group = useRef<Group>(null)
  const pointer = useThree((s) => s.pointer)

  // Total loop depth: once a gate passes the camera it wraps to the back.
  const depth = count * spacing
  // Spawn far ahead (negative Z) so gates approach the camera at z=0.
  const far = -depth

  const base = new Color(color)

  useFrame((_, delta) => {
    const g = group.current
    if (!g) return

    // Subtle parallax: lean the whole tunnel toward the pointer rather than
    // moving the camera, keeping this usable as a plain <Canvas> child.
    g.rotation.x = MathUtils.lerp(g.rotation.x, -pointer.y * 0.12, 0.05)
    g.rotation.y = MathUtils.lerp(g.rotation.y, pointer.x * 0.12, 0.05)

    for (const child of g.children) {
      // March each gate forward; wrap with modulo so the stream is endless.
      let z = child.position.z + delta * speed
      if (z > spacing) z -= depth
      child.position.z = z

      // Gates closest to the camera spin a touch faster for depth cueing.
      child.rotation.z += delta * 0.2

      // Fade in from the distance and out as it whips past the lens.
      const t = (z - far) / depth
      const fade = Math.sin(t * Math.PI)
      child.scale.setScalar(0.6 + fade * 0.6)
    }
  })

  return (
    <group ref={group}>
      {Array.from({ length: count }, (_, i) => {
        const z = far + i * spacing
        // Stagger gates off the center axis and tint each one slightly.
        const offX = (hash(i) - 0.5) * radius * 0.8
        const offY = (hash(i + 53) - 0.5) * radius * 0.8
        const hueShift = (hash(i + 91) - 0.5) * 0.18
        const tint = base.clone().offsetHSL(hueShift, 0, 0)
        return (
          <mesh key={i} position={[offX, offY, z]}>
            <torusGeometry args={[radius, 0.12, 12, 48]} />
            <meshStandardMaterial
              color={tint}
              emissive={tint}
              emissiveIntensity={0.6}
              metalness={0.4}
              roughness={0.3}
            />
          </mesh>
        )
      })}
    </group>
  )
}
