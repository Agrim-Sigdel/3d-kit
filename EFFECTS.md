# O3S — 3d-kit Effects Reference

A complete catalogue of every effect in the kit, grouped by its **master family**,
with the exact controls/props each exposes. Open the gallery (`pnpm dev`) and pick
any effect from the sidebar; its controls appear in the **leva panel** (top-right).

## How to use this kit

Two ways to drive any effect:

1. **In the gallery** — select it, tweak the leva controls live. Camera: the
   **Interact / View** toggle (bottom-center, or hold **Space**) switches between
   driving the *effect* with your cursor and *orbiting the camera*. ScrollScene
   effects instead show a **scroll slider + Play** to preview their scroll range.
2. **In your own app** — import from `@o3s/lib` and pass props:

```tsx
import { Stage, CameraRig, InteractiveSurface, plasma, OceanPlane } from '@o3s/lib'

<Stage background={null}>
  <InteractiveSurface material={plasma} params={{ speed: 1.5 }} />
  <CameraRig />
</Stage>
```

### The 6 master families

| Family | What it is | How you use an effect |
|---|---|---|
| **InteractiveSurface** | A shader plane. Each effect = a `material` variant. | `<InteractiveSurface material={X} params={{...}} />` |
| **ParticleField** | GPU point cloud. | `<ParticleField {...props} />` |
| **InstancedGrid** | Thousands of instances, 1 draw call. Each effect = a `layout`. | `<InstancedGrid layout={X({...})} {...appearance} />` |
| **FloatingObject** | Spring/motion object wrappers. | `<ComponentName {...props} />` |
| **ScrollScene** | Scroll/time-driven scene effects. | `<ComponentName {...props} />` |
| **PostFX** | Full-frame post-processing. | `<PostFX {...props} />` (last child of Stage) |

> **Controls note:** every numeric control shows `default (min–max)`. Colors are hex.
> For surface effects the control name is what you pass inside `params={{ }}`.

---

## 1. InteractiveSurface — shader effects

Use: `<InteractiveSurface material={NAME} params={{ control: value }} />`.
All of them react to the cursor and expose `uScroll`, so they also work in scroll scenes.

### Frosted Glass

Import `frostedGlass`.

**Controls:**
- `tint` — color · #cfe6ff
- `highlight` — color · #ffffff
- `frost` — slider · 1.6 (0.2–5.0)
- `refract` — slider · 0.18 (0.0–1.0)
- `opacity` — slider · 0.55 (0.0–1.0)

### Holographic Foil

Import `holographicFoil`.

**Controls:**
- `tint` — color · #ffffff
- `hueScale` — slider · 3.0 (0.5–8.0)
- `streakSharp` — slider · 24.0 (4.0–64.0)
- `grain` — slider · 0.15 (0.0–0.6)

### Toon Cel

Import `toonCel`.

**Controls:**
- `base` — color · #4f9dde
- `shadow` — color · #1b3a5c
- `steps` — slider · 4 (2–8)
- `outline` — slider · 2.5 (0.5–6)

### Wireframe Morph

Import `wireframeMorph`.

**Controls:**
- `lineColor` — color · #39ff14
- `fillColor` — color · #0a1f3c
- `density` — slider · 24 (4–80)
- `lineWidth` — slider · 0.04 (0.005–0.2)
- `morphSpeed` — slider · 0.5 (0.0–3.0)

### Moiré

Import `moire`.

**Controls:**
- `colorA` — color · #05060a
- `colorB` — color · #7df9ff
- `frequency` — slider · 80 (10–200)
- `angle` — slider · 0.08 (0.0–0.6)
- `sharpness` — slider · 2.2 (0.5–6)

### Fractal Zoom

Import `fractalZoom`.

**Controls:**
- `iterations` — slider · 96 (16–512)
- `zoomSpeed` — slider · 0.18 (0.0–1.0)
- `julia` — slider · 0.0 (0.0–1.0)
- `inside` — color · #05060f
- `palette` — color · #3fa9ff

### Liquid Blob

Import `liquidBlob`.

**Controls:**
- `count` — slider · 5 (1–12)
- `smooth` — slider · 0.35 (0.05–1.0)
- `speed` — slider · 0.6 (0.0–3.0)
- `colorA` — color · #0a1fff
- `colorB` — color · #ff2d95

### Brushed Metal

Import `brushedMetal`.

