import { useEffect, useRef, useState } from 'react'
import { Leva, useControls } from 'leva'
import {
  Stage,
  CameraRig,
  useInputMode,
  setInputMode,
  toggleInputMode,
  setScrollOverride,
} from '@o3s/lib'
import { registry, type Family } from './gallery/registry'
import { levaTheme } from './gallery/levaTheme'

/**
 * Gallery shell (Layer 4) — glassmorphism.
 *
 * The <Stage> is full-bleed in the background; every panel (sidebar, header,
 * leva) floats on top as a frosted-glass surface that blurs the live 3D scene
 * behind it. That "blur what's behind" is what makes glassmorphism read as
 * glass rather than just a translucent box.
 */
export default function App() {
  const [activeId, setActiveId] = useState(registry[0].id)
  const active = registry.find((e) => e.id === activeId) ?? registry[0]

  // Drive the selected component's props from a live leva panel.
  // Keyed by id so switching components rebuilds the panel.
  const values = useControls(active.name, active.controls as never, [active.id])

  // Canonical 6-family order; only show families that have entries.
  const FAMILY_ORDER: Family[] = [
    'InteractiveSurface',
    'ParticleField',
    'InstancedGrid',
    'FloatingObject',
    'ScrollScene',
    'PostFX',
  ]
  const families = FAMILY_ORDER.filter((f) => registry.some((e) => e.family === f))

  const mode = useInputMode()

  // ScrollScene effects are driven by scroll progress, not the cursor — so the
  // Interact/View toggle is meaningless for them. Instead we visualise their
  // scroll range with a slider + auto-play that drives the scroll override.
  const isScrollFamily = active.family === 'ScrollScene'
  const [scroll, setScroll] = useState(0)
  const [autoPlay, setAutoPlay] = useState(true)
  const rafRef = useRef(0)

  // Apply / clear the scroll override based on the active family.
  useEffect(() => {
    if (isScrollFamily) setScrollOverride(scroll)
    else setScrollOverride(null)
    return () => setScrollOverride(null)
  }, [isScrollFamily, scroll])

  // Auto-play loop: sweep scroll 0→1→0 so the scroll behaviour plays on its own.
  useEffect(() => {
    if (!isScrollFamily || !autoPlay) return
    let dir = 1
    let last = performance.now()
    const tick = (now: number) => {
      const dt = (now - last) / 1000
      last = now
      setScroll((s) => {
        let next = s + dir * dt * 0.25 // ~4s per full sweep
        if (next >= 1) { next = 1; dir = -1 }
        else if (next <= 0) { next = 0; dir = 1 }
        return next
      })
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [isScrollFamily, autoPlay])

  // Keyboard shortcut: hold Space (or press V) to flip to View, release to Interact.
  // (Disabled for ScrollScene effects — camera modes don't apply there.)
  useEffect(() => {
    if (isScrollFamily) return
    const down = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault()
        setInputMode('view')
      } else if (e.key === 'v' || e.key === 'V') {
        toggleInputMode()
      }
    }
    const up = (e: KeyboardEvent) => {
      if (e.code === 'Space') setInputMode('interact')
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [isScrollFamily])

  return (
    <div className="app">
      {/* Full-bleed live scene — the thing every glass panel blurs. */}
      <div className="stage-layer">
        <Stage background={null}>
          {active.render(values as Record<string, unknown>)}
          {/* Camera is a SEPARATE entity, not part of any effect. It only
              responds in View mode, so it never fights cursor-bound effects.
              Present on every effect — you can always orbit the view. */}
          <CameraRig />
        </Stage>
      </div>

      {/* Ambient color wash behind the glass, for depth. */}
      <div className="ambient" aria-hidden />

      {/* Floating glass sidebar */}
      <aside className="sidebar glass">
        <div className="brand">
          <span className="logo">O3S</span>
          <span className="tagline">3d&#8202;kit</span>
        </div>

        <nav className="nav">
          {families.map((fam) => (
            <div key={fam} className="cat">
              <h3>{fam}</h3>
              {registry
                .filter((e) => e.family === fam)
                .map((e) => (
                  <button
                    key={e.id}
                    className={e.id === activeId ? 'item active' : 'item'}
                    onClick={() => setActiveId(e.id)}
                  >
                    <span className={`dot diff-${e.difficulty}`} />
                    {e.name}
                  </button>
                ))}
            </div>
          ))}
        </nav>

        <footer>{registry.length} effects · 6 families</footer>
      </aside>

      {/* Floating glass header */}
      <header className="preview-header glass">
        <span className="chip">{active.family}</span>
        <span className={`chip diff diff-${active.difficulty}`}>{active.difficulty}</span>
        <h2>{active.name}</h2>
        <p>{active.description}</p>
      </header>

      {/* Bottom control bar. ScrollScene effects get a scroll visualiser
          (slider + auto-play); everything else gets the camera Interact/View
          toggle. The two concerns never share a control. */}
      {isScrollFamily ? (
        <div className="mode-toggle glass scroll-sim" role="group" aria-label="Scroll">
          <button
            className={autoPlay ? 'mode active' : 'mode'}
            onClick={() => setAutoPlay((p) => !p)}
          >
            {autoPlay ? 'Pause' : 'Play'}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.001}
            value={scroll}
            onChange={(e) => {
              setAutoPlay(false)
              setScroll(parseFloat(e.target.value))
            }}
            aria-label="Scroll progress"
          />
          <span className="hint">scroll {Math.round(scroll * 100)}%</span>
        </div>
      ) : (
        <div className="mode-toggle glass" role="group" aria-label="Input mode">
          <button
            className={mode === 'interact' ? 'mode active' : 'mode'}
            onClick={() => setInputMode('interact')}
          >
            Interact
          </button>
          <button
            className={mode === 'view' ? 'mode active' : 'mode'}
            onClick={() => setInputMode('view')}
          >
            View
          </button>
          <span className="hint">hold Space to orbit</span>
        </div>
      )}

      {/* leva, themed to match the glass */}
      <Leva theme={levaTheme} titleBar={{ title: 'Controls' }} />
    </div>
  )
}
