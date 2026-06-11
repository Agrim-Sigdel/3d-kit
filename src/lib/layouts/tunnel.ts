import { Vector3, Matrix4, Color } from 'three'
import { type InstanceLayout } from '../components/InstancedGrid'

export interface TunnelLayoutOptions {
  /** number of instances; distributed across rings */
  count?: number
  /** tunnel bore radius in world units */
  radius?: number
  /** scroll speed toward camera (units/sec along z) */
  speed?: number
  /** instances per ring; count/ringSize gives the ring count */
  ringSize?: number
  /** spacing between successive rings along z */
  ringSpacing?: number
  /** per-instance cube scale */
  scale?: number
}

// Module-scope scratch reused every place() call — allocating Vector3s per
// instance per frame would thrash the GC at thousands of instances/60fps.
const scratch = new Vector3()

/**
 * Receding rings of instances forming a tunnel that scrolls toward the camera.
 * Each instance keeps a fixed ring index and angular slot; only its z position
 * advances with time, wrapping modulo the tunnel depth so the tube appears
 * infinite. The wrap is per-instance (no shared buffer) so it is allocation-free.
 */
export function tunnelLayout(opts: TunnelLayoutOptions = {}): InstanceLayout {
  const {
    count = 800,
    radius = 2,
    speed = 1,
    ringSize = 20,
    ringSpacing = 0.6,
    scale = 0.12,
  } = opts

  const rings = Math.max(1, Math.ceil(count / ringSize))
  // Total depth the tube occupies; used as the modulo period so z wraps cleanly.
  const depth = rings * ringSpacing
  const angleStep = (Math.PI * 2.0) / ringSize

  return {
    id: 'tunnel',
    name: 'Infinite Tunnel',
    count,
    place(i: number, t: number, m: Matrix4, ctx: { count: number; mouse: [number, number]; color: Color }) {
      const ring = Math.floor(i / ringSize)
      const slot = i % ringSize

      // Deterministic sin-hash for stable per-instance variety (no RNG / no clock).
      const h = Math.sin(i * 12.9898) * 43758.5453
      const jitter = h - Math.floor(h) // fract() in [0,1)

      // Angle is stable per slot; a tiny per-instance offset breaks the grid look.
      const angle = slot * angleStep + (jitter - 0.5) * angleStep * 0.5

      // Slight radial breathing so rings don't read as perfectly rigid tubes.
      const r = radius * (0.92 + 0.08 * Math.sin(t * 0.8 + ring * 0.5))
      const x = Math.cos(angle) * r
      const y = Math.sin(angle) * r

      // Scroll toward +z (camera). Wrap into [0, depth) so the tunnel loops.
      let z = ring * ringSpacing + t * speed
      z = z - Math.floor(z / depth) * depth // positive modulo via floor
      // Recenter so the tube straddles the origin and recedes into -z.
      z -= depth

      // Mouse steers the tunnel axis: gentle parallax shift of the whole bore.
      const sway = 0.6
      m.makeTranslation(x + ctx.mouse[0] * sway, y + ctx.mouse[1] * sway, z)

      // Fade-in scale near the far end avoids instances popping at the wrap seam.
      const edge = Math.min(1.0, (z + depth) / (depth * 0.15))
      scratch.setScalar(scale * Math.max(0.0, edge))
      m.scale(scratch)
    },
  }
}
