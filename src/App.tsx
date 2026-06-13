import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Leva, useControls } from 'leva'
import {
  Stage,
  CameraRig,
  ScrollAnimator,
  useInputMode,
  setInputMode,
  toggleInputMode,
  setScrollOverride,
  type EaseName,
  type EntranceMode,
  type IdleMode,
  type ViewAngle,
} from '@o3s/lib'
import { registry, type Family } from './gallery/registry'
import { toO3SConfig, type O3SConfig } from './gallery/O3SElement'
import { levaTheme } from './gallery/levaTheme'
import { viewGroup, animationGroup } from './gallery/controls'
import { generateCode, DEFAULT_ANIMATION, type AnimationValues } from './gallery/codegen'
import { schemaDefaults } from './gallery/schema'
import { DocsPanel } from './gallery/DocsPanel'
import { DEFAULT_VIEW } from '@o3s/lib'
import { OnboardingToast, ShortcutsOverlay } from './gallery/Overlays'

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

  // Sidebar search — filter the component list by name / description / family.
  // Case-insensitive, whitespace-trimmed.
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()
  const matches = (e: (typeof registry)[number]) =>
    !q ||
    e.name.toLowerCase().includes(q) ||
    e.description.toLowerCase().includes(q) ||
    e.family.toLowerCase().includes(q)
  const filtered = registry.filter(matches)

  // Mobile: the sidebar is an off-canvas drawer toggled by a hamburger.
  const [navOpen, setNavOpen] = useState(false)

  // Desktop: the sidebar can be collapsed to reclaim the full stage. Persisted
  // so the choice sticks across reloads. (Mobile uses navOpen instead.)
  // Default collapsed so the live scene is front-and-centre on first load;
  // a stored '0' (user explicitly expanded) overrides that default.
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('o3s.gallery.sidebarCollapsed') !== '0'
    } catch {
      return true
    }
  })
  const toggleSidebar = () =>
    setSidebarCollapsed((c) => {
      const next = !c
      try {
        localStorage.setItem('o3s.gallery.sidebarCollapsed', next ? '1' : '0')
      } catch {
        // ignore — persistence is best-effort
      }
      return next
    })

  // Per-effect docs panel (props table + live usage snippet).
  const [docsOpen, setDocsOpen] = useState(false)

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

  // App-level Camera store — persists across effect switches, drives the
  // CameraRig's declarative view, and is captured by Copy code / Copy JSON.
  // Hand-orbiting in View mode writes back into these sliders (two-way sync).
  // Camera and Animation are collapsed by default so opening the controls
  // panel shows the component's own settings first; these app-level folders
  // are there when you want them but don't bury the per-effect knobs.
  const [viewValues, setViewValues] = useControls('Camera', () => viewGroup(), {
    collapsed: true,
  })
  const view: ViewAngle = viewValues

  // App-level Animation store — the ScrollAnimator wrapper around EVERY
  // effect. All channels default to off, so it's a passthrough until used.
  const [animRaw, setAnimValues] = useControls('Animation', () => animationGroup(), {
    collapsed: true,
  })
  const animation = animRaw as unknown as AnimationValues & {
    ease: EaseName
    entrance: EntranceMode
    idle: IdleMode
  }
  const anyScrollChannel =
    animation.rotate !== 0 ||
    animation.zoom !== 0 ||
    animation.lift !== 0 ||
    animation.parallax !== 0 ||
    animation.reveal !== 0 ||
    animation.drift !== 0

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

  const writeClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      // Clipboard API blocked (insecure context / permissions) — fall back to
      // logging so the content is still recoverable.
      console.log(text)
    }
  }

  // "Copy code" — generate the exact, ready-to-paste React file for the
  // current effect, leva values, camera view, and animation settings.
  const [copiedCode, setCopiedCode] = useState(false)
  const copyCode = async () => {
    await writeClipboard(
      generateCode(active, values as Record<string, unknown>, { view, animation }),
    )
    setCopiedCode(true)
    window.setTimeout(() => setCopiedCode(false), 1500)
  }

  // "Copy JSON" — serialize the active effect's live leva values (plus any
  // non-default view/animation) into a portable O3SConfig blob. Paste it into
  // a site's content file, or straight into <O3SElement config={...} />.
  const [copied, setCopied] = useState(false)
  const copyConfig = async () => {
    const config = toO3SConfig(active.id, values as Record<string, unknown>, { view, animation })
    await writeClipboard(JSON.stringify(config, null, 2))
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  // "Export" — download the active effect's config as a .json file, named by
  // effect id. Same O3SConfig shape as Copy JSON, just a file instead of clipboard.
  const exportConfig = () => {
    const config = toO3SConfig(active.id, values as Record<string, unknown>, { view, animation })
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
      const config = JSON.parse(await file.text()) as Partial<O3SConfig>
      const entry = config.id ? registry.find((e) => e.id === config.id) : undefined
      if (!entry) {
        setImportError(`Unknown effect "${config.id ?? '(missing id)'}"`)
        return
      }
      const params = config.params ?? {}
      // Restore camera + animation too — absent fields reset to defaults so an
      // old (v1) config doesn't inherit this session's leftover settings.
      setViewValues({
        azimuth: config.view?.azimuth ?? 0,
        elevation: config.view?.elevation ?? 0,
        distance: config.view?.distance ?? 6,
      })
      setAnimValues({ ...DEFAULT_ANIMATION, ...config.animation } as never)
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

  // "Reset" — restore the active effect's control defaults plus the default
  // camera view and a passthrough animation. Reuses the same set() bridge as
  // Import, so the leva panel and the scene snap back together.
  const resetConfig = () => {
    setImportError(null)
    setValues(schemaDefaults(active.controls) as never)
    setViewValues({
      azimuth: DEFAULT_VIEW.azimuth,
      elevation: DEFAULT_VIEW.elevation,
      distance: DEFAULT_VIEW.distance,
    })
    setAnimValues({ ...DEFAULT_ANIMATION } as never)
  }

  // "Apply preset" — push a curated partial param set into the live panel.
  const applyPreset = (params: Record<string, unknown>) => setValues(params as never)

  // Keyboard shortcuts cheat-sheet overlay.
  const [shortcutsOpen, setShortcutsOpen] = useState(false)

  // On touch / phones there's no hover, so the dock (info + actions) is
  // revealed by an explicit toggle instead. Desktop ignores this and uses
  // :hover / :focus-within (see index.css).
  const [dockOpen, setDockOpen] = useState(false)
  // Collapse the dock again whenever the active effect changes, so switching
  // components on mobile returns to the compact name-only state.
  useEffect(() => {
    setDockOpen(false)
  }, [activeId])

  // "More" menu (Copy JSON / Export / Import) — keeps the header uncluttered.
  const [moreOpen, setMoreOpen] = useState(false)
  const moreRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!moreOpen) return
    const onDoc = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false)
    }
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMoreOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onEsc)
    }
  }, [moreOpen])

  // Search box ref so "/" can focus it from anywhere.
  const searchRef = useRef<HTMLInputElement>(null)

  // ScrollScene effects are driven by scroll progress, not the cursor — so the
  // Interact/View toggle is meaningless for them. Instead we visualise their
  // scroll range with a slider + auto-play that drives the scroll override.
  // The same visualiser appears whenever a ScrollAnimator channel is active,
  // whatever the effect's family.
  const isScrollFamily = active.family === 'ScrollScene'
  const scrollDriven = isScrollFamily || anyScrollChannel
  const [scroll, setScroll] = useState(0)
  const [autoPlay, setAutoPlay] = useState(true)
  const rafRef = useRef(0)

  // Apply / clear the scroll override based on whether anything is scroll-driven.
  useEffect(() => {
    if (scrollDriven) setScrollOverride(scroll)
    else setScrollOverride(null)
    return () => setScrollOverride(null)
  }, [scrollDriven, scroll])

  // Auto-play loop: sweep scroll 0→1→0 so the scroll behaviour plays on its own.
  useEffect(() => {
    if (!scrollDriven || !autoPlay) return
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
  }, [scrollDriven, autoPlay])

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

  // Gallery navigation shortcuts: arrows / j / k walk the FILTERED list, "/"
  // focuses search, "?" toggles the cheat-sheet, Esc clears search / closes
  // panels. Suppressed while typing in a field so it never hijacks input.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null
      const typing =
        el &&
        (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)

      if (e.key === '/' && !typing) {
        e.preventDefault()
        searchRef.current?.focus()
        return
      }
      if (e.key === '?') {
        e.preventDefault()
        setShortcutsOpen((o) => !o)
        return
      }
      if (e.key === '[' && !typing) {
        e.preventDefault()
        toggleSidebar()
        return
      }
      if (e.key === 'Escape') {
        if (shortcutsOpen) setShortcutsOpen(false)
        else if (docsOpen) setDocsOpen(false)
        else if (query) setQuery('')
        else if (typing) (el as HTMLInputElement).blur()
        return
      }

      // List navigation — only when not typing, and the active item is in view.
      const isPrev = e.key === 'ArrowUp' || (!typing && e.key === 'k')
      const isNext = e.key === 'ArrowDown' || (!typing && e.key === 'j')
      if ((isPrev || isNext) && filtered.length > 0) {
        e.preventDefault()
        const idx = filtered.findIndex((x) => x.id === activeId)
        const base = idx === -1 ? 0 : idx
        const next = isNext
          ? (base + 1) % filtered.length
          : (base - 1 + filtered.length) % filtered.length
        setActiveId(filtered[next].id)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [filtered, activeId, query, docsOpen, shortcutsOpen])

  return (
    <div
      className={
        'app' + (sidebarCollapsed ? ' sidebar-collapsed' : '') + (navOpen ? ' nav-open' : '')
      }
    >
      {/* Full-bleed live scene — the thing every glass panel blurs. */}
      <div className="stage-layer">
        <Stage background={null}>
          {/* The Animation store wraps EVERY effect; with all channels off it
              is a plain passthrough group. */}
          <ScrollAnimator {...animation}>
            {active.render(values as Record<string, unknown>)}
          </ScrollAnimator>
          {/* Camera is a SEPARATE entity, not part of any effect. It only
              responds in View mode, so it never fights cursor-bound effects.
              Present on every effect — you can always orbit the view. The
              Camera sliders drive it, and hand-orbits write back into them. */}
          <CameraRig
            view={view}
            onViewChange={(v) =>
              setViewValues({
                azimuth: Math.round(v.azimuth),
                elevation: Math.round(v.elevation),
                distance: Math.round(v.distance * 10) / 10,
              })
            }
          />
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

      {/* Desktop "show sidebar" rail — only visible while collapsed. */}
      <button
        className="sidebar-rail glass"
        onClick={toggleSidebar}
        aria-label="Show sidebar"
        title="Show sidebar"
      >
        <span className="chevron right" aria-hidden />
      </button>

      {/* Floating glass sidebar — off-canvas drawer on mobile. */}
      <aside className={navOpen ? 'sidebar glass open' : 'sidebar glass'}>
        <div className="brand">
          <span className="logo">O3S</span>
          <span className="tagline">3d&#8202;kit</span>
          {/* Desktop-only collapse toggle. */}
          <button
            className="sidebar-collapse"
            onClick={toggleSidebar}
            aria-label="Collapse sidebar"
            title="Collapse sidebar"
          >
            <span className="chevron left" aria-hidden />
          </button>
        </div>

        {/* Search / filter the component list. */}
        <div className="search">
          <svg className="search-icon" viewBox="0 0 24 24" aria-hidden>
            <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
            <line x1="16.5" y1="16.5" x2="21" y2="21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            ref={searchRef}
            type="search"
            placeholder="Search  ( / )"
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

        <nav className="nav" role="listbox" aria-label="Components">
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
                      role="option"
                      aria-selected={e.id === activeId}
                      className={e.id === activeId ? 'item active' : 'item'}
                      onClick={() => {
                        setActiveId(e.id)
                        setNavOpen(false)
                      }}
                    >
                      <span className="dot" />
                      {e.name}
                    </button>
                  ))}
              </div>
            ))
          )}
        </nav>

        <footer>
          {q ? `${filtered.length} of ${registry.length}` : `${registry.length} effects · 6 families`}
          <Link className="demo-link" to="/">
            Home: easy-3dkit
          </Link>
          <Link className="demo-link" to="/studio">
            Demo site: Novaforge
          </Link>
          <Link className="demo-link" to="/showcase">
            Feature tour: Showcase
          </Link>
        </footer>
      </aside>

      {/* Floating info + actions dock. Compact by default (just the name and
          description); hover or focus reveals chips, presets, and the action
          card. The dock stays expanded while the More menu is open. */}
      <div
        className={
          'preview-dock' +
          (moreOpen || dockOpen ? ' is-open' : '') +
          (dockOpen ? ' dock-open' : '')
        }
      >
        <header className="preview-header glass">
          <div className="header-meta">
            <span className="chip">{active.family}</span>
          </div>
          <div className="header-title">
            <h2>{active.name}</h2>
            {/* Touch toggle: phones have no hover, so reveal the dock on tap. */}
            <button
              className="dock-toggle"
              onClick={() => setDockOpen((o) => !o)}
              aria-expanded={dockOpen}
              aria-label={dockOpen ? 'Hide details' : 'Show details'}
            >
              <span className={dockOpen ? 'chevron up' : 'chevron down'} aria-hidden />
            </button>
          </div>
          <p>{active.description}</p>

          {active.presets && active.presets.length > 0 && (
            <div className="presets" role="group" aria-label="Presets">
              <span className="presets-label">Presets</span>
              {active.presets.map((p) => (
                <button
                  key={p.name}
                  className="preset-chip"
                  onClick={() => applyPreset(p.params)}
                >
                  {p.name}
                </button>
              ))}
            </div>
          )}
        </header>

        {/* Separate actions card. */}
        <div className="actions-card glass">
          <button className="copy-config primary" onClick={copyCode}>
            {copiedCode ? 'Copied' : 'Copy code'}
          </button>
          <button className="copy-config" onClick={() => setDocsOpen((o) => !o)}>
            Docs
          </button>
          <button className="copy-config" onClick={resetConfig}>
            Reset
          </button>

          {/* Everything secondary folds into a "More" menu. */}
          <div className="more" ref={moreRef}>
            <button
              className="copy-config more-btn"
              onClick={() => setMoreOpen((o) => !o)}
              aria-haspopup="menu"
              aria-expanded={moreOpen}
              aria-label="More actions"
              title="More actions"
            >
              &#8943;
            </button>
            {moreOpen && (
              <div className="more-menu glass" role="menu">
                <button
                  role="menuitem"
                  onClick={() => {
                    copyConfig()
                    setMoreOpen(false)
                  }}
                >
                  {copied ? 'Copied JSON' : 'Copy JSON'}
                </button>
                <button
                  role="menuitem"
                  onClick={() => {
                    exportConfig()
                    setMoreOpen(false)
                  }}
                >
                  Export config
                </button>
                <button
                  role="menuitem"
                  onClick={() => {
                    importInputRef.current?.click()
                    setMoreOpen(false)
                  }}
                >
                  Import config
                </button>
              </div>
            )}
          </div>

          <button
            className="copy-config icon-btn"
            onClick={() => setShortcutsOpen(true)}
            aria-label="Keyboard shortcuts"
            title="Keyboard shortcuts"
          >
            ?
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
      </div>

      {/* Announce the active component to assistive tech on change. */}
      <div className="sr-only" role="status" aria-live="polite">
        {active.name}
      </div>

      {docsOpen && (
        <DocsPanel
          entry={active}
          values={values as Record<string, unknown>}
          view={view}
          animation={animation}
          onClose={() => setDocsOpen(false)}
        />
      )}

      {/* Bottom control bar. Scroll-driven effects (ScrollScene family, or any
          effect with a ScrollAnimator channel active) get a scroll visualiser
          (slider + auto-play); everything else gets the camera Interact/View
          toggle. The two concerns never share a control. */}
      {scrollDriven ? (
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

      {/* leva, themed to match the glass, and wrapped in a container we own so
          we control its placement (top-right on desktop, lifted above the
          bottom bar on phones) instead of leva's default fixed corner. `fill`
          makes the panel fill this wrapper. Collapsed by default. */}
      <div className="leva-dock">
        <Leva
          key={isCompact ? 'compact' : 'wide'}
          theme={levaTheme}
          titleBar={{ title: 'Controls' }}
          fill
          collapsed
        />
      </div>

      <OnboardingToast />
      {shortcutsOpen && <ShortcutsOverlay onClose={() => setShortcutsOpen(false)} />}
    </div>
  )
}
