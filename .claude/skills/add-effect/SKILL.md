---
name: add-effect
description: Add a new effect (surface material, instance layout, or standalone component) to easy-3dkit end to end - lib module, public export, gallery entry with codegen spec and docs, regenerated EFFECTS.md, smoke test. Use when asked to create or add an effect, material, layout, shader, or 3D component to the kit.
---

# Add an effect to easy-3dkit

Every effect ships in FIVE places, in this order. Missing any one breaks the
contract (the docs script will fail on a missing codegen identifier).

## 1. Lib module (the effect itself)

Pick the family and copy a sibling as a template; match its comment style:

- Surface shader -> `src/lib/materials/<name>.ts` implementing `SurfaceMaterial`
  (see `src/lib/materials/types.ts`). Build `uniforms` ONCE; mutate only
  `.value` inside `update()`. The family injects `uTime`, `uMouse`, `uScroll`,
  `uResolution`. Include `controls` (leva schema) and `docs` (one line per
  control key, accurate to the shader math).
- Instance layout -> `src/lib/layouts/<name>.ts` exporting a factory
  `(opts) => InstanceLayout` with a `place(i, t, m, ctx)` callback.
- Standalone component -> `src/lib/components/<Name>.tsx`. House style: one
  group/mesh ref, one `useFrame`, refs only - never per-frame React state.

Lib rules: only peer deps (react, three, @react-three/*, gsap). Never import
leva or react-router. No `Date.now()`-style nondeterminism in render paths.

## 2. Public export

Add the value AND its type to `src/lib/index.ts`. Not exported = not usable =
codegen validation fails.

## 3. Gallery entry

- Surface materials: one `surfaceEntry(material, { description })` call in
  `src/gallery/registry.tsx` - codegen and docs are auto-filled from the
  material.
- Layouts / standalones: use the `grid()` / `standalone()` helpers in
  `src/gallery/generatedEntries.tsx`, or a full entry in registry.tsx with an
  explicit `codegen: CodegenSpec` (component/kind/layoutFactory/layoutKeys)
  and `docs: { props }`. The codegen spec is what makes the gallery's
  "Copy code" button emit correct code - identifiers must match step 2.

## 4. Documentation

Run `pnpm docs:effects`. It validates every codegen identifier against the
real lib exports (exits 1 on a mismatch) and regenerates EFFECTS.md. Never
edit EFFECTS.md by hand.

## 5. Verify

```bash
pnpm typecheck
pnpm dev            # leave running
pnpm smoke          # all effects + docs panel snippets; expect N/N pass
```

If the dev server is not on 5173, pass `SMOKE_URL=http://localhost:<port>/`.
