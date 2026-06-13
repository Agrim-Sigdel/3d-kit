/**
 * easy-3dkit landing page — site copy and data.
 *
 * Pure content module: no React, no three.js. Mirrors the studio content
 * shape so the landing page can reuse the studio layout/CSS wholesale, with
 * product copy instead of the fictional Novaforge studio. Copy rules match
 * the studio: concrete over evocative, numbers over adjectives, sentence case.
 */

export const INSTALL = 'npm install easy-3dkit'

/** A featured component, shown as a live card (like a studio "game" card). */
export interface ComponentShowcase {
  id: string
  title: string
  tagline: string
  description: string
  /** Short descriptors shown as pills. */
  family: string
  status: string
  /** Which surface material the card's live key art uses (resolved in the page). */
  art: 'heatHaze' | 'voronoiCells' | 'bioluminescent'
  /** Per-card params for that material, tuned to the site palette. */
  artParams: Record<string, unknown>
  /** Copy-pasteable usage snippet. */
  code: string
}

export const COMPONENTS: ComponentShowcase[] = [
  {
    id: 'interactive-surface',
    title: 'InteractiveSurface',
    tagline: 'One component, twenty-plus shader looks.',
    description:
      'A cursor-reactive plane you drop a material into — glassmorphism, iridescent, thermal, holographic and more. Swap the material prop to change the entire look; every knob is a plain prop.',
    family: 'Surface',
    status: '20+ materials',
    art: 'heatHaze',
    artParams: { colorTop: '#0c0e12', colorBottom: '#ff6b3d', strength: 0.07, speed: 1.6, scale: 6 },
    code: `import { Stage, InteractiveSurface, iridescent } from 'easy-3dkit'

<Stage background={null}>
  <InteractiveSurface material={iridescent} />
</Stage>`,
  },
  {
    id: 'instanced-grid',
    title: 'InstancedGrid',
    tagline: 'Thousands of objects, one draw call.',
    description:
      'A GPU-instanced field of primitives arranged by a layout function — orbit shells, galaxy spirals, tunnels, swarms. Cursor-reactive and cheap enough to sit behind a whole page.',
    family: 'Instances',
    status: '11 layouts',
    art: 'voronoiCells',
    artParams: { scale: 7, speed: 0.35, lightRadius: 0.6, cellColor: '#e8a849', edgeColor: '#0c0e12' },
    code: `import { Stage, InstancedGrid, galaxySpiral } from 'easy-3dkit'

<Stage background={null}>
  <InstancedGrid layout={galaxySpiral({ count: 2400 })} />
</Stage>`,
  },
  {
    id: 'scroll-animator',
    title: 'ScrollAnimator',
    tagline: 'Bind any 3D content to page scroll.',
    description:
      'Wrap any children and drive rotate, zoom, lift, parallax, reveal and drift from scroll — plus entrance and idle animation. The components inside stay scroll-ignorant and fully reusable.',
    family: 'Scroll',
    status: '6 channels',
    art: 'bioluminescent',
    artParams: { glow: '#7fa8a4', base: '#04060a', scale: 5, breath: 0.5, intensity: 1.2 },
    code: `import { Stage, ScrollAnimator, FloatingObject } from 'easy-3dkit'

<Stage background={null}>
  <ScrollAnimator rotate={1} lift={3} entrance="rise">
    <FloatingObject />
  </ScrollAnimator>
</Stage>`,
  },
]

export interface LoreBlock {
  kicker: string
  title: string
  body: string
}

/** "How it works" — replaces the studio's universe lore rail. */
export const HOW_IT_WORKS: LoreBlock[] = [
  {
    kicker: 'Install',
    title: 'One package, peer-managed 3D stack.',
    body: 'easy-3dkit ships its three.js stack as peer dependencies, so your app keeps a single copy of three and React Three Fiber. No duplicate-instance crashes, no bundled engine.',
  },
  {
    kicker: 'Compose',
    title: 'A Stage, then components inside it.',
    body: 'Stage sets up the canvas, renderer, lights and frame loop. Everything else — surfaces, particle fields, instanced grids, post-processing — is a component you place inside and configure with props.',
  },
  {
    kicker: 'Drive',
    title: 'Props in, visuals out.',
    body: 'Components never assume they live in a website or a game. A site drives them with scroll, a game with state. Drivers like ScrollAnimator stay separate from the components they move.',
  },
  {
    kicker: 'Ship',
    title: 'Tune it in the gallery, copy the code.',
    body: 'Open the live gallery, tweak any component with real controls, then copy the exact React code or a portable JSON config. What you preview is what you paste.',
  },
]

export interface TechPillar {
  name: string
  title: string
  body: string
}

/** The toolbox — replaces the studio's Forge engine pillars. */
export const TOOLBOX: TechPillar[] = [
  {
    name: 'Engine',
    title: 'Stage, CameraRig and stores',
    body: 'A single Stage owns the WebGL context; CameraRig gives declarative viewing angles; small stores let you drive effects from input mode or your own scroll state.',
  },
  {
    name: 'Components',
    title: 'Twenty-plus 3D building blocks',
    body: 'InteractiveSurface, ParticleField, InstancedGrid, FloatingObject, ScrollScene, PostFX, PortalRing, OceanPlane and more — each one props-driven and documented.',
  },
  {
    name: 'Materials & layouts',
    title: 'Swap the look without new plumbing',
    body: 'Surface materials and instance layouts are data: pass a different material or layout function and the same component renders an entirely different effect.',
  },
]

export interface Resource {
  title: string
  team: string
  type: string
  href: string
}

/** Get-started links — replaces the studio's open roles list. */
export const RESOURCES: Resource[] = [
  { title: 'Open the live gallery', team: 'Tinker with every component', type: 'Interactive', href: '/gallery' },
  { title: 'Feature tour: Showcase', team: 'The whole kit in one scroll', type: 'Demo', href: '/showcase' },
  { title: 'Demo site: Novaforge', team: 'A full site built with the kit', type: 'Example', href: '/studio' },
  { title: 'easy-3dkit on npm', team: 'npm install easy-3dkit', type: 'Package', href: 'https://www.npmjs.com/package/easy-3dkit' },
]