**Controls:**
- `base` — color · #9aa2ad
- `sheen` — color · #f2f5fa
- `grain` — slider · 220 (40–600)
- `aniso` — slider · 0.85 (0–1)
- `contrast` — slider · 0.5 (0–1)

### Neon Line Art

Import `neonLineArt`.

**Controls:**
- `lineColor` — color · #00ffd5
- `bgColor` — color · #04060a
- `density` — slider · 14 (4–40)
- `thickness` — slider · 0.04 (0.005–0.2)
- `pulse` — slider · 1 (0–3)

### Bioluminescent

Import `bioluminescent`.

**Controls:**
- `glow` — color · #27f5c8
- `base` — color · #020308
- `scale` — slider · 4.0 (1.0–12.0)
- `breath` — slider · 0.6 (0.05–2.0)
- `intensity` — slider · 1.4 (0.2–4.0)

### X-Ray Ghost

Import `xrayGhost`.

**Controls:**
- `rimColor` — color · #9fe8ff
- `coreColor` — color · #0a1830
- `rimPower` — slider · 2.6 (0.5–8)
- `opacity` — slider · 0.55 (0–1)

### Rain Streaks

Import `rainStreaks`.

**Controls:**
- `glassColor` — color · #0a1822
- `streakColor` — color · #aaccdd
- `density` — slider · 40 (8–120)
- `speed` — slider · 0.6 (0.1–2.0)
- `blur` — slider · 0.35 (0.05–1.0)

### Scanlines

Import `scanlines`.

**Controls:**
- `tint` — color · #39ff66
- `dark` — color · #02060a
- `lineFreq` — slider · 220 (40–600)
- `aberration` — slider · 0.004 (0.0–0.02)
- `flicker` — slider · 0.08 (0.0–0.4)

### Dither 8-bit

Import `dither8bit`.

**Controls:**
- `dark` — color · #0b1d3a
- `light` — color · #7fe3ff
- `levels` — slider · 4 (2–12)
- `pixel` — slider · 96 (16–256)

### Kinetic Type

Import `kineticType`.

**Controls:**
- `ink` — color · #0a0a0a
- `paper` — color · #f5f2e8
- `freq` — slider · 24 (4–60)
- `warp` — slider · 0.35 (0–1)
- `pull` — slider · 0.6 (0–2)

### Plasma

Import `plasma`.

**Controls:**
- `scale` — slider · 8 (2–24)
- `speed` — slider · 0.6 (0–3)
- `colorA` — color · #ff2d75
- `colorB` — color · #1fa2ff

### Voronoi Cells

Import `voronoiCells`.

**Controls:**
- `scale` — slider · 6 (2–20)
- `speed` — slider · 0.6 (0–3)
- `lightRadius` — slider · 0.5 (0.05–1.5)
- `cellColor` — color · #33e0ff
- `edgeColor` — color · #0a0f24

### Heat Haze

Import `heatHaze`.

**Controls:**
- `colorTop` — color · #1b2a4a
- `colorBottom` — color · #ff7a3c
- `strength` — slider · 0.04 (0.0–0.2)
- `speed` — slider · 1.2 (0.0–4.0)
- `scale` — slider · 5.0 (1.0–16.0)

---

## 2. ParticleField — GPU point cloud

`<ParticleField {...props} />`. Built-in component (not variant-based).

**Props / controls:**
- `count`: number — particle count (200–30000)
- `radius`: number — cloud size (1–12)
- `distribution`: `'sphere' | 'cube' | 'disc' | 'shell'` — point arrangement
- `color`: hex — particle color
- `size`: number — point size (0.005–0.3)
- `opacity`: number (0.05–1)
- `glow`: boolean — additive blending (energy glow) vs solid dots
- `sizeAttenuation`: boolean — shrink with distance
- `speed`: number — Y rotation rate
- `tumble`: number — X rotation relative to Y

---

## 3. InstancedGrid — instanced layouts

Use: `<InstancedGrid layout={NAME({ ...options })} color shape metalness roughness />`.
The **layout** decides where instances go; the **appearance props** (shape, color,
metalness, roughness, emissive, wireframe, instanceSize) style them.

### Infinite Tunnel

Import `tunnelLayout`.

**Layout options:**
- `count`: `number` — number of instances; distributed across rings
- `radius`: `number` — tunnel bore radius in world units
- `speed`: `number` — scroll speed toward camera (units/sec along z)
- `ringSize`: `number` — instances per ring; count/ringSize gives the ring count
- `ringSpacing`: `number` — spacing between successive rings along z
- `scale`: `number` — per-instance cube scale

