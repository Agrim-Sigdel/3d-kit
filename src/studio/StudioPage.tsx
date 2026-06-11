import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { InteractiveSurface, Stage, bioluminescent, heatHaze, voronoiCells } from '@o3s/lib'
import { StudioBackdrop, type Band, type Theme } from './StudioBackdrop'
import { GAMES, LORE, ROLES, TECH_PILLARS, type Game } from './content'
import './studio.css'

/**
 * Novaforge Interactive — a fictional game studio site built entirely on
 * the O3S kit. The page is a normal scrolling document; a single fixed
 * <StudioBackdrop> behind it swaps its 3D scene per section, and each game
 * card carries its own small live-shader key art.
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

/**
 * Adds .revealed to every .reveal element the first time it enters the
 * viewport; CSS animates the entrance. Observation is one-shot per element.
 */
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
      novaforge<span className="mark-dot">.</span>
    </>
  )
}

function GameCard({ game, index }: { game: Game; index: number }) {
  const material = ART_MATERIALS[game.art]
  return (
    <article className="game-card glass reveal">
      <div className="game-visual">
        <Stage background={null} defaultLights={false} camera={{ position: [0, 0, 3.2], fov: 450 }}>
          <InteractiveSurface material={material} size={[7, 8]} params={game.artParams} />
        </Stage>
        <span className="game-index">{String(index + 1).padStart(2, '0')}</span>
      </div>
      <div className="game-info">
        <div className="game-meta">
          <span className="pill">{game.genre}</span>
          <span className="pill">{game.platforms}</span>
          <span className="pill pill-status">{game.status}</span>
        </div>
        <h3>{game.title}</h3>
        <p className="game-tagline">{game.tagline}</p>
        <p className="game-desc">{game.description}</p>
        <div className="game-actions">
          <button className="btn btn-primary">{game.status === 'Out now' ? 'Buy now' : 'Wishlist'}</button>
          <button className="btn btn-ghost">Watch trailer</button>
        </div>
      </div>
    </article>
  )
}

export default function StudioPage() {
  const band = useActiveBand()
  const [theme, setTheme] = useState<Theme>('light')
  const railRef = useRef<HTMLDivElement>(null)

  const scrollRail = (dir: number) => {
    const rail = railRef.current
    if (rail) rail.scrollBy({ left: dir * rail.clientWidth * 0.75, behavior: 'smooth' })
  }

  useReveal()

  // The gallery locks page scroll (html/body overflow hidden); this route
  // needs a real scrolling document, so flip it on while mounted.
  useEffect(() => {
    document.documentElement.classList.add('studio-scroll')
    return () => document.documentElement.classList.remove('studio-scroll')
  }, [])

  // Keep the document itself on the page color so overscroll never flashes.
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
          <a href="#games">Games</a>
          <a href="#universe">Universe</a>
          <a href="#tech">Technology</a>
          <a href="#careers">Careers</a>
        </div>
        <button
          className="theme-toggle"
          onClick={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
        >
          {theme === 'light' ? 'Dark' : 'Light'}
        </button>
        <Link className="nav-kit" to="/">
          Built with O3S
        </Link>
      </nav>

      <main>
        <section className="hero" id="hero">
          <p className="kicker reveal">Independent game studio, est. 2019</p>
          <h1 className="reveal d1">
            Three sci-fi games.
            <br />
            One persistent universe.
          </h1>
          <p className="hero-sub reveal d2">
            Novaforge is a 41-person, remote-first studio. We build our own engine, publish our
            own titles, and connect every one of them — Axiom Drift, Neon Requiem, Voidborn —
            to the same persistent setting.
          </p>
          <div className="hero-actions reveal d3">
            <a className="btn btn-primary" href="#games">
              Our games
            </a>
            <a className="btn btn-ghost" href="#careers">
              Open roles
            </a>
          </div>
          {/* Direct paths into the content: the three titles, one tap away. */}
          <div className="hero-games reveal d3">
            {GAMES.map((g) => (
              <a className="hero-game glass" href="#games" key={g.id}>
                <span className="hero-game-title">{g.title}</span>
                <span className="hero-game-meta">
                  {g.genre} · {g.status}
                </span>
              </a>
            ))}
          </div>
        
        </section>

        <section className="games" id="games">
          <header className="section-head reveal">
            <p className="kicker">Games</p>
            <h2>One shipped. Two on the way.</h2>
            <p className="section-sub">
              All three titles run on the Forge engine and share a single fictional timeline.
            </p>
          </header>
          <div className="game-list">
            {GAMES.map((g, i) => (
              <GameCard key={g.id} game={g} index={i} />
            ))}
          </div>
        </section>

        <section className="universe" id="universe">
          <header className="section-head reveal">
            <p className="kicker">The universe</p>
            <h2>Decisions travel between our games.</h2>
            <p className="section-sub">
              Four ways the shared setting shows up in play. Scroll the rail, or use the arrows.
            </p>
          </header>
          <div className="lore-rail-wrap">
            <button className="rail-btn" onClick={() => scrollRail(-1)} aria-label="Scroll back">
              &#8249;
            </button>
            <div className="lore-rail" ref={railRef}>
              {LORE.map((block) => (
                <article className="lore-card glass reveal" key={block.kicker}>
                  <p className="kicker">{block.kicker}</p>
                  <h3>{block.title}</h3>
                  <p>{block.body}</p>
                </article>
              ))}
            </div>
            <button className="rail-btn" onClick={() => scrollRail(1)} aria-label="Scroll forward">
              &#8250;
            </button>
          </div>
        </section>

        <section className="tech" id="tech">
          <header className="section-head reveal">
            <p className="kicker">Forge engine</p>
            <h2>We build the technology we ship on.</h2>
            <p className="section-sub">
              Forge is our in-house engine, in development since the studio was founded.
              Three systems define it.
            </p>
          </header>
          <div className="pillars">
            {TECH_PILLARS.map((p) => (
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
            <p className="kicker">Careers</p>
            <h2>Forty-one people. Nine time zones.</h2>
            <p className="section-sub">
              Remote-first since day one. Salary ranges are published on every listing, and
              most of the company is senior.
            </p>
          </header>
          <ul className="roles">
            {ROLES.map((r) => (
              <li className="role glass reveal" key={r.title}>
                <div>
                  <h3>{r.title}</h3>
                  <p>
                    {r.team} · {r.type}
                  </p>
                </div>
                <button className="btn btn-ghost">Apply</button>
              </li>
            ))}
          </ul>
        </section>

        <footer className="studio-footer" id="footer">
          <div className="footer-cta">
            <h2>Get in touch.</h2>
            <p>Press, partnerships, playtests — one inbox, read daily.</p>
            <a className="btn btn-primary" href="mailto:hello@novaforge.games">
              hello@novaforge.games
            </a>
          </div>
          <div className="footer-bar">
            <span className="nav-brand">
              <Wordmark />
            </span>
            <div className="footer-links">
              <a href="#games">Games</a>
              <a href="#universe">Universe</a>
              <a href="#tech">Technology</a>
              <a href="#careers">Careers</a>
            </div>
            <span className="footer-note">
              Fictional studio. Site rendered live with the O3S 3d-kit.
            </span>
          </div>
        </footer>
      </main>
    </div>
  )
}
