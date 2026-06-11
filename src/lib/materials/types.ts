import { type IUniform } from 'three'

/**
 * SurfaceMaterial — the variant contract for shader-driven surface effects.
 *
 * Every InteractiveSurface effect (glassmorphism, thermal, iridescent, …) is
 * just an object of this shape. The InteractiveSurface FAMILY component owns
 * all the plumbing (mesh, the create-once-mutate-in-loop uniform discipline,
 * cursor/scroll/time wiring); a variant only supplies its shaders + uniforms.
 *
 * THE GOLDEN RULE: build `uniforms` once. The family injects the standard
 * uniforms (uTime, uMouse, uScroll, uResolution) and then calls your `update`
 * each frame — mutate `.value` there, never replace the object.
 */
export interface SurfaceMaterial {
  /** Unique id, e.g. 'glassmorphism'. */
  id: string
  /** Human label for the gallery. */
  name: string
  /** Variant-specific uniforms (the family adds the standard ones). */
  uniforms: Record<string, IUniform>
  vertexShader: string
  fragmentShader: string
  /**
   * Optional per-frame hook. `u` is the LIVE merged uniform set (standard +
   * variant). Mutate `.value` fields only. `props` is whatever the gallery /
   * consumer passed (colors, intensities) so the variant can react to controls.
   */
  update?: (u: Record<string, IUniform>, props: Record<string, unknown>) => void
  /** leva control schema for this variant (optional). */
  controls?: Record<string, unknown>
  /**
   * One-line human description per control key (e.g. strength: 'How far the
   * shimmer displaces the gradient'). Surfaces in the gallery docs panel and
   * the generated EFFECTS.md — keep shader knowledge next to the shader.
   */
  docs?: Record<string, string>
  /** Render transparent / double-sided? Defaults: opaque, front-side. */
  transparent?: boolean
  doubleSide?: boolean
}

/** The standard uniforms every surface variant can rely on existing. */
export const STANDARD_SURFACE_UNIFORMS = `
  uniform float uTime;
  uniform vec2  uMouse;       // normalized [-1,1]
  uniform float uScroll;      // 0..1 page progress
  uniform vec2  uResolution;  // canvas px
`
