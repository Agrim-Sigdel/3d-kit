import { Matrix4, Vector3 } from 'three'
import { type InstanceLayout } from '../components/InstancedGrid'

// Scratch reused across every place() call — allocating inside the per-instance
// loop would churn the GC at thousands of calls/frame.
const scratchScale = new Vector3()
const scratchRot = new Matrix4()

export interface OrigamiFoldOptions {
  count?: number
  /** Instances per accordion row; remaining instances wrap to the next row. */
  perRow?: number
  /** Spacing between hinge points along a row. */
  panelSize?: number
  /** Fold cycle speed. */
  speed?: number
  /** Peak fold angle in radians (how sharply panels crease). */
  maxAngle?: number
  /** How much the cursor biases the fold phase, for interactive folding. */
  cursorBias?: number
}

/**
 * Origami Fold — rows of panels hinge up and down accordion-style. Each panel
 * pivots around its row's baseline, with alternating panels folding in
 * opposite directions so the row zig-zags like a paper fan opening and closing.
 */
export function origamiFold(opts: OrigamiFoldOptions = {}): InstanceLayout {
  const {
    count = 900,
    perRow = 30,
    panelSize = 0.4,
    speed = 1,
    maxAngle = Math.PI * 0.45,
    cursorBias = 0.6,
  } = opts

  return {
    id: 'origami-fold',
    name: 'Origami Fold',
    count,
    place(i, t, m, ctx) {
      const col = i % perRow
      const row = Math.floor(i / perRow)

      // Stable per-row phase offset so rows fold out of sync, not in lockstep.
      // sin-hash of the row index keeps it deterministic (no RNG / clock).
      const rowPhase = Math.sin(row * 78.233) * Math.PI

      // Fold amount oscillates 0..1; cursor.y nudges the whole sheet's phase so
      // moving the mouse drives the fold open/closed.
      const drive = t * speed + rowPhase + ctx.mouse[1] * cursorBias
      const fold = 0.5 + 0.5 * Math.sin(drive)
      const angle = fold * maxAngle

      // Accordion math: a creased strip of equal panels. The horizontal reach of
      // each panel shrinks by cos(angle) as it folds up; vertical zig-zag rises
      // by sin(angle), flipping sign every other panel to form the pleats.
      const cosA = Math.cos(angle)
      const sinA = Math.sin(angle)
      const zig = col % 2 === 0 ? 1.0 : -1.0

      // Center the row about origin so it folds symmetrically.
      const centered = col - (perRow - 1) * 0.5
      const x = centered * panelSize * cosA + ctx.mouse[0] * cursorBias
      const y = zig * sinA * panelSize * 0.5 + (row - 1.5) * panelSize * 1.2
      const z = Math.sin(row * 12.9898) * panelSize // slight per-row depth jitter

      m.makeTranslation(x, y, z)

      // Tilt each panel to match its crease so the faces read as folded paper.
      m.multiply(scratchRot.makeRotationZ(zig * angle))

      // Panels stay flat/thin; squash on Y a touch as they fold for a paper feel.
      const s = panelSize * 0.9
      m.scale(scratchScale.set(s, s * (0.4 + 0.6 * cosA), s * 0.08))
    },
  }
}
