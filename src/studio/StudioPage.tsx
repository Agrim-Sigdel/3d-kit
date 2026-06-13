import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CardFlip,
  ElasticJiggle,
  ExplodedView,
  FloatingObject,
  InstancedGrid,
  MagneticGroup,
  MorphShape,
  PathSpline,
  PopupFold,
  PortalRing,
  ScrollAnimator,
  SquashStretch,
  Stage,
  gearField,
  kineticRing,
  waveGrid,
} from '@o3s/lib'
import { ClayBackdrop, type ClayTheme } from './ClayBackdrop'
import { NOTES, PIECES, PROCESS, STATS, VISIT, type Piece } from './content'
import './clay.css'

/**
 * Kiln & Clay — a small wheel-thrown pottery studio.
 *
 * The demo site. It shares NOTHING structural with the library's home page:
 * a fixed left rail instead of a centred pill nav, an asymmetric hero with a
 * live feature object, inline per-section 3D (every kit component family makes
 * an appearance), a marquee, a numbered process timeline, an interactive
 * studio-floor grid, a notes wall and a visit card. One calm ClayBackdrop
 * sits behind it all; the warm palette is fixed site-wide.
 */

/* The piece "key art" is a different kit component per piece, so the
 * collection reads as a sampler of the library rather than six of the same
 * card. Each is tinted to the wine / cream / tan palette. */
function PieceArt({ piece }: { piece: Piece }) {
  switch (piece.art) {
    case 'morph':
      return <MorphShape color="#810b38" speed={0.5} size={1.5} segments={48} />
    case 'cardflip':
      return <CardFlip color="#dcc3aa" speed={0.7} count={3} size={[1.5, 2]} idleTilt={0.25} />
    case 'popup':
      return (
        <PopupFold
          color="#f1e2d1"
          speed={0.5}
          count={5}
          panelSize={[2, 2.4]}
          foldAngle={1.1}
        />
      )
    case 'portal':
      return <PortalRing color="#810b38" speed={0.9} radius={1.7} thickness={0.42} particleCount={500} />
    case 'explode':
      return <ExplodedView color="#dcc3aa" speed={0.5} count={4} spread={1.6} size={2.4} />
    case 'spline':
      return (
        <PathSpline
          color="#810b38"
          speed={0.6}
          size={0.32}
          ghostCount={9}
          frequencies={[2, 3, 1]}
        />
      )
  }
}

function PieceCard({ piece, index }: { piece: Piece; index: number }) {
  const sold = piece.status === 'sold out'
  return (
    <article className={'piece' + (sold ? ' is-sold' : '')}>
      <div className="piece-art">
        <Stage background={null} camera={{ position: [0, 0, 5], fov: 45 }}>
          <ScrollAnimator entrance="rise" idle="bob" idleAmplitude={0.04}>
            <PieceArt piece={piece} />
          </ScrollAnimator>
        </Stage>
        <span className="piece-no">{String(index + 1).padStart(2, '0')}</span>
        <span className={'piece-status status-' + piece.status.replace(/\s+/g, '-')}>
          {piece.status}
        </span>
      </div>
      <div className="piece-body">
        <h3>{piece.name}</h3>
        <p className="piece-note">{piece.note}</p>
        <p className="piece-desc">{piece.body}</p>
        <dl className="piece-spec">
          <div>
            <dt>Clay</dt>
            <dd>{piece.clay}</dd>
          </div>
          <div>
            <dt>Glaze</dt>
            <dd>{piece.glaze}</dd>
          </div>
          <div>
            <dt>Price</dt>
            <dd>{piece.price}</dd>
          </div>
        </dl>
        <button className="btn btn-line" disabled={sold}>
          {sold ? 'Sold out' : piece.status === 'made to order' ? 'Order one' : 'Add to basket'}
        </button>
      </div>
    </article>
  )
}

/** Reveal-on-scroll, one-shot per element. */
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.clay .reveal')
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('shown')
            io.unobserve(e.target)
          }
        }
      },
      { threshold: 0.18 },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])
}

