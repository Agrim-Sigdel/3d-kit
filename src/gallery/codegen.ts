import { DEFAULT_VIEW, type EaseName, type EntranceMode, type IdleMode, type ViewAngle } from '@o3s/lib'
import type { GalleryEntry } from './registry'
import { flattenSchema, type FlatControl } from './schema'
import { toExportName } from './exportNames'

/**
 * Code generator (gallery layer) — "Copy code".
 *
 * Turns a registry entry + the CURRENT leva values (+ camera view + animation
 * settings) into the exact, ready-to-paste React file a consumer needs. The
 * registry's declarative `codegen` spec says how flat leva values map back to
 * JSX; this module does the serialization. The docs panel and the EFFECTS.md
 * script reuse generateCode, so documented snippets and copied code can never
 * diverge.
 */

/** Animation values as the gallery's Animation leva store produces them. */
export interface AnimationValues {
  rotate: number
  zoom: number
  lift: number
  parallax: number
  reveal: number
  drift: number
  ease: EaseName
  speed: number
  entrance: EntranceMode
  entranceDuration: number
  entranceDelay: number
  idle: IdleMode
  idleSpeed: number
  idleAmplitude: number
}

export const DEFAULT_ANIMATION: AnimationValues = {
  rotate: 0,
  zoom: 0,
  lift: 0,
  parallax: 0,
  reveal: 0,
  drift: 0,
  ease: 'linear',
  speed: 1,
  entrance: 'none',
  entranceDuration: 0.9,
  entranceDelay: 0,
  idle: 'none',
  idleSpeed: 1,
  idleAmplitude: 0.15,
}

export interface SnippetExtras {
  view?: ViewAngle
  animation?: Partial<AnimationValues>
  /** Prepend the `// npm install ...` line. Default true. */
  includeInstall?: boolean
}

const PEERS = 'easy-3dkit three @react-three/fiber @react-three/drei gsap'

/** kebab-case id -> PascalCase component name, e.g. 'heat-haze' -> 'HeatHaze'. */
function toPascal(id: string): string {
  const camel = toExportName(id)
  return camel.charAt(0).toUpperCase() + camel.slice(1)
}

/** Trim float noise from slider values: 0.30000000000000004 -> 0.3. */
function num(v: number): string {
  return String(Number(v.toFixed(4)))
}

/** A value as a JS expression (object literals, factory args, array items). */
function expr(v: unknown): string {
  if (typeof v === 'number') return num(v)
  if (typeof v === 'boolean') return String(v)
  if (Array.isArray(v)) return `[${v.map(expr).join(', ')}]`
  return `'${String(v)}'`
}

/** A value as a JSX attribute, e.g. color="#fff" / speed={1.2} / size={[1, 2]}. */
function attr(key: string, v: unknown): string {
  if (typeof v === 'string') return `${key}="${v}"`
  return `${key}={${expr(v)}}`
}

/** The animation props that differ from their defaults, in ScrollAnimator order. */
function animDiff(animation: Partial<AnimationValues>): Array<[string, unknown]> {
  const out: Array<[string, unknown]> = []
  for (const key of Object.keys(DEFAULT_ANIMATION) as Array<keyof AnimationValues>) {
    const v = animation[key]
    if (v !== undefined && v !== DEFAULT_ANIMATION[key]) out.push([key, v])
  }
  // ease / entranceDuration / entranceDelay / idleSpeed / idleAmplitude are
  // meaningless without an active channel — drop them when nothing uses them.
  const has = (k: string) => out.some(([key]) => key === k)
  const scrollOn = ['rotate', 'zoom', 'lift', 'parallax', 'reveal', 'drift'].some(has)
  const entranceOn = has('entrance')
  const idleOn = has('idle')
  return out.filter(([key]) => {
    if (key === 'ease') return scrollOn || entranceOn
    if (key === 'entranceDuration' || key === 'entranceDelay') return entranceOn
    if (key === 'idleSpeed' || key === 'idleAmplitude') return idleOn
    // `speed` scales the time-driven layers (entrance + idle); drop it otherwise.
    if (key === 'speed') return entranceOn || idleOn
    return true
  })
}

function viewDiffers(view: ViewAngle): boolean {
  const eq = (a: number, b: number) => Math.abs(a - b) < 0.05
  return !(
    eq(view.azimuth ?? 0, DEFAULT_VIEW.azimuth) &&
    eq(view.elevation ?? 0, DEFAULT_VIEW.elevation) &&
    eq(view.distance ?? 6, DEFAULT_VIEW.distance)
  )
}

/** Resolve a control's current value (live leva value, else schema default). */
function valueOf(c: FlatControl, values: Record<string, unknown>): unknown {
  return values[c.key] !== undefined ? values[c.key] : c.default
}

/**
 * The effect's own JSX (component + its codegen-spec wiring), without Stage /
 * CameraRig / ScrollAnimator wrappers. `indent` is the leading whitespace.
 */
