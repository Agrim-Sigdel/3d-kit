/**
 * Effect id -> easy-3dkit export identifier (gallery layer).
 *
 * The code generator emits identifiers (`material={heatHaze}`), never strings,
 * so copied code references the real export. Most material ids are just the
 * kebab-case of their camelCase export name; irregulars live in the override
 * map. The docs script validates every resolved name against the actual
 * exports of src/lib/index.ts, so a wrong mapping fails CI-style, not at the
 * user's paste site.
 */

/** Irregular id -> export name mappings (anything kebab-to-camel gets wrong). */
const OVERRIDES: Record<string, string> = {
  dither8bit: 'dither8bit',
  'xray-ghost': 'xrayGhost',
}

/** kebab-case id -> camelCase export name, e.g. 'heat-haze' -> 'heatHaze'. */
export function toExportName(id: string): string {
  if (OVERRIDES[id]) return OVERRIDES[id]
  return id.replace(/-([a-z0-9])/g, (_, c: string) => c.toUpperCase())
}
