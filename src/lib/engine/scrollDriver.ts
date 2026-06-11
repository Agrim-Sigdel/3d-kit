import { useSyncExternalStore } from 'react'

/**
 * Scroll driver — an optional override for scroll progress (0..1).
 *
 * Normally useScrollProgress reads the real page scroll. But in contexts with no
 * scrollable page (the gallery's full-bleed canvas, a Storybook frame, tests),
 * there's nothing to scroll — so ScrollScene-family effects would sit frozen at
 * 0. Setting an override here lets a host DRIVE the scroll value directly (a
 * slider, an auto-play loop) so you can visualise the full scroll range in place.
 *
 * override === null  → use real window scroll (default).
 * override is number → force that progress everywhere.
 */
let override: number | null = null
const listeners = new Set<() => void>()

export function getScrollOverride() {
  return override
}

export function setScrollOverride(next: number | null) {
  if (next === override) return
  override = next
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** React hook for UI that needs to reflect the override (re-renders on change). */
export function useScrollOverride() {
  return useSyncExternalStore(subscribe, getScrollOverride, getScrollOverride)
}
