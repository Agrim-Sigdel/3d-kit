import { Matrix4, Vector3 } from 'three'
import { type InstanceLayout } from '../components/InstancedGrid'

// Module-scope scratch — place() must never allocate (runs count*60 times/sec).
const _pos = new Vector3()
const _scale = new Vector3()
const _rot = new Matrix4()

export interface VoxelSphereOptions {
  /** Number of voxels distributed over the sphere surface. */
  count?: number
  /** Sphere radius the voxels sit on. */
  radius?: number
  /** Rotation speed in radians/sec (slow ambient spin). */
  rotateSpeed?: number
  /** World-space reach of the cursor displacement falloff. */
  cursorRadius?: number
  /** Peak outward push (along normal) at the cursor center. */
  cursorPush?: number
  /** Base edge length of each voxel cube. */
  voxelSize?: number
}

export function voxelSphere(opts: VoxelSphereOptions = {}): InstanceLayout {
  const {
    count = 1200,
    radius = 2.2,
    rotateSpeed = 0.15,
    cursorRadius = 1.4,
    cursorPush = 0.9,
    voxelSize = 0.12,
  } = opts

  // Golden-angle spiral gives an even, sunflower-like surface distribution
  // with no clumping — far cheaper than rejection sampling and fully stable in i.
  const golden = Math.PI * (3.0 - Math.sqrt(5.0))
  const invCursorRadius = 1.0 / cursorRadius

  return {
    id: 'voxel-sphere',
    name: 'Voxel Sphere',
    count,
    place(i, t, m, ctx) {
      const n = ctx.count

      // Fibonacci sphere: y walks linearly down the axis, theta spirals by golden angle.
      const y = 1.0 - (i / (n - 1)) * 2.0 // [1, -1]
      const ringR = Math.sqrt(Math.max(0.0, 1.0 - y * y))
      const theta = golden * i

      // Unit surface normal (also the direction we push along for the cursor effect).
      const nx = Math.cos(theta) * ringR
      const ny = y
      const nz = Math.sin(theta) * ringR

      // Slow spin about the Y axis. Rotating the placement (not the mesh) keeps
      // the cursor interaction in a stable world frame the user can aim at.
      const spin = t * rotateSpeed
      const cs = Math.cos(spin)
      const sn = Math.sin(spin)
      const rx = nx * cs - nz * sn
      const rz = nx * sn + nz * cs

      // Cursor maps from [-1,1] onto the sphere's front face; voxels near it
      // bulge outward with a smooth quadratic falloff (no sqrt in the hot path).
      const mx = ctx.mouse[0] * radius
      const my = ctx.mouse[1] * radius
      const dx = rx * radius - mx
      const dy = ny * radius - my
      const d2 = dx * dx + dy * dy
      const fall = Math.max(0.0, 1.0 - d2 * invCursorRadius * invCursorRadius)
      const push = fall * fall * cursorPush

      const rr = radius + push
      _pos.set(rx * rr, ny * rr, rz * rr)
      m.makeTranslation(_pos.x, _pos.y, _pos.z)

      // Deterministic sin-hash for per-voxel size jitter — no RNG, no clock.
      const h = Math.sin(i * 12.9898) * 43758.5453
      const jitter = 0.75 + (h - Math.floor(h)) * 0.5 // [0.75, 1.25)
      const s = voxelSize * jitter * (1.0 + push * 0.5)
      _scale.set(s, s, s)
      m.scale(_scale)

      // Orient each cube to face along its surface normal so faces read as a shell.
      // lookAt builds a basis pointing -Z at the target; aim at the sphere center.
      _rot.lookAt(_pos, _ORIGIN, _UP)
      m.multiply(_rot)

      // Tint warmer toward the cursor so displaced voxels glow.
      ctx.color.setHSL(0.58 - push * 0.12, 0.6, 0.45 + push * 0.25)
    },
  }
}

const _ORIGIN = new Vector3(0, 0, 0)
const _UP = new Vector3(0, 1, 0)
