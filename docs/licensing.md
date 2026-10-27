# Licensing and attribution

## Our own work

| What | Licence |
|---|---|
| Code: JavaScript, Python, build configuration | **Apache-2.0** |
| Content: 3D models, research notes, design notes, lesson material, docs | **CC BY-SA 4.0** |

The repository follows the [REUSE](https://reuse.software) specification. [`REUSE.toml`](../REUSE.toml) sets these defaults and lists every third-party exception, and the licence texts are in [`LICENSES/`](../LICENSES). CI runs `reuse lint` on every push and pull request.

## Third-party material

- **Photos and engravings** in `research/images/commons/` (Wikimedia Commons and Flickr): each under its own licence (CC BY-SA 4.0, 3.0 or 2.0, CC BY 4.0, 3.0 or 2.0, CC0, public domain, some dual-licensed with the GFDL), catalogued per file with author and source in `research/data/photo_catalog.json` and `research/images/ATTRIBUTION.md`. They are modelling references: nothing in the simulator is derived from them. Anything derived from one later (a texture, a picture in a lesson) credits the photographer and keeps its licence; prefer the CC0, public-domain and CC BY files, since CC BY-SA would carry share-alike into it.
- **Public-domain scans** in `research/images/pd-scans/` (publications before 1900) can be used freely, and are still cited.
- **The tutorial's pictures** in `images/tutorial/`: four of the research's images, scaled and re-encoded, each under its own licence (public domain, CC0, CC BY 4.0), annotated per file in `REUSE.toml` and credited under the picture in the app.
- **The machine's sounds** in `audio/`: edited for this project from Pixabay sound effects, under the Pixabay Content License (`LicenseRef-Pixabay`), which allows use and modification without attribution but not distributing the sounds on their own, apart from the simulator; each file's source is in `audio/SOURCES.md`.
- **Vendored library** in `vendor/three/`: three.js (MIT), copied unchanged from its npm package with its `LICENSE` (`pnpm vendor`).
- **The name game's font** (`js/game/unscii16.js`): the printable ASCII glyphs of Unscii 8 × 16 by Viznut, which is in the public domain (its "full" variant, GPL, is not used).
- **Copyrighted drawings and figures** (modern papers and books, archive drawings) are **not** copied, traced or redistributed without written permission. **Facts and dimensions taken from them may be used**, with a citation: every value in `params/` carries a `src`.
- **Licences that forbid commercial use or derivatives** (NC, ND) are incompatible with this repository's licences, so such material is not committed (the Science Museum Group's images, CC BY-NC-SA, are referred to, not copied).

Each third-party path has its own annotation in `REUSE.toml`, and its licence text is in `LICENSES/`.

## Credits

The README's **Credits** section lists the research sources the model relies on and the photographers whose images were used.
