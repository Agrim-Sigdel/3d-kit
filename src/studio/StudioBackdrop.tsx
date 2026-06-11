import { useEffect, useState } from 'react'
import {
  FloatingObject,
  InstancedGrid,
  InteractiveSurface,
  MagneticGroup,
  OceanPlane,
  ParticleField,
  PostFX,
  Stage,
  galaxySpiral,
  rainStreaks,
  tunnelLayout,
} from '@o3s/lib'

/**
 * StudioBackdrop — the single full-viewport 3D layer behind the whole site.
 *
 * One <Stage> (one WebGL context) lives fixed behind the scrolling page.
 * The page tells it which section band is on screen and it swaps the scene
 * to that section's signature effect; it also passes the active theme so
 * every scene draws from the same palette as the page chrome.
 *
 * Palette discipline: ember (accent), steel (cool neutral) and a structure
 * tone per theme. Light mode runs a much quieter grade — bloom on a paper
 * background reads as haze, so it is nearly off.
 */
export type Band = 'hero' | 'games' | 'universe' | 'tech' | 'careers' | 'footer'
export type Theme = 'light' | 'dark'

interface ScenePalette {
  ember: string
  amber: string
  steel: string
  structure: string
  rainGlass: string
  rainStreak: string
  magnet: string
  oceanBase: string
  oceanCrest: string
  particleColor: string
  particleOpacity: number
  particleGlow: boolean
  emissiveStrong: number
  emissiveSoft: number
  bloom: number
  bloomThreshold: number
  vignette: number
  noise: number
}

const PALETTES: Record<Theme, ScenePalette> = {
  dark: {
    ember: '#ff6b3d',
    amber: '#e8a849',
    steel: '#aab4c4',
    structure: '#171a20',
    rainGlass: '#0b1014',
    rainStreak: '#aab4c4',
    magnet: '#4a5360',
    oceanBase: '#06090d',
    oceanCrest: '#8a5a3a',
    particleColor: '#aab4c4',
    particleOpacity: 0.35,
    particleGlow: true,
    emissiveStrong: 1.1,
    emissiveSoft: 0.55,
    bloom: 0.7,
    bloomThreshold: 0.32,
    vignette: 0.4,
    noise: 0.04,
  },
  light: {
    ember: '#e85a2a',
    amber: '#c98a2e',
    steel: '#5d6b80',
    structure: '#cfc9bc',
    rainGlass: '#eceadf',
    rainStreak: '#76808f',
    magnet: '#b9b2a4',
    oceanBase: '#d7dee2',
    oceanCrest: '#9aa7ad',
    particleColor: '#7d8595',
    particleOpacity: 0.5,
    particleGlow: false,
    emissiveStrong: 0.6,
    emissiveSoft: 0.35,
    bloom: 0.18,
    bloomThreshold: 0.65,
    vignette: 0.16,
    noise: 0.03,
  },
}

interface SceneProps {
  p: ScenePalette
}

function HeroScene({ p }: SceneProps) {
  return (
    // Rain on glass, full-bleed behind the headline. Slow drips, no hero
    // object: the typography and the game shortcuts carry the landing page.
    <InteractiveSurface
      material={rainStreaks}
      size={[20, 150]}
      params={{ glassColor: p.rainGlass, streakColor: p.rainStreak, density: 100, speed: 0.11, blur: 0.  }}
    />
  )
}

function GamesScene({ p }: SceneProps) {
  return (
    <MagneticGroup color={p.magnet} count={7} size={0.26} spread={4.5} strength={1.2} speed={1} />
  )
}

function UniverseScene({ p }: SceneProps) {
  return (
    // A slow galaxy seen from above-side; the disk tilt keeps it readable
    // behind the copy without hot spots near the lens. Scaled up so the
    // arms sweep past the viewport edges instead of huddling at center.
    <group rotation={[-0.85, 0, 0.2]} position={[0, 0.4, 0]} scale={1.7}>
      <InstancedGrid
        layout={galaxySpiral({ arms: 3, windings: 1.5, radius: 10, speed: 0.42, thickness: 1.5, count: 2400 })}
        instanceSize={0.3}
        color={p.structure}
        emissive={p.amber}
        emissiveIntensity={p.emissiveStrong}
        metalness={0.3}
        roughness={0.4}
      />
    </group>
  )
}

function TechScene({ p }: SceneProps) {
  return (
    // The tube spans z = [-depth, 0]; shifting +8 puts the camera (z = 6)
    // inside the bore so it reads as a tunnel around you, not a distant dot.
    <group position={[0, 0, 8]}>
      <InstancedGrid
        layout={tunnelLayout({ count: 720, radius: 3.2, speed: 5, ringSize: 16, ringSpacing: 1.4, scale: 0.16 })}
        color={p.structure}
        emissive={p.ember}
        emissiveIntensity={p.emissiveSoft}
        metalness={0.6}
        roughness={0.35}
      />
    </group>
  )
}

function CareersScene({ p }: SceneProps) {
  return (
    <>
      <ParticleField
        count={8000}
        radius={6}
        distribution="shell"
        color={p.particleColor}
        size={0.016}
        glow={p.particleGlow}
        opacity={0.6}
        speed={0.06}
        tumble={0.3}
      />
      <FloatingObject
        shape="icosahedron"
        wireframe
        color={p.structure}
        emissive={p.ember}
        emissiveIntensity={p.emissiveStrong * 0.8}
        speed={0.4}
        amplitude={0.3}
        spin={0.2}
        scale={1.4}
      />
    </>
  )
}

function FooterScene({ p }: SceneProps) {
  return (
    <group position={[0, -2.4, 0]}>
      <OceanPlane color={p.oceanBase} crestColor={p.oceanCrest} size={70} segments={120} speed={0.7} waveCount={4} />
    </group>
  )
}

const SCENES: Record<Band, (props: SceneProps) => JSX.Element> = {
  hero: HeroScene,
  games: GamesScene,
  universe: UniverseScene,
  tech: TechScene,
  careers: CareersScene,
  footer: FooterScene,
}

export function StudioBackdrop({ band, theme }: { band: Band; theme: Theme }) {
  // Two-step transition: fade the whole canvas out, swap the scene while it
  // is invisible, fade back in. Reads as one smooth dissolve through the
  // page background instead of a hard scene pop.
  const [shown, setShown] = useState(band)
  const [fading, setFading] = useState(false)

  useEffect(() => {
    if (band === shown) return
    setFading(true)
    const id = window.setTimeout(() => {
      setShown(band)
      setFading(false)
    }, 280)
    return () => window.clearTimeout(id)
  }, [band, shown])

  const Scene = SCENES[shown]
  const p = PALETTES[theme]
  return (
    <div className={fading ? 'studio-backdrop is-fading' : 'studio-backdrop'} aria-hidden>
      <Stage background={null}>
        {/* Ambient drifting particles shared by every band: continuity across swaps. */}
        <ParticleField
          count={180000}
          radius={100}
          distribution="cone"
          color={p.particleColor}
          size={0.014}
          glow={p.particleGlow}
          opacity={p.particleOpacity}
          speed={0.03}
        />
        <Scene p={p} />
        {/* Restrained grade: bloom is an accent, not the aesthetic. */}
        <PostFX bloom={p.bloom} bloomThreshold={p.bloomThreshold} vignette={p.vignette} noise={p.noise} />
      </Stage>
    </div>
  )
}
