# Development

How to run, check, change and release the simulator. The rules the code, the models and the tests follow are in [conventions.md](conventions.md), the page's design principles in [ui-design.md](ui-design.md), and the licences in [licensing.md](licensing.md).

## Running it

There is nothing to build: the pages are plain HTML, CSS and JavaScript modules, and three.js is vendored. Serve the repository's root over HTTP and open it:

```
pnpm serve
```

`pnpm serve` (`tools/serve.mjs`) is a small static server that turns caching off, so a changed file is always fetched again while you work; any static server works too (`python3 -m http.server 8000`), but a browser may then keep an old stylesheet until a hard reload.

- <http://localhost:8000/> is the learner page (`index.html`).
- <http://localhost:8000/dev/> lists the developer pages, one per milestone. They are not linked from the learner page.

Pages cannot be opened from `file://`, because browsers do not load modules from there.

**Page options.**

| Option | Where | What it does |
|---|---|---|
| `?lesson=L3` | learner page | Open a lesson (L1 to L10) |
| `?view=3d` | learner page | Open the mechanism pane on the parts in 3D |
| `#…` (a copied link) | learner page, `dev/02-loom/` | Open the loom with those cards, at that moment (the format is a public contract: `js/sim/link.js`) |
| `?text=…&mode=damask` or `direct` | `dev/06-name-game/` | Open the name game with that text |
| `?selftest` | every page | Run the page's acceptance checks and show the results |

## Requirements

- **Git LFS**, for the 3D models: run `git lfs install` once, then clone as usual (or `git lfs pull` in an existing clone). Without it the `.glb` files are small pointer files, and the 3D views and tests fail.
- **Node 22 or later** and **pnpm** (the version is in `package.json`'s `packageManager`), for the checks: `pnpm install` brings three.js for Node and TypeScript's checker. The pages themselves need neither.
- **Blender 5.2**, only to rebuild the models (`pnpm build:model`). Set `BLENDER` to its path if it is not at `/Applications/Blender.app`.

## Commands

| Command | What it does |
|---|---|
| `pnpm serve` | Serves the site at http://localhost:8000/, with caching off |
| `pnpm test` | The logic, the 2D and 3D acceptance tests, the version stamps, `vendor/`, and the reference check's own tests (Node, no browser) |
| `pnpm typecheck` | The JSDoc types, checked strictly; nothing is compiled |
| `pnpm check:refs` | No private references, local paths or broken links (`tools/check-refs.mjs`) |
| `pnpm build:model` | Rebuilds the five units and the ghosted machine into `assets/` with Blender, headless |
| `pnpm vendor` | Copies three.js from `node_modules` into `vendor/` |
| `pnpm stamp` | Writes the version into every file name the pages load |
| `reuse lint` | Every file's licence is declared (REUSE; CI runs it) |

Before a commit: `pnpm check:refs`, `pnpm typecheck`, `pnpm test`, and the `?selftest` of the pages a change touches. After a change to `params/` or `blender/scripts/`: `pnpm build:model`, and commit the new `.glb` files with it.

## Versions and releases

- **The version lives in one place,** `package.json`. `pnpm version x.y.z` sets it and stamps it into every page's file names (`?v=`), so a cache can keep each file for ever and a new release asks for new names; it does not commit or tag (`.npmrc`).
- **A release** is a branch and a pull request (`release/vX.Y.Z`) with the version set, the stamps and the changelog ([CHANGELOG.md](../CHANGELOG.md)); once merged, it is tagged `vX.Y.Z` on GitHub, on the merge commit.
- **Caching on the server:** the pages (`index.html`, `dev/**/index.html`) must be revalidated; everything they load carries `?v=` and may be cached for ever.

## Publishing

GitHub Pages publishes the repository as it is, from an LFS checkout (`.github/workflows/pages.yml`), once the Tests workflow has passed on `main`. In the repository's settings: Pages, Source: GitHub Actions.
