# O3S — Distribution Plan (shadcn-style + npm)

How to make the 3D kit usable by anyone: a stable **npm package** for the engine,
plus a **shadcn-compatible registry** so people can copy effect source into their own
repo and edit it. Two front doors, one library.

---

## 1. The decision and why

Goal: "make my 3D kit usable by anyone." That splits into two real audiences, and a
3D kit is different from shadcn's UI components in one way that decides the design:

- shadcn components (a button) are **self-contained** — copy one file, done.
- O3S effects are **layered**. A variant like `glassmorphism.ts` is self-contained
  *except* it imports `../shaders/chunks`, and it only runs inside the
  `<InteractiveSurface>` family component, which itself needs `Stage` / `CameraRig` /
  the `SurfaceMaterial` contract. Copying one effect the shadcn way would otherwise
  drag 10–15 engine files into the user's repo and force them to hand-sync the engine.

So the model is **hybrid** — the split follows the existing architecture exactly:

| Layer | Ships as | Why |
|---|---|---|
| Engine + family components + contracts + shader chunks (`Stage`, `CameraRig`, `InteractiveSurface`, `InstancedGrid`, `ParticleField`, `FloatingObject`, `ScrollScene`, `PostFX`, hooks, `materials/types`, `shaders/chunks`) | **npm package `@o3s/lib`** | Stable plumbing nobody wants to copy-paste or keep in sync by hand. |
| The ~40 variants (`materials/*`, `layouts/*`, and the standalone behavior components) | **shadcn registry** (`r/<id>.json`) | Small, self-contained-ish, and exactly the source people want to own and tweak (it's the shader). |

This mirrors how mature kits ship: a stable runtime package + copy-in "blocks" on top.
We do **not** build a custom CLI — `npx shadcn add <url>` already resolves dependency
trees, rewrites import aliases, and installs npm deps. We just publish a conformant
registry and inherit the installer for free.

### What a user does

```bash
# Path A — plug-and-play (npm)
npm install @o3s/lib three @react-three/fiber @react-three/drei
```
```tsx
import { Stage, InteractiveSurface, glassmorphism } from '@o3s/lib'
<Stage><InteractiveSurface material={glassmorphism} /></Stage>
```

```bash
# Path B — own the source (shadcn)
npx shadcn@latest add https://<host>/r/glassmorphism.json
# → writes src/components/o3s/glassmorphism.ts into THEIR repo,
#   ensures @o3s/lib + three + @react-three/fiber are installed,
#   the copied file imports the engine from @o3s/lib
```

Power users edit the copied shader; everyone else just installs and imports. Same kit.

---

## 2. Repo layout (chosen: keep `src/lib`, add build config)

No monorepo refactor. `src/lib/` stays the package entry; the gallery keeps its current
`@o3s/lib` Vite alias and tsconfig path. We add a build that targets `src/lib/index.ts`.

```
/
├─ src/lib/                ← unchanged source = the package
│  └─ index.ts             ← already the public surface (package entry)
├─ src/gallery/            ← unchanged; doubles as the registry browser / docs
├─ vite.lib.config.ts      ← NEW: Vite library-mode build for the package
├─ package.lib.json        ← NEW: the published package manifest (see §3)
│                            (or a build step that emits dist/package.json)
├─ scripts/build-registry.mjs  ← NEW: registry.tsx → public/r/*.json (see §5)
├─ registry/                ← NEW: hand-authored item metadata (deps, extra files)
│  └─ items/<id>.json
├─ public/r/               ← NEW (generated): registry-item JSONs served statically
│  ├─ registry.json        ← index of all items
│  └─ <id>.json            ← one per effect
└─ dist/                   ← NEW (generated): the npm tarball contents
```

The published package and the gallery share the same `src/lib` source — they never
drift, because there is only one copy.

---

## 3. Package the engine for npm (`@o3s/lib`)

**3.1 Build config — `vite.lib.config.ts`** (Vite library mode)
- `build.lib.entry = src/lib/index.ts`, formats `['es']` (ESM-only is fine for R3F).
- `build.rollupOptions.external`: `react`, `react-dom`, `react/jsx-runtime`, `three`,
  `@react-three/fiber`, `@react-three/drei`, `@react-three/postprocessing`, `gsap`,
  `leva`. These become **peerDependencies** — never bundle three.js (duplicate-instance
  bugs) or React.
- Emit `.d.ts` types: add `vite-plugin-dts` (or run `tsc --emitDeclarationOnly` against
  a lib-only tsconfig). Types are the package's docs — must ship.

**3.2 `package.json` for the package** (`package.lib.json`, copied into `dist/` on build)
```jsonc
{
  "name": "@o3s/lib",            // pick a real npm scope you own, e.g. @your-handle/o3s
  "version": "0.1.0",
  "type": "module",
  "files": ["dist"],
  "exports": {
    ".": { "types": "./dist/index.d.ts", "import": "./dist/index.js" }
  },
  "peerDependencies": {
    "react": ">=18", "react-dom": ">=18", "three": ">=0.160",
    "@react-three/fiber": ">=8", "@react-three/drei": ">=9"
  },
  "peerDependenciesMeta": {
    "@react-three/postprocessing": { "optional": true },  // only PostFX needs it
    "gsap": { "optional": true },                          // only some ScrollScene
    "leva": { "optional": true }                           // controls are gallery-only
  }
}
```
Note: the `controls` (leva schemas) on each variant are gallery metadata. Decide whether
the package ships them (keeps `leva` as an optional peer) or strips them at build so the
package has zero leva coupling. **Recommended: strip `controls` from the package build**
(they're for the gallery/registry, not runtime) so consumers never need leva.

**3.3 Verify**: `npm pack` → inspect the tarball has only `dist/` (JS + d.ts), correct
`exports`, and no bundled three/React. Smoke-test by `npm install`-ing the tarball into a
throwaway Vite app and importing `glassmorphism`.

**3.4 Scripts** (root `package.json`):
```
"build:lib":      "vite build --config vite.lib.config.ts && tsc -p tsconfig.lib.json",
"build:registry": "node scripts/build-registry.mjs",
"build:dist":     "pnpm build:lib && pnpm build:registry"
```

---

## 4. Registry schema (shadcn-compatible)

Adopt shadcn's `registry-item.json` shape so `npx shadcn add <url>` just works. Per item:

```jsonc
// public/r/glassmorphism.json
{
  "$schema": "https://ui.shadcn.com/schema/registry-item.json",
  "name": "glassmorphism",
  "type": "registry:component",
  "title": "Glassmorphism",
  "description": "Frosted translucent surface with cursor sheen.",
  "dependencies": ["@o3s/lib", "three", "@react-three/fiber"],  // npm deps
  "registryDependencies": [],                                    // other O3S items, if any
  "files": [
    {
      "path": "registry/glassmorphism.ts",     // source location at build time
      "target": "components/o3s/glassmorphism.ts", // where it lands in user's repo
      "type": "registry:component",
      "content": "…inlined source string…"      // shadcn inlines file contents
    }
  ]
}
```

Key points:
- `dependencies` carries `@o3s/lib` so the installer pulls the engine — this is the hinge
  of the hybrid model. The copied file's `import { … } from '@o3s/lib'` then resolves.
- The one cross-variant import (`../shaders/chunks`) is **not** copied — `shaderChunks` is
  re-exported from `@o3s/lib`, so the registry generator rewrites
  `from '../shaders/chunks'` → `from '@o3s/lib'` before inlining. (See §5.3.)
- `registryDependencies` is for the rare variant that needs another variant; mostly empty.
- A top-level `public/r/registry.json` lists every item (name, type, description) so a
  browser/CLI can enumerate the kit.

---

## 5. Registry generator — `scripts/build-registry.mjs`

The existing `src/gallery/registry.tsx` + `generatedEntries.tsx` are already structured
data (id, name, family, description per effect). The generator turns each into a
registry item. Mostly mechanical.

**5.1 Inputs**: a manifest mapping each effect `id` → its source file path and npm deps.
Two ways to get it (pick one):
- **(a) Derive** from `registry.tsx`: import the registry array, read `id`/`name`/
  `description`/`family`, and map `family` → source file convention
  (`InteractiveSurface` → `materials/<id>.ts`, `InstancedGrid` → `layouts/<id>.ts`,
  `FloatingObject`/`ScrollScene` standalone → `components/<Name>.tsx`).
- **(b) Hand-author** `registry/items/<id>.json` stubs (deps + target path) and let the
  generator fill in `content`. More control for odd cases.
  **Recommended: (a) with a small per-id override table** for the handful that don't fit
  the convention.

**5.2 Per item, the generator**:
1. Resolves the variant's source file under `src/lib/…`.
2. Reads it, rewrites internal imports to package imports (§5.3).
3. Inlines the (rewritten) source as `files[].content`.
4. Computes `dependencies` (always `@o3s/lib` + `three` + `@react-three/fiber`; add
   `@react-three/postprocessing` for PostFX items, `gsap` for GSAP-driven ScrollScene).
5. Writes `public/r/<id>.json` and appends to `public/r/registry.json`.

**5.3 Import rewriting** (the only non-trivial bit):
- `from '../shaders/chunks'` / `from '../materials/types'` → `from '@o3s/lib'`
  (both are re-exported from the package surface — verify each used symbol is in
  `src/lib/index.ts`; `shaderChunks` is exported as a namespace, so a variant doing
  `import { snoise2D } from '../shaders/chunks'` rewrites to
  `import { shaderChunks } from '@o3s/lib'` + a `const { snoise2D } = shaderChunks`, OR
  we add named re-exports of the chunks to `index.ts`. **Recommended: add named chunk
  re-exports** so the rewrite is a clean one-liner.)
- Strip the `controls` field from the inlined variant if we also stripped it from the
  package (keep behavior identical between the two install paths).

**5.4 Validation**: after generating, run shadcn's own validation if available, and a
self-check that every `content` string parses and every `from '@o3s/lib'` symbol exists
in the built `dist/index.d.ts`.

---

## 6. Hosting (deferred — kept host-agnostic on purpose)

The registry is just **static JSON under `public/r/`**. Any static host serves it, so the
hosting choice is decoupled and can be made later:
- **Reuse the Vite gallery**: `public/r/*.json` ships with the existing site; the install
  URL is `https://<gallery-host>/r/<id>.json`. Zero extra infra.
- The only host requirement: serve `r/*.json` over HTTPS with permissive CORS (shadcn's
  CLI fetches them). A `_headers`/`vercel.json`/`netlify.toml` CORS rule covers it.

When hosting is chosen, set the canonical base URL in one place (the generator) so every
emitted JSON and every gallery "copy install command" uses it.

---

## 7. Gallery becomes the registry browser (docs)

Make the existing gallery double as the install/docs surface — low effort, high payoff:
- Each `GalleryEntry` already has `id`/`name`/`description`. Add to each card:
  - a **"Copy install command"** button → `npx shadcn@latest add <base>/r/<id>.json`
  - a **"View source"** disclosure showing the variant file (the registry `content`)
  - a small **"npm" tab** showing the `import … from '@o3s/lib'` snippet
- This requires no new data: it reads the same registry the gallery already renders.

---

## 8. Build order (recommended)

1. **Package the engine** (§3) — foundation both paths depend on. Land `vite.lib.config.ts`,
   the package manifest, d.ts emit, and a green `npm pack` + throwaway-app smoke test.
   *(Do the chunk named re-exports in `index.ts` here so §5.3 is trivial later.)*
2. **Registry schema + generator** (§4–5) — emit `public/r/*.json` for ONE effect end to
   end, install it into a scratch app via `npx shadcn add`, confirm it renders.
3. **Generate all 40** — run the generator across the full registry; fix per-id overrides.
4. **Gallery install UX** (§7) — copy-command + view-source on each card.
5. **Pick hosting** (§6), set the base URL, publish `@o3s/lib` to npm, ship.

## 9. Open decisions to confirm before coding

- **npm scope/name**: `@o3s/lib` is a placeholder — needs a scope you own on npm.
- **Strip `controls` from package + registry?** (Recommended yes → no leva dependency for
  consumers; gallery keeps them.)
- **Chunk re-exports vs namespace rewrite** in §5.3 (Recommended: add named re-exports).
- **Manifest: derive vs hand-author** (Recommended: derive + override table).
- **Hosting target** (deferred) — pin the base URL when chosen.