### Isometric Stack

Import `isometricStack`.

**Layout options:**
- `cols`: `number` — Cubes per row/column of the square footprint. count is derived as cols*cols.
- `spacing`: `number` — Center-to-center distance between cubes on the X/Y plane.
- `heightScale`: `number` — Multiplier on the per-cube resting height variation.
- `rippleAmp`: `number` — Z amplitude of the travelling ripple.
- `rippleFreq`: `number` — Angular frequency of the ripple in radians per world unit.
- `speed`: `number` — Phase speed of the ripple.

### Voxel Sphere

Import `voxelSphere`.

**Layout options:**
- `count`: `number` — Number of voxels distributed over the sphere surface.
- `radius`: `number` — Sphere radius the voxels sit on.
- `rotateSpeed`: `number` — Rotation speed in radians/sec (slow ambient spin).
- `cursorRadius`: `number` — World-space reach of the cursor displacement falloff.
- `cursorPush`: `number` — Peak outward push (along normal) at the cursor center.
- `voxelSize`: `number` — Base edge length of each voxel cube.

### Voronoi Shatter

Import `voronoiShatter`.

**Layout options:**
- `count`: `number` — Number of shards. Defaults tuned for a dense, readable cloud.
- `radius`: `number` — Peak explosion radius (world units) at the apex of the burst.
- `speed`: `number` — Loop frequency in Hz; controls how fast burst->settle repeats.
- `spin`: `number` — Per-shard spin rate multiplier; shards tumble while flying out.
- `mouseInfluence`: `number` — Mouse parallax gain. ctx.mouse is [-1,1]; this scales its push.

### Gear Field

Import `gearField`.

**Layout options:**
- `count`: `number` — Number of instances; clamped into a near-square grid below.
- `spacing`: `number` — Center-to-center spacing of gears in the grid plane.
- `spin`: `number` — Base angular velocity (rad/s) before per-gear variation.
- `size`: `number` — Uniform scale applied to every instance.
- `tilt`: `number` — How strongly mouse X/Y tilts the whole field (0 disables).

### Kinetic Ring

Import `kineticRing`.

**Layout options:**
- `radius`: `number` — Ring radius in world units.
- `spin`: `number` — Orbital angular velocity (radians/sec) of instances around the ring.
- `tumble`: `number` — Tumble rate of the whole ring's tilt (radians/sec).
- `size`: `number` — Uniform instance scale; cubes face outward along the radial.
- `count`: `number`

### Origami Fold

Import `origamiFold`.

**Layout options:**
- `perRow`: `number` — Instances per accordion row; remaining instances wrap to the next row.
- `panelSize`: `number` — Spacing between hinge points along a row.
- `speed`: `number` — Fold cycle speed.
- `maxAngle`: `number` — Peak fold angle in radians (how sharply panels crease).
- `cursorBias`: `number` — How much the cursor biases the fold phase, for interactive folding.
- `count`: `number`

### Wave Grid

Import `waveGrid`.

**Layout options:**
- `cols`: `number` — Number of columns/rows; total instances ≈ cols*cols (clamped to count).
- `spacing`: `number` — Spacing between grid cells in world units.
- `amplitude`: `number` — Amplitude of the traveling sine wave.
- `frequency`: `number` — Spatial frequency of the wave across the grid.
- `speed`: `number` — Wave travel speed (radians/sec scalar).
- `bumpRadius`: `number` — World-space radius of the cursor bump falloff.

### Galaxy Spiral

Import `galaxySpiral`.

**Layout options:**
- `arms`: `number` — number of spiral arms
- `windings`: `number` — tightness of the log spiral (higher = more tightly wound)
- `radius`: `number` — outer radius of the disk
- `speed`: `number` — base angular speed; inner radii are multiplied up from this
- `thickness`: `number` — vertical thickness of the disk (bulge falloff toward the rim)
- `count`: `number`

### Cube Swarm

Import `cubeSwarm`.

**Layout options:**
- `count`: `number` — Number of cubes in the swarm.
- `bounds`: `number` — Half-extent of the bounding box on each axis (world units).
- `speed`: `number` — Drift cycles per second; lower is calmer.
- `size`: `number` — Per-cube base size (uniform scale).
- `cohesion`: `number` — 0..1 — how strongly cubes pull toward a shared index-phased center.

