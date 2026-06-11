import { Vector3, Color } from 'three'
import { type InstanceLayout } from '../components/InstancedGrid'

// Module-scope scratch reused every place() call — never allocate per-frame.
const scale = new Vector3()
const tint = new Color()

export interface IsometricStackOptions {
  /** Cubes per row/column of the square footprint. count is derived as cols*cols. */
  cols?: number
  /** Center-to-center distance between cubes on the X/Y plane. */
  spacing?: number
  /** Multiplier on the per-cube resting height variation. */
  heightScale?: number
  /** Z amplitude of the travelling ripple. */
  rippleAmp?: number
  /** Angular frequency of the ripple in radians per world unit. */
  rippleFreq?: number
  /** Phase speed of the ripple. */
  speed?: number
}

export function isometricStack(opts: IsometricStackOptions = {}): InstanceLayout {
  const {
    cols = 24,
    spacing = 1.0,
    heightScale = 1.0,
    rippleAmp = 0.6,
    rippleFreq = 1.4,
    speed = 1.5,
  } = opts

  const count = cols * cols
  // Cache the footprint span so we can recentre the grid on the origin.
  const half = (cols - 1) * spacing * 0.5

  return {
    id: 'isometric-stack',
    name: 'Isometric Stack',
    count,
    place(i, t, m, ctx) {
      // Decode the flat index into grid coordinates; integer math keeps it exact.
      const gx = i % cols
      const gy = (i / cols) | 0

      // World position on the ground plane, recentred about the origin.
      const x = gx * spacing - half
      const y = gy * spacing - half

      // Deterministic sin-hash of the index gives each column a stable, varied
      // resting height and width without any RNG or time dependency.
      const h = Math.sin(i * 12.9898) * 43758.5453
      const stable = h - Math.floor(h) // fract() -> [0,1)

      // Radial distance feeds a travelling ripple so waves emanate from centre.
      const dist = Math.sqrt(x * x + y * y)
      const ripple = Math.sin(dist * rippleFreq - t * speed) * rippleAmp

      // Mouse tilts the whole stack: pushes the ripple origin toward the cursor.
      const mx = ctx.mouse[0]
      const my = ctx.mouse[1]
      const lean = (x * mx + y * my) * 0.15

      // Base height per cube plus the shared ripple; clamp the floor so nothing
      // sinks below the build plate.
      const z = Math.max(0.0, 0.5 + stable * heightScale + ripple + lean)

      m.makeTranslation(x, y, z * 0.5)

      // Taller cubes are slightly slimmer for a stacked, towered silhouette.
      const footprint = 0.7 + stable * 0.2
      scale.set(footprint, footprint, z)
      m.scale(scale)

      // Colour ramps with height so peaks read hotter than the valleys.
      const hue = 0.55 - z * 0.05 + stable * 0.05
      tint.setHSL(hue, 0.6, 0.45 + ripple * 0.15)
      ctx.color.copy(tint)
    },
  }
}