import { type ReactNode } from 'react'
import { folder } from 'leva'
import {
  ParticleField,
  RippleShader,
  FloatingObject,
  ScrollScene,
  PostFX,
  InteractiveSurface,
  InstancedGrid,
  glassmorphism,
  thermalVision,
  iridescent,
  orbitLayout,
  type SurfaceMaterial,
} from '@o3s/lib'
import { geometryGroup, materialGroup, transformGroup } from './controls'
import { generatedEntries } from './generatedEntries'

/**
 * The gallery registry (Layer 4).
 *
 * Each entry = one card in the sidebar + one live preview. To add a new
 * component to the gallery, append one object here. `controls` is a leva
 * schema object; the live values are passed back into `render(values)`.
 *
 * Keeping this as plain data (not scattered route files) is what makes the
 * gallery scale to dozens of components without ceremony.
 */
/** The 6 master families effects are grouped under in the gallery. */
export type Family =
  | 'PostFX'
  | 'InteractiveSurface'
  | 'ParticleField'
  | 'InstancedGrid'
  | 'FloatingObject'
  | 'ScrollScene'

export type Difficulty = 'easy' | 'medium' | 'hard'

/**
 * CodegenSpec — how an entry's flat leva values map back to real JSX.
 *
 * Declarative on purpose: the "Copy code" generator, the docs panel, and the
 * EFFECTS.md script all read the SAME spec, so a documented snippet and the
 * copied code can never diverge. Identifiers here must be actual exports of
 * src/lib/index.ts (the docs script validates this).
 */
export interface CodegenSpec {
  /** Component export name, e.g. 'InteractiveSurface'. */
  component: string
  kind: 'props' | 'surface' | 'layout'
  /** kind 'surface': material export name. Defaults to camelCase(entry.id). */
  materialExport?: string
  /** kind 'surface': extra fixed props as raw code strings, e.g. { segments: '64' }. */
  fixedProps?: Record<string, string>
  /** kind 'layout': factory export name, e.g. 'orbitLayout'. */
  layoutFactory?: string
  /** kind 'layout': flat leva keys routed into the factory; the rest become props. */
  layoutKeys?: string[]
  /** Control keys the render ignores — never emitted (e.g. a vestigial slider). */
  omitKeys?: string[]
  /** Literal JSX children, e.g. ScrollScene's demo child. */
  childrenCode?: string
  /** Literal sibling JSX emitted before the component (PostFX demo scene). */
  siblingsCode?: string
  /** Extra named imports needed by childrenCode / siblingsCode. */
  extraImports?: string[]
}

export interface GalleryEntry {
  id: string
  name: string
  /** Which master family this effect belongs to (drives sidebar grouping). */
  family: Family
  category: 'effects' | 'objects' | 'website' | 'postprocessing'
  difficulty: Difficulty
  description: string
  /** leva schema — see https://github.com/pmndrs/leva */
  controls: Record<string, unknown>
  /** Render the component given the live control values. */
  render: (v: Record<string, unknown>) => ReactNode
  /** How values map back to pasteable code ("Copy code", docs, EFFECTS.md). */
  codegen?: CodegenSpec
  /** Per-prop descriptions + free-form notes for the docs panel / EFFECTS.md. */
  docs?: { props?: Record<string, string>; notes?: string }
}

/**
 * surfaceEntry — turn any SurfaceMaterial variant into a gallery entry.
 *
 * This is the payoff of the Family/Variant architecture: a new shader effect
 * becomes a ONE-LINE registry addition. The variant already carries its name,
 * controls, and update logic.
 */
function surfaceEntry(
  material: SurfaceMaterial,
  opts: {
    difficulty?: Difficulty
    description: string
    segments?: number
  },
): GalleryEntry {
  return {
    id: material.id,
    name: material.name,
    family: 'InteractiveSurface',
    category: 'effects',
    difficulty: opts.difficulty ?? 'easy',
    description: opts.description,
    controls: material.controls ?? {},
    render: (v) => (
      <InteractiveSurface material={material} segments={opts.segments} params={v} />
    ),
    codegen: {
      component: 'InteractiveSurface',
      kind: 'surface',
      fixedProps: opts.segments !== undefined ? { segments: String(opts.segments) } : undefined,
    },
    docs: material.docs ? { props: material.docs } : undefined,
  }
}

