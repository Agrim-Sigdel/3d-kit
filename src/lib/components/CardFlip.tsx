import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Group, MathUtils } from 'three'

export interface CardFlipProps {
  /** Base tint of the card front/back. */
  color?: string
  /** Multiplier on flip/idle animation rate. */
  speed?: number
  /** Card footprint as [width, height]; depth is derived to stay thin. */
  size?: [number, number]
  /** Peak idle tilt in radians applied on both axes. */
  idleTilt?: number
  /** Number of cards laid out side by side. */
  count?: number
}

/**
 * A row of thin cards. Each card eases toward a 180deg flip while hovered and,
 * when at rest, drifts with a subtle two-axis tilt. Flip + idle state live on
 * refs so the render loop never triggers React re-renders.
 */
export function CardFlip({
  color = '#5fa8ff',
  speed = 1,
  size = [2, 3],
  idleTilt = 0.12,
  count = 3,
}: CardFlipProps) {
  const group = useRef<Group>(null)
  // Per-card flip progress in [0,1]; mutated in the loop, never via state.
  const flip = useRef<number[]>(new Array(count).fill(0))
  // Latest pointer; read in-loop so hover tracks without re-subscribing.
  const pointer = useThree((s) => s.pointer)

  const [w, h] = size
  const depth = Math.min(w, h) * 0.04
  const gap = w * 1.25

  useFrame((state, dt) => {
    const root = group.current
    if (!root) return
    const t = state.clock.elapsedTime

    // Map normalized pointer (-1..1) into the group's local layout space so we
    // can decide which card it currently overlaps.
    const px = pointer.x * (count * gap) * 0.5

    for (let i = 0; i < root.children.length; i++) {
      const card = root.children[i]
      const x = (i - (count - 1) / 2) * gap

      // A card is "hovered" when the pointer sits within half a gap of it.
      const hovered = Math.abs(px - x) < gap * 0.5
      const target = hovered ? 1.0 : 0.0

      // Critically-damped-ish approach so flips feel weighty, not snappy.
      flip.current[i] = MathUtils.damp(flip.current[i], target, 6.0 * speed, dt)
      const p = flip.current[i]

      card.rotation.y = p * Math.PI

      // Deterministic per-index phase so idle tilts never sync up. sin-hash of
      // the index keeps it stable across reloads without any RNG/clock seed.
      const phase = Math.sin(i * 127.1) * 43758.5453
      const ph = phase - Math.floor(phase)
      const wobble = (1.0 - p) * idleTilt // fade tilt out while flipping
      card.rotation.x = Math.sin(t * 0.6 * speed + ph * Math.PI * 2.0) * wobble
      card.rotation.z =
        Math.cos(t * 0.45 * speed + ph * Math.PI * 2.0) * wobble * 0.6

      // Lift the hovered card slightly to reinforce the flip.
      card.position.y = p * h * 0.06
    }
  })

  return (
    <group ref={group}>
      {Array.from({ length: count }, (_, i) => {
        const x = (i - (count - 1) / 2) * gap
        return (
          <mesh key={i} position={[x, 0, 0]}>
            <boxGeometry args={[w, h, depth]} />
            <meshStandardMaterial
              color={color}
              metalness={0.1}
              roughness={0.55}
            />
          </mesh>
        )
      })}
    </group>
  )
}