import {
  InstancedGrid,
  OceanPlane,
  ParticleField,
  PostFX,
  Stage,
  cubeSwarm,
  voxelSphere,
} from '@o3s/lib'

/**
 * ClayBackdrop — the soft, palette-tinted 3D wash behind the Kiln & Clay site.
 *
 * Deliberately NOT the landing page's scroll-banded backdrop. This is one
 * calm fixed layer: drifting kiln-dust particles, a slow voxel sphere reading
 * as a turning pot, and a low pour of "slip" along the bottom. Per-section
 * 3D lives inline in the page itself, not here — so the chrome and the
 * structure read completely differently from the home page.
 *
 * Palette is fixed and warm: wine (#810B38), cream (#F1E2D1), tan (#DCC3AA),
 * dark brown (#541A1A). Light and dark are two grades of the same earth tones.
 */
export type ClayTheme = 'warm' | 'kiln'

interface Grade {
  bg: string
  dust: string
  dustOpacity: number
  voxel: string
  voxelEmissive: string
  voxelGlow: number
  slip: string
  slipCrest: string
  bloom: number
  bloomThreshold: number
  vignette: number
  noise: number
}

const GRADES: Record<ClayTheme, Grade> = {
  // Daytime: cream paper, wine and tan accents, almost no bloom.
  warm: {
    bg: '#f1e2d1',
    dust: '#dcc3aa',
    dustOpacity: 0.45,
    voxel: '#dcc3aa',
    voxelEmissive: '#810b38',
    voxelGlow: 0.3,
    slip: '#dcc3aa',
    slipCrest: '#810b38',
    bloom: 0.12,
    bloomThreshold: 0.7,
    vignette: 0.18,
    noise: 0.035,
  },
  // Evening firing: deep brown, embers glowing in the wine accent.
  kiln: {
    bg: '#1c0d0d',
    dust: '#dcc3aa',
    dustOpacity: 0.32,
    voxel: '#541a1a',
    voxelEmissive: '#810b38',
    voxelGlow: 1.05,
    slip: '#2a1212',
    slipCrest: '#810b38',
    bloom: 0.62,
    bloomThreshold: 0.34,
    vignette: 0.42,
    noise: 0.05,
  },
}

export function ClayBackdrop({ theme }: { theme: ClayTheme }) {
  const g = GRADES[theme]
  return (
    <div className="clay-backdrop" aria-hidden>
      <Stage background={null}>
        {/* Kiln dust drifting through the whole scene — continuity. */}
        <ParticleField
          count={9000}
          radius={26}
          distribution="cube"
          color={g.dust}
          size={0.02}
          opacity={g.dustOpacity}
          glow={theme === 'kiln'}
          speed={0.02}
          tumble={0.15}
        />
        {/* A slow turning "pot" built from voxels, up and to the right. */}
        <group position={[5.5, 1.6, -4]} scale={1.3}>
          <InstancedGrid
            layout={voxelSphere({ count: 1300, radius: 3, rotateSpeed: 0.08, voxelSize: 0.12 })}
            color={g.voxel}
            emissive={g.voxelEmissive}
            emissiveIntensity={g.voxelGlow}
            metalness={0.1}
            roughness={0.85}
          />
        </group>
        {/* A loose drift of trimmings, lower left, very calm. */}
        <group position={[-6, -1, -3]} scale={0.9}>
          <InstancedGrid
            layout={cubeSwarm({ count: 240, bounds: 5, speed: 0.12, size: 0.16, cohesion: 0.4 })}
            color={g.dust}
            emissive={g.voxelEmissive}
            emissiveIntensity={g.voxelGlow * 0.4}
            roughness={0.9}
          />
        </group>
        {/* Slip pooling along the bottom edge of the page. */}
        <group position={[0, -4.2, 0]}>
          <OceanPlane
            color={g.slip}
            crestColor={g.slipCrest}
            size={60}
            segments={90}
            speed={0.45}
            waveCount={3}
          />
        </group>
        <PostFX
          bloom={g.bloom}
          bloomThreshold={g.bloomThreshold}
          vignette={g.vignette}
          noise={g.noise}
        />
      </Stage>
    </div>
  )
}