export const registry: GalleryEntry[] = [
  {
    id: 'particle-field',
    name: 'Particle Field',
    family: 'ParticleField',
    category: 'effects',
    difficulty: 'easy',
    description: 'A configurable GPU point cloud. Ambient atmosphere for any scene.',
    controls: {
      Cloud: folder({
        count: { value: 4000, min: 200, max: 30000, step: 200 },
        radius: { value: 4, min: 1, max: 12, step: 0.5 },
        distribution: { value: 'sphere', options: ['sphere', 'cube', 'disc', 'shell'] },
      }),
      Appearance: folder({
        color: '#5fa8ff',
        size: { value: 0.04, min: 0.005, max: 0.3, step: 0.005 },
        opacity: { value: 1, min: 0.05, max: 1, step: 0.05 },
        glow: true,
        sizeAttenuation: true,
      }),
      Motion: folder({
        speed: { value: 0.05, min: 0, max: 1, step: 0.01 },
        tumble: { value: 0.4, min: 0, max: 2, step: 0.05 },
      }),
    },
    render: (v) => <ParticleField {...(v as any)} />,
    codegen: { component: 'ParticleField', kind: 'props' },
    docs: {
      props: {
        count: 'How many points are in the cloud',
        radius: 'Overall size of the cloud in world units',
        distribution: 'Shape the points fill: solid sphere, cube, flat disc, or hollow shell',
        color: 'Point color',
        size: 'Size of each point',
        opacity: 'Point transparency',
        glow: 'Additive blending so overlapping points brighten',
        sizeAttenuation: 'Points shrink with distance from the camera',
        speed: 'How fast the cloud tumbles',
        tumble: 'How much the tumble axis wanders',
      },
    },
  },
  {
    id: 'ripple-shader',
    name: 'Ripple Shader',
    family: 'InteractiveSurface',
    category: 'effects',
    difficulty: 'easy',
    description: 'A cursor-reactive GLSL plane. Great as a website hero backdrop.',
    controls: {
      Color: folder({
        colorA: '#0a0a2a',
        colorB: '#4fc3ff',
      }),
      Ripple: folder({
        frequency: { value: 40, min: 5, max: 120, step: 1 },
        speed: { value: 2, min: 0, max: 8, step: 0.1 },
        falloff: { value: 0.9, min: 0.1, max: 1.5, step: 0.05 },
        intensity: { value: 1, min: 0, max: 3, step: 0.05 },
      }),
    },
    render: (v) => <RippleShader {...(v as any)} />,
    codegen: { component: 'RippleShader', kind: 'props' },
    docs: {
      props: {
        colorA: 'Base color of the plane',
        colorB: 'Color of the ripple crests',
        frequency: 'How many ripple rings fit across the plane',
        speed: 'How fast the rings travel outward',
        falloff: 'How quickly ripples fade with distance from the cursor',
        intensity: 'Overall strength of the ripple displacement',
      },
      notes: 'Move the cursor over the plane to drive the ripples.',
    },
  },
  {
    id: 'floating-object',
    name: 'Floating Object',
    family: 'FloatingObject',
    category: 'objects',
    difficulty: 'easy',
    description: 'Idle float + spin with a hover pop. Every aspect configurable.',
    controls: {
      ...geometryGroup('torusKnot'),
      ...materialGroup('#ff7a59'),
      Motion: folder({
        speed: { value: 1, min: 0, max: 4, step: 0.1 },
        amplitude: { value: 0.3, min: 0, max: 1.5, step: 0.05 },
        spin: { value: 1, min: 0, max: 4, step: 0.1 },
        hoverScale: { value: 1.15, min: 1, max: 2.5, step: 0.05 },
      }),
      ...transformGroup(),
    },
    render: (v) => <FloatingObject {...(v as any)} />,
    codegen: { component: 'FloatingObject', kind: 'props' },
    docs: {
      props: {
        shape: 'Which primitive geometry to float',
        detail: 'Geometry subdivision / segment count',
        color: 'Surface color',
        roughness: 'Microsurface roughness (0 = mirror, 1 = matte)',
        metalness: 'How metallic the surface responds to light',
        emissive: 'Self-illumination color',
        emissiveIntensity: 'Strength of the self-illumination',
        wireframe: 'Render as wireframe',
        opacity: 'Surface transparency',
        flatShading: 'Faceted (low-poly) shading instead of smooth normals',
        speed: 'Speed of the idle float cycle',
        amplitude: 'How far the object bobs up and down',
        spin: 'Continuous Y rotation speed',
        hoverScale: 'Scale multiplier while the cursor hovers the object',
        position: 'Base position in world units',
        rotation: 'Base rotation in radians',
        scale: 'Uniform scale multiplier',
      },
    },
  },
  {
    id: 'scroll-scene',
    name: 'Scroll Scene',
    family: 'ScrollScene',
    category: 'website',
    difficulty: 'medium',
    description:
      'Binds page scroll to a 3D transform. (Scroll the page to see it drive.)',
    controls: {
      rotations: { value: 1, min: 0, max: 4, step: 0.25 },
      zTravel: { value: 4, min: 0, max: 10, step: 0.5 },
    },
    render: (v) => (
      <ScrollScene {...(v as any)}>
        <FloatingObject />
      </ScrollScene>
    ),
    codegen: {
      component: 'ScrollScene',
      kind: 'props',
      childrenCode: '<FloatingObject />',
      extraImports: ['FloatingObject'],
    },
    docs: {
      props: {
        rotations: 'Full Y rotations across the whole scroll range',
        zTravel: 'How far the group dollies toward the camera across the range',
      },
      notes:
        'Wrap any children; they stay scroll-ignorant. For more channels (lift, parallax, reveal, drift) plus entrance and idle animation, use ScrollAnimator instead.',
    },
  },
  {
    id: 'postfx',
    name: 'Post FX',
    family: 'PostFX',
    category: 'postprocessing',
    difficulty: 'medium',
    description: 'Composable bloom / vignette / grain. Add as the last Stage child.',
    controls: {
      bloom: { value: 1.2, min: 0, max: 3, step: 0.1 },
      bloomThreshold: { value: 0.4, min: 0, max: 1, step: 0.05 },
      vignette: { value: 0.5, min: 0, max: 1.5, step: 0.05 },
      noise: { value: 0, min: 0, max: 0.5, step: 0.02 },
    },
    render: (v) => (
      <>
        <FloatingObject color="#88ddff" />
        <ParticleField count={1500} radius={5} />
        <PostFX {...(v as any)} />
      </>
    ),
    codegen: {
      component: 'PostFX',
      kind: 'props',
      siblingsCode: '<FloatingObject color="#88ddff" />\n<ParticleField count={1500} radius={5} />',
      extraImports: ['FloatingObject', 'ParticleField'],
    },
    docs: {
      props: {
        bloom: 'Bloom (glow) strength on bright areas',
        bloomThreshold: 'Luminance above which pixels start to bloom',
        vignette: 'Darkening toward the screen edges',
        noise: 'Animated film-grain amount',
      },
      notes: 'Requires the optional peer @react-three/postprocessing. Add as the LAST child of Stage.',
    },
  },

  // ── InteractiveSurface variants — each is ONE line via surfaceEntry(). ──
  // This is the architecture paying off: adding a shader effect = a variant
  // module + this single call. No new component, no plumbing.
  surfaceEntry(glassmorphism, {
    description: 'Frosted translucent glass with an animated frost and cursor sheen.',
  }),
  surfaceEntry(thermalVision, {
    description: 'Thermal heatmap shading; the cursor adds a hot spot.',
  }),
  surfaceEntry(iridescent, {
    description: 'Oil-slick / soap-bubble shimmer that shifts hue with cursor + time.',
  }),

  // ── InstancedGrid variant ──
  {
    id: 'orbit-grid',
    name: 'Orbit Layout',
    family: 'InstancedGrid',
    category: 'objects',
    difficulty: 'medium',
    description:
      'Hundreds of instances on nested orbiting shells in a single draw call. Cursor nudges the cloud.',
    controls: {
      Layout: folder({
        count: { value: 600, min: 100, max: 5000, step: 100 },
        shells: { value: 5, min: 1, max: 12, step: 1 },
        radius: { value: 1.5, min: 0.5, max: 5, step: 0.1 },
        spacing: { value: 0.6, min: 0.1, max: 2, step: 0.05 },
        speed: { value: 1, min: 0, max: 4, step: 0.1 },
        cursorPush: { value: 0.5, min: 0, max: 3, step: 0.1 },
      }),
      Instance: folder({
        shape: { value: 'box', options: ['box', 'sphere', 'icosahedron', 'octahedron', 'tetrahedron', 'cone'] },
        instanceSize: { value: 0.12, min: 0.02, max: 0.5, step: 0.01 },
        color: '#5fa8ff',
        roughness: { value: 0.3, min: 0, max: 1, step: 0.01 },
        metalness: { value: 0.5, min: 0, max: 1, step: 0.01 },
        emissive: '#000000',
        emissiveIntensity: { value: 0, min: 0, max: 5, step: 0.05 },
        wireframe: false,
      }),
    },
    render: (v) => (
      <InstancedGrid
        layout={orbitLayout({
          count: (v.count as number) ?? 600,
          shells: v.shells as number,
          radius: v.radius as number,
          spacing: v.spacing as number,
          speed: v.speed as number,
          cursorPush: v.cursorPush as number,
        })}
        shape={v.shape as any}
        instanceSize={v.instanceSize as number}
        color={v.color as string}
        roughness={v.roughness as number}
        metalness={v.metalness as number}
        emissive={v.emissive as string}
        emissiveIntensity={v.emissiveIntensity as number}
        wireframe={v.wireframe as boolean}
      />
    ),
    codegen: {
      component: 'InstancedGrid',
      kind: 'layout',
      layoutFactory: 'orbitLayout',
      layoutKeys: ['count', 'shells', 'radius', 'spacing', 'speed', 'cursorPush'],
    },
    docs: {
      props: {
        count: 'Total number of instances (one draw call)',
        shells: 'How many nested orbit shells the instances spread across',
        radius: 'Radius of the innermost shell',
        spacing: 'Gap between consecutive shells',
        speed: 'Orbit speed',
        cursorPush: 'How strongly the cursor repels nearby instances',
        shape: 'Primitive geometry used for every instance',
        instanceSize: 'Size of each instance',
        color: 'Instance color',
        roughness: 'Microsurface roughness',
        metalness: 'How metallic instances respond to light',
        emissive: 'Self-illumination color',
        emissiveIntensity: 'Strength of the self-illumination',
        wireframe: 'Render instances as wireframe',
      },
    },
  },

  // ── All workflow-authored effects (40) appended here. ──
  ...generatedEntries,
]
