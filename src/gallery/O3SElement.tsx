import { type ReactNode } from 'react'
import { DEFAULT_VIEW, ScrollAnimator, type ViewAngle } from '@o3s/lib'
import { registry } from './registry'
import { DEFAULT_ANIMATION, type AnimationValues } from './codegen'

/**
 * Portable config <-> live component bridge.
 *
 * The gallery's "Copy JSON" button serializes the active effect into an
 * O3SConfig JSON blob. Drop that same blob into <O3SElement> anywhere (inside
 * a <Stage>) and it rebuilds the exact effect — no per-effect wiring, because
 * the registry already knows how to turn params into a component.
 */
export interface O3SConfig {
  /** Registry id of the effect, e.g. 'heat-haze'. The resolver key. */
  id: string
  /** Master family (informational; helps when reading the JSON by hand). */
  family?: string
  /** Flat leva control values — exactly what registry.render() consumes. */
  params: Record<string, unknown>
  /**
   * Camera viewpoint, present only when it differs from the default.
   * O3SElement renders scene CONTENTS and cannot reach the camera — pass this
   * to your own <CameraRig view={config.view} /> sibling.
   */
  view?: ViewAngle
  /** ScrollAnimator settings, present only when something is active. */
  animation?: Partial<AnimationValues>
}

/**
 * Build an O3SConfig from a gallery entry id, its live leva values, and the
 * app-level camera/animation settings. Default-valued extras are omitted so
 * old configs stay valid and new ones stay minimal.
 */
export function toO3SConfig(
  id: string,
  params: Record<string, unknown>,
  extras?: { view?: ViewAngle; animation?: Partial<AnimationValues> },
): O3SConfig {
  const entry = registry.find((e) => e.id === id)
  const config: O3SConfig = { id, family: entry?.family, params }

  const view = extras?.view
  if (
    view &&
    (Math.abs((view.azimuth ?? 0) - DEFAULT_VIEW.azimuth) >= 0.05 ||
      Math.abs((view.elevation ?? 0) - DEFAULT_VIEW.elevation) >= 0.05 ||
      Math.abs((view.distance ?? 6) - DEFAULT_VIEW.distance) >= 0.05)
  ) {
    config.view = view
  }

  const animation = extras?.animation
  if (animation) {
    const diff = Object.fromEntries(
      Object.entries(animation).filter(
        ([k, v]) => v !== undefined && v !== DEFAULT_ANIMATION[k as keyof AnimationValues],
      ),
    ) as Partial<AnimationValues>
    if (Object.keys(diff).length > 0) config.animation = diff
  }

  return config
}

/**
 * Render an O3SConfig as a live component. Must be mounted inside a <Stage>
 * (it returns scene contents, not a canvas). Returns null + warns if the id
 * is unknown, so a stale config can't crash the page. Animation settings are
 * applied via a ScrollAnimator wrapper; `config.view` is up to the caller's
 * CameraRig (see O3SConfig.view).
 */
export function O3SElement({ config }: { config: O3SConfig }): ReactNode {
  const entry = registry.find((e) => e.id === config.id)
  if (!entry) {
    console.warn(`[O3SElement] unknown effect id "${config.id}" — nothing rendered.`)
    return null
  }
  const content = entry.render(config.params ?? {})
  if (config.animation) {
    return <ScrollAnimator {...config.animation}>{content}</ScrollAnimator>
  }
  return content
}
