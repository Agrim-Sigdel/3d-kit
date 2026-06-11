/**
 * gen-effects-docs.mjs — regenerate EFFECTS.md from the registry.
 *
 * Single source of truth: each entry's leva schema (names/types/defaults/
 * ranges), its docs metadata (per-prop descriptions, notes), and its codegen
 * spec (usage snippets, via the SAME generator as the gallery's "Copy code"
 * button). Run with: pnpm docs:effects
 *
 * Also acts as the codegen validation gate: every identifier referenced by a
 * codegen spec must be a real export of src/lib/index.ts, or this exits 1.
 */
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { resolve, dirname } from 'node:path'
import { createServer } from 'vite'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const server = await createServer({
  configFile: resolve(root, 'vite.config.ts'),
  root,
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'error',
})

try {
  const lib = await server.ssrLoadModule('/src/lib/index.ts')
  const { registry } = await server.ssrLoadModule('/src/gallery/registry.tsx')
  const { buildEffectDoc } = await server.ssrLoadModule('/src/gallery/docsModel.ts')
  const { generateJsx } = await server.ssrLoadModule('/src/gallery/codegen.ts')
  const { schemaDefaults } = await server.ssrLoadModule('/src/gallery/schema.ts')
  const { toExportName } = await server.ssrLoadModule('/src/gallery/exportNames.ts')

  // ── Validation gate ──
  const problems = []
  for (const entry of registry) {
    const spec = entry.codegen
    if (!spec) {
      problems.push(`${entry.id}: no codegen spec`)
      continue
    }
    const names = [spec.component, ...(spec.extraImports ?? [])]
    if (spec.kind === 'surface') names.push(spec.materialExport ?? toExportName(entry.id))
    if (spec.kind === 'layout') names.push(spec.layoutFactory ?? toExportName(entry.id))
    for (const n of names) {
      if (!(n in lib)) problems.push(`${entry.id}: "${n}" is not exported from src/lib/index.ts`)
    }
    const docProps = entry.docs?.props ?? {}
    for (const doc of Object.values(docProps)) {
      if (/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(doc)) {
        problems.push(`${entry.id}: docs contain an emoji`)
      }
    }
  }
  if (problems.length) {
    console.error('EFFECTS.md generation failed validation:')
    for (const p of problems) console.error(`  - ${p}`)
    process.exit(1)
  }

  // ── Markdown ──
  const FAMILY_ORDER = [
    'InteractiveSurface',
    'ParticleField',
    'InstancedGrid',
    'FloatingObject',
    'ScrollScene',
    'PostFX',
  ]
  const FAMILY_INTRO = {
    InteractiveSurface:
      'Shader effects on a plane. Each effect is a `material` variant: `<InteractiveSurface material={NAME} params={{ control: value }} />`. All react to the cursor and expose `uScroll`, so they also work in scroll scenes.',
    ParticleField: 'A configurable GPU point cloud: `<ParticleField {...props} />`.',
    InstancedGrid:
      'Thousands of instances in a single draw call. Each effect is a `layout` factory: `<InstancedGrid layout={NAME({...})} {...appearance} />`.',
    FloatingObject: 'Spring/motion object wrappers: `<ComponentName {...props} />`.',
    ScrollScene:
      'Scroll/time-driven scene effects: `<ComponentName {...props} />`. Preview their scroll range with the gallery scroll slider.',
    PostFX:
      'Full-frame post-processing: `<PostFX {...props} />` as the LAST child of Stage. Requires the optional peer `@react-three/postprocessing`.',
  }

  const fmtDefault = (v) => (Array.isArray(v) ? `[${v.join(', ')}]` : String(v))

  const controlLine = (p) => {
    let range = ''
    if (p.type === 'select') range = ` · ${(p.options ?? []).map(String).join(' | ')}`
    else if (p.min !== undefined) range = ` (${p.min}-${p.max})`
    const desc = p.description ? ` — ${p.description}` : ''
    return `- \`${p.key}\` — ${p.type} · ${fmtDefault(p.default)}${range}${desc}`
  }

  const sections = []
  let familyIndex = 0
  for (const family of FAMILY_ORDER) {
    const entries = registry.filter((e) => e.family === family)
    if (!entries.length) continue
    familyIndex += 1
    const parts = [`## ${familyIndex}. ${family}`, '', FAMILY_INTRO[family], '']
    for (const entry of entries) {
      const doc = buildEffectDoc(entry)
      const spec = entry.codegen
      const importNames = [spec.component, ...(spec.extraImports ?? [])]
      if (spec.kind === 'surface') importNames.push(spec.materialExport ?? toExportName(entry.id))
      if (spec.kind === 'layout') importNames.push(spec.layoutFactory ?? toExportName(entry.id))

      parts.push(`### ${doc.name}`)
      parts.push('')
      parts.push(doc.description)
      parts.push('')
      parts.push(`Import \`{ ${[...new Set(importNames)].join(', ')} }\` from \`easy-3dkit\`.`)
      parts.push('')
      if (doc.props.length) {
        parts.push('**Controls:**')
        parts.push('')
        for (const p of doc.props) parts.push(controlLine(p))
        parts.push('')
      }
      if (doc.notes) {
        parts.push(`> ${doc.notes}`)
        parts.push('')
      }
      parts.push('```tsx')
      parts.push(generateJsx(entry, schemaDefaults(entry.controls), ''))
      parts.push('```')
      parts.push('')
    }
    sections.push(parts.join('\n'))
  }

  const surfaceCount = registry.filter((e) => e.codegen?.kind === 'surface').length
  const layoutCount = registry.filter((e) => e.codegen?.kind === 'layout').length
  const total = registry.length

  const intro = `# easy-3dkit — Effects Reference

<!-- AUTO-GENERATED by scripts/gen-effects-docs.mjs. Edit registry docs metadata, not this file. -->

A complete catalogue of every effect in the kit, grouped by its **master family**,
with the exact controls/props each exposes, what they do, and a ready-to-paste
usage snippet. Open the gallery (\`pnpm dev\`) and pick any effect from the
sidebar; its controls appear in the **leva panel** (top-right), and the **Docs**
button shows this same reference with a LIVE snippet of your current settings.

## How to use this kit

\`\`\`bash
npm install easy-3dkit three @react-three/fiber @react-three/drei gsap
\`\`\`

Three ways to drive any effect:

1. **In the gallery** — select it, tweak the leva controls live, then **Copy
   code** for the exact React file or **Copy JSON** for a portable config.
   Camera: the **Interact / View** toggle (bottom-center, or hold **Space**)
   switches between driving the *effect* with your cursor and *orbiting the
   camera*. Scroll-driven effects show a **scroll slider + Play** instead.
2. **In your own app** — import from \`easy-3dkit\` and pass props:

\`\`\`tsx
import { Stage, CameraRig, InteractiveSurface, plasma } from 'easy-3dkit'

<Stage background={null}>
  <InteractiveSurface material={plasma} params={{ speed: 1.5 }} />
  <CameraRig />
</Stage>
\`\`\`

3. **From a config** — paste a Copy JSON blob into \`<O3SElement config={...} />\`
   (gallery layer) and it rebuilds the effect with no per-effect wiring.

### The 6 master families

| Family | What it is | How you use an effect |
|---|---|---|
| **InteractiveSurface** | A shader plane. Each effect = a \`material\` variant. | \`<InteractiveSurface material={X} params={{...}} />\` |
| **ParticleField** | GPU point cloud. | \`<ParticleField {...props} />\` |
| **InstancedGrid** | Thousands of instances, 1 draw call. Each effect = a \`layout\`. | \`<InstancedGrid layout={X({...})} {...appearance} />\` |
| **FloatingObject** | Spring/motion object wrappers. | \`<ComponentName {...props} />\` |
| **ScrollScene** | Scroll/time-driven scene effects. | \`<ComponentName {...props} />\` |
| **PostFX** | Full-frame post-processing. | \`<PostFX {...props} />\` (last child of Stage) |

### Viewing angle (CameraRig view)

Every scene's camera accepts a declarative viewpoint:

\`\`\`tsx
<CameraRig view={{ azimuth: 30, elevation: 15, distance: 8 }} />
\`\`\`

- \`azimuth\` — horizontal orbit angle in degrees (-180 to 180, 0 = front)
- \`elevation\` — vertical angle in degrees (-85 to 85, 0 = level)
- \`distance\` — camera distance from the target in world units
- \`target\` — orbit center, default \`[0, 0, 0]\`

In the gallery the **Camera** folder drives this live, and hand-orbiting in
View mode writes back into the sliders, so Copy code captures the exact shot
you framed. \`onViewChange\` gives you the same two-way binding in your app.

### Scroll modes and animation (ScrollAnimator)

Wrap ANY effect to make it scroll-aware and/or animated — all channels run
simultaneously and compose:

\`\`\`tsx
<ScrollAnimator rotate={1} zoom={3} ease="easeInOut" entrance="rise" idle="bob">
  <InteractiveSurface material={heatHaze} />
</ScrollAnimator>
\`\`\`

| Prop | What it does | Default |
|---|---|---|
| \`rotate\` | Full Y turns across the scroll range | 0 |
| \`zoom\` | World units dollied toward the camera | 0 |
| \`lift\` | World units risen (+Y) | 0 |
| \`parallax\` | Inverse lift + slight X sway; vary per layer for depth | 0 |
| \`reveal\` | Scale 0 to 1 over the first \`reveal\` fraction of scroll | 0 |
| \`drift\` | Deterministic x/y wander amplitude | 0 |
| \`ease\` | linear, easeIn, easeOut, easeInOut, backOut, elasticOut | linear |
| \`entrance\` | One-shot intro on mount: rise, scaleIn, spinIn, dropIn | none |
| \`entranceDuration\` / \`entranceDelay\` | Entrance timing in seconds | 0.9 / 0 |
| \`idle\` | Endless ambient motion: bob, sway, pulse | none |
| \`idleSpeed\` / \`idleAmplitude\` | Idle timing and size | 1 / 0.15 |

Scroll channels need the page to be taller than the viewport (the gallery
fakes this with its scroll slider). The gallery's **Animation** folder drives
a ScrollAnimator around every effect, and Copy code / Copy JSON include it.

> **Controls note:** every numeric control shows \`type · default (min-max)\`.
> Colors are hex. For surface effects the control name is what you pass inside
> \`params={{ }}\`; for InstancedGrid layouts the layout options are passed to
> the factory and the rest are component props. Usage snippets show defaults —
> in the gallery, Copy code emits your CURRENT values instead.

---

`

  const footer = `---

_Generated from the source of truth (each module's own controls/props/docs) by
\`pnpm docs:effects\`. ${surfaceCount} surface effects · ${layoutCount} instance layouts ·
${total} entries across 6 families._
`

  writeFileSync(resolve(root, 'EFFECTS.md'), intro + sections.join('\n---\n\n') + footer)
  console.log(`EFFECTS.md regenerated: ${total} entries, all codegen specs validated.`)
} finally {
  await server.close()
}
