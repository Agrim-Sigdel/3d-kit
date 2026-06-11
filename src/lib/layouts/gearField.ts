import { Vector3 } from 'three'
import { type InstanceLayout } from '../components/InstancedGrid'

// Module-scope scratch. place() must never allocate — reusing these keeps the
// per-frame work GC-free even at thousands of instances.
const _scale = new Vector3()
const _axis = new Vector3(0, 0, 1)

export interface GearFieldOptions {
  /** Number of instances; clamped into a near-square grid below. */
  count?: number
  /** Center-to-center spacing of gears in the grid plane. */
  spacing?: number
  /** Base angular velocity (rad/s) before per-gear variation. */
  spin?: number
  /** Uniform scale applied to every instance. */
  size?: number
  /** How strongly mouse X/Y tilts the whole field (0 disables). */
  tilt?: number
}

export function gearField(opts: GearFieldOptions = {}): InstanceLayout {
  const { count = 900, spacing = 1.15, spin = 0.6, size = 0.9, tilt = 0.4 } = opts

  // Square-ish grid. cols is derived once at factory time, not per frame.
  const cols = Math.max(1, Math.round(Math.sqrt(count)))
  const half = (cols - 1) * 0.5

  return {
    id: 'gear-field',
    name: 'Gear Field',
    count,
    place(i, t, m, ctx) {
      // Grid coordinates. Integer col/row let us alternate spin by parity so
      // neighbouring gears appear to mesh (a gear turns opposite its neighbour).
      const col = i % cols
      const row = (i / cols) | 0

      // Sin-hash for stable per-gear variety (phase + slight speed jitter).
      // Deterministic in i so the field is identical every frame/reload.
      const h = Math.sin(i * 12.9898) * 43758.5453
      const phase = (h - Math.floor(h)) * Math.PI * 2.0

      // Checkerboard parity flips rotation direction so interlocking teeth
      // would mesh; the +1/-1 comes straight from the summed parity.
      const dir = ((col + row) & 1) === 0 ? 1.0 : -1.0

      // Angle: shared base rate so the mesh stays in lockstep, plus a stable
      // per-gear phase offset. Direction alternates across the checkerboard.
      const angle = dir * (t * spin) + phase

      const x = (col - half) * spacing
      const y = (row - half) * spacing

      // Mouse tilts the plane in Z to give the flat field some parallax depth.
      // ctx.mouse is in [-1,1]; scale by tilt so 0 fully disables it.
      const z = (ctx.mouse[0] * x + ctx.mouse[1] * y) * tilt * 0.15

      m.makeTranslation(x, y, z)
      m.multiply(_rotZ(angle))
      _scale.set(size, size, size)
      m.scale(_scale)
    },
  }
}

// Local rotation helper reusing a single Matrix4-free path: we rotate the
// already-translated matrix about Z. makeRotationAxis on a scratch axis avoids
// allocating a fresh Matrix4 — but m.multiply needs a Matrix4, so we keep one
// module-scoped rotation matrix and rewrite it in place each call.
import { Matrix4 } from 'three'
const _rot = new Matrix4()
function _rotZ(angle: number): Matrix4 {
  // Rotating about the shared Z axis; in-place write keeps place() allocation-free.
  return _rot.makeRotationAxis(_axis, angle)
}
