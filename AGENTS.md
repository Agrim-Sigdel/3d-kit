# AGENTS.md

Guidance for AI coding agents working in this repository. Humans should read
[Readme.md](./Readme.md) first; this file captures the conventions an agent needs
to make changes that fit.

## What this is

`easy-3dkit` is a published npm library of interactive 3D React components (three.js +
React Three Fiber + GSAP), plus a local gallery and demo "studio" page used to
develop and preview them. The library is the product; the gallery and studio are
development tooling that ships only in the repo, never in the npm package.

## Repository layout

```
src/
├── lib/              THE PACKAGE. Only this directory is published to npm.
│   ├── index.ts      Public surface — the ONLY things consumers may import.
│   ├── engine/       Layer 1: Stage (Canvas/renderer/lights/loop), CameraRig, stores.
│   ├── hooks/        Layer 2: reusable primitives (useMouse, useScrollProgress).
│   ├── components/   Layer 3: the 3D elements consumers assemble.
│   ├── materials/    Surface-material variants for <InteractiveSurface>.
│   ├── layouts/      Instance-layout variants for <InstancedGrid>.
│   └── shaders/      Shared GLSL chunks.
├── gallery/          Dev-only: the preview app that consumes lib/ (uses leva, router).
├── studio/           Dev-only: a themed demo site (/studio).
└── showcase/         Dev-only: interactive feature tour of the whole kit (/showcase).
scripts/              Dev-only puppeteer smoke/visual checks + EFFECTS.md generator.
.claude/skills/       Agent skills: add-effect, verify-kit, use-kit. Read the one
                      matching your task before starting.
```

## The one architectural rule

Lower layers never import higher ones, and **library code must never import
gallery/studio-only dependencies** (`leva`, `react-router-dom`). Components are
"props in, visuals out" — they must not assume they live in a website vs. a game.
A website drives them with scroll; a game drives them with game state. Keep
drivers (like `ScrollScene`) separate from the components they drive.

Before adding any import to `src/lib/`, confirm the dependency is a declared
**peer dependency** in `package.json` (react, three, @react-three/*, gsap). Adding
a hard runtime dependency to the library is almost always a mistake — it would be
bundled into consumers and can cause duplicate-instance crashes.

## Adding a component / material / layout

Full checklist: `.claude/skills/add-effect/SKILL.md`. In short:

1. Create the file under the matching `src/lib/` subdirectory. Use a sibling as a
   template; match its comment density and naming. Surface materials should
   include a `docs` map (one line per control key).
2. Export it (and its props/options type) from `src/lib/index.ts`. This file is
   the package boundary — if it isn't exported here, consumers can't use it.
3. Add a gallery entry in `src/gallery/registry.tsx` (or via the helpers in
   `src/gallery/generatedEntries.tsx`) with a `codegen` spec so the gallery's
   Copy code button and docs emit correct code.
4. Run `pnpm docs:effects` — it validates every codegen identifier against the
   real lib exports and regenerates [EFFECTS.md](./EFFECTS.md). Never edit
   EFFECTS.md by hand.

## Commands

```bash
pnpm install        # this repo uses pnpm
pnpm dev            # gallery at http://localhost:5173
pnpm typecheck      # tsc -b --noEmit
pnpm build:pkg      # build the publishable library (dist/easy-3dkit.js + dist/*.d.ts)
pnpm smoke          # puppeteer smoke check (needs the dev server running)
```

To inspect what would publish: `npm pack` then `tar -tf easy-3dkit-*.tgz` — it must
contain only `dist/**`, `package.json`, `Readme.md`, and `LICENSE`.

## Conventions

- **No emojis** anywhere — code, comments, docs, commit messages, or generated files.
- ESM only. The whole codebase is `"type": "module"`.
- Do not add `.ts` extensions to imports inside `src/lib/` — it breaks the
  declaration-emit build (`tsconfig.lib.json`).
- TypeScript is `strict`; keep it that way. Every public component exports its
  props type from `index.ts`.

## Publishing (maintainers only)

`build:pkg` runs automatically via `prepublishOnly`. Bump the version, update
[CHANGELOG.md](./CHANGELOG.md), then `npm publish`. Tag the release: `git tag vX.Y.Z`.
