import { useEffect, useRef } from 'react'
import { getScrollOverride } from '../engine/scrollDriver'

/**
 * useScrollProgress — page scroll as a 0..1 ref (DOM side, no R3F dependency).
 *
 * This is the "driver" a WEBSITE uses to push values into 3D components.
 * A GAME would instead drive the same components from game state. The
 * component itself doesn't care which — that's the layered design.
 *
 * If a scroll OVERRIDE is set (see engine/scrollDriver), it wins over real page
 * scroll — this is how the gallery visualises scroll-driven effects without an
 * actual scrollable page. Returns a ref (reading it in useFrame is free).
 */
export function useScrollProgress() {
  const progress = useRef(0)

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      progress.current = max > 0 ? window.scrollY / max : 0
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    // Poll the override each frame-ish; cheap and avoids a per-component subscription.
    const id = window.setInterval(() => {
      const o = getScrollOverride()
      if (o !== null) progress.current = o
    }, 16)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      window.clearInterval(id)
    }
  }, [])

  return progress
}