const SECTIONS = [
  { id: 'top', label: 'Studio' },
  { id: 'shelf', label: 'The shelf' },
  { id: 'making', label: 'How it’s made' },
  { id: 'floor', label: 'The studio' },
  { id: 'notes', label: 'Notes' },
  { id: 'visit', label: 'Visit' },
]

/** Track which section the rail should mark as current. */
function useActiveSection(): string {
  const [active, setActive] = useState('top')
  useEffect(() => {
    const onScroll = () => {
      const mid = window.scrollY + window.innerHeight * 0.35
      let cur = 'top'
      for (const s of SECTIONS) {
        const el = document.getElementById(s.id)
        if (!el) continue
        if (el.getBoundingClientRect().top + window.scrollY <= mid) cur = s.id
      }
      setActive(cur)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return active
}

function Wordmark() {
  return (
    <>
      Kiln <span className="amp">&amp;</span> Clay
    </>
  )
}

export default function StudioPage() {
  const [theme, setTheme] = useState<ClayTheme>('warm')
  const active = useActiveSection()
  const railRef = useRef<HTMLDivElement>(null)
  useReveal()

  // The gallery locks page scroll; this route needs a real scrolling document.
  useEffect(() => {
    document.documentElement.classList.add('studio-scroll')
    return () => document.documentElement.classList.remove('studio-scroll')
  }, [])
  useEffect(() => {
    document.documentElement.style.backgroundColor = theme === 'warm' ? '#f1e2d1' : '#1c0d0d'
    return () => {
      document.documentElement.style.backgroundColor = ''
    }
  }, [theme])

  const scrollNotes = (dir: number) => {
    const rail = railRef.current
    if (rail) rail.scrollBy({ left: dir * rail.clientWidth * 0.8, behavior: 'smooth' })
  }

  return (
    <div className="clay" data-clay-theme={theme}>
      <ClayBackdrop theme={theme} />
      <div className="clay-scrim" aria-hidden />

      {/* Fixed left rail — nothing like the home page's centred pill. */}
      <aside className="rail">
        <a className="rail-mark" href="#top">
          <Wordmark />
        </a>
        <nav className="rail-nav">
          {SECTIONS.map((s) => (
            <a key={s.id} href={'#' + s.id} className={active === s.id ? 'is-here' : ''}>
              <span className="tick" aria-hidden />
              {s.label}
            </a>
          ))}
        </nav>
        <div className="rail-foot">
          <button className="rail-theme" onClick={() => setTheme((t) => (t === 'warm' ? 'kiln' : 'warm'))}>
            {theme === 'warm' ? 'Firing light' : 'Day light'}
          </button>
          <Link className="rail-kit" to="/gallery">
            Built with easy&middot;3dkit
          </Link>
        </div>
      </aside>

      <main className="clay-main">
        {/* ── Hero: asymmetric, live feature object on the right ───── */}
        <section className="hero" id="top">
          <div className="hero-copy">
            <p className="eyebrow reveal">Wheel-thrown pottery &middot; est. 2016</p>
            <h1 className="reveal">
              Pots made
              <br />
              one at a time,
              <br />
              <em>slowly</em>.
            </h1>
            <p className="lede reveal">
              We are two people, two old wheels and one gas kiln in the back of a
              dairy. Everything here was centred, pulled and glazed by hand, then
              fired once a week and unloaded on a Sunday with coffee.
            </p>
            <div className="hero-cta reveal">
              <a className="btn btn-solid" href="#shelf">
                See the shelf
              </a>
              <a className="btn btn-line" href="#visit">
                Visit the studio
              </a>
            </div>
            <ul className="stat-strip reveal">
              {STATS.map((s) => (
                <li key={s.label}>
                  <span className="stat-val">{s.value}</span>
                  <span className="stat-lab">{s.label}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="hero-art">
            <Stage background={null} camera={{ position: [0, 0, 6], fov: 42 }}>
              <ScrollAnimator entrance="scaleIn" idle="sway" rotate={1.2} idleAmplitude={0.06}>
                <FloatingObject
                  shape="torusKnot"
                  color="#810b38"
                  emissive="#541a1a"
                  emissiveIntensity={0.35}
                  roughness={0.7}
                  metalness={0.15}
                  speed={0.5}
                  amplitude={0.25}
                  spin={0.3}
                  scale={1.5}
                />
              </ScrollAnimator>
            </Stage>
            <span className="hero-art-cap">Tide Bowl, on the wheel</span>
          </div>
        </section>

        {/* ── Marquee strip ───────────────────────────────────────── */}
        <div className="marquee" aria-hidden>
          <div className="marquee-track">
            {Array.from({ length: 2 }).map((_, k) => (
              <span key={k}>
                Stoneware <i>&middot;</i> Porcelain <i>&middot;</i> Oxblood reduction{' '}
                <i>&middot;</i> Pulled handles <i>&middot;</i> Fired Fridays <i>&middot;</i>{' '}
                Made by hand <i>&middot;</i> No two the same <i>&middot;</i>{' '}
              </span>
            ))}
          </div>
        </div>

        {/* ── The shelf: collection, alternating editorial rows ───── */}
        <section className="shelf" id="shelf">
          <header className="band-head reveal">
            <span className="band-no">01</span>
            <h2>What&rsquo;s on the shelf right now</h2>
            <p>
              We make in small runs, so the list changes. When a glaze batch runs
              out the colour changes with it. Nothing here is mass-produced and a
              few things are one of one.
            </p>
          </header>
          <div className="piece-grid">
            {PIECES.map((p, i) => (
              <PieceCard key={p.id} piece={p} index={i} />
            ))}
          </div>
        </section>

        {/* ── Making: numbered timeline with a kinetic-ring accent ── */}
        <section className="making" id="making">
          <div className="making-head reveal">
            <span className="band-no">02</span>
            <h2>How it&rsquo;s made</h2>
            <p>
              Four steps, the same every week. We don&rsquo;t cast, we don&rsquo;t
              outsource, and we don&rsquo;t pretend the cracked ones never happened.
            </p>
            <div className="making-art">
              <Stage background={null} camera={{ position: [0, 1.5, 7], fov: 42 }}>
                <ScrollAnimator idle="sway" idleSpeed={0.5}>
                  <InstancedGrid
                    layout={kineticRing({ count: 60, radius: 2.4, spin: 0.5, tumble: 0.2, size: 0.22 })}
                    color="#dcc3aa"
                    emissive="#810b38"
                    emissiveIntensity={0.5}
                    roughness={0.8}
                  />
                </ScrollAnimator>
              </Stage>
            </div>
          </div>
          <ol className="steps">
            {PROCESS.map((s) => (
              <li className="step reveal" key={s.no}>
                <span className="step-no">{s.no}</span>
                <div>
                  <h3>{s.title}</h3>
                  <p>{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* ── The studio floor: interactive, hands-on 3D ──────────── */}
        <section className="floor" id="floor">
          <div className="floor-stage">
            <Stage background={null} camera={{ position: [0, 0, 9], fov: 45 }}>
              <MagneticGroup color="#810b38" count={9} size={0.34} spread={4} strength={1.4} speed={1} />
            </Stage>
            <div className="floor-overlay">
              <span className="band-no">03</span>
              <h2 className="reveal">Come and make a mess</h2>
              <p className="reveal">
                Move your cursor over the clay. We run a beginners&rsquo; wheel
                evening on the first Thursday of the month &mdash; six seats, two
                hours, you keep whatever survives the kiln.
              </p>
              <a className="btn btn-solid reveal" href="#visit">
                Book a wheel evening
              </a>
            </div>
          </div>
          {/* A little band of bouncing test-tiles + a jiggly sample. */}
          <div className="floor-toys reveal">
            <div className="toy">
              <Stage background={null} camera={{ position: [0, 0, 7], fov: 45 }}>
                <SquashStretch color="#dcc3aa" speed={1.1} count={5} size={0.5} bounceHeight={1.4} intensity={0.35} />
              </Stage>
              <span>Glaze test tiles</span>
            </div>
            <div className="toy">
              <Stage background={null} camera={{ position: [0, 0, 7], fov: 45 }}>
                <ElasticJiggle color="#810b38" stiffness={120} damping={6} amplitude={1.4} count={4} size={0.7} />
              </Stage>
              <span>Wet clay, do touch</span>
            </div>
            <div className="toy">
              <Stage background={null} camera={{ position: [0, 1.5, 8], fov: 45 }}>
                <ScrollAnimator idle="sway" idleSpeed={0.4}>
                  <InstancedGrid
                    layout={gearField({ count: 16, spacing: 1.1, spin: 0.6, size: 0.5, tilt: 0.4 })}
                    color="#541a1a"
                    emissive="#810b38"
                    emissiveIntensity={0.6}
                    metalness={0.3}
                    roughness={0.6}
                  />
                </ScrollAnimator>
              </Stage>
              <span>The old electric wheel</span>
            </div>
          </div>
        </section>

        {/* ── Notes wall: horizontal snap rail ────────────────────── */}
        <section className="notes" id="notes">
          <header className="band-head reveal">
            <span className="band-no">04</span>
            <h2>Notes people have sent us</h2>
            <p>Pinned to the wall by the kiln. Lightly edited for length, not flattery.</p>
          </header>
          <div className="notes-wrap">
            <button className="note-arrow" onClick={() => scrollNotes(-1)} aria-label="Previous">
              &#8249;
            </button>
            <div className="notes-rail" ref={railRef}>
              {NOTES.map((n) => (
                <figure className="note reveal" key={n.who}>
                  <blockquote>{n.body}</blockquote>
                  <figcaption>
                    <span className="note-who">{n.who}</span>
                    <span className="note-where">{n.where}</span>
                  </figcaption>
                </figure>
              ))}
            </div>
            <button className="note-arrow" onClick={() => scrollNotes(1)} aria-label="Next">
              &#8250;
            </button>
          </div>
        </section>

        {/* ── Visit / footer ──────────────────────────────────────── */}
        <footer className="visit" id="visit">
          <div className="visit-grid">
            <div className="visit-art">
              <Stage background={null} camera={{ position: [0, 0, 8], fov: 45 }}>
                <ScrollAnimator idle="bob" idleAmplitude={0.05}>
                  <InstancedGrid
                    layout={waveGrid({ cols: 16, spacing: 0.5, amplitude: 0.5, frequency: 0.8, speed: 1.2 })}
                    color="#dcc3aa"
                    emissive="#810b38"
                    emissiveIntensity={0.4}
                    roughness={0.85}
                  />
                </ScrollAnimator>
              </Stage>
            </div>
            <div className="visit-copy">
              <span className="band-no">05</span>
              <h2 className="reveal">Come by on a Saturday</h2>
              <p className="reveal">{VISIT.line1}</p>
              <p className="reveal">{VISIT.line2}</p>
              <div className="visit-lines reveal">
                <a className="visit-link" href={'mailto:' + VISIT.email}>
                  {VISIT.email}
                </a>
                <a className="visit-link" href={'tel:' + VISIT.phone.replace(/\D/g, '')}>
                  {VISIT.phone}
                </a>
              </div>
            </div>
          </div>
          <div className="visit-bar">
            <span className="rail-mark static">
              <Wordmark />
            </span>
            <span className="visit-note">
              A made-up pottery studio, built as a demo. Every shape on the page is
              rendered live with easy&middot;3dkit.
            </span>
            <Link className="rail-kit" to="/gallery">
              Open the gallery
            </Link>
          </div>
        </footer>
      </main>
    </div>
  )
}
