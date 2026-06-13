import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { InteractiveSurface, Stage, bioluminescent, heatHaze, voronoiCells } from '@o3s/lib'
import { StudioBackdrop, type Band, type Theme } from '../studio/StudioBackdrop'
import {
  COMPONENTS,
  HOW_IT_WORKS,
  INSTALL,
  RESOURCES,
  TOOLBOX,
  type ComponentShowcase,
} from './content'
import '../studio/studio.css'
import './landing.css'

/**
 * easy-3dkit landing page (route "/").
 *
 * Built ON the kit and styled with the Novaforge studio CSS — same layout,
 * same themed glass chrome, same scroll-banded 3D backdrop — but the content
 * sells easy-3dkit itself: what it is, how to install it, the components you
 * can drop in, and where to go to try them live.
 */

const ART_MATERIALS = {
  heatHaze,
  voronoiCells,
  bioluminescent,
} as const

const BANDS: Band[] = ['hero', 'games', 'universe', 'tech', 'careers', 'footer']

/** Which section band currently owns the viewport midline. */
function useActiveBand(): Band {
  const [band, setBand] = useState<Band>('hero')
  useEffect(() => {
    const onScroll = () => {
      const mid = window.scrollY + window.innerHeight / 2
      let active: Band = 'hero'
      for (const b of BANDS) {
        const el = document.getElementById(b)
        if (!el) continue
        const top = el.getBoundingClientRect().top + window.scrollY
        if (top <= mid) active = b
      }
      setBand(active)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])
  return band
}

/** Reveal-on-scroll, one-shot per element (matches the studio behavior). */
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.studio .reveal')
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('revealed')
            io.unobserve(e.target)
          }
        }
      },
      { threshold: 0.15 },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])
}

function Wordmark() {
  return (
    <>
      easy<span className="mark-dot">·</span>3dkit
    </>
  )
}

/** A small "npm install" block with a copy button. */
function InstallBlock() {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(INSTALL)
    } catch {
      console.log(INSTALL)
    }
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }
  return (
    <div className="install glass">
      <code>
        <span className="install-prompt">$</span> {INSTALL}
      </code>
      <button className="install-copy" onClick={copy} aria-label="Copy install command">
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  )
}

function ComponentCard({ item, index }: { item: ComponentShowcase; index: number }) {
  const material = ART_MATERIALS[item.art]
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(item.code)
    } catch {
      console.log(item.code)
    }
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }
  return (
    <article className="game-card glass reveal">
      <div className="game-visual">
        <Stage background={null} defaultLights={false} camera={{ position: [0, 0, 3.2], fov: 450 }}>
          <InteractiveSurface material={material} size={[7, 8]} params={item.artParams} />
        </Stage>
        <span className="game-index">{String(index + 1).padStart(2, '0')}</span>
      </div>
      <div className="game-info">
        <div className="game-meta">
          <span className="pill">{item.family}</span>
          <span className="pill pill-status">{item.status}</span>
        </div>
        <h3>{item.title}</h3>
        <p className="game-tagline">{item.tagline}</p>
        <p className="game-desc">{item.description}</p>
        <div className="code-block">
          <button className="code-copy" onClick={copy}>
            {copied ? 'Copied' : 'Copy'}
          </button>
          <pre>
            <code>{item.code}</code>
          </pre>
        </div>
      </div>
    </article>
  )
}

