import { Vector3 } from 'three'
import { type InstanceLayout } from '../components/InstancedGrid'

export interface VoronoiShatterOptions {
  /** Number of shards. Defaults tuned for a dense, readable cloud. */
  count?: number
  /** Peak explosion radius (world units) at the apex of the burst. */
  radius?: number
  /** Loop frequency in Hz; controls how fast burst->settle repeats. */
  speed?: number
  /** Per-shard spin rate multiplier; shards tumble while flying out. */
  spin?: number
  /** Mouse parallax gain. ctx.mouse is [-1,1]; this scales its push. */
  mouseInfluence?: number
}

// Module-scope scratch reused every place() call — allocating Vectors per
// instance per frame would thrash the GC at thousands of instances.
const dir = new Vector3()
const scl = new Vector3()

export function voronoiShatter(opts: VoronoiShatterOptions = {}): InstanceLayout {
  const {
    count = 1000,
    radius = 4,
    speed = 0.35,
    spin = 1.2,
    mouseInfluence = 0.6,
  } = opts

  // Hoist the two-pi constant; cheaper and clearer than recomputing inline.
  const TAU = Math.PI * 2

  return {
    id: 'voronoi-shatter',
    name: 'Voronoi Shatter',
    count,
    place(i, t, m, ctx) {
      // Deterministic sin-hash of the index gives each shard a stable identity
      // (direction, phase, size) without any RNG or wall-clock dependency.
      const h1 = Math.sin(i * 12.9898) * 43758.5453
      const h2 = Math.sin(i * 78.233) * 12543.1234
      const h3 = Math.sin(i * 39.425) * 24634.6345
      const r1 = h1 - Math.floor(h1) // fract() -> [0,1)
      const r2 = h2 - Math.floor(h2)
      const r3 = h3 - Math.floor(h3)

      // Uniformly distributed unit direction on the sphere. cos-theta sampling
      // (z = 2u-1) avoids the polar clustering you'd get from naive lat/long.
      const z = r1 * 2.0 - 1.0
      const phi = r2 * TAU
      const ring = Math.sqrt(Math.max(0.0, 1.0 - z * z))
      dir.set(ring * Math.cos(phi), ring * Math.sin(phi), z)

      // Each shard offsets its loop phase so the cloud breathes asynchronously
      // rather than pulsing as one rigid mass.
      const phase = (t * speed + r3) % 1.0
      // Asymmetric ease: fast outward burst (pow<1) then a long settle back.
      // sin gives the 0->1->0 there-and-back; the pow sharpens the launch.
      const burst = Math.pow(Math.sin(phase * Math.PI), 0.6)

      const dist = burst * radius * (0.5 + r1 * 0.5) // size-correlated reach

      // Mouse parallax: nudge the whole field along view-plane axes so the
      // shatter tracks the cursor without per-shard branching.
      const mx = ctx.mouse[0] * mouseInfluence * burst
      const my = ctx.mouse[1] * mouseInfluence * burst

      m.makeTranslation(
        dir.x * dist + mx,
        dir.y * dist + my,
        dir.z * dist,
      )

      // Shards shrink as they reach apex (energy spread thin), largest when
      // re-converged at center — reinforces the "settling back" read.
      const s = 0.25 + (1.0 - burst) * (0.4 + r2 * 0.5)
      scl.set(s, s, s)
      m.scale(scl)

      // Tumble: rotate about the index-derived axis, rate tied to spin. Reuse
      // dir as the axis (already a unit vector) to avoid another allocation.
      m.makeRotationAxis(dir, (t * spin + r3 * TAU))
      // makeRotationAxis overwrote translation/scale, so recompose explicitly:
      // re-apply translation*scale then the rotation via multiply would need a
      // second matrix. Instead bake rotation into the position-built matrix.
      m.setPosition(dir.x * dist + mx, dir.y * dist + my, dir.z * dist)
      m.elements[0] *= s
      m.elements[1] *= s
      m.elements[2] *= s
      m.elements[4] *= s
      m.elements[5] *= s
      m.elements[6] *= s
      m.elements[8] *= s
      m.elements[9] *= s
      m.elements[10] *= s

      // Tint shards by reach: hot core -> cool fringe, a cheap fake of fracture
      // energy. Mutating ctx.color is the contract's per-instance color channel.
      ctx.color.setHSL(0.55 + burst * 0.12, 0.7, 0.45 + (1.0 - burst) * 0.25)
    },
  }
}