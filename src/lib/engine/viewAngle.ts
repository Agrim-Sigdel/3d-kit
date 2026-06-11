import { type Vector3 } from 'three'

/**
 * ViewAngle — a declarative camera viewpoint (engine layer).
 *
 * Where CameraRig's OrbitControls let a USER drag the camera around, ViewAngle
 * lets CODE say "look from 30 degrees left, slightly above, 6 units out" — a
 * value you can store in a config, tween, or copy/paste between projects.
 * CameraRig accepts it as its `view` prop and reports drags back through
 * `onViewChange` in the same shape, so the two stay interchangeable.
 *
 * Pure math, no React — usable from any driver (website, game, test).
 */
export interface ViewAngle {
  /** Horizontal orbit angle in degrees. 0 = the default front view (down -Z). */
  azimuth?: number
  /** Vertical angle in degrees, clamped to -85..85. 0 = level with the target. */
  elevation?: number
  /** Camera distance from the target in world units. */
  distance?: number
  /** Orbit target. Default the origin. */
  target?: [number, number, number]
}

/** Matches Stage's default camera (position [0, 0, 6] looking at the origin). */
export const DEFAULT_VIEW: Required<ViewAngle> = {
  azimuth: 0,
  elevation: 0,
  distance: 6,
  target: [0, 0, 0],
}

const DEG = Math.PI / 180

/** Spherical -> cartesian camera position around `target`. */
export function viewAngleToPosition(view: ViewAngle): [number, number, number] {
  const azimuth = (view.azimuth ?? DEFAULT_VIEW.azimuth) * DEG
  // Clamp elevation away from the poles so the orbit up-vector never flips.
  const elevation = Math.max(-85, Math.min(85, view.elevation ?? DEFAULT_VIEW.elevation)) * DEG
  const distance = view.distance ?? DEFAULT_VIEW.distance
  const [tx, ty, tz] = view.target ?? DEFAULT_VIEW.target
  const horizontal = Math.cos(elevation) * distance
  return [
    tx + Math.sin(azimuth) * horizontal,
    ty + Math.sin(elevation) * distance,
    tz + Math.cos(azimuth) * horizontal,
  ]
}

/** Inverse of viewAngleToPosition — decompose a camera position into a ViewAngle. */
export function positionToViewAngle(position: Vector3, target: Vector3): Required<ViewAngle> {
  const dx = position.x - target.x
  const dy = position.y - target.y
  const dz = position.z - target.z
  const distance = Math.sqrt(dx * dx + dy * dy + dz * dz)
  const horizontal = Math.sqrt(dx * dx + dz * dz)
  return {
    azimuth: Math.atan2(dx, dz) / DEG,
    elevation: Math.atan2(dy, horizontal) / DEG,
    distance,
    target: [target.x, target.y, target.z],
  }
}