> **Shared appearance props** (on `<InstancedGrid>` itself, any layout):
> `shape`, `instanceSize`, `color`, `roughness`, `metalness`, `emissive`, `emissiveIntensity`, `wireframe`.

---

## 4. FloatingObject family — object/motion components

Each is a standalone component: `<ComponentName {...props} />`.

### FloatingObject (the base wrapper)
Wrap any mesh, or use its built-in configurable primitive.
- **Geometry:** `shape` (box/sphere/torus/torusKnot/cone/cylinder/icosahedron/dodecahedron/octahedron/tetrahedron), `detail`
- **Material:** `color`, `roughness`, `metalness`, `emissive`, `emissiveIntensity`, `wireframe`, `opacity`, `flatShading`
- **Motion:** `speed`, `amplitude`, `spin`, `hoverScale`
- **Transform:** `position`, `rotation`, `scale`

### Card Flip

Import `CardFlip`.

**Props:**
- `color`: `string` — Base tint of the card front/back.
- `speed`: `number` — Multiplier on flip/idle animation rate.
- `size`: `[number, number]` — Card footprint as [width, height]; depth is derived to stay thin.
- `idleTilt`: `number` — Peak idle tilt in radians applied on both axes.
- `count`: `number` — Number of cards laid out side by side.

### Magnetic Group

Import `MagneticGroup`.

**Props:**
- `color`: `string` — Base hue color shared by all meshes.
- `speed`: `number` — Global animation/return-spring speed multiplier.
- `count`: `number` — Number of magnetic meshes.
- `size`: `number` — Base radius of each sphere; per-mesh size varies deterministically.
- `spread`: `number` — Spread radius of the rest-position ring on the XY plane.
- `strength`: `number` — How strongly meshes are pulled toward the cursor (world units).

### Squash Stretch

Import `SquashStretch`.

**Props:**
- `color`: `string` — Base tint of the bouncing spheres.
- `speed`: `number` — Bounce cycles per second (drives the time phase).
- `count`: `number` — Number of spheres laid out along X.
- `size`: `number` — Radius of each sphere's source geometry.
- `bounceHeight`: `number` — Peak hop height in world units.
- `intensity`: `number` — Max squash/stretch deformation (0 = rigid, 0.5 = strong).

### Elastic Jiggle

Import `ElasticJiggle`.

**Props:**
- `color`: `string` — Base material color.
- `stiffness`: `number` — Spring stiffness — higher reaches the target faster.
- `damping`: `number` — Damping ratio — lower values overshoot more (jiggle).
- `amplitude`: `number` — How far the cursor displaces the mesh in world units.
- `count`: `number` — Number of stacked meshes; each lags the previous for a trailing wobble.
- `size`: `number` — Edge length of each cube.

### Path Spline

Import `PathSpline`.

**Props:**
- `color`: `string` — Base mesh color; trail ghosts inherit and fade this.
- `speed`: `number` — Path traversal speed (cycles scale with this).
- `size`: `number` — Leading mesh radius; ghosts scale down from here.
- `ghostCount`: `number` — Number of trailing ghost copies.
- `frequencies`: `[number, number, number]` — Lissajous angular frequencies (x, y, z). Non-integer ratios avoid a static path.

### Morph Shape

Import `MorphShape`.

**Props:**
- `color`: `string` — Base color of the morphing surface.
- `speed`: `number` — Morph + rotation speed multiplier.
- `size`: `number` — Radius of the sphere / half-extent of the box.
- `segments`: `number` — Tessellation per box face edge; higher = smoother morph.

---

## 5. ScrollScene family — scroll/time-driven scenes

Standalone components driven by time (auto-animate) and/or scroll progress. In the
gallery they show a **scroll slider + Play** instead of the camera toggle.

### ScrollScene (the base driver)
`<ScrollScene rotations={1} zTravel={4}>{children}</ScrollScene>` — binds page
scroll to a 3D transform on its children.

### Exploded View

Import `ExplodedView`.

**Props:**
- `color`: `string` — Base tint; each layer derives a slight hue offset from this.
- `speed`: `number` — Drives the explode oscillation rate.
- `count`: `number` — Number of stacked parts. Clamped to a sane range.
- `spread`: `number` — Max vertical separation each part reaches when fully exploded.
- `size`: `number` — Footprint of each slab (X, Z). Thickness is derived from spread/count.

