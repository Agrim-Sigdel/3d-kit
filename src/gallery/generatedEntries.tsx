import { type ComponentType } from 'react'
import { folder } from 'leva'
import {
  InteractiveSurface, InstancedGrid,
  frostedGlass,
  holographicFoil,
  toonCel,
  wireframeMorph,
  moire,
  fractalZoom,
  liquidBlob,
  brushedMetal,
  neonLineArt,
  bioluminescent,
  xrayGhost,
  rainStreaks,
  scanlines,
  dither8bit,
  kineticType,
  plasma,
  voronoiCells,
  heatHaze,
  tunnelLayout,
  isometricStack,
  voxelSphere,
  voronoiShatter,
  gearField,
  kineticRing,
  origamiFold,
  waveGrid,
  galaxySpiral,
  cubeSwarm,
  CardFlip,
  MagneticGroup,
  SquashStretch,
  ElasticJiggle,
  PathSpline,
  MorphShape,
  ExplodedView,
  ParallaxLayers,
  OceanPlane,
  PortalRing,
  CameraFlythrough,
  PopupFold,
  type SurfaceMaterial,
  type InstanceLayout,
} from '@o3s/lib'
import type { Family, GalleryEntry } from './registry'

/* AUTO-GENERATED effect entries (workflow-authored). Each surface uses the
   material's own controls; layouts get a count + the standalone components get
   a shared color/speed control set. Hand-tune individual entries as needed. */

/** Surface material -> entry. Mirrors registry.tsx's surfaceEntry(). */
function surface(material: SurfaceMaterial, description: string): GalleryEntry {
  return {
    id: material.id,
    name: material.name,
    family: 'InteractiveSurface',
    category: 'effects',
    description,
    controls: material.controls ?? {},
    render: (v) => <InteractiveSurface material={material} params={v} />,
    codegen: { component: 'InteractiveSurface', kind: 'surface' },
    docs: material.docs ? { props: material.docs } : undefined,
  }
}

const GRID_INSTANCE_DOCS = {
  count: 'Total number of instances (one draw call)',
  color: 'Instance color',
  metalness: 'How metallic instances respond to light',
  roughness: 'Microsurface roughness (0 = mirror, 1 = matte)',
}

/** InstancedGrid layout -> entry. `factory` must be the lib export name. */
function grid(
  id: string,
  name: string,
  description: string,
  factory: string,
  makeLayout: (count: number) => InstanceLayout,
  opts?: { hasCount?: boolean; notes?: string },
): GalleryEntry {
  const hasCount = opts?.hasCount ?? true
  return {
    id,
    name,
    family: 'InstancedGrid',
    category: 'objects',
    description,
    controls: {
      ...(hasCount ? { count: { value: 800, min: 100, max: 5000, step: 100 } } : {}),
      Instance: folder({
        color: '#5fa8ff',
        metalness: { value: 0.5, min: 0, max: 1, step: 0.01 },
        roughness: { value: 0.3, min: 0, max: 1, step: 0.01 },
      }),
    },
    render: (v) => (
      <InstancedGrid
        layout={makeLayout((v.count as number) ?? 800)}
        color={v.color as string}
        metalness={v.metalness as number}
        roughness={v.roughness as number}
      />
    ),
    codegen: {
      component: 'InstancedGrid',
      kind: 'layout',
      layoutFactory: factory,
      layoutKeys: hasCount ? ['count'] : [],
    },
    docs: { props: GRID_INSTANCE_DOCS, notes: opts?.notes },
  }
}

const STANDALONE_DOCS = {
  color: 'Primary color of the meshes',
  speed: 'Animation speed multiplier',
}

/** Standalone component -> entry. `componentName` must be the lib export name. */
function standalone(
  id: string,
  name: string,
  family: Family,
  category: GalleryEntry['category'],
  description: string,
  Component: ComponentType<{ color?: string; speed?: number }>,
  componentName: string,
  notes?: string,
): GalleryEntry {
  return {
    id,
    name,
    family,
    category,
    description,
    controls: { color: '#5fa8ff', speed: { value: 1, min: 0, max: 4, step: 0.1 } },
    render: (v) => <Component {...(v as { color?: string; speed?: number })} />,
    codegen: { component: componentName, kind: 'props' },
    docs: { props: STANDALONE_DOCS, notes },
  }
}

