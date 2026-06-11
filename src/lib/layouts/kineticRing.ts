import { type InstanceLayout } from '../components/InstancedGrid'


export interface KineticRingOptions {
  count?: number
  /** Ring radius in world units. */
  radius?: number
  /** Orbital angular velocity (radians/sec) of instances around the ring. */
  spin?: number
  /** Tumble rate of the whole ring's tilt (radians/sec). */
  tumble?: number
  /** Uniform instance scale; cubes face outward along the radial. */
  size?: number
}

export function kineticRing(opts: KineticRingOptions = {}): InstanceLayout {
  const {
    count = 600,
    radius = 3,
    spin = 0.6,
    tumble = 0.4,
    size = 0.18,
  } = opts

  return {
    id: 'kinetic-ring',
    name: 'Kinetic Ring',
    count,
    place(i, t, m, ctx) {
      // Stable per-instance phase via sin-hash; keeps each index deterministic
      // across frames without RNG/time so motion is reproducible.
      const hash = Math.sin(i * 12.9898) * 43758.5453
      const jitter = hash - Math.floor(hash) // fract -> [0,1)

      // Even angular distribution + tiny per-index nudge so the ring reads
      // organic rather than perfectly lattice-like.
      const base = (i / ctx.count) * Math.PI * 2.0
      const ang = base + spin * t + jitter * 0.15

      // Position on the ring in its local XY plane before the tumble tilt.
      const cx = Math.cos(ang)
      const cy = Math.sin(ang)
      const lx = cx * radius
      const ly = cy * radius

      // The ring tumbles: tilt its plane about X over time, mouse adds steer.
      // We rotate the local (lx, ly, 0) point by that tilt manually — cheaper
      // and allocation-free versus building a Matrix4 rotation here.
      const tiltX = t * tumble + ctx.mouse[1] * 0.8
      const tiltZ = ctx.mouse[0] * 0.8
      const sinX = Math.sin(tiltX)
      const cosX = Math.cos(tiltX)

      // Rotate about X: y/z mix.
      const ry = ly * cosX
      const rz = ly * sinX

      // Rotate the resulting (lx, rz) about Z for the second tumble axis.
      const sinZ = Math.sin(tiltZ)
      const cosZ = Math.cos(tiltZ)
      const wx = lx * cosZ - ry * sinZ
      const wy = lx * sinZ + ry * cosZ
      const wz = rz

      m.makeTranslation(wx, wy, wz)

      // Face outward: rotate so the cube's +Z points along the radial.
      // atan2 of the in-plane direction gives yaw; we fold it into the matrix
      // by composing a Z-rotation (the dominant facing for a flat ring).
      const yaw = ang + Math.PI * 0.5
      const sy = Math.sin(yaw)
      const cy2 = Math.cos(yaw)
      // Manually write the upper-left rotation block (rotation about Z) scaled
      // by `size`, avoiding a Matrix4 multiply allocation.
      const e = m.elements
      e[0] = cy2 * size
      e[1] = sy * size
      e[4] = -sy * size
      e[5] = cy2 * size
      e[10] = size

      // Subtle radial color shift so motion has depth cueing.
      ctx.color.setHSL((i / ctx.count + t * 0.05) % 1.0, 0.6, 0.55)
    },
  }
}