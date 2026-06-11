import { useMemo, useState } from 'react'
import { type ViewAngle } from '@o3s/lib'
import type { GalleryEntry } from './registry'
import { buildEffectDoc } from './docsModel'
import { generateCode, type AnimationValues } from './codegen'

/**
 * DocsPanel — per-effect documentation, in the gallery.
 *
 * Shows what every control does (from the shared doc model) plus the LIVE
 * usage snippet: the exact code "Copy code" would produce for the current
 * leva values, camera view, and animation settings. Tweak a slider and the
 * snippet updates with it.
 */
export function DocsPanel({
  entry,
  values,
  view,
  animation,
  onClose,
}: {
  entry: GalleryEntry
  values: Record<string, unknown>
  view: ViewAngle
  animation: Partial<AnimationValues>
  onClose: () => void
}) {
  const doc = useMemo(() => buildEffectDoc(entry), [entry])
  const code = generateCode(entry, values, { view, animation })

  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
    } catch {
      console.log(code)
    }
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  const fmt = (v: unknown): string => {
    if (Array.isArray(v)) return `[${v.join(', ')}]`
    return String(v)
  }

  return (
    <div className="docs-panel glass" role="dialog" aria-label={`${doc.name} documentation`}>
      <div className="docs-head">
        <h3>{doc.name}</h3>
        <span className="chip">{doc.family}</span>
        <button className="docs-close" onClick={onClose} aria-label="Close docs">
          &times;
        </button>
      </div>
      <p className="docs-desc">{doc.description}</p>
      {doc.notes && <p className="docs-notes">{doc.notes}</p>}

      <h4>Controls</h4>
      <table className="docs-props">
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Default</th>
            <th>Range</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          {doc.props.map((p) => (
            <tr key={p.key}>
              <td><code>{p.key}</code></td>
              <td>{p.type}</td>
              <td><code>{fmt(p.default)}</code></td>
              <td>
                {p.type === 'select'
                  ? (p.options ?? []).map(String).join(' | ')
                  : p.min !== undefined
                    ? `${p.min} to ${p.max}`
                    : ''}
              </td>
              <td>{p.description ?? ''}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="docs-usage-head">
        <h4>Usage (current settings)</h4>
        <button className="copy-config" onClick={copy}>
          {copied ? 'Copied' : 'Copy code'}
        </button>
      </div>
      <pre className="docs-code">
        <code>{code}</code>
      </pre>
    </div>
  )
}
