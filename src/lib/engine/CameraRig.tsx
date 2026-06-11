import { useEffect, useRef, type ComponentRef } from 'react'
import { OrbitControls } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { useInputMode } from './inputMode'
import {
  DEFAULT_VIEW,
  positionToViewAngle,
  viewAngleToPosition,
  type ViewAngle,
} from './viewAngle'

export interface CameraRigProps {
  /** Allow zoom (wheel). Default true. */
  zoom?: boolean
  /** Allow pan (right-drag / two-finger). Default false for a tidy showcase. */
  pan?: boolean
  /** Damping factor for that smooth, weighty feel. */
  damping?: number
  /** Min/max zoom distance. */
  minDistance?: number
  maxDistance?: number
  /**
   * Declarative viewpoint (azimuth / elevation / distance / target, degrees).
   * Applied whenever its values change; manual orbiting still works in 'view'
   * mode and does NOT get stomped by re-renders with the same values.
   */
  view?: ViewAngle
  /**
   * Fired when the user finishes a manual orbit (drag/zoom), with the
   * resulting viewpoint. Feed it back into `view` for two-way binding —
   * the rig guards against the loop.
   */
  onViewChange?: (view: Required<ViewAngle>) => void
}

/**
 * CameraRig — the camera as a FIRST-CLASS, SEPARATE entity (engine layer).
 *
 * Components never touch the camera; this rig owns it. Crucially, its controls
 * are only enabled in 'view' input mode. In 'interact' mode they're disabled,
 * so dragging drives the EFFECTS (ripple, etc.) instead of fighting them for
 * the pointer. Flip the mode (the gallery has a toggle) to reframe the shot.
 *
 * Drop it inside <Stage> as a sibling to your components.
 */
export function CameraRig({
  zoom = true,
  pan = false,
  damping = 0.08,
  minDistance = 2,
  maxDistance = 20,
  view,
  onViewChange,
}: CameraRigProps) {
  const mode = useInputMode()
  const active = mode === 'view'

  const controlsRef = useRef<ComponentRef<typeof OrbitControls>>(null)
  const camera = useThree((s) => s.camera)

  // The last view WE reported via onViewChange. When that same view comes back
  // down as the `view` prop (two-way binding), skip re-applying it — otherwise
  // every drag would end with a redundant (and damping-visible) snap.
  const reported = useRef<Required<ViewAngle> | null>(null)

  const azimuth = view?.azimuth ?? DEFAULT_VIEW.azimuth
  const elevation = view?.elevation ?? DEFAULT_VIEW.elevation
  const distance = view?.distance ?? DEFAULT_VIEW.distance
  const [tx, ty, tz] = view?.target ?? DEFAULT_VIEW.target

  // Apply the declarative view. Deps are the SCALARS, not the object, so a
  // parent re-render with a fresh-but-equal object literal is a no-op.
  useEffect(() => {
    if (!view) return
    // Tolerances absorb the consumer rounding the reported values for display
    // (e.g. whole degrees / 0.1 distance) while staying below the smallest
    // change a slider step can make.
    const r = reported.current
    const eqAngle = (a: number, b: number) => Math.abs(a - b) < 0.51
    const eqDist = (a: number, b: number) => Math.abs(a - b) < 0.051
    if (
      r &&
      eqAngle(r.azimuth, azimuth) &&
      eqAngle(r.elevation, elevation) &&
      eqDist(r.distance, distance) &&
      eqDist(r.target[0], tx) && eqDist(r.target[1], ty) && eqDist(r.target[2], tz)
    ) {
      return // our own echo — the camera is already there
    }
    const [px, py, pz] = viewAngleToPosition({ azimuth, elevation, distance, target: [tx, ty, tz] })
    camera.position.set(px, py, pz)
    const controls = controlsRef.current
    if (controls) {
      controls.target.set(tx, ty, tz)
      controls.update()
    } else {
      camera.lookAt(tx, ty, tz)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camera, !view, azimuth, elevation, distance, tx, ty, tz])

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enabled={active}
      enableDamping
      dampingFactor={damping}
      enableZoom={zoom}
      enablePan={pan}
      minDistance={minDistance}
      maxDistance={maxDistance}
      onEnd={() => {
        if (!onViewChange) return
        const controls = controlsRef.current
        if (!controls) return
        const next = positionToViewAngle(camera.position, controls.target)
        reported.current = next
        onViewChange(next)
      }}
    />
  )
}
