import { Vector3 } from 'three'
import { type InstanceLayout } from '../components/InstancedGrid'

// Module-scope scratch reused every place() call — allocating per-instance per-frame
// would thrash the GC at thousands of instances * 60fps.
const _scale = new Vector3()

export interface WaveGridOptions {
  /** Number of columns/rows; total instances ≈ cols*cols (clamped to count). */
  cols?: number
  /** Spacing between grid cells in world units. */
  spacing?: number
  /** Amplitude of the traveling sine wave. */
  amplitude?: number
  /** Spatial frequency of the wave across the grid. */
  frequency?: number
  /** Wave travel speed (radians/sec scalar). */
  speed?: number
  /** World-space radius of the cursor bump falloff. */
  bumpRadius?: number
}

export function waveGrid(opts: WaveGridOptions = {}): InstanceLayout {
  const {
    cols = 40,
    spacing = 0.55,
    amplitude = 0.6,
    frequency = 0.8,
    speed = 1.4,
    bumpRadius = 2.5,
  } = opts

  const count = cols * cols
  // Precompute layout constants so place() stays branch-light and allocation-free.
  const half = (cols - 1) * 0.5
  const invBumpR2 = 1.0 / (bumpRadius * bumpRadius)

  return {
    id: 'wave-grid',
    name: 'Wave Grid',
    count,
    place(i, t, m, ctx) {
      // Resolve grid coordinates from the flat index, centered on origin.
      const gx = i % cols
      const gz = (i - gx) / cols
      const x = (gx - half) * spacing
      const z = (gz - half) * spacing

      // Traveling sine wave: phase advances with distance from origin and time.
      const dist = Math.sqrt(x * x + z * z)
      let y = Math.sin(dist * frequency - t * speed) * amplitude

      // Cursor bump: map mouse [-1,1] onto the grid extent, add a Gaussian-ish lobe.
      const reach = half * spacing
      const mx = ctx.mouse[0] * reach
      const mz = ctx.mouse[1] * reach
      const dx = x - mx
      const dz = z - mz
      const d2 = dx * dx + dz * dz
      y += Math.exp(-d2 * invBumpR2) * amplitude * 2.0

      m.makeTranslation(x, y, z)

      // Cells near a crest get slightly larger — emphasizes the wave silhouette.
      const s = 0.18 + Math.max(0.0, y) * 0.12
      _scale.set(s, s, s)
      m.scale(_scale)
    },
  }
}