export function generateJsx(
  entry: GalleryEntry,
  values: Record<string, unknown>,
  indent = '      ',
): string {
  const spec = entry.codegen
  if (!spec) {
    return `${indent}{/* No codegen spec for "${entry.id}" yet. */}`
  }
  const controls = flattenSchema(entry.controls).filter(
    (c) => !(spec.omitKeys ?? []).includes(c.key),
  )

  const attrs: string[] = []
  if (spec.kind === 'surface') {
    const materialName = spec.materialExport ?? toExportName(entry.id)
    attrs.push(`material={${materialName}}`)
    for (const [k, raw] of Object.entries(spec.fixedProps ?? {})) attrs.push(`${k}={${raw}}`)
    if (controls.length > 0) {
      const params = controls.map((c) => `${c.key}: ${expr(valueOf(c, values))}`).join(', ')
      attrs.push(`params={{ ${params} }}`)
    }
  } else if (spec.kind === 'layout') {
    const factory = spec.layoutFactory ?? toExportName(entry.id)
    const layoutKeys = spec.layoutKeys ?? []
    const opts = controls
      .filter((c) => layoutKeys.includes(c.key))
      .map((c) => `${c.key}: ${expr(valueOf(c, values))}`)
      .join(', ')
    attrs.push(`layout={${factory}(${opts ? `{ ${opts} }` : ''})}`)
    for (const c of controls.filter((c) => !layoutKeys.includes(c.key))) {
      attrs.push(attr(c.key, valueOf(c, values)))
    }
  } else {
    for (const c of controls) attrs.push(attr(c.key, valueOf(c, values)))
  }

  // Render the tag — one line when short, one attribute per line otherwise.
  const multi =
    attrs.length > 2 || `<${spec.component} ${attrs.join(' ')} />`.length + indent.length > 90
  const open = multi
    ? `<${spec.component}\n${attrs.map((a) => `${indent}  ${a}`).join('\n')}\n${indent}`
    : `<${spec.component} ${attrs.join(' ')}`

  let tag: string
  if (spec.childrenCode) {
    const children = spec.childrenCode
      .split('\n')
      .map((l) => `${indent}  ${l}`)
      .join('\n')
    tag = `${open}>\n${children}\n${indent}</${spec.component}>`
  } else {
    tag = multi ? `${open}/>` : `${open} />`
  }

  const siblings = spec.siblingsCode
    ? spec.siblingsCode
        .split('\n')
        .map((l) => `${indent}${l}`)
        .join('\n') + '\n'
    : ''
  return `${siblings}${indent}${tag}`
}

/** The complete, ready-to-paste file for the current effect + settings. */
export function generateCode(
  entry: GalleryEntry,
  values: Record<string, unknown>,
  extras: SnippetExtras = {},
): string {
  const spec = entry.codegen
  const animation = extras.animation ?? {}
  const animProps = animDiff(animation)
  const hasAnim = animProps.length > 0
  const scrollActive = animProps.some(([k]) =>
    ['rotate', 'zoom', 'lift', 'parallax', 'reveal', 'drift'].includes(k),
  )
  const view = extras.view
  const hasView = view !== undefined && viewDiffers(view)

  // ── Imports ──
  const names = new Set<string>(['Stage', 'CameraRig'])
  if (hasAnim) names.add('ScrollAnimator')
  if (spec) {
    names.add(spec.component)
    if (spec.kind === 'surface') names.add(spec.materialExport ?? toExportName(entry.id))
    if (spec.kind === 'layout') names.add(spec.layoutFactory ?? toExportName(entry.id))
    for (const n of spec.extraImports ?? []) names.add(n)
  }
  const usesPostFX = names.has('PostFX')

  // ── Body ──
  const innerIndent = hasAnim ? '        ' : '      '
  let body = generateJsx(entry, values, innerIndent)
  if (hasAnim) {
    const animAttrs = animProps.map(([k, v]) => attr(k, v)).join(' ')
    body = `      <ScrollAnimator ${animAttrs}>\n${body}\n      </ScrollAnimator>`
  }

  const rigAttr = hasView
    ? ` view={{ azimuth: ${num(view.azimuth ?? 0)}, elevation: ${num(view.elevation ?? 0)}, distance: ${num(view.distance ?? 6)} }}`
    : ''

  const lines: string[] = []
  if (extras.includeInstall !== false) {
    lines.push(`// npm install ${PEERS}${usesPostFX ? ' @react-three/postprocessing' : ''}`)
  }
  lines.push(`import { ${[...names].join(', ')} } from 'easy-3dkit'`)
  lines.push('')
  if (scrollActive) {
    lines.push('// Scroll-driven: the page must be taller than the viewport for')
    lines.push('// scroll progress to move.')
  }
  lines.push(`export function ${toPascal(entry.id)}Scene() {`)
  lines.push('  return (')
  lines.push('    <Stage background={null}>')
  lines.push(body)
  lines.push(`      <CameraRig${rigAttr} />`)
  lines.push('    </Stage>')
  lines.push('  )')
  lines.push('}')
  return lines.join('\n')
}
