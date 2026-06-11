import { useRef, type ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import { type Group } from 'three'
import { useScrollProgress } from '../hooks/useScrollProgress'
import { EASINGS, type EaseName } from '../engine/easing'

export type EntranceMode = 'none' | 'rise' | 'scaleIn' | 'spinIn' | 'dropIn'
export type IdleMode = 'none' | 'bob' | 'sway' | 'pulse'

export interface ScrollAnimatorProps {
  children: ReactNode

  // ── Scroll-driven channels. All run simultaneously; 0 = channel off. ──
  /** Full turns around Y across the whole scroll range. */
  rotate?: number
  /** World units the group dollies toward the camera (+Z) across the range. */
  zoom?: number
  /** World units the group rises (+Y) across the range. */
  lift?: number
  /** Inverse lift with a slight X sway — give layers different values for depth. */
  parallax?: number
  /** Scale 0 -> 1 over the FIRST `reveal` fraction of scroll (0..1). */
  reveal?: number
  /** Amplitude of a deterministic x/y wander as scroll progresses. */
  drift?: number
  /** Easing applied to scroll progress before the channels read it. */
  ease?: EaseName

  /**
   * Master multiplier for every time-driven layer (entrance + idle). 2 = twice
   * as fast, 0.5 = half speed. Scroll channels are progress-based, not clock-
   * based, so they are intentionally unaffected. Composes with `idleSpeed`
   * (effective idle rate = speed * idleSpeed).
   */
  speed?: number

  // ── One-shot entrance on mount (time-based, not scroll). ──
  entrance?: EntranceMode
  /** Entrance length in seconds. */
  entranceDuration?: number
  /** Delay before the entrance starts, in seconds. */
  entranceDelay?: number

  // ── Continuous idle motion layered on top. ──
  idle?: IdleMode
  idleSpeed?: number
  idleAmplitude?: number
}

/**
 * ScrollAnimator — binds page scroll, mount time, and idle motion to a group's
 * transform. Wrap ANY effect (or plain meshes) to make it scroll-aware:
 *
 *   <ScrollAnimator rotate={1} zoom={3} ease="easeInOut" entrance="rise" idle="bob">
 *     <InteractiveSurface material={heatHaze} />
 *   </ScrollAnimator>
 *
 * Three independent layers compose every frame, transforms only (no material
 * or opacity changes, so children stay untouched):
 *   1. scroll channels  — eased 0..1 progress drives each non-zero channel
 *   2. entrance         — a one-shot eased intro played once after mount
 *   3. idle             — endless trig motion (bob / sway / pulse)
 *
 * Like ScrollScene, this is a "website driver": children stay ignorant of
 * scroll. ScrollScene itself is the legacy special case — equivalent to
 * <ScrollAnimator rotate={rotations} zoom={zTravel}>.
 *
 * Note: scroll channels need the page to be taller than the viewport (or the
 * gallery's scroll override) for progress to move.
 */
export function ScrollAnimator({
  children,
  rotate = 0,
  zoom = 0,
  lift = 0,
  parallax = 0,
  reveal = 0,
  drift = 0,
  ease = 'linear',
  speed = 1,
  entrance = 'none',
  entranceDuration = 0.9,
  entranceDelay = 0,
  idle = 'none',
  idleSpeed = 1,
  idleAmplitude = 0.15,
}: ScrollAnimatorProps) {
  const ref = useRef<Group>(null)
  const progress = useScrollProgress()
  // Entrance clock starts on the first rendered frame, not at module load, so
  // remounting (e.g. switching effects in the gallery) replays the entrance.
  const startTime = useRef<number | null>(null)

  useFrame(({ clock }) => {
    const g = ref.current
    if (!g) return

    const scrollActive = rotate !== 0 || zoom !== 0 || lift !== 0 || parallax !== 0 || reveal !== 0 || drift !== 0
    const entranceActive = entrance !== 'none'
    const idleActive = idle !== 'none'
    if (!scrollActive && !entranceActive && !idleActive) {
      // Pure passthrough — but reset once in case a channel was just turned off.
      g.position.set(0, 0, 0)
      g.rotation.set(0, 0, 0)
      g.scale.setScalar(1)
      return
    }

    const t = clock.elapsedTime
    let x = 0
    let y = 0
    let z = 0
    let ry = 0
    let scale = 1

    // 1. Scroll channels — all read the same eased progress.
    if (scrollActive) {
      const p = EASINGS[ease](Math.min(1, Math.max(0, progress.current)))
      ry += p * Math.PI * 2 * rotate
      z += p * zoom
      y += p * lift
      if (parallax !== 0) {
        y -= p * parallax
        x += Math.sin(p * Math.PI) * parallax * 0.25
      }
      if (reveal > 0) {
        const r = Math.min(1, p / reveal)
        scale *= Math.max(0.001, EASINGS[ease](r))
      }
      if (drift !== 0) {
        x += Math.sin(p * Math.PI * 3) * drift
        y += Math.cos(p * Math.PI * 2) * drift * 0.6
      }
    }

    // 2. Entrance — one-shot, eased 0..1, composed on top of the scroll pose.
    // `speed` scales the wall-clock elapsed so the whole intro plays faster/slower.
    if (entranceActive) {
      if (startTime.current === null) startTime.current = t
      const elapsed = (t - startTime.current) * speed - entranceDelay
      const e = elapsed <= 0 ? 0 : Math.min(1, elapsed / Math.max(0.001, entranceDuration))
      // Entrances read as "settling in", so they get a fixed easeOut feel
      // (backOut for the playful ones) independent of the scroll ease.
      if (e < 1) {
        if (entrance === 'rise') {
          y -= (1 - EASINGS.easeOut(e)) * 1.5
          scale *= Math.max(0.001, EASINGS.easeOut(e))
        } else if (entrance === 'scaleIn') {
          scale *= Math.max(0.001, EASINGS.backOut(e))
        } else if (entrance === 'spinIn') {
          ry += (1 - EASINGS.easeOut(e)) * Math.PI * 2
          scale *= Math.max(0.001, EASINGS.easeOut(e))
        } else if (entrance === 'dropIn') {
          y += (1 - EASINGS.backOut(e)) * 2
        }
      }
    }

    // 3. Idle — endless, layered last so it reads as ambient motion.
    if (idleActive) {
      const w = t * idleSpeed * speed
      if (idle === 'bob') {
        y += Math.sin(w * 1.4) * idleAmplitude
      } else if (idle === 'sway') {
        ry += Math.sin(w * 0.9) * idleAmplitude
        x += Math.sin(w * 0.6) * idleAmplitude * 0.4
      } else if (idle === 'pulse') {
        scale *= 1 + Math.sin(w * 1.8) * idleAmplitude * 0.3
      }
    }

    g.position.set(x, y, z)
    g.rotation.set(0, ry, 0)
    g.scale.setScalar(scale)
  })

  return <group ref={ref}>{children}</group>
}
