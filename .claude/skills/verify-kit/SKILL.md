---
name: verify-kit
description: Run the full easy-3dkit verification suite - typecheck, app build, library build, EFFECTS.md generation gate, and the puppeteer smoke test over every gallery effect. Use after any change to src/lib, src/gallery, or the scripts, or when asked to verify, test, or check the kit.
---

# Verify easy-3dkit

Run in this order; each step catches a different failure class.

```bash
pnpm typecheck       # tsc -b --noEmit
pnpm build           # gallery app compiles + bundles
pnpm build:pkg       # publishable library (vite lib build + d.ts)
pnpm docs:effects    # codegen validation gate + regenerate EFFECTS.md
```

`docs:effects` fails (exit 1) if any gallery entry lacks a codegen spec or
references an identifier that src/lib/index.ts does not export - this is the
codegen correctness test, not just doc generation.

## Smoke test (needs a dev server and system Chrome)

```bash
pnpm dev             # background; note the port vite prints
pnpm smoke           # or SMOKE_URL=http://localhost:<port>/ pnpm smoke
```

The smoke script clicks every sidebar effect with the Docs panel open and
fails an effect on: console/page errors, shader compile errors, an empty
usage snippet, or a snippet missing the easy-3dkit import. Expect
`PASS N/N`. A studio visual pass also exists: `node scripts/verify-studio.mjs`.

## What to check manually when camera/scroll behavior changed

- Hold Space (View mode), orbit, release: the Camera leva sliders must follow
  and the camera must not snap afterward.
- Set a non-zero Animation channel on a non-ScrollScene effect: the scroll
  slider + Play bar must appear and drive the effect.
- Copy code -> paste into a scratch file: imports must resolve, values must
  match the panel.
