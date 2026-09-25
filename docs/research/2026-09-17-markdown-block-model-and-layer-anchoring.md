# The markdown app's block model, and what a layer must anchor to

Companion to [2026-09-17-extension-points-and-layers.md](2026-09-17-extension-points-and-layers.md),
which surveyed all seven apps and did not examine `apps/markdown`. This one examines it, and
compares it against three shipped programs that solve the same problem.

The product target: **collections of markdown documents, with comments, annotations, ink, AI Q&A
and presentation as layers that toggle per mode.** Markdown is the document. PDF is an optional
display surface over it, not the base.

Build order: the extension mechanism first, then layers that toggle per mode — study ink and
presentation ink are different layers of the same document.

---

## 1. What `apps/markdown` already is

A ProseMirror document is a stream of related blocks. The markdown app already treats it that way,
through one named-op layer that both the AI and the UI go through.

### 1.1 The op vocabulary

[ops.ts:40](../../apps/markdown/src/renderer/editor/ops.ts#L40) defines `MdOp`, fifteen ops:

```typescript apps/markdown/src/renderer/editor/ops.ts
export type BlockTarget = 'selection' | { start: number; end?: number }
/** block index to insert after (-1 = document start) or 'selection' = after the caret's block */
export type InsertAnchor = 'selection' | number

export type MdOp =
  | { op: 'insertContent'; after: InsertAnchor; markdown: string }
  | { op: 'replaceBlocks'; target: BlockTarget; markdown: string }
  | { op: 'deleteBlocks'; target: BlockTarget }
  // ... 11 more ...
  | { op: 'setFrontmatter'; yaml: string }
```

Its header states the design:

> The single edit entry shared by the AI (`apply_ops`) and the discrete UI actions (ribbon, slash
> menu, table menu, block handle). Typing and paste stay on the raw ProseMirror step layer;
> everything with a name goes through here so both callers get the same validation, addressing and
> result reporting.

`runOps` ([ops.ts:987](../../apps/markdown/src/renderer/editor/ops.ts#L987)) is the one entry.
Every dispatch carries `OP_META` with `{op, source, batch, rollback?}`, and the comment on it names
who listens: "plugins (AI highlight, logs) key off it."

### 1.2 The seam is the spec table, and it feeds the AI its own documentation

`OP_SPECS` ([ops.ts:128](../../apps/markdown/src/renderer/editor/ops.ts#L128)) is a
`Record<OpName, OpSpec>` of `{labelKey, doc, fields}`, where each field is
`{type, required?, doc}` over a closed `FieldType` union (`target`, `anchor`, `blockIndex`,
`string`, `nullableString`, `int`, `bool`, `{enum}`). Three things read it:

| reader | what it gets |
| --- | --- |
| `validateOps` ([ops.ts:318](../../apps/markdown/src/renderer/editor/ops.ts#L318)) | per-field type checking, required checks, and rejection of unknown fields |
| the tool-description builder ([ops.ts:268](../../apps/markdown/src/renderer/editor/ops.ts#L268)) | one generated line per op — `- insertContent {after: …, markdown: string} — …` — handed to the model |
| the UI | `labelKey` into i18n |

Adding an op is: one `OP_SPECS` entry, one arm in `execOp`
([ops.ts:720](../../apps/markdown/src/renderer/editor/ops.ts#L720)). The AI learns it with no
prompt edit. **This is the extension mechanism the plan asks for, already built and already
carrying two callers.** It is scoped to one app and has no registration API — a fourth caller
compiles into the same file rather than registering against it.

### 1.3 Addressing is by index, and that is deliberate

`resolveTarget` ([ops.ts:501](../../apps/markdown/src/renderer/editor/ops.ts#L501)) does not read
indices against the live document. It reads them against `exec.origDoc`, the document as it stood
when the batch started, then maps the resulting positions forward through every step taken so far:

```typescript apps/markdown/src/renderer/editor/ops.ts
const orig = blockRange(exec.origDoc, target.start, end)
const from = mapPos(exec, orig.from, 1)
const to = mapPos(exec, orig.to, -1)
if (to <= from) fail('the target blocks were removed by an earlier op in this batch')
```

So indices are coherent within one batch and meaningless outside it. Two guards say so out loud:
`usesBlockIndexes` ([ops.ts:352](../../apps/markdown/src/renderer/editor/ops.ts#L352)) and its one
caller, [ai/tools.ts:232](../../apps/markdown/src/renderer/ai/tools.ts#L232), which rejects an AI
batch outright when the document was edited externally since the model last read it.

**An index is a call argument here, not an identity. Nothing persists one.** A layer cannot be
anchored to one.

### 1.4 A stable-id anchor exists — with no persistence

[aiQueueAnchors.ts](../../apps/markdown/src/renderer/editor/aiQueueAnchors.ts) is a ProseMirror
plugin holding a `DecorationSet`. Each decoration carries a `qid` in its spec, and the plugin's
`apply` starts with `old.map(tr.mapping, tr.doc)` — so an anchor tracks its text through every
edit, character-precisely, for free. `queueAnchorRange`
([aiQueueAnchors.ts:97](../../apps/markdown/src/renderer/editor/aiQueueAnchors.ts#L97)) returns
`null` once the anchored text is gone, rather than guessing.

[ai/edit-queue.ts:9](../../apps/markdown/src/renderer/ai/edit-queue.ts#L9) states the rule the two
files share:

> Anchors live as decorations (aiQueueAnchors.ts), so they migrate through edits
> character-precisely; block indexes are derived only at render/submit time and never stored.

This is a working layer-anchoring primitive: stable id, edit-tracking range, honest "gone" report.
Its limit is lifetime — a `DecorationSet` is renderer state. Close the document and every `qid`
is lost. `apps/docs` has the identical file
([ai-queue-anchors.ts](../../apps/docs/src/renderer/editor/ai-queue-anchors.ts)), duplicated rather
than shared.

### 1.5 The save envelope already has a place to put a page id

[docText.ts](../../apps/markdown/src/renderer/markdown/docText.ts) splits a `.md` file into
`{frontmatter, body, eol, trailingNewline, bom}`. The editor only ever sees `body`; `frontmatter`
is captured as raw text and re-emitted verbatim by `serializeDocText`. There is a `setFrontmatter`
op and a `FrontmatterAccess` interface ([ops.ts:66](../../apps/markdown/src/renderer/editor/ops.ts#L66))
with `read()` / `write(inner)`.

So a `page-id` key can be added to a markdown file without touching a byte of the body. That is the
mechanism the Obsidian plugin uses, and it is already here.

### 1.6 Extension registration cost

[extensions.ts](../../apps/markdown/src/renderer/editor/extensions.ts) is a flat 66-line array
built by `buildExtensions(options)`. Sixteen entries, seven of them local
(`LocalImage`, `BlockDragHandle`, `BlockKeymap`, `AiHighlight`, `AiQueueAnchors`,
`InactiveSelection`, `SearchHighlight`). A new overlay or block type is one more entry and one more
import. There is no loader, no manifest, no ordering declaration — the array literal is the
registry.

### 1.7 What is absent

No layer concept. No mode concept. No ink, no annotation, no comment, no presentation. No
awareness of `packages/project-store` — the markdown app has no notion of a document collection.

Ink exists in three other apps, in three unrelated `InkStroke` types
([apps/docs/…/ink.ts:22](../../apps/docs/src/renderer/editor/ink.ts#L22),
[apps/slides/…/ink.ts:28](../../apps/slides/src/renderer/ink.ts#L28),
[apps/slides/…/ShowInk.tsx:8](../../apps/slides/src/renderer/components/ShowInk.tsx#L8)) plus
`DrawingInput` in [apps/pdf/…/ipc.ts:159](../../apps/pdf/src/shared/ipc.ts#L159).

---

## 2. Three programs that already solved this

### 2.1 Handwriting (Obsidian plugin, v1.4.19, 161k lines) — the ink↔markdown mechanism

`ellimist-afk/handwriting`. Ink on ordinary Obsidian notes and PDFs, with the note staying
markdown.

**The split.** Ink is never in the markdown. It lives in one JSON sidecar per note under
`.handwriting/` at the vault root, named by a page id. The markdown file gets exactly one added
line, on the first stroke ever drawn, and never again:

```yaml
---
handwriting-page-id: 3f2a91c8-…
---
```

The sidecar is keyed by that id rather than by filename, so renaming or moving a note keeps its
ink. A note never inked on is never modified. Disable the plugin and the notes are byte-identical.

**The coordinate world is a field on the data, not a code branch.** From
`src/model/PageData.ts`:

```typescript
surface?: "inline" | "pdf" | "slides";
coordSpace?: string;   // e.g. "page-css@1" — page-local css px at scale 1.0
```

with the rule stated beside it: "The two must never be confused: the inline layer refuses to render
or overwrite a canvas sidecar." `coordSpace` exists so a later migration is versioned rather than
guessed — "inferring it from the numbers is not possible, because both conventions produce
plausible coordinates."

That is the answer to the four-coordinate-space problem catalogued in the companion doc: make the
space a declared, versioned field on the stored geometry.

**Forward compatibility is a data field too.** `unknownTop` and `unknownByObject` preserve any
field a build does not recognise, verbatim, through load and save — "an older Handwriting must not
delete a newer Handwriting's data, and in a synced vault both versions are live at once." A sidecar
declaring a schema newer than the reader opens read-only for ink rather than being overwritten.

**How inline ink follows the text — and where it stops.** `src/inline/DocumentTop.ts:6`:

> Ink is anchored to exactly two numbers: the text column's left edge, which `ContentOrigin.ts`
> answers, and the document top, which is this one.
>
>     world.y = (clientY - documentTop) / scale

One origin for the whole note. That is why ink scrolls with the markdown perfectly — scrolling
moves the origin and every stroke with it, at zero cost. It is also why **ink does not survive a
reflow**: insert a paragraph at the top and the text moves down while the ink stays at its stored
`y`. The plugin ships an "insert space" tool, which is the manual compensation for exactly this.

**Except in slides, where it did solve identity.** Presentation ink is stored per section, and the
section is identified by content:

```typescript
/**
 * Slides sidecars only: which slide each `page` index meant when the ink
 * was written, by a hash of that section's source text.
 *
 * The index alone is not an identity - inserting one `---` above the
 * first slide shifts every later index by one - so the hash is what lets
 * a load re-attach stored ink to the section it was drawn on. Never used
 * to DELETE ink: a section whose hash no longer matches anything keeps
 * its index (see SlidesInkSurface.remapSlides).
 */
slides?: { index: number; hash: string }[];
```

`remapSlides` (`src/slides/SlidesInkSurface.ts:1433`) matches stored hashes against current ones,
treats a section that still holds its own stored slide as "spoken for" so a duplicate cannot
displace it, moves only the nearest claimant, and never merges two stored slides onto one section.
The hash is FNV-1a over the trimmed section text (`sectionHash`, :1241).

**The design gap that matters for us: the plugin has no layer concept.** 219 uses of the word
`layer` in the source are all render layers — `handwriting-ink-layer`, the canvas stacking div. No
user-visible, toggleable, per-mode layer exists. The stored model has no `layerId` on a stroke.

**Presentation mode: same plugin, separate surface, separate sidecar.** Not a different plugin.
`src/slides/SlidesInkSurface.ts` (4,772 lines) attaches to Obsidian's *core* Slides plugin, which
is Reveal.js, and it is documented — `docs/manual.md:396`, twenty-eight lines under `## slides`:

> Ink for the presentation lives in its own file, `<page id>.slides`, beside the note's own ink
> file in `.handwriting/`. Add a slide above ones you've already drawn on, and the ink stays with
> its own slide instead of sliding down to the next number.

So study ink and presentation ink are already two distinct sets of strokes over one note, keyed by
one page id, in two files. That is one mode split, hardcoded as two surfaces — the special case of
which "layers toggled per mode" is the general form.

The mechanism, from the file header (S1–S5, verified on hardware):

| fact | consequence |
| --- | --- |
| the presenter is `div.slides-container` appended to `<body>`, not a workspace leaf | no workspace event fires; a `MutationObserver` on `body` is the only mount signal |
| `.reveal > .slides > section`, one per `---`, created up front and never re-created; current carries `.present` | slide index is position among `.slides`' direct children |
| `.slides` is laid out at the logical deck size (960×700) then CSS-scaled | `k = slidesRect.width / slides.clientWidth`, measured off the element; `deck: {width, height}` is stored so the numbers stay interpretable |
| never `stopPropagation()` a pen or mouse `pointerdown` | Reveal's focus plugin loses the deck and the keyboard dies. `preventDefault` is fine |
| `pointercancel` is not a lift — Chromium reclassifies a contact as a pan mid-stroke | a handler that commits there draws two centimetres and stops; the reducer holds the stroke open |

**Also worth taking directly:** the save policy (700 ms debounce with a 5-second ceiling that later
changes do not reset; nothing written on the pen path; eraser persists once per gesture at pen-up),
atomic `tmp`+rename with serialized per-page writes, a `trash/` that is never emptied, conflict
detection by mtime *then* content stamp because "sync tools routinely preserve timestamps", and
duplicate-note detection that re-mints an id when a note is copied.

### 2.2 Unity:Layers — layers as first-class rows, over files it never writes

`dimitri-rod/unity-layers`. FastAPI + React + SQLite/FTS5 + PDF.js, read-only over a PDF
collection. Its `CLAUDE.md` opens with the rule: "**Never** write, move, rename, or touch files
under any collection root; all mutations go to SQLite (`backend/overlay.db`)."

The schema is the part to take. `backend/schema.sql`:

```sql
CREATE TABLE IF NOT EXISTS layers (
    id         INTEGER PRIMARY KEY,
    name       TEXT NOT NULL UNIQUE,
    color      TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    visible    INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS annotations (
    id         INTEGER PRIMARY KEY,
    file_id    INTEGER NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    quick_hash TEXT,               -- portable identity once extraction has run
    page       INTEGER NOT NULL,
    x          REAL NOT NULL,
    y          REAL NOT NULL,
    anchor     TEXT NOT NULL DEFAULT 'point',
    layer_id   INTEGER REFERENCES layers(id) ON DELETE SET NULL,
    body       TEXT NOT NULL DEFAULT '',   -- markdown
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

Three things to lift:

- **`layers.visible` and `layers.sort_order`** — visibility is a property of the layer row, not of
  the renderer. Toggling a layer is one `UPDATE`.
- **`annotations.anchor` is an anchor-kind discriminator** — `'point' | 'page' | 'span'` — so one
  table holds several anchoring strategies. The comment beside it makes the argument we need:

  > `'span'` will carry start_char/end_char into doc_text instead of coordinates, since Stage 2
  > already stores per-page character offsets and **a character range survives zoom and re-render
  > in a way a rectangle does not**.

- **`annotations.body` is markdown.** The annotation content is the same document type as the
  document. That is the user's "layers are just a special kind of block", one level up.

The `edges` table (`shared_tag | same_folder | text_similarity`, weight comparable within a type
and not across types) is the collection-level graph — relevant to "collections of markdown
documents" but not to the layer mechanism, so it is noted and set aside.

### 2.3 Sigla — the third anchor policy: re-check and ask

`z18520736823-coder/sigla-desktop`. **Source is private**; the repo is the product page, docs and
release notes. The design is still on point and one sentence from it is the contribution:

> Annotations live in Sigla's private local database. When the document changes externally, Sigla
> rechecks the anchor and **asks for confirmation when the match is uncertain**.

Plus: "your original files stay read-only", annotations anchored to exact source, and selected
annotations compiled into an editing brief with exact locations and acceptance criteria to hand
back to an agent. That last part is the AI-Q&A layer with a defined output shape.

---

## 3. The four anchor strategies, side by side

Every one of these programs answers the same question — *what does a layer hold onto when the
document underneath it changes?* — and they answer it differently.

| | anchor unit | identity | when the text changes | persists? |
| --- | --- | --- | --- | --- |
| genoffice `MdOp` | top-level block | index into `origDoc` | batch-mapped; rejected as stale across a reload | no, by design |
| genoffice `aiQueueAnchors` | character range | `qid` + ProseMirror decoration | maps exactly through every step; `null` when deleted | **no — renderer state only** |
| Handwriting, inline | the whole note | `handwriting-page-id` + one document-top origin | ink keeps its `y`; text reflows under it. Manual "insert space" | yes, JSON sidecar |
| Handwriting, slides | `---` section | index **+ FNV hash of section text** | `remapSlides` re-attaches by hash; keeps index when unsure; never merges | yes, `.slides` sidecar |
| Unity:Layers | page, point, or char span | `files` row + `quick_hash`; `anchor` names the kind | span survives re-render where a rectangle does not | yes, SQLite |
| Sigla | source passage | private DB anchor | re-checks, **asks** when the match is uncertain | yes, SQLite |

Read down the "when the text changes" column and the gradient is: reject · track exactly · drift
silently · re-attach by content · re-attach by offset · ask the human. The three shipped answers
that work all share a shape — **content-derived identity plus an explicit uncertain case that is
never resolved by guessing.**

`remapSlides` is the cleanest statement of it: never used to delete ink; a section whose hash
matches nothing keeps its index; two stored slides sharing a hash are never merged onto one
section.

---

## 4. What this implies for the build

### 4.1 Block identity is the one missing primitive

Everything else is present. The op vocabulary exists, the seam exists, the frontmatter envelope
exists, the anchor primitive exists. What no part of `apps/markdown` has is **a block identity that
survives a save and a reload** — and every layer type in the product target (comment, annotation,
ink, AI answer, presentation note) needs one.

The three shipped programs point at the same answer, from three directions: derive identity from
content, keep the last known position as a fallback, and surface the uncertain case rather than
resolving it.

Concretely, for a stream-of-blocks document that is one `handwriting-page-id`'s worth of surfaces:

- a **block id** minted on first attachment, carried in the sidecar, never written into the body
- a **content hash** of the block's source text, stored beside the id — the `remapSlides` role
- a **last known index**, stored — the fallback when the hash matches nothing, never a delete
- an **anchor kind** discriminator on the stored anchor — `block | span | point | page` — so one
  store holds a comment on a paragraph, an ink stroke over a region, and a pin, the way
  `annotations.anchor` does
- a **coordSpace** field on any geometry, versioned, per Handwriting's rule that the convention
  cannot be inferred from the numbers

`aiQueueAnchors` is then the *live* half of this: load the sidecar, mint decorations from the
resolved positions, and let ProseMirror keep them exact for the rest of the session; write back the
resolved positions and fresh hashes on save. The in-memory mechanism already works and is already
in the tree — it needs a disk format under it, not a replacement.

### 4.2 Layers are rows, not rendering

`layers.visible` in Unity:Layers is the model to copy: a layer is a persisted record with a name, a
colour, an order and a visibility flag, and every annotation carries `layer_id`. Rendering reads
the flag; it does not own it.

"Modes" then fall out as named visibility sets over that table rather than as a second concept —
study mode and presentation mode are two selections of which layer rows are visible and which are
interactive. Handwriting's two surfaces (`inline` and `slides`, two sidecars, one page id) are that
same split hardcoded for one case, which is evidence the split is real and evidence that hardcoding
it does not generalise.

The tri-state from the companion doc (hidden / visible-locked / interactive) is a per-mode property
of the *pairing* of layer and mode, so it belongs on the mode's row set, not on the layer.

### 4.3 There is still no database

`packages/project-store` is JSON files (`index.json`, `<projectId>/project.json`, `chats/*.jsonl`),
atomic tmp+rename, and no SQLite anywhere in any of the 21 package manifests. Spec 02 puts "new
corpus, vector, or graph storage" out of scope.

Both shipped designs are available at that constraint: Handwriting is per-document JSON sidecars
with atomic writes, which is what `project-store` already does; Unity:Layers is SQLite, which is
what a collection-level query (all comments in this layer across forty documents) wants. **The
layer store can start as sidecars and stay correct** — Handwriting runs a synced multi-device vault
on exactly that. The point at which it stops being enough is cross-document query, which is a
collection feature, not a layer feature, and it is not in this slice.

### 4.4 Order of work

1. **Block identity + sidecar format** — id, content hash, last index, anchor kind, coordSpace.
   Resolution logic ported from `remapSlides`' rules, with an explicit uncertain state.
2. **Bind it to `aiQueueAnchors`** — hydrate decorations on load, write back on save. This makes
   the existing in-memory anchor durable and proves the format against a layer that already exists.
3. **The layer record** — name, colour, order, visible; `layerId` on every anchored object.
4. **Modes as visibility sets** over layer records, with the hidden/locked/interactive tri-state on
   the mode-layer pairing.
5. **Ink as the second layer type**, once 1–4 carry one type. Four `InkStroke` shapes already exist
   in the tree to consolidate, and none of them is in `apps/markdown`.

Steps 1–2 change no product behaviour and are testable on their own — the criterion is that a
comment anchored to a paragraph is still on that paragraph after the file has been edited by
another program.

---

## 5. Sources

| | |
| --- | --- |
| `apps/markdown` | this repo, read 2026-09-17 via codegraph index + direct read |
| Handwriting | `github.com/ellimist-afk/handwriting` @ `fbc8128` (v1.4.19), Obsidian plugin, 581 files / 161k lines, **CC BY-NC-ND 4.0**. Read: `docs/storage.md`, `docs/manual.md`, `src/model/PageData.ts`, `src/inline/DocumentTop.ts`, `src/inline/ContentOrigin.ts`, `src/slides/SlidesInkSurface.ts` — [references/handwriting.md](../../references/handwriting.md) |
| Unity:Layers | `github.com/dimitri-rod/unity-layers` @ `5e9d3f3`, MIT. Read: `README.md`, `CLAUDE.md`, `backend/schema.sql` — [references/unity-layers.md](../../references/unity-layers.md) |
| Sigla | `github.com/z18520736823-coder/sigla-desktop` @ `da40485`, **proprietary, all rights reserved**. Docs and release repo — source is private; claims here are from `README.md` and are product claims, not verified mechanism — [references/sigla-desktop.md](../../references/sigla-desktop.md) |

Each reference file records the pinned commit and what was read. The artifacts this document
quotes are vendored under [references/extracts/](../../references/extracts/), so every claim above
is checkable from inside this repo without the clones. Working clones are at `~/Projects/_refs/`.

**On reuse.** Handwriting's licence permits noncommercial use and sharing with attribution; it does
not permit distributing a modified version. Its *mechanisms* — a frontmatter id, a content-hash
section anchor, a declared coordinate space — are design facts and are what this document takes.
Its code is not a source to copy from into a shipped officebay. Unity:Layers is MIT, so its schema
can be adapted directly with attribution. Sigla ships no source.