### Parallax Layers

Import `ParallaxLayers`.

**Props:**
- `color`: `string` — Base tint; each layer is darkened by depth for atmospheric falloff.
- `speed`: `number` — Cursor-follow lerp rate. Higher = snappier parallax.
- `layers`: `number` — Number of depth layers (clamped to a sane range).
- `density`: `number` — Quads per layer; more = denser scene.
- `spread`: `number` — Horizontal parallax travel of the nearest layer, in world units.

### Ocean Plane

Import `OceanPlane`.

**Props:**
- `color`: `string` — Base water color.
- `crestColor`: `string` — Crest highlight color blended in at wave peaks.
- `size`: `number` — Plane edge length in world units (square).
- `segments`: `number` — Vertex resolution per side; higher = smoother crests, costlier.
- `speed`: `number` — Global time multiplier for wave motion.
- `waveCount`: `number` — Number of summed Gerstner-ish wave octaves (clamped 1..6).

### Portal Ring

Import `PortalRing`.

**Props:**
- `color`: `string` — Base hue of the ring/swirl/particles.
- `speed`: `number` — Global animation rate multiplier.
- `radius`: `number` — Outer radius of the torus ring.
- `thickness`: `number` — Thickness (tube radius) of the torus ring.
- `particleCount`: `number` — Number of particles streaming toward the portal.

### Camera Flythrough

Import `CameraFlythrough`.

**Props:**
- `count`: `number` — Number of gates streaming toward the camera.
- `speed`: `number` — Forward travel speed in world units per second.
- `color`: `string` — Base color of the gate rings; per-gate hue is offset deterministically.
- `radius`: `number` — Outer radius of each ring.
- `spacing`: `number` — Spacing between consecutive gates along Z.

### Popup Fold

Import `PopupFold`.

**Props:**
- `color`: `string` — Base panel tint; per-panel hue is offset deterministically.
- `speed`: `number` — Animation rate for the open/close breathing cycle.
- `count`: `number` — Number of folding leaves arranged front-to-back.
- `panelSize`: `[number, number]` — Width / height of each flat panel before folding.
- `spacing`: `number` — Depth gap between successive leaves so they nest like book pages.
- `foldAngle`: `number` — Max fold angle in radians (0 = flat on the page, PI/2 = standing up).

---

## 6. PostFX — post-processing

`<PostFX bloom bloomThreshold vignette noise />` as the **last child** of `<Stage>`.
- `bloom`: number (0 disables) — glow strength
- `bloomThreshold`: number — lower = more things glow
- `vignette`: number (0 disables) — edge darkening
- `noise`: number (0 disables) — film grain

---

## Engine & helpers (for building your own scenes)

- `<Stage background={null}>` — the Canvas wrapper (color-managed, clamped DPR, default lights). `background={null}` = transparent.
- `<CameraRig zoom pan minDistance maxDistance>` — camera as a separate entity; only orbits in **View** mode.
- `useMouse(smoothing)` — smoothed cursor ref ([-1,1]); freezes in View mode.
- `useScrollProgress()` — 0..1 scroll ref; honors the scroll override.
- `setScrollOverride(n | null)` / `useScrollOverride()` — drive scroll without a real page.
- `setInputMode('interact'|'view')` / `useInputMode()` — the camera-vs-effect mode.
- `shaderChunks` — reusable GLSL (snoise2D, fresnel, hash, hsv2rgb) for authoring new surface variants.
- `ShapeGeometry` — render any primitive by name.

## Authoring a new effect

- **Surface shader:** create `src/lib/materials/<name>.ts` exporting a `SurfaceMaterial` (id, name, uniforms, vertex/fragmentShader, controls, update). Build uniforms ONCE; mutate `.value` in `update`. Standard uniforms (uTime, uMouse, uScroll, uResolution) are auto-injected.
- **Instance layout:** create `src/lib/layouts/<name>.ts` exporting a factory returning `InstanceLayout` (id, name, count, place). Reuse a module-scope scratch Vector3 — never allocate in `place()`.
- **Standalone:** create `src/lib/components/<Name>.tsx` — an R3F component, animate via `useFrame`.

Then export it from `src/lib/index.ts` and add a registry entry in `src/gallery/`.

---

_Generated from the source of truth (each module's own controls/props). 18 surface effects · 10 instance layouts · 12 standalone components, plus the base components = **49 effects** across 6 families._
