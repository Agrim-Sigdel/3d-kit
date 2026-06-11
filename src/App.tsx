import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
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
import { toO3SConfig } from './gallery/O3SElement'
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

  // Sidebar search — filter the component list by name / description / family /
  // difficulty. Case-insensitive, whitespace-trimmed.
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()
  const matches = (e: (typeof registry)[number]) =>
    !q ||
    e.name.toLowerCase().includes(q) ||
    e.description.toLowerCase().includes(q) ||
    e.family.toLowerCase().includes(q) ||
    e.difficulty.includes(q)
  const filtered = registry.filter(matches)

  // Mobile: the sidebar is an off-canvas drawer toggled by a hamburger.
  const [navOpen, setNavOpen] = useState(false)

  // On phones the leva panel would cover the header band, so collapse it by
  // default there. Tracks the breakpoint live so a rotate/resize re-applies.
  const [isCompact, setIsCompact] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 720px)').matches,
  )
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 720px)')
    const onChange = () => setIsCompact(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  // Drive the selected component's props from a live leva panel.
  // Keyed by id so switching components rebuilds the panel. The function-form
  // schema (() => controls) makes useControls return a [values, set] tuple, so
  // Import can push a loaded config back into the live panel.
  const [values, setValues] = useControls(
    active.name,
    () => active.controls as never,
    [active.id],
  )

  // Canonical 6-family order; only show families that have entries.
  const FAMILY_ORDER: Family[] = [
    'InteractiveSurface',
    'ParticleField',
    'InstancedGrid',
    'FloatingObject',
    'ScrollScene',
    'PostFX',
  ]
  const families = FAMILY_ORDER.filter((f) => filtered.some((e) => e.family === f))

  const mode = useInputMode()

  // "Copy config" — serialize the active effect's live leva values into a
  // portable O3SConfig JSON blob and write it to the clipboard. Paste it into
  // a site's content file, or straight into <O3SElement config={...} />.
  const [copied, setCopied] = useState(false)
  const copyConfig = async () => {
    const config = toO3SConfig(active.id, values as Record<string, unknown>)
    const json = JSON.stringify(config, null, 2)
    try {
      await navigator.clipboard.writeText(json)
    } catch {
      // Clipboard API blocked (insecure context / permissions) — fall back to
      // logging so the config is still recoverable.
      console.log(json)
    }
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  // "Export" — download the active effect's config as a .json file, named by
  // effect id. Same O3SConfig shape as Copy, just a file instead of clipboard.
  const exportConfig = () => {
    const config = toO3SConfig(active.id, values as Record<string, unknown>)
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${active.id}.o3s.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // "Import" — load an O3SConfig .json and preview it live. If its id matches a
  // known effect we select that effect, then push its params into the leva
  // panel via set() so the controls and the scene both update. Param keys that
  // aren't in the effect's schema are ignored by leva.
  const importInputRef = useRef<HTMLInputElement>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const importConfig = async (file: File) => {
    setImportError(null)
    try {
      const config = JSON.parse(await file.text()) as { id?: string; params?: Record<string, unknown> }
      const entry = config.id ? registry.find((e) => e.id === config.id) : undefined
      if (!entry) {
        setImportError(`Unknown effect "${config.id ?? '(missing id)'}"`)
        return
      }
      const params = config.params ?? {}
      // Switching effects rebuilds the panel; set() the params after the new
      // schema mounts (next frame) so it targets the right store.
      if (entry.id !== activeId) {
        setActiveId(entry.id)
        requestAnimationFrame(() => setValues(params as never))
      } else {
        setValues(params as never)
      }
    } catch {
      setImportError('Not a valid config file')
    }
  }

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

      {/* Mobile-only hamburger: opens the off-canvas sidebar drawer. */}
      <button
        className="nav-toggle glass"
        aria-label={navOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={navOpen}
        onClick={() => setNavOpen((o) => !o)}
      >
        <span className={navOpen ? 'burger open' : 'burger'} />
      </button>

      {/* Tap-away scrim behind the open drawer (mobile only). */}
      {navOpen && <div className="nav-scrim" onClick={() => setNavOpen(false)} aria-hidden />}

      {/* Floating glass sidebar — off-canvas drawer on mobile. */}
      <aside className={navOpen ? 'sidebar glass open' : 'sidebar glass'}>
        <div className="brand">
          <span className="logo">O3S</span>
          <span className="tagline">3d&#8202;kit</span>
        </div>

        {/* Search / filter the component list. */}
        <div className="search">
          <svg className="search-icon" viewBox="0 0 24 24" aria-hidden>
            <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
            <line x1="16.5" y1="16.5" x2="21" y2="21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            placeholder="Search components"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search components"
          />
          {query && (
            <button className="search-clear" onClick={() => setQuery('')} aria-label="Clear search">
              &times;
            </button>
          )}
        </div>

        <nav className="nav">
          {families.length === 0 ? (
            <p className="nav-empty">No components match &ldquo;{query}&rdquo;.</p>
          ) : (
            families.map((fam) => (
              <div key={fam} className="cat">
                <h3>{fam}</h3>
                {filtered
                  .filter((e) => e.family === fam)
                  .map((e) => (
                    <button
                      key={e.id}
                      className={e.id === activeId ? 'item active' : 'item'}
                      onClick={() => {
                        setActiveId(e.id)
                        setNavOpen(false)
                      }}
                    >
                      <span className={`dot diff-${e.difficulty}`} />
                      {e.name}
                    </button>
                  ))}
              </div>
            ))
          )}
        </nav>

        <footer>
          {q ? `${filtered.length} of ${registry.length}` : `${registry.length} effects · 6 families`}
          <Link className="demo-link" to="/studio">
            Demo site: Novaforge
          </Link>
        </footer>
      </aside>

      {/* Floating glass header */}
      <header className="preview-header glass">
        <span className="chip">{active.family}</span>
        <span className={`chip diff diff-${active.difficulty}`}>{active.difficulty}</span>
        <h2>{active.name}</h2>
        <p>{active.description}</p>
        <div className="config-actions">
          <button className="copy-config" onClick={copyConfig}>
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button className="copy-config" onClick={exportConfig}>
            Export
          </button>
          <button className="copy-config" onClick={() => importInputRef.current?.click()}>
            Import
          </button>
          <input
            ref={importInputRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) importConfig(file)
              e.target.value = '' // allow re-importing the same file
            }}
          />
        </div>
        {importError && <p className="config-error">{importError}</p>}
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

      {/* leva, themed to match the glass. Collapsed by default on phones so it
          doesn't cover the header band; the key re-applies that on breakpoint
          change. */}
      <Leva
        key={isCompact ? 'compact' : 'wide'}
        theme={levaTheme}
        titleBar={{ title: 'Controls' }}
        collapsed={isCompact}
      />
    </div>
  )
}
