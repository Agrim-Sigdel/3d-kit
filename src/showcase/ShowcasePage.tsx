import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  CameraRig,
  FloatingObject,
  InstancedGrid,
  InteractiveSurface,
  ParticleField,
  PortalRing,
  PostFX,
  ScrollAnimator,
  Stage,
  galaxySpiral,
  glassmorphism,
  holographicFoil,
  orbitLayout,
  type EaseName,
  type EntranceMode,
  type IdleMode,
  type ViewAngle,
} from '@o3s/lib'
import { O3SElement, type O3SConfig } from '../gallery/O3SElement'
import './showcase.css'

/**
 * Showcase — a complete feature tour of easy-3dkit, built with easy-3dkit.
 *
 * Where the studio route shows ONE polished site, this route demonstrates the
 * whole toolbox: viewing angles, every scroll/entrance/idle animation channel,
 * all six effect families, and the config workflow — each section is a live,
 * interactive demo paired with the exact code it runs.
 *
 * WebGL discipline: browsers cap concurrent contexts (~8-16), so each section
 * owns ONE <Stage> and swaps its scene via state, never one canvas per card.
 */

// ── Palette + theme ────────────────────────────────────────────────
// Scene colors are theme-independent: every stage panel carries its own
// blue-tinted backdrop so the same materials read on cream and on night.

const PALETTE = {
  blue: '#7daacb',
  sand: '#e8dbb3',
  cream: '#fffdeb',
  red: '#ce2626',
} as const

type Theme = 'light' | 'dark'

const THEME_BG: Record<Theme, string> = { light: PALETTE.cream, dark: '#0c141b' }

function getInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem('sc-theme')
    if (stored === 'light' || stored === 'dark') return stored
  } catch {
    /* storage unavailable */
  }
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

// ── Small shared pieces ────────────────────────────────────────────

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
    } catch {
      console.log(code)
    }
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }
  return (
    <div className="sc-code">
      <button className="sc-copy" onClick={copy}>
        {copied ? 'Copied' : 'Copy'}
      </button>
      <pre>
        <code>{code}</code>
      </pre>
    </div>
  )
}

function SectionHead({ kicker, title, sub }: { kicker: string; title: string; sub: string }) {
  return (
    <header className="sc-head">
      <p className="sc-kicker">{kicker}</p>
      <h2>{title}</h2>
      <p className="sc-sub">{sub}</p>
    </header>
  )
}

// ── 1. Viewing angle ───────────────────────────────────────────────

const VIEW_PRESETS: Array<{ name: string; view: Required<Pick<ViewAngle, 'azimuth' | 'elevation' | 'distance'>> }> = [
  { name: 'Front', view: { azimuth: 0, elevation: 0, distance: 6 } },
  { name: 'Hero angle', view: { azimuth: 32, elevation: 14, distance: 7 } },
  { name: 'High orbit', view: { azimuth: -50, elevation: 42, distance: 10 } },
  { name: 'Low close-up', view: { azimuth: 65, elevation: -12, distance: 3.5 } },
]

function ViewAngleSection() {
  const [view, setView] = useState(VIEW_PRESETS[1].view)
  const code = `<CameraRig view={{ azimuth: ${view.azimuth}, elevation: ${view.elevation}, distance: ${view.distance} }} />`

  const slider = (
    key: 'azimuth' | 'elevation' | 'distance',
    min: number,
    max: number,
    step: number,
  ) => (
    <label className="sc-slider">
      <span>
        {key} <em>{view[key]}</em>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={view[key]}
        onChange={(e) => setView({ ...view, [key]: parseFloat(e.target.value) })}
      />
    </label>
  )

  return (
    <section className="sc-section" id="view">
      <SectionHead
        kicker="Viewing angle"
        title="Frame the shot in code."
        sub="Every scene's camera takes a declarative view: azimuth, elevation, distance. Drag the sliders or pick a preset; the snippet below is the exact line your project needs."
      />
      <div className="sc-split">
        <div className="sc-stage glass">
          <Stage background={null}>
            <FloatingObject color={PALETTE.red} shape="torusKnot" spin={0.6} amplitude={0.15} />
            <ParticleField count={1200} radius={5} color={PALETTE.blue} size={0.03} opacity={0.5} />
            <CameraRig view={view} />
          </Stage>
        </div>
        <div className="sc-controls glass">
          <div className="sc-presets">
            {VIEW_PRESETS.map((p) => (
              <button
                key={p.name}
                className={
                  p.view.azimuth === view.azimuth &&
                  p.view.elevation === view.elevation &&
                  p.view.distance === view.distance
                    ? 'sc-chip active'
                    : 'sc-chip'
                }
                onClick={() => setView(p.view)}
              >
                {p.name}
              </button>
            ))}
          </div>
          {slider('azimuth', -180, 180, 1)}
          {slider('elevation', -85, 85, 1)}
          {slider('distance', 2, 14, 0.5)}
          <CodeBlock code={code} />
        </div>
      </div>
    </section>
  )
}

