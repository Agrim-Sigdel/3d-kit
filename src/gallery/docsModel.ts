import type { Difficulty, Family, GalleryEntry } from './registry'
import { flattenSchema, schemaDefaults, type FlatControl } from './schema'
import { generateCode } from './codegen'

/**
 * Doc model (gallery layer) — one structured doc per effect.
 *
 * Merges the leva schema (name / type / default / range, via flattenSchema)
 * with the entry's prose docs (what each prop MEANS) and a usage snippet from
 * the same generator the "Copy code" button uses. Consumed by the in-gallery
 * DocsPanel and the EFFECTS.md generation script, so all three surfaces of
 * documentation share one source of truth.
 */

export interface DocProp extends FlatControl {
  description?: string
}

export interface EffectDoc {
  id: string
  name: string
  family: Family
  difficulty: Difficulty
  description: string
  notes?: string
  props: DocProp[]
  /** Ready-to-paste usage at default values (no install preamble). */
  usage: string
}

export function buildEffectDoc(entry: GalleryEntry): EffectDoc {
  const omit = entry.codegen?.omitKeys ?? []
  const props: DocProp[] = flattenSchema(entry.controls)
    .filter((c) => !omit.includes(c.key))
    .map((c) => ({ ...c, description: entry.docs?.props?.[c.key] }))

  return {
    id: entry.id,
    name: entry.name,
    family: entry.family,
    difficulty: entry.difficulty,
    description: entry.description,
    notes: entry.docs?.notes,
    props,
    usage: generateCode(entry, schemaDefaults(entry.controls), { includeInstall: false }),
  }
}
