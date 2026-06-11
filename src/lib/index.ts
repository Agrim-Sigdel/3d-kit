/**
 * O3S / 3d-kit — public library surface.
 *
 * This file is the package boundary. Everything a consuming app (the gallery,
 * a website, a game) is allowed to import lives here. Keep internals private.
 */

// Engine (Layer 1)
export { Stage } from './engine/Stage'
export type { StageProps } from './engine/Stage'
export { CameraRig } from './engine/CameraRig'
export type { CameraRigProps } from './engine/CameraRig'
export {
  DEFAULT_VIEW,
  viewAngleToPosition,
  positionToViewAngle,
  type ViewAngle,
} from './engine/viewAngle'
export { EASINGS, type EaseName } from './engine/easing'
export {
  useInputMode,
  setInputMode,
  toggleInputMode,
  getInputMode,
  type InputMode,
} from './engine/inputMode'
export {
  useScrollOverride,
  setScrollOverride,
  getScrollOverride,
} from './engine/scrollDriver'

// Hooks / primitives (Layer 2)
export { useMouse } from './hooks/useMouse'
export { useScrollProgress } from './hooks/useScrollProgress'

// Components (Layer 3) — the 6 master families
export { ParticleField } from './components/ParticleField'
export type { ParticleFieldProps } from './components/ParticleField'
export { RippleShader } from './components/RippleShader'
export type { RippleShaderProps } from './components/RippleShader'
export { FloatingObject } from './components/FloatingObject'
export type { FloatingObjectProps } from './components/FloatingObject'
export { ScrollScene } from './components/ScrollScene'
export type { ScrollSceneProps } from './components/ScrollScene'
export { ScrollAnimator } from './components/ScrollAnimator'
export type { ScrollAnimatorProps, EntranceMode, IdleMode } from './components/ScrollAnimator'
export { PostFX } from './components/PostFX'
export type { PostFXProps } from './components/PostFX'
export { InteractiveSurface } from './components/InteractiveSurface'
export type { InteractiveSurfaceProps } from './components/InteractiveSurface'
export { InstancedGrid } from './components/InstancedGrid'
export type { InstancedGridProps, InstanceLayout } from './components/InstancedGrid'
export { ShapeGeometry } from './components/Shape'
export type { ShapeName } from './components/Shape'
export type { ParticleDistribution } from './components/ParticleField'

// Variant contracts + shader chunks (for authoring custom effects)
export type { SurfaceMaterial } from './materials/types'
export { STANDARD_SURFACE_UNIFORMS } from './materials/types'
export * as shaderChunks from './shaders/chunks'

// Surface material variants (InteractiveSurface effects)
export { glassmorphism } from './materials/glassmorphism'
export { thermalVision } from './materials/thermalVision'
export { iridescent } from './materials/iridescent'

// Instance layout variants (InstancedGrid effects)
export { orbitLayout } from './layouts/orbit'
export type { OrbitLayoutOptions } from './layouts/orbit'

// ── Workflow-authored surface variants (InteractiveSurface effects) ──
export { frostedGlass } from './materials/frostedGlass'
export { holographicFoil } from './materials/holographicFoil'
export { toonCel } from './materials/toonCel'
export { wireframeMorph } from './materials/wireframeMorph'
export { moire } from './materials/moire'
export { fractalZoom } from './materials/fractalZoom'
export { liquidBlob } from './materials/liquidBlob'
export { brushedMetal } from './materials/brushedMetal'
export { neonLineArt } from './materials/neonLineArt'
export { bioluminescent } from './materials/bioluminescent'
export { xrayGhost } from './materials/xrayGhost'
export { rainStreaks } from './materials/rainStreaks'
export { scanlines } from './materials/scanlines'
export { dither8bit } from './materials/dither8bit'
export { kineticType } from './materials/kineticType'
export { plasma } from './materials/plasma'
export { voronoiCells } from './materials/voronoiCells'
export { heatHaze } from './materials/heatHaze'

// ── Workflow-authored instance layouts (InstancedGrid effects) ──
export { tunnelLayout, type TunnelLayoutOptions } from './layouts/tunnel'
export { isometricStack, type IsometricStackOptions } from './layouts/isometricStack'
export { voxelSphere, type VoxelSphereOptions } from './layouts/voxelSphere'
export { voronoiShatter, type VoronoiShatterOptions } from './layouts/voronoiShatter'
export { gearField, type GearFieldOptions } from './layouts/gearField'
export { kineticRing, type KineticRingOptions } from './layouts/kineticRing'
export { origamiFold, type OrigamiFoldOptions } from './layouts/origamiFold'
export { waveGrid, type WaveGridOptions } from './layouts/waveGrid'
export { galaxySpiral, type GalaxySpiralOptions } from './layouts/galaxySpiral'
export { cubeSwarm, type CubeSwarmOptions } from './layouts/cubeSwarm'

// ── Workflow-authored standalone components (FloatingObject / ScrollScene family) ──
export { CardFlip, type CardFlipProps } from './components/CardFlip'
export { MagneticGroup, type MagneticGroupProps } from './components/MagneticGroup'
export { SquashStretch, type SquashStretchProps } from './components/SquashStretch'
export { ElasticJiggle, type ElasticJiggleProps } from './components/ElasticJiggle'
export { PathSpline, type PathSplineProps } from './components/PathSpline'
export { MorphShape, type MorphShapeProps } from './components/MorphShape'
export { ExplodedView, type ExplodedViewProps } from './components/ExplodedView'
export { ParallaxLayers, type ParallaxLayersProps } from './components/ParallaxLayers'
export { OceanPlane, type OceanPlaneProps } from './components/OceanPlane'
export { PortalRing, type PortalRingProps } from './components/PortalRing'
export { CameraFlythrough, type CameraFlythroughProps } from './components/CameraFlythrough'
export { PopupFold, type PopupFoldProps } from './components/PopupFold'
