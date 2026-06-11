import { type ReactNode } from 'react'
import { registry } from './registry'

/**
 * Portable config <-> live component bridge.
 *
 * The gallery's "Copy config" button serializes the active effect into an
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
}

/**
 * Build an O3SConfig from a gallery entry id and its live leva values.
 * Used by the "Copy config" button.
 */
export function toO3SConfig(id: string, params: Record<string, unknown>): O3SConfig {
  const entry = registry.find((e) => e.id === id)
  return { id, family: entry?.family, params }
}

/**
 * Render an O3SConfig as a live component. Must be mounted inside a <Stage>
 * (it returns scene contents, not a canvas). Returns null + warns if the id
 * is unknown, so a stale config can't crash the page.
 */
export function O3SElement({ config }: { config: O3SConfig }): ReactNode {
  const entry = registry.find((e) => e.id === config.id)
  if (!entry) {
    console.warn(`[O3SElement] unknown effect id "${config.id}" — nothing rendered.`)
    return null
  }
  return entry.render(config.params ?? {})
}