export const generatedEntries: GalleryEntry[] = [
  surface(frostedGlass, 'Heavy frosted-glass blur with fake refraction wobble.'),
  surface(holographicFoil, 'Rainbow foil sheen with a sharp specular streak.'),
  surface(toonCel, 'Cel-shaded quantized lighting with a fresnel outline rim.'),
  surface(wireframeMorph, 'Grid lines morphing to solid fill over time/scroll.'),
  surface(moire, 'Two rotated line gratings producing moire interference.'),
  surface(fractalZoom, 'Animated escape-time fractal coloring; cursor pans.'),
  surface(liquidBlob, 'Metaball blobs via smooth-min distance fields.'),
  surface(brushedMetal, 'Anisotropic brushed-metal highlight streaks.'),
  surface(neonLineArt, 'Emissive glowing line-art grid that pulses.'),
  surface(bioluminescent, 'Dark surface with glowing organic cells that breathe.'),
  surface(xrayGhost, 'Fresnel translucent edge-glow ghostly shading.'),
  surface(rainStreaks, 'Vertical rain streaks with droplets running down glass.'),
  surface(scanlines, 'CRT scanlines with chromatic offset and flicker.'),
  surface(dither8bit, 'Ordered-dither posterized retro shading.'),
  surface(kineticType, 'Distortion field warping a procedural stripe pattern.'),
  surface(plasma, 'Classic demoscene plasma via summed sines.'),
  surface(voronoiCells, 'Animated voronoi cells lit near the cursor.'),
  surface(heatHaze, 'Refractive heat-shimmer over a gradient backdrop.'),

  grid('tunnel-grid', 'Infinite Tunnel', 'Receding rings forming a tunnel scrolling toward camera.',
    'tunnelLayout', (count) => tunnelLayout({ count })),
  grid('isometric-stack-grid', 'Isometric Stack', 'Staggered cube grid with a Z-height ripple wave.',
    'isometricStack', () => isometricStack(), { hasCount: false, notes: 'Instance count is derived from the layout grid (cols * cols).' }),
  grid('voxel-sphere-grid', 'Voxel Sphere', 'Instances voxelizing a sphere surface; cursor displaces.',
    'voxelSphere', (count) => voxelSphere({ count })),
  grid('voronoi-shatter-grid', 'Voronoi Shatter', 'Shards exploding outward and settling back, looping.',
    'voronoiShatter', (count) => voronoiShatter({ count })),
  grid('gear-field-grid', 'Gear Field', 'Grid of instances spinning like interlocking gears.',
    'gearField', (count) => gearField({ count })),
  grid('kinetic-ring-grid', 'Kinetic Ring', 'Instances on a tumbling ring facing outward.',
    'kineticRing', (count) => kineticRing({ count })),
  grid('origami-fold-grid', 'Origami Fold', 'Rows folding/unfolding accordion-style.',
    'origamiFold', (count) => origamiFold({ count })),
  grid('wave-grid-grid', 'Wave Grid', 'Flat grid with a traveling sine wave; cursor bumps it.',
    'waveGrid', () => waveGrid(), { hasCount: false, notes: 'Instance count is derived from the layout grid (cols * cols).' }),
  grid('galaxy-spiral-grid', 'Galaxy Spiral', 'Instances on logarithmic spiral arms rotating differentially.',
    'galaxySpiral', (count) => galaxySpiral({ count })),
  grid('cube-swarm-grid', 'Cube Swarm', 'Drifting bounded swarm with index-phase cohesion.',
    'cubeSwarm', (count) => cubeSwarm({ count })),

  standalone('card-flip', 'Card Flip', 'FloatingObject', 'objects',
    '3D card that flips on hover with an idle tilt.', CardFlip, 'CardFlip',
    'Hover the card to flip it.'),
  standalone('magnetic-group', 'Magnetic Group', 'FloatingObject', 'objects',
    'Meshes that drift toward the cursor then ease back.', MagneticGroup, 'MagneticGroup'),
  standalone('squash-stretch', 'Squash Stretch', 'FloatingObject', 'objects',
    'Bouncing sphere with squash-and-stretch deformation.', SquashStretch, 'SquashStretch'),
  standalone('elastic-jiggle', 'Elastic Jiggle', 'FloatingObject', 'objects',
    'Mesh that jiggles elastically when the cursor moves.', ElasticJiggle, 'ElasticJiggle'),
  standalone('path-spline', 'Path Spline', 'FloatingObject', 'objects',
    'Mesh following a looping lissajous path with a ghost trail.', PathSpline, 'PathSpline'),
  standalone('morph-shape', 'Morph Shape', 'FloatingObject', 'objects',
    'Mesh morphing between sphere and box over time.', MorphShape, 'MorphShape'),
  standalone('exploded-view', 'Exploded View', 'ScrollScene', 'website',
    'Parts separating along Y as time rises (exploded view).', ExplodedView, 'ExplodedView'),
  standalone('parallax-layers', 'Parallax Layers', 'ScrollScene', 'website',
    'Depth-layered planes that parallax with the cursor.', ParallaxLayers, 'ParallaxLayers'),
  standalone('ocean-plane', 'Ocean Plane', 'ScrollScene', 'website',
    'Subdivided plane with Gerstner sine-wave displacement.', OceanPlane, 'OceanPlane'),
  standalone('portal-ring', 'Portal Ring', 'ScrollScene', 'website',
    'Glowing torus portal with a swirling interior + particles.', PortalRing, 'PortalRing'),
  standalone('camera-flythrough', 'Camera Flythrough', 'ScrollScene', 'website',
    'Gates/rings drifting past the camera on a loop.', CameraFlythrough, 'CameraFlythrough'),
  standalone('popup-fold', 'Popup Fold', 'ScrollScene', 'website',
    'Flat panels folding up into a 3D pop-up arrangement.', PopupFold, 'PopupFold'),
]
