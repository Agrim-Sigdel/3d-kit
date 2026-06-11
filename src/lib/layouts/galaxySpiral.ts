import { Vector3 } from 'three'
import { type InstanceLayout } from '../components/InstancedGrid'

/**
 * Galaxy spiral: instances are distributed across N logarithmic spiral arms.
 * Each arm follows r = a*e^(b*theta); inner instances orbit faster than outer
 * ones (differential rotation), which is what gives a galaxy its characteristic
 * winding-up of the arms over time.
 */
export interface GalaxySpiralOptions {
  count?: number
  /** number of spiral arms */
  arms?: number
  /** tightness of the log spiral (higher = more tightly wound) */
  windings?: number
  /** outer radius of the disk */
  radius?: number
  /** base angular speed; inner radii are multiplied up from this */
  speed?: number
  /** vertical thickness of the disk (bulge falloff toward the rim) */
  thickness?: number
}

// Module-scope scratch reused every place() call — never allocate per-instance.
const scale = new Vector3()

export function galaxySpiral(opts: GalaxySpiralOptions = {}): InstanceLayout {
  const {
    count = 1200,
    arms = 4,
    windings = 2.5,
    radius = 6,
    speed = 0.4,
    thickness = 0.6,
  } = opts

  return {
    id: 'galaxy-spiral',
    name: 'Galaxy Spiral',
    count,
    place(i, t, m, ctx) {
      // Stable per-instance hashes in [0,1). Distinct frequencies keep the
      // three derived params decorrelated without an RNG.
      const h0 = Math.sin(i * 12.9898) * 43758.5453
      const h1 = Math.sin(i * 78.233) * 43758.5453
      const h2 = Math.sin(i * 39.425) * 43758.5453
      const f0 = h0 - Math.floor(h0)
      const f1 = h1 - Math.floor(h1)
      const f2 = h2 - Math.floor(h2)

      // sqrt biases samples toward the rim so disk density stays roughly even
      // in area rather than clumping at the core.
      const rad = Math.sqrt(f0) * radius
      const armIndex = i % arms
      const armBase = (armIndex / arms) * Math.PI * 2.0

      // Log-spiral angle: theta grows with radius; scatter spreads instances
      // off the ideal arm line, tighter near the rim for crisp arm edges.
      const scatter = (f1 - 0.5) * 0.6 * (1.0 - rad / radius)
      const theta = armBase + windings * Math.log(1.0 + rad) + scatter

      // Differential rotation: inner orbits sweep faster (~1/r falloff),
      // clamped so the dense core does not spin to infinity.
      const omega = speed * (1.0 / (0.4 + rad * 0.5))
      const ang = theta + t * omega

      const x = Math.cos(ang) * rad
      const z = Math.sin(ang) * rad
      // Thicker bulge in the center, thinning toward the rim.
      const bulge = thickness * (1.0 - rad / radius)
      const y = (f2 - 0.5) * 2.0 * bulge

      // Mouse parallax-tilts the whole disk for a subtle interactive sway.
      const tiltX = ctx.mouse[1] * 0.5
      const tiltZ = ctx.mouse[0] * 0.5
      m.makeTranslation(x + tiltZ * y, y, z + tiltX * y)

      // Brighter, larger near the core; fade out the faint outer stars.
      const lum = 0.4 + 0.6 * (1.0 - rad / radius)
      const s = 0.05 + 0.12 * lum
      scale.set(s, s, s)
      m.scale(scale)

      // Warm yellow-white core to cool blue arms — a real galaxy color gradient.
      ctx.color.setRGB(lum, lum * 0.85 + 0.15, 0.5 + 0.5 * (rad / radius))
    },
  }
}