// ── 2. Scroll modes ────────────────────────────────────────────────

const SCROLL_CHANNELS = [
  { key: 'rotate', label: 'rotate', amount: 2 },
  { key: 'zoom', label: 'zoom', amount: 4 },
  { key: 'lift', label: 'lift', amount: 2 },
  { key: 'drift', label: 'drift', amount: 1 },
] as const

const EASES: EaseName[] = ['linear', 'easeIn', 'easeOut', 'easeInOut', 'backOut', 'elasticOut']

function ScrollSection() {
  const [on, setOn] = useState<Record<string, boolean>>({ rotate: true, zoom: true })
  const [ease, setEase] = useState<EaseName>('easeInOut')
  const channels = SCROLL_CHANNELS.filter((c) => on[c.key])

  const props = Object.fromEntries(channels.map((c) => [c.key, c.amount]))
  const attrs = channels.map((c) => `${c.key}={${c.amount}}`).join(' ')
  const code = `<ScrollAnimator ${attrs}${attrs ? ' ' : ''}ease="${ease}">
  <InstancedGrid layout={galaxySpiral({ count: 1400 })} color="${PALETTE.blue}" />
</ScrollAnimator>`

  return (
    <section className="sc-section sc-tall" id="scroll">
      <div className="sc-sticky">
        <SectionHead
          kicker="Scroll modes"
          title="The page is the timeline."
          sub="ScrollAnimator binds page scroll to transform channels that all run at once. This galaxy is driven by THIS page's scroll position - keep scrolling and watch it travel."
        />
        <div className="sc-split">
          <div className="sc-stage glass">
            <Stage background={null}>
              <ScrollAnimator {...props} ease={ease}>
                <InstancedGrid layout={galaxySpiral({ count: 1400 })} color={PALETTE.blue} metalness={0.6} roughness={0.3}/>
      <CameraRig view={{ azimuth: 84, elevation: 85, distance: 2 }} />
              </ScrollAnimator>
            </Stage>
          </div>
          <div className="sc-controls glass">
            <p className="sc-label">Channels (composable)</p>
            <div className="sc-presets">
              {SCROLL_CHANNELS.map((c) => (
                <button
                  key={c.key}
                  className={on[c.key] ? 'sc-chip active' : 'sc-chip'}
                  onClick={() => setOn({ ...on, [c.key]: !on[c.key] })}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <p className="sc-label">Easing</p>
            <div className="sc-presets">
              {EASES.map((e) => (
                <button
                  key={e}
                  className={ease === e ? 'sc-chip active' : 'sc-chip'}
                  onClick={() => setEase(e)}
                >
                  {e}
                </button>
              ))}
            </div>
            <CodeBlock code={code} />
          </div>
        </div>
      </div>
    </section>
  )
}

// ── 3. Entrance + idle animation ──────────────────────────────────

const ENTRANCES: EntranceMode[] = ['rise', 'scaleIn', 'spinIn', 'dropIn']
const IDLES: IdleMode[] = ['none', 'bob', 'sway', 'pulse']

function AnimationSection() {
  const [entrance, setEntrance] = useState<EntranceMode>('rise')
  const [idle, setIdle] = useState<IdleMode>('bob')
  const [speed, setSpeed] = useState(1)
  const [replay, setReplay] = useState(0)

  const idleAttr = idle !== 'none' ? ` idle="${idle}"` : ''
  const speedAttr = speed !== 1 ? ` speed={${speed}}` : ''
  const code = `<ScrollAnimator entrance="${entrance}"${idleAttr}${speedAttr}>
  <FloatingObject color="${PALETTE.red}" shape="icosahedron" />
</ScrollAnimator>`

  return (
    <section className="sc-section" id="animation">
      <SectionHead
        kicker="Entrance and idle"
        title="Arrive, then breathe."
        sub="Entrances play once on mount (remount with a React key to replay); idle motion layers endless ambient movement on top. Both are pure transforms - they wrap any effect without touching it."
      />
      <div className="sc-split">
        <div className="sc-stage glass">
          <Stage background={null}>
            <ScrollAnimator
              key={`${entrance}-${idle}-${replay}`}
              entrance={entrance}
              idle={idle}
              speed={speed}
            >
              <FloatingObject color={PALETTE.red} shape="icosahedron" amplitude={0} spin={0.4} />
            </ScrollAnimator>
          </Stage>
        </div>
        <div className="sc-controls glass">
          <p className="sc-label">Entrance</p>
          <div className="sc-presets">
            {ENTRANCES.map((e) => (
              <button
                key={e}
                className={entrance === e ? 'sc-chip active' : 'sc-chip'}
                onClick={() => setEntrance(e)}
              >
                {e}
              </button>
            ))}
            <button className="sc-chip sc-replay" onClick={() => setReplay((r) => r + 1)}>
              Replay
            </button>
          </div>
          <p className="sc-label">Idle</p>
          <div className="sc-presets">
            {IDLES.map((i) => (
              <button
                key={i}
                className={idle === i ? 'sc-chip active' : 'sc-chip'}
                onClick={() => setIdle(i)}
              >
                {i}
              </button>
            ))}
          </div>
          <p className="sc-label">Speed</p>
          <label className="sc-slider">
            <span>
              speed <em>{speed.toFixed(1)}x</em>
            </span>
            <input
              type="range"
              min={0.2}
              max={3}
              step={0.1}
              value={speed}
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
            />
          </label>
          <CodeBlock code={code} />
        </div>
      </div>
    </section>
  )
}

// ── 4. The six families ────────────────────────────────────────────

interface FamilyScene {
  id: string
  name: string
  blurb: string
  code: string
  node: ReactNode
}

const FAMILY_SCENES: FamilyScene[] = [
  {
    id: 'surface',
    name: 'InteractiveSurface',
    blurb: 'A shader plane; each of the 21 effects is a material variant. Cursor, time, and scroll are wired in automatically.',
    code: `import { Stage, InteractiveSurface, glassmorphism } from 'easy-3dkit'

<InteractiveSurface material={glassmorphism} params={{ tint: '${PALETTE.blue}' }} />`,
    node: <InteractiveSurface material={glassmorphism} params={{ tint: PALETTE.blue }} />,
  },
  {
    id: 'particles',
    name: 'ParticleField',
    blurb: 'A GPU point cloud with shaped distributions. Thousands of points, one buffer.',
    code: `import { Stage, ParticleField } from 'easy-3dkit'

<ParticleField count={8000} radius={4.5} color="${PALETTE.blue}" distribution="shell" />`,
    node: <ParticleField count={8000} radius={4.5} color={PALETTE.blue} distribution="shell" />,
  },
  {
    id: 'grid',
    name: 'InstancedGrid',
    blurb: 'Hundreds of meshes in a single draw call; each of the 11 effects is a layout factory.',
    code: `import { Stage, InstancedGrid, orbitLayout } from 'easy-3dkit'

<InstancedGrid layout={orbitLayout({ count: 700, shells: 6 })} color="${PALETTE.sand}" />`,
    node: <InstancedGrid layout={orbitLayout({ count: 700, shells: 6 })} color={PALETTE.sand} metalness={0.5} roughness={0.3} />,
  },
  {
    id: 'floating',
    name: 'FloatingObject',
    blurb: 'Spring-and-motion object wrappers: idle float, spin, hover pop. Twelve standalone components share this family.',
    code: `import { Stage, FloatingObject } from 'easy-3dkit'

<FloatingObject shape="torus" color="${PALETTE.red}" spin={1.2} hoverScale={1.3} />`,
    node: <FloatingObject shape="torus" color={PALETTE.red} spin={1.2} hoverScale={1.3} />,
  },
  {
    id: 'scrollscene',
    name: 'ScrollScene family',
    blurb: 'Scene-scale, time- and scroll-driven set pieces - portals, oceans, flythroughs, exploded views.',
    code: `import { Stage, PortalRing } from 'easy-3dkit'

<PortalRing color="${PALETTE.blue}" speed={1.1} />`,
    node: <PortalRing color={PALETTE.blue} speed={1.1} />,
  },
  {
    id: 'postfx',
    name: 'PostFX',
    blurb: 'Composable bloom, vignette, and grain over the whole frame. Always the last child of Stage.',
    code: `import { Stage, FloatingObject, ParticleField, PostFX } from 'easy-3dkit'

<FloatingObject color="${PALETTE.sand}" />
<ParticleField count={1500} radius={5} color="${PALETTE.blue}" />
<PostFX bloom={1.6} vignette={0.6} noise={0.06} />`,
    node: (
      <>
        <FloatingObject color={PALETTE.sand} />
        <ParticleField count={1500} radius={5} color={PALETTE.blue} />
        <PostFX bloom={1.6} vignette={0.6} noise={0.06} />
      </>
    ),
  },
]

function FamiliesSection() {
  const [index, setIndex] = useState(0)
  const scene = FAMILY_SCENES[index]
  return (
    <section className="sc-section" id="families">
      <SectionHead
        kicker="Six families"
        title="Forty-nine effects, one mental model."
        sub="Every effect belongs to a master family that owns its plumbing. Learn the family once and every variant is a one-line swap."
      />
      <div className="sc-tabs">
        {FAMILY_SCENES.map((s, i) => (
          <button
            key={s.id}
            className={i === index ? 'sc-chip active' : 'sc-chip'}
            onClick={() => setIndex(i)}
          >
            {s.name}
          </button>
        ))}
      </div>
      <div className="sc-split">
        <div className="sc-stage glass">
          <Stage background={null}>{scene.node}</Stage>
        </div>
        <div className="sc-controls glass">
          <h3 className="sc-family-name">{scene.name}</h3>
          <p className="sc-blurb">{scene.blurb}</p>
          <CodeBlock code={scene.code} />
        </div>
      </div>
    </section>
  )
}

// ── 5. Configs (O3SElement) ───────────────────────────────────────

const CONFIGS: O3SConfig[] = [
  {
    id: 'bioluminescent',
    family: 'InteractiveSurface',
    params: { glow: PALETTE.blue, scale: 7 },
    animation: { idle: 'sway', idleAmplitude: 0.1 },
  },
  {
    id: 'cube-swarm-grid',
    family: 'InstancedGrid',
    params: { count: 900, color: PALETTE.red, metalness: 0.26, roughness: 0.3 },
    animation: { entrance: 'scaleIn' },
  },
]

function ConfigSection() {
  const [index, setIndex] = useState(0)
  const config = CONFIGS[index]
  return (
    <section className="sc-section" id="config">
      <SectionHead
        kicker="Configs"
        title="Effects as data."
        sub="The gallery's Copy JSON button emits a portable config: effect id, params, camera view, animation. O3SElement turns it back into a live scene - swap visuals by editing JSON, not components."
      />
      <div className="sc-split">
        <div className="sc-stage glass">
          <Stage background={null}>
            <O3SElement key={index} config={config} />
                    <CameraRig view={{ azimuth: 24, elevation: -56, distance: 2 }} />

          </Stage>
        </div>
        <div className="sc-controls glass">
          <div className="sc-presets">
            {CONFIGS.map((c, i) => (
              <button
                key={c.id}
                className={i === index ? 'sc-chip active' : 'sc-chip'}
                onClick={() => setIndex(i)}
              >
                {c.id}
              </button>
            ))}
          </div>
          <CodeBlock
            code={`const config = ${JSON.stringify(config, null, 2)}

<Stage background={null}>
  <O3SElement config={config} />
</Stage>`}
          />
        </div>
      </div>
    </section>
  )
}

// ── Page shell ─────────────────────────────────────────────────────

export default function ShowcasePage() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)

  // The gallery locks page scroll; this route is a real scrolling document.
  useEffect(() => {
    document.documentElement.classList.add('showcase-scroll')
    return () => {
      document.documentElement.classList.remove('showcase-scroll')
      document.documentElement.style.backgroundColor = ''
    }
  }, [])

  // Keep the document background in step with the theme (overscroll areas).
  useEffect(() => {
    document.documentElement.style.backgroundColor = THEME_BG[theme]
    try {
      localStorage.setItem('sc-theme', theme)
    } catch {
      /* storage unavailable */
    }
  }, [theme])

  return (
    <div className={`showcase ${theme}`}>
      <nav className="sc-nav glass">
        <a className="sc-brand" href="#top">
          easy-3dkit <span className="sc-brand-dim">showcase</span>
        </a>
        <div className="sc-nav-links">
          <a href="#view">View</a>
          <a href="#scroll">Scroll</a>
          <a href="#animation">Animation</a>
          <a href="#families">Families</a>
          <a href="#config">Configs</a>
        </div>
        <button
          className="sc-theme-toggle"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </button>
        <Link className="sc-nav-cta" to="/">
          Open the gallery
        </Link>
      </nav>

      <main id="top">
        <section className="sc-hero">
          <div className="sc-hero-stage">
            <Stage background={null}>
              <ScrollAnimator entrance="rise" idle="sway" idleAmplitude={0.08} rotate={0.5} ease="easeInOut">
                <InteractiveSurface material={holographicFoil} params={{ hueScale: 3.5 }} />
              </ScrollAnimator>
              <ParticleField count={2500} radius={6} color={PALETTE.blue} size={0.025} opacity={0.4} />
              <PostFX bloom={0.8} vignette={0.5} noise={0.04} />
              <CameraRig view={{ azimuth: 14, elevation: 8, distance: 6.5 }} />
            </Stage>
          </div>
          <div className="sc-hero-copy">
            <p className="sc-kicker">Interactive 3D for React, batteries included</p>
            <h1>
              Pick an effect.
              <br />
              Frame it. Animate it.
              <br />
              Paste the code.
            </h1>
            <p className="sc-sub">
              49 effects across 6 families, a declarative camera, composable scroll and
              entrance animation, and a gallery that hands you the exact code for whatever
              you build. This page IS the library running - every demo below is live.
            </p>
            <div className="sc-hero-actions">
              <a className="sc-btn primary" href="#view">
                Tour the features
              </a>
              <Link className="sc-btn" to="/studio">
                See a real site built with it
              </Link>
            </div>
          </div>
        
        </section>

        <ViewAngleSection />
        <ScrollSection />
        <AnimationSection />
        <FamiliesSection />
        <ConfigSection />

        <footer className="sc-footer">
          <h2>Build something glassy.</h2>
          <p>
            <code>npm install easy-3dkit three @react-three/fiber @react-three/drei gsap</code>
          </p>
          <div className="sc-footer-links">
            <Link to="/">Gallery</Link>
            <Link to="/studio">Novaforge demo</Link>
            <a href="https://github.com/Agrim-Sigdel/3d-kit" target="_blank" rel="noreferrer">
              GitHub
            </a>
          </div>
          <p className="sc-footer-note">
            Every scene on this page renders live with easy-3dkit. Snippets are copy-ready.
          </p>
        </footer>
      </main>
    </div>
  )
}
