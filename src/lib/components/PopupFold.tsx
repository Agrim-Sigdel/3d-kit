import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Color, Group, MathUtils, Mesh } from 'three'

export interface PopupFoldProps {
  /** Base panel tint; per-panel hue is offset deterministically. */
  color?: string
  /** Animation rate for the open/close breathing cycle. */
  speed?: number
  /** Number of folding leaves arranged front-to-back. */
  count?: number
  /** Width / height of each flat panel before folding. */
  panelSize?: [number, number]
  /** Depth gap between successive leaves so they nest like book pages. */
  spacing?: number
  /** Max fold angle in radians (0 = flat on the page, PI/2 = standing up). */
  foldAngle?: number
}

// Deterministic per-index pseudo-random in [0,1). Avoids RNG/time so the
// arrangement is reproducible across reloads and SSR hydration.
function hash01(i: number): number {
  const s = Math.sin(i * 12.9898 + 78.233) * 43758.5453
  return s - Math.floor(s)
}

export function PopupFold({
  color = '#5fa8ff',
  speed = 1,
  count = 5,
  panelSize = [2.4, 1.6],
  spacing = 0.18,
  foldAngle = Math.PI / 2,
}: PopupFoldProps) {
  const root = useRef<Group>(null)
  // Pivot groups hinge along the bottom edge; the mesh inside is offset up so
  // the panel rotates about its base rather than its centre, like a real fold.
  const hinges = useRef<Array<Group | null>>([])
  const pointer = useThree((s) => s.pointer)

  const [pw, ph] = panelSize

  // Precompute per-leaf static data once: tint, phase offset and hinge sign.
  const leaves = useMemo(() => {
    const base = new Color(color)
    return Array.from({ length: Math.max(1, Math.floor(count)) }, (_, i) => {
      const r = hash01(i)
      const tint = base.clone().offsetHSL((r - 0.5) * 0.12, 0.0, (r - 0.5) * 0.1)
      // Alternate hinge direction so leaves fold toward each other (book spine).
      const sign = i % 2 === 0 ? 1.0 : -1.0
      return {
        z: (i - (count - 1) / 2) * spacing,
        phase: r * Math.PI * 2.0,
        sign,
        tint: `#${tint.getHexString()}`,
      }
    })
  }, [color, count, spacing])

  useFrame((state) => {
    const t = state.clock.elapsedTime * speed
    for (let i = 0; i < leaves.length; i++) {
      const hinge = hinges.current[i]
      if (!hinge) continue
      // Breathing open/close: 0 -> foldAngle. Phase stagger gives a wave so the
      // page nearest the spine opens slightly ahead of the outer ones.
      const open = (Math.sin(t + leaves[i].phase) * 0.5 + 0.5) * foldAngle
      hinge.rotation.x = open * leaves[i].sign
    }
    if (root.current) {
      // Subtle parallax tilt toward the cursor; damped so motion stays gentle.
      const tx = -pointer.y * 0.25
      const ty = pointer.x * 0.4
      root.current.rotation.x = MathUtils.lerp(root.current.rotation.x, tx, 0.06)
      root.current.rotation.y = MathUtils.lerp(root.current.rotation.y, ty, 0.06)
    }
  })

  return (
    <group ref={root}>
      {leaves.map((leaf, i) => (
        <group key={i} position={[0, -ph / 2, leaf.z]}>
          <group
            ref={(g: Group | null) => {
              hinges.current[i] = g
            }}
          >
            {/* Panel pushed up by half its height so the group origin is the hinge. */}
            <mesh position={[0, ph / 2, 0]} castShadow receiveShadow>
              <boxGeometry args={[pw, ph, 0.04]} />
              <meshStandardMaterial
                color={leaf.tint}
                roughness={0.55}
                metalness={0.05}
              />
            </mesh>
          </group>
        </group>
      ))}
      {/* Flat base spread the leaves rise from, anchoring the pop-up read. */}
      <mesh
        position={[0, -ph / 2 - 0.02, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <boxGeometry args={[pw * 1.1, spacing * count + 0.4, 0.04]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
    </group>
  )
}

// Referenced to satisfy noUnusedLocals when tree-shaken; Mesh typing documents
// the ref shape consumers may attach to individual panels via cloning.
export type PopupFoldPanelRef = Mesh