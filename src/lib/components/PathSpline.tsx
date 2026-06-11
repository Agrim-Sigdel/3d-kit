import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Color, Group, Mesh, Vector3 } from 'three'

export interface PathSplineProps {
  /** Base mesh color; trail ghosts inherit and fade this. */
  color?: string
  /** Path traversal speed (cycles scale with this). */
  speed?: number
  /** Leading mesh radius; ghosts scale down from here. */
  size?: number
  /** Number of trailing ghost copies. */
  ghostCount?: number
  /** Lissajous angular frequencies (x, y, z). Non-integer ratios avoid a static path. */
  frequencies?: [number, number, number]
}

// Sample a 3D lissajous curve. Constant phase offsets on each axis open the
// figure into a genuine 3D loop instead of a flat planar one.
function lissajous(t: number, fx: number, fy: number, fz: number, out: Vector3): Vector3 {
  out.set(
    Math.sin(t * fx) * 3.0,
    Math.sin(t * fy + 1.5708) * 2.0,
    Math.sin(t * fz + 0.7854) * 3.0
  )
  return out
}

export function PathSpline({
  color = '#5fa8ff',
  speed = 1.0,
  size = 0.35,
  ghostCount = 12,
  frequencies = [2.0, 3.0, 4.0],
}: PathSplineProps) {
  const group = useRef<Group>(null)
  const lead = useRef<Mesh>(null)
  const ghosts = useRef<Array<Mesh | null>>([])
  const pointer = useThree((s) => s.pointer)

  const [fx, fy, fz] = frequencies

  // Per-ghost static parameters: fractional time lag along the path and a
  // deterministic sin-hash jitter so equally-spaced ghosts still read distinct.
  const ghostParams = useMemo(() => {
    return Array.from({ length: ghostCount }, (_, i) => {
      // sin-hash of the index -> stable pseudo-random in [0,1)
      const h = Math.sin(i * 12.9898 + 78.233) * 43758.5453
      const hash = h - Math.floor(h)
      const lag = (i + 1) / (ghostCount + 1) // even spread behind the leader
      return { lag, hash }
    })
  }, [ghostCount])

  // Reusable scratch vectors keep the frame loop allocation-free.
  const scratch = useMemo(() => new Vector3(), [])
  const base = useMemo(() => new Color(color), [color])

  useFrame((state) => {
    const t = state.clock.elapsedTime * speed
    // The full loop period is 2*PI scaled by the largest frequency factor; we
    // simply advance phase and let the trail lag in phase units.
    const trailGap = 0.18

    if (lead.current) {
      lissajous(t, fx, fy, fz, scratch)
      lead.current.position.copy(scratch)
    }

    for (let i = 0; i < ghostParams.length; i++) {
      const g = ghosts.current[i]
      if (!g) continue
      const { lag, hash } = ghostParams[i]
      // Sample the path slightly in the past so ghosts trace where the lead was.
      const gt = t - (i + 1) * trailGap
      lissajous(gt, fx, fy, fz, scratch)
      g.position.copy(scratch)
      // Shrink and fade with distance back through the trail.
      const k = 1.0 - lag
      const s = size * (0.3 + 0.7 * k) * (0.85 + 0.3 * hash)
      g.scale.setScalar(s)
    }

    // Subtle parallax: pointer nudges the whole figure so it feels reactive
    // without hijacking the autonomous motion.
    if (group.current) {
      group.current.rotation.y += (pointer.x * 0.4 - group.current.rotation.y) * 0.05
      group.current.rotation.x += (pointer.y * 0.3 - group.current.rotation.x) * 0.05
    }
  })

  return (
    <group ref={group}>
      <mesh ref={lead}>
        <sphereGeometry args={[size, 24, 24]} />
        <meshStandardMaterial color={base} emissive={base} emissiveIntensity={0.6} roughness={0.3} />
      </mesh>
      {ghostParams.map((p, i) => (
        <mesh
          key={i}
          ref={(m) => {
            ghosts.current[i] = m
          }}
        >
          <sphereGeometry args={[1.0, 16, 16]} />
          {/* Ghosts are translucent and dimmer the further back they trail. */}
          <meshStandardMaterial
            color={base}
            emissive={base}
            emissiveIntensity={0.25}
            transparent
            opacity={0.5 * (1.0 - p.lag)}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  )
}