/**
 * Leva schema flattener (gallery layer).
 *
 * Turns a registry entry's leva `controls` object into a flat, typed list of
 * controls — the single source of truth for prop name / type / default /
 * range used by the code generator, the in-gallery docs panel, and the
 * EFFECTS.md generation script. leva itself flattens folder() keys the same
 * way, so `key` here matches what render(values) reads.
 */

export type ControlType = 'number' | 'color' | 'boolean' | 'select' | 'vector' | 'string'

export interface FlatControl {
  /** Flat value key, exactly as it appears in render(values). */
  key: string
  /** Enclosing folder() label, if any (purely informational). */
  folder?: string
  type: ControlType
  default: unknown
  min?: number
  max?: number
  step?: number
  /** For selects: the allowed values. */
  options?: unknown[]
}

/** leva's folder() marker: { type: 'FOLDER', schema, settings }. */
function isFolder(v: unknown): v is { schema: Record<string, unknown> } {
  return (
    typeof v === 'object' &&
    v !== null &&
    (v as { type?: unknown }).type === 'FOLDER' &&
    typeof (v as { schema?: unknown }).schema === 'object'
  )
}

function isVector(v: unknown): v is number[] {
  return Array.isArray(v) && v.length >= 2 && v.length <= 4 && v.every((n) => typeof n === 'number')
}

function inferType(value: unknown, options?: unknown[]): ControlType {
  if (options) return 'select'
  if (typeof value === 'number') return 'number'
  if (typeof value === 'boolean') return 'boolean'
  if (isVector(value)) return 'vector'
  if (typeof value === 'string') return value.startsWith('#') ? 'color' : 'string'
  return 'string'
}

export function flattenSchema(controls: Record<string, unknown>): FlatControl[] {
  const out: FlatControl[] = []

  const walk = (schema: Record<string, unknown>, folderName?: string) => {
    for (const [key, raw] of Object.entries(schema)) {
      if (isFolder(raw)) {
        walk(raw.schema, key)
        continue
      }
      // Normalized input: either a bare value (color: '#fff', glow: true) or a
      // settings object ({ value, min, max, step, options, label }).
      if (typeof raw === 'object' && raw !== null && 'value' in (raw as object) && !isVector(raw)) {
        const o = raw as {
          value: unknown
          min?: number
          max?: number
          step?: number
          options?: unknown[]
        }
        out.push({
          key,
          folder: folderName,
          type: inferType(o.value, o.options),
          default: o.value,
          min: o.min,
          max: o.max,
          step: o.step,
          options: o.options,
        })
      } else {
        out.push({ key, folder: folderName, type: inferType(raw), default: raw })
      }
    }
  }

  walk(controls)
  return out
}

/** Flat key -> default value map, e.g. to render a snippet at defaults. */
export function schemaDefaults(controls: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(flattenSchema(controls).map((c) => [c.key, c.default]))
}
