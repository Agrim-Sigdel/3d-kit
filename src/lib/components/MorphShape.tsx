import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { BufferAttribute, BufferGeometry, Mesh } from 'three'

export interface MorphShapeProps {
  /** Base color of the morphing surface. */
  color?: string
  /** Morph + rotation speed multiplier. */
  speed?: number
  /** Radius of the sphere / half-extent of the box. */
  size?: number
  /** Tessellation per box face edge; higher = smoother morph. */
  segments?: number
}

// Deterministic per-vertex jitter so the morph doesn't look mechanically
// uniform. sin-hash keeps it stable across frames (no RNG / wall-clock).
function hash(i: number): number {
  const s = Math.sin(i * 12.9898) * 43758.5453
  return s - Math.floor(s)
}

export function MorphShape({
  color = '#5fa8ff',
  speed = 1,
  size = 1,
  segments = 24,
}: MorphShapeProps) {
  const meshRef = useRef<Mesh>(null)

  // Build a box-topology grid of points, then precompute each point's matching
  // position on a sphere. We lerp between the two sets every frame on the CPU;
  // doing it here (rather than a vertex shader) keeps the contract dependency-
  // free and lets standard lighting/normals work with a plain material.
  const { geometry, boxPos, spherePos } = useMemo(() => {
    const positions: number[] = []
    const seg = Math.max(1, Math.floor(segments))

    // Generate the 6 faces of a unit cube as parametric grids. Each face spans
    // [-1,1] in two axes with the third pinned to +/-1.
    const faces: Array<[0 | 1 | 2, 1 | -1]> = [
      [0, 1], [0, -1], [1, 1], [1, -1], [2, 1], [2, -1],
    ]
    for (const [axis, sign] of faces) {
      for (let a = 0; a <= seg; a++) {
        for (let b = 0; b <= seg; b++) {
          const u = (a / seg) * 2.0 - 1.0
          const v = (b / seg) * 2.0 - 1.0
          const p: [number, number, number] = [0, 0, 0]
          p[axis] = sign
          // Fill the two non-pinned axes in order.
          const other = [0, 1, 2].filter((x) => x !== axis)
          p[other[0]] = u
          p[other[1]] = v
          positions.push(p[0], p[1], p[2])
        }
      }
    }

    const count = positions.length / 3
    const box = new Float32Array(positions)
    const sphere = new Float32Array(positions.length)

    // Map every box point onto the sphere by normalizing its direction. Shared
    // vertex indexing means the lerp is a clean 1:1 correspondence.
    for (let i = 0; i < count; i++) {
      const x = box[i * 3]
      const y = box[i * 3 + 1]
      const z = box[i * 3 + 2]
      const len = Math.hypot(x, y, z) || 1.0
      sphere[i * 3] = x / len
      sphere[i * 3 + 1] = y / len
      sphere[i * 3 + 2] = z / len
    }

    const geo = new BufferGeometry()
    // Start at the box state; updated in-place each frame.
    geo.setAttribute('position', new BufferAttribute(box.slice(), 3))
    return { geometry: geo, boxPos: box, spherePos: sphere }
  }, [segments])

  useFrame((state) => {
    const mesh = meshRef.current
    if (!mesh) return

    const t = state.clock.elapsedTime * speed
    // 0..1 ping-pong: smooth ease between the two shapes via raised cosine.
    const morph = 0.5 - 0.5 * Math.cos(t)

    const attr = geometry.getAttribute('position') as BufferAttribute
    const arr = attr.array as Float32Array
    const count = arr.length / 3

    for (let i = 0; i < count; i++) {
      // Per-vertex phase offset gives a rippling, non-rigid transition.
      const phase = hash(i) * 0.4
      const m = Math.min(1.0, Math.max(0.0, morph + phase - 0.2))
      const ix = i * 3
      arr[ix] = (boxPos[ix] + (spherePos[ix] - boxPos[ix]) * m) * size
      arr[ix + 1] = (boxPos[ix + 1] + (spherePos[ix + 1] - boxPos[ix + 1]) * m) * size
      arr[ix + 2] = (boxPos[ix + 2] + (spherePos[ix + 2] - boxPos[ix + 2]) * m) * size
    }
    attr.needsUpdate = true
    geometry.computeVertexNormals()

    mesh.rotation.y += state.clock.getDelta() * 0.0 // no-op guard; rotation below
    mesh.rotation.x = t * 0.15
    mesh.rotation.y = t * 0.25
  })

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <meshStandardMaterial color={color} roughness={0.35} metalness={0.1} flatShading />
    </mesh>
  )
}