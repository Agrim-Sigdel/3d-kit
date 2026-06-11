/**
 * Easing functions (engine layer).
 *
 * Named, pure t -> t curves (t in 0..1) shared by ScrollAnimator and anyone
 * authoring their own driver. Kept dependency-free on purpose — the kit has
 * no animation library; easing is just math.
 */
export type EaseName = 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' | 'backOut' | 'elasticOut'

export const EASINGS: Record<EaseName, (t: number) => number> = {
  linear: (t) => t,
  easeIn: (t) => t * t * t,
  easeOut: (t) => 1 - Math.pow(1 - t, 3),
  easeInOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  backOut: (t) => {
    const c1 = 1.70158
    const c3 = c1 + 1
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
  },
  elasticOut: (t) => {
    if (t === 0 || t === 1) return t
    return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1
  },
}
