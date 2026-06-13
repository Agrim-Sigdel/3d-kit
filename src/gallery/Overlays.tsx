import { useEffect, useState } from 'react'

/**
 * Gallery overlays (Layer 4) — first-run onboarding toast + a keyboard
 * shortcuts cheat-sheet. Both are pure presentational glass panels; the
 * keyboard wiring itself lives in App.tsx. Kept out of lib/ (gallery-only UI).
 */

const ONBOARDING_KEY = 'o3s.gallery.onboarded'

/** Dismissible first-load hint. Persists its dismissal in localStorage. */
export function OnboardingToast() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    try {
      if (!localStorage.getItem(ONBOARDING_KEY)) setShow(true)
    } catch {
      // localStorage blocked (private mode) — just don't show the toast.
    }
  }, [])

  if (!show) return null

  const dismiss = () => {
    setShow(false)
    try {
      localStorage.setItem(ONBOARDING_KEY, '1')
    } catch {
      // ignore — worst case it shows again next load
    }
  }

  return (
    <div className="onboard glass" role="status">
      <div className="onboard-body">
        <strong>Tinker freely.</strong> Drag the controls to tweak the live scene.
        Hold <kbd>Space</kbd> to orbit. Press <kbd>?</kbd> for all shortcuts. Hit{' '}
        <strong>Copy code</strong> when you like a look.
      </div>
      <button className="onboard-close" onClick={dismiss} aria-label="Dismiss">
        &times;
      </button>
    </div>
  )
}

const SHORTCUTS: { keys: string[]; label: string }[] = [
  { keys: ['↑', '↓'], label: 'Previous / next component' },
  { keys: ['j', 'k'], label: 'Previous / next component' },
  { keys: ['/'], label: 'Focus search' },
  { keys: ['['], label: 'Collapse / show the sidebar' },
  { keys: ['Space'], label: 'Hold to orbit the camera (View mode)' },
  { keys: ['V'], label: 'Toggle Interact / View' },
  { keys: ['?'], label: 'Toggle this shortcuts panel' },
  { keys: ['Esc'], label: 'Clear search / close panels' },
]

/** Keyboard shortcut cheat-sheet modal. Visibility is owned by App.tsx. */
export function ShortcutsOverlay({ onClose }: { onClose: () => void }) {
  return (
    <div className="shortcuts-scrim" onClick={onClose}>
      <div
        className="shortcuts glass"
        role="dialog"
        aria-label="Keyboard shortcuts"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shortcuts-head">
          <h3>Keyboard shortcuts</h3>
          <button className="docs-close" onClick={onClose} aria-label="Close">
            &times;
          </button>
        </div>
        <ul className="shortcuts-list">
          {SHORTCUTS.map((s) => (
            <li key={s.label + s.keys.join()}>
              <span className="shortcuts-keys">
                {s.keys.map((k) => (
                  <kbd key={k}>{k}</kbd>
                ))}
              </span>
              <span className="shortcuts-label">{s.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
