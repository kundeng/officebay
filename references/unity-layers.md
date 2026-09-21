# Unity:Layers — vendored reference

| field | value |
|---|---|
| Upstream | `https://github.com/dimitri-rod/unity-layers.git` |
| Author | Dimitri Rod |
| Licence | **MIT** |
| Working clone | `~/Projects/_refs/unity-layers` (depth 50, outside this repo) |
| Pinned commit | `5e9d3f32b898205220eae544131a8d11795eb682` |
| Commit date | 2026-08-31 19:27:05 -0300 |
| Subject | `scan: run the walk on a worker so /scan returns at once` |
| Size at clone | 115 files |
| Stack | FastAPI · React + Vite · SQLite + FTS5 · PDF.js |
| Recorded | 2026-09-17 |

## Why it is here

It is a shipped answer to "what is a layer, as data" — and it is MIT, so the schema can be adapted
directly with attribution rather than only learned from.

Its `CLAUDE.md` opens with the rule that makes it relevant: "**Never** write, move, rename, or
touch files under any collection root; all mutations go to SQLite (`backend/overlay.db`)." The
whole product is a read-only overlay on a document collection, which is the shape officebay's layer
store needs whether or not it ever uses SQLite.

Three designs are taken:

1. **A layer is a row with a visibility column.** `layers(id, name, color, sort_order, visible)`.
   Toggling a layer is an `UPDATE`, not renderer state. This is the substrate for per-mode layer
   toggling.
2. **An anchor-kind discriminator.** `annotations.anchor` is `'point' | 'page' | 'span'`, so one
   table holds several anchoring strategies. Its comment carries the argument officebay needs:
   a `'span'` anchor carries character offsets "since a character range survives zoom and
   re-render in a way a rectangle does not."
3. **The annotation body is markdown.** The layer content is the same document type as the
   document — "layers are just a special kind of block", one level up.

Set aside for now: the `edges` table (`shared_tag | same_folder | text_similarity`, with weights
comparable within a type and not across types) is collection-level discovery, not layer mechanism.
It is the right reference if cross-document relationships come into scope later.

## Verification

```
git -C ~/Projects/_refs/unity-layers log -1 --format=%H   # 5e9d3f32b898...
git -C ~/Projects/_refs/unity-layers ls-files | wc -l     # 115
head -1 ~/Projects/_refs/unity-layers/LICENSE             # MIT License
```

## What was read

`README.md`, `CLAUDE.md`, `LICENSE`, `backend/schema.sql` (17 tables; `layers`, `tags`,
`file_tags`, `annotations`, `edges` read in detail).

Vendored:

- [extracts/unity-layers-schema-layers-annotations.sql](extracts/unity-layers-schema-layers-annotations.sql) — the `layers`, `tags`, `file_tags`, `annotations` and `edges` definitions with their comments
- [extracts/unity-layers-LICENSE.txt](extracts/unity-layers-LICENSE.txt)

Findings are in
[docs/research/2026-09-17-markdown-block-model-and-layer-anchoring.md](../docs/research/2026-09-17-markdown-block-model-and-layer-anchoring.md).
