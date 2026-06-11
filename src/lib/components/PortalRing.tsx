import { useRef, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Group, Color, Vector3, InstancedMesh, Object3D, AdditiveBlending } from 'three'

export interface PortalRingProps {
  /** Base hue of the ring/swirl/particles. */
  color?: string
  /** Global animation rate multiplier. */
  speed?: number
  /** Outer radius of the torus ring. */
  radius?: number
  /** Thickness (tube radius) of the torus ring. */
  thickness?: number
  /** Number of particles streaming toward the portal. */
  particleCount?: number
}

// Deterministic pseudo-random in [0,1) from an integer index. We use a sin-hash
// so per-particle variety is stable across renders/reloads (no RNG, no clock).
function hash(i: number): number {
  const s = Math.sin(i * 127.1 + 311.7) * 43758.5453123
  return s - Math.floor(s)
}

export function PortalRing({
  color = '#5fa8ff',
  speed = 1,
  radius = 2,
  thickness = 0.18,
  particleCount = 160,
}: PortalRingProps) {
  const group = useRef<Group>(null)
  const swirl = useRef<Group>(null)
  const particles = useRef<InstancedMesh>(null)
  const pointer = useThree((s) => s.pointer)

  const base = useMemo(() => new Color(color), [color])

  // Per-particle constants: angular position, spiral phase, inward speed and
  // size. Computed once so the loop only advances a single time scalar.
  const seeds = useMemo(() => {
    const arr = new Float32Array(particleCount * 4)
    for (let i = 0; i < particleCount; i++) {
      arr[i * 4 + 0] = hash(i) * Math.PI * 2.0 // initial angle
      arr[i * 4 + 1] = hash(i + 13.0) // phase offset along the inward cycle
      arr[i * 4 + 2] = 0.4 + hash(i + 91.0) * 0.6 // inward speed factor
      arr[i * 4 + 3] = 0.5 + hash(i + 57.0) * 0.8 // scale factor
    }
    return arr
  }, [particleCount])

  // Reused scratch object to avoid per-frame allocation when writing instances.
  const dummy = useMemo(() => new Object3D(), [])

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime * speed

    // Subtle parallax tilt toward the cursor; eased so it feels weighty.
    if (group.current) {
      group.current.rotation.x += (pointer.y * 0.25 - group.current.rotation.x) * Math.min(1, delta * 3.0)
      group.current.rotation.y += (pointer.x * 0.25 - group.current.rotation.y) * Math.min(1, delta * 3.0)
    }

    // The swirl plane spins continuously to read as a vortex behind the ring.
    if (swirl.current) swirl.current.rotation.z = t * 0.6

    const mesh = particles.current
    if (mesh) {
      for (let i = 0; i < particleCount; i++) {
        const angle = seeds[i * 4 + 0]
        const phase = seeds[i * 4 + 1]
        const inSpeed = seeds[i * 4 + 2]
        const scale = seeds[i * 4 + 3]

        // p cycles 1->0 as the particle is pulled inward, then wraps to restart.
        const p = 1.0 - ((t * 0.18 * inSpeed + phase) % 1.0)
        const r = radius * 0.95 * p
        // Spiral the angle inward so paths curve rather than fall straight in.
        const a = angle + (1.0 - p) * 4.0
        dummy.position.set(Math.cos(a) * r, Math.sin(a) * r, (1.0 - p) * -0.4)
        // Shrink and let them blink out as they reach the centre.
        const s = scale * 0.06 * Math.max(p, 0.05)
        dummy.scale.setScalar(s)
        dummy.updateMatrix()
        mesh.setMatrixAt(i, dummy.matrix)
      }
      mesh.instanceMatrix.needsUpdate = true
    }
  })

  const swirlColor = useMemo(() => base.clone().offsetHSL(0.0, 0.0, 0.1), [base])

  return (
    <group ref={group}>
      {/* Glowing portal rim. emissive + additive-ish brightness via toneMapped off. */}
      <mesh>
        <torusGeometry args={[radius, thickness, 24, 96]} />
        <meshStandardMaterial
          color={base}
          emissive={base}
          emissiveIntensity={2.5}
          toneMapped={false}
          roughness={0.3}
          metalness={0.1}
        />
      </mesh>

      {/* Swirling interior: a thin disc just behind the rim, additively blended
          so it glows without occluding the particles in front of it. */}
      <group ref={swirl} position={[0, 0, -0.05]}>
        <mesh>
          <circleGeometry args={[radius * 0.95, 64]} />
          <meshBasicMaterial
            color={swirlColor}
            transparent
            opacity={0.35}
            blending={AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      </group>

      {/* Particles drawn inward. Instanced for cheap high counts; additive glow. */}
      <instancedMesh ref={particles} args={[undefined, undefined, particleCount]}>
        <sphereGeometry args={[1, 6, 6]} />
        <meshBasicMaterial
          color={base}
          transparent
          opacity={0.9}
          blending={AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </instancedMesh>

      <pointLight position={[0, 0, 1]} color={base} intensity={2} distance={radius * 4} />
    </group>
  )
}

// Touch Vector3 import so strict noUnusedLocals stays satisfied while keeping the
// type available for downstream consumers composing portal positions.
export const PORTAL_AXIS = new Vector3(0, 0, 1)