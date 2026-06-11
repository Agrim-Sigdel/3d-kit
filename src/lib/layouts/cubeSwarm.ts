import { Vector3 } from 'three'
import { type InstanceLayout } from '../components/InstancedGrid'

/**
 * Drifting cube swarm bounded to an axis-aligned box. Each instance follows a
 * slow Lissajous-style drift whose phase is derived from its index, so the
 * swarm reads as loosely coherent rather than independently noisy. The bounding
 * box is enforced by amplitude clamping, not wrapping, to avoid teleport pops.
 */
export interface CubeSwarmOptions {
  /** Number of cubes in the swarm. */
  count?: number
  /** Half-extent of the bounding box on each axis (world units). */
  bounds?: number
  /** Drift cycles per second; lower is calmer. */
  speed?: number
  /** Per-cube base size (uniform scale). */
  size?: number
  /** 0..1 — how strongly cubes pull toward a shared index-phased center. */
  cohesion?: number
}

// Module-scope scratch reused every place() call. Allocating Vector3 inside
// place() would churn the GC at thousands of calls per frame.
const scratchScale = new Vector3()

// Golden-angle increment keeps successive indices spread across the unit circle
// so neighbouring cubes don't clump onto identical phases.
const GOLDEN = 2.399963229728653

/** Deterministic sin-hash of the index in [0,1). Fract of a high-frequency sine. */
function hash(i: number, salt: number): number {
  const s = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453
  return s - Math.floor(s)
}

export function cubeSwarm(opts: CubeSwarmOptions = {}): InstanceLayout {
  const { count = 1200, bounds = 4, speed = 0.25, size = 0.18, cohesion = 0.35 } = opts

  return {
    id: 'cube-swarm',
    name: 'Cube Swarm',
    count,
    place(i, t, m, ctx) {
      // Stable per-instance parameters. Three independent hashes give each cube
      // its own home position and drift signature without any RNG state.
      const hx = hash(i, 1.0)
      const hy = hash(i, 2.0)
      const hz = hash(i, 3.0)

      // Index-phased shared rhythm: all cubes share the global clock but offset
      // their phase by the golden angle, producing gentle wave-like cohesion.
      const phase = t * speed * 6.2831853 + i * GOLDEN

      // Home position spread across the box, biased to the interior so drift
      // stays inside bounds after the amplitude term is added.
      const homeX = (hx * 2.0 - 1.0) * bounds * 0.8
      const homeY = (hy * 2.0 - 1.0) * bounds * 0.8
      const homeZ = (hz * 2.0 - 1.0) * bounds * 0.8

      // Drift amplitude scaled so home + drift never exceeds the box half-extent.
      const amp = bounds * 0.2

      // Cohesion target: a slowly orbiting attractor common to the whole swarm.
      // Cubes ease toward it by `cohesion`, the rest of the motion is local drift.
      const cohX = Math.sin(t * speed) * bounds * 0.5
      const cohY = Math.cos(t * speed * 0.8) * bounds * 0.5
      const cohZ = Math.sin(t * speed * 1.3) * bounds * 0.5

      // Mouse nudges the whole swarm's drift centre for a subtle parallax feel.
      const mx = ctx.mouse[0] * bounds * 0.15
      const my = ctx.mouse[1] * bounds * 0.15

      const localX = homeX + Math.sin(phase) * amp + mx
      const localY = homeY + Math.cos(phase * 1.17) * amp + my
      const localZ = homeZ + Math.sin(phase * 0.83) * amp

      // Linear blend toward the shared attractor. cohesion stays 0..1 so the
      // result is always a convex combination and therefore inside the box.
      const x = localX + (cohX - localX) * cohesion
      const y = localY + (cohY - localY) * cohesion
      const z = localZ + (cohZ - localZ) * cohesion

      m.makeTranslation(x, y, z)

      // Slight per-cube size variation, breathing with the same phase so the
      // swarm pulses subtly as it moves. Kept strictly positive.
      const breathe = 1.0 + Math.sin(phase) * 0.2
      const s = size * (0.6 + hx * 0.8) * breathe
      scratchScale.set(s, s, s)
      m.scale(scratchScale)
    },
  }
}