export default function LandingPage() {
  const band = useActiveBand()
  const [theme, setTheme] = useState<Theme>('dark')

  useReveal()

  // The gallery locks page scroll; this route needs a real scrolling document.
  useEffect(() => {
    document.documentElement.classList.add('studio-scroll')
    return () => document.documentElement.classList.remove('studio-scroll')
  }, [])

  useEffect(() => {
    document.documentElement.style.backgroundColor = theme === 'light' ? '#f4f2ec' : '#0a0b0d'
    return () => {
      document.documentElement.style.backgroundColor = ''
    }
  }, [theme])

  return (
    <div className="studio" data-theme={theme}>
      <StudioBackdrop band={band} theme={theme} />
      <div className="studio-scrim" aria-hidden />

      <nav className="studio-nav glass">
        <a className="nav-brand" href="#hero">
          <Wordmark />
        </a>
        <div className="nav-links">
          <a href="#games">Components</a>
          <a href="#universe">How it works</a>
          <a href="#tech">Toolbox</a>
          <a href="#careers">Get started</a>
        </div>
        <button
          className="theme-toggle theme-toggle-icon"
          onClick={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
          aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          title={theme === 'light' ? 'Dark mode' : 'Light mode'}
        >
          {theme === 'light' ? (
            // Moon — click to go dark.
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
              <path
                d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            // Sun — click to go light.
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
              <circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" strokeWidth="2" />
              <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="12" y1="2.5" x2="12" y2="5" />
                <line x1="12" y1="19" x2="12" y2="21.5" />
                <line x1="2.5" y1="12" x2="5" y2="12" />
                <line x1="19" y1="12" x2="21.5" y2="12" />
                <line x1="5.2" y1="5.2" x2="6.9" y2="6.9" />
                <line x1="17.1" y1="17.1" x2="18.8" y2="18.8" />
                <line x1="18.8" y1="5.2" x2="17.1" y2="6.9" />
                <line x1="6.9" y1="17.1" x2="5.2" y2="18.8" />
              </g>
            </svg>
          )}
        </button>
        <Link className="nav-kit" to="/gallery">
          Open gallery
        </Link>
      </nav>

      <main>
        <section className="hero" id="hero">
          <p className="kicker reveal">Interactive 3D components for React</p>
          <h1 className="reveal d1">
            Drop 3D into any
            <br />
            React site.
          </h1>
          <p className="hero-sub reveal d2">
            easy-3dkit is a library of scroll-reactive surfaces, particle fields, instanced
            layouts and post-processing — built on three.js, React Three Fiber and GSAP.
            Install one package, compose components, ship.
          </p>
          <div className="reveal d3">
            <InstallBlock />
          </div>
          <div className="hero-actions reveal d3">
            <Link className="btn btn-primary" to="/gallery">
              Open the gallery
            </Link>
            <a className="btn btn-ghost" href="#games">
              See components
            </a>
          </div>
          {/* Direct paths into the content: the featured components, one tap away. */}
          <div className="hero-games reveal d3">
            {COMPONENTS.map((c) => (
              <a className="hero-game glass" href="#games" key={c.id}>
                <span className="hero-game-title">{c.title}</span>
                <span className="hero-game-meta">
                  {c.family} · {c.status}
                </span>
              </a>
            ))}
          </div>
        </section>

        <section className="games" id="games">
          <header className="section-head reveal">
            <p className="kicker">Components</p>
            <h2>Composable building blocks.</h2>
            <p className="section-sub">
              Each one is props-driven and copy-pasteable. These are three of twenty-plus.
            </p>
          </header>
          <div className="game-list">
            {COMPONENTS.map((c, i) => (
              <ComponentCard key={c.id} item={c} index={i} />
            ))}
          </div>
        </section>

        <section className="universe" id="universe">
          <header className="section-head reveal">
            <p className="kicker">How it works</p>
            <h2>Install, compose, drive, ship.</h2>
            <p className="section-sub">
              Four ideas behind the kit. The components stay portable; you bring the page.
            </p>
          </header>
          <div className="pillars">
            {HOW_IT_WORKS.map((block) => (
              <div className="pillar glass reveal" key={block.kicker}>
                <span className="pillar-name">{block.kicker}</span>
                <h3>{block.title}</h3>
                <p>{block.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="tech" id="tech">
          <header className="section-head reveal">
            <p className="kicker">The toolbox</p>
            <h2>Three layers, one import.</h2>
            <p className="section-sub">
              Engine primitives, the components you assemble, and the data that restyles them.
            </p>
          </header>
          <div className="pillars">
            {TOOLBOX.map((p) => (
              <div className="pillar glass reveal" key={p.name}>
                <span className="pillar-name">{p.name}</span>
                <h3>{p.title}</h3>
                <p>{p.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="careers" id="careers">
          <header className="section-head reveal">
            <p className="kicker">Get started</p>
            <h2>Try it, then build with it.</h2>
            <p className="section-sub">
              Tinker live in the gallery, browse the feature tour, or install the package.
            </p>
          </header>
          <ul className="roles">
            {RESOURCES.map((r) =>
              r.href.startsWith('http') ? (
                <li className="role glass reveal" key={r.title}>
                  <div>
                    <h3>{r.title}</h3>
                    <p>{r.team} · {r.type}</p>
                  </div>
                  <a className="btn btn-ghost" href={r.href} target="_blank" rel="noreferrer">
                    Open
                  </a>
                </li>
              ) : (
                <li className="role glass reveal" key={r.title}>
                  <div>
                    <h3>{r.title}</h3>
                    <p>{r.team} · {r.type}</p>
                  </div>
                  <Link className="btn btn-ghost" to={r.href}>
                    Open
                  </Link>
                </li>
              ),
            )}
          </ul>
        </section>

        <footer className="studio-footer" id="footer">
          <div className="footer-cta">
            <h2>Build something in 3D.</h2>
            <p>One package, a Stage, and a component. That is the whole setup.</p>
            <Link className="btn btn-primary" to="/gallery">
              Open the gallery
            </Link>
          </div>
          <div className="footer-bar">
            <span className="nav-brand">
              <Wordmark />
            </span>
            <div className="footer-links">
              <a href="#games">Components</a>
              <a href="#universe">How it works</a>
              <a href="#tech">Toolbox</a>
              <a href="#careers">Get started</a>
            </div>
            <span className="footer-note">
              MIT licensed. This site is rendered live with easy-3dkit.
            </span>
          </div>
        </footer>
      </main>
    </div>
  )
}
