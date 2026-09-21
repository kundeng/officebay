# officebay — plan, 2026-09-17: markdown as the document, layers as the extension

Status: **proposed, awaiting approval.** Nothing here is started.

Supersedes nothing. [PLAN-2026-09-13.md](PLAN-2026-09-13.md) stays live: its section C (whitelabel)
is a prerequisite for shipping anything under the officebay name and is independent of this plan,
and its sections A/B/D/E answered questions this plan now assumes answers to.

Evidence for every claim below:
[docs/research/2026-09-17-markdown-block-model-and-layer-anchoring.md](../research/2026-09-17-markdown-block-model-and-layer-anchoring.md),
with the outside references pinned in [references/](../../references/).

---

## The product, in one paragraph

officebay is markdown document management. A collection of markdown documents, with ink, comments,
annotations, AI question-and-answer and presentation as **layers over those documents** — each
layer individually toggleable per mode, because ink taken during a lecture and ink drawn while
presenting are different layers of the same file. PDF is an optional display surface over a
markdown document, not the base format. Word and PDF's own formats stay as import and export.

The near-term user need is met today by Obsidian plus the Handwriting plugin, and that is the
interim answer. This plan is what officebay has to do to be better than it, which is a specific and
short list: layers, modes, collections, and AI that can see the whole collection.

## Why this order

The order is fixed by one fact and one instruction.

The fact: **`apps/markdown` already has the extension mechanism and already has a stable-id anchor;
what it does not have is a block identity that survives a save.** `OP_SPECS`
(`apps/markdown/src/renderer/editor/ops.ts:128`) validates ops, labels the UI and generates the
AI's own tool documentation from one table. `aiQueueAnchors.ts` tracks a `qid` through every edit
character-precisely and reports `null` honestly when its text is deleted — but it is a
`DecorationSet`, so it dies with the session. Every layer type in the product needs exactly the
thing that is missing.

The instruction: extension mechanism first, layers second. That holds — with the correction that
the extension mechanism largely exists, so step 1 is the identity primitive the mechanism needs
rather than the mechanism itself.

Steps 1 and 2 change no user-visible behaviour. That is deliberate: they are provable on their own,
against a layer that already ships.

---

## M1 · Block identity that survives a save

**The problem.** `BlockTarget` addresses blocks by index into `origDoc`
(`ops.ts:17`, resolved at `ops.ts:501`), and indices are never persisted — `usesBlockIndexes` plus
`editedExternally` (`ai/tools.ts:232`) reject a stale AI batch outright. That is correct for an op
argument and useless as a layer anchor.

**The design**, taken from `remapSlides` and from `annotations.anchor`:

| field | role |
|---|---|
| `blockId` | minted on first attachment, lives in the sidecar, never written into the body |
| `hash` | content hash of the block's source text — the identity that survives reflow |
| `lastIndex` | last known position; the fallback when the hash matches nothing, never a delete |
| `anchorKind` | `block \| span \| point \| page`, so one store holds a paragraph comment, a region of ink and a pin |
| `coordSpace` | versioned string on any geometry, because the convention cannot be inferred from the numbers |

**Resolution rules**, ported from `SlidesInkSurface.remapSlides`:

1. A block still holding its own stored anchor is spoken for; a duplicate elsewhere cannot displace it.
2. Where a hash matches several candidates, only the nearest claimant moves.
3. Two stored anchors sharing a hash are never merged onto one block.
4. A hash that matches nothing keeps its `lastIndex` and is marked **uncertain**. It is never deleted.

**The uncertain state is a product surface, not an internal flag** — this is Sigla's policy and the
one thing all three references agree on. An anchor that cannot be placed confidently is shown as
such and the user resolves it.

**Done when:** a comment anchored to a paragraph is still on that paragraph after another program
edits the file above it; an anchor whose paragraph was rewritten is reported uncertain rather than
moved or dropped; round-tripping a sidecar through a reader that does not understand a field
preserves that field verbatim (`unknownTop` / `unknownByObject`).

## M2 · Make `aiQueueAnchors` durable

Bind M1's format under the anchor that already exists: hydrate decorations from resolved positions
on load, write back resolved positions and fresh hashes on save.

The AI edit queue is the proving ground because it is a real layer already in use, so the format is
tested against live behaviour rather than a fixture. `apps/docs` carries a duplicate
(`ai-queue-anchors.ts`); consolidating the two is in scope here and removes one of the duplications
catalogued in the companion research.

The page id goes in frontmatter, following Handwriting: one key, written on first attachment, never
again, and a document never annotated is never modified. `docText.ts` already re-emits frontmatter
verbatim and `setFrontmatter` already exists, so this costs no new machinery.

**Done when:** an AI edit queue survives closing and reopening the document, and a document that
has never been annotated is byte-identical after an open-and-save cycle.

## M3 · The layer record

`{id, name, color, sortOrder, visible}`, and a `layerId` on every anchored object — Unity:Layers'
schema, which is MIT and adaptable directly.

Visibility is a property of the record. Rendering reads it and does not own it.

**Done when:** two layers of comments on one document can be toggled independently, and the state
survives a reload.

## M4 · Modes as visibility sets

A mode is a named selection over layer records: which are visible, and which are interactive. The
tri-state — hidden / visible-locked / interactive — is a property of the *pairing* of mode and
layer, so it lives on the mode's row set rather than on the layer.

Study mode and presentation mode are the first two. Handwriting ships that exact split hardcoded as
two surfaces with two sidecars under one page id, which is evidence the split is real and evidence
that hardcoding it does not generalise.

**Done when:** entering presentation mode changes which layers are visible and which accept input,
without touching any document content, and the mode definition is editable.

## M5 · Ink as the second layer type

Only after M1–M4 carry one layer type end to end.

Four unrelated `InkStroke` shapes already exist in this repo — `apps/docs/src/renderer/editor/ink.ts:22`,
`apps/slides/src/renderer/ink.ts:28`, `apps/slides/src/renderer/components/ShowInk.tsx:8`, and
`DrawingInput` in `apps/pdf/src/shared/ipc.ts:159` — and none of them is in `apps/markdown`.
Consolidating them is part of this milestone, not a precondition.

Take from Handwriting as design, not code (CC BY-NC-ND — see [references/handwriting.md](../../references/handwriting.md)):
the save policy (700 ms debounce under a 5-second ceiling that later changes do not reset; nothing
written on the pen path; eraser persists once per gesture at pen-up), atomic tmp+rename with
serialized per-page writes, conflict detection by mtime *then* content stamp because sync tools
preserve timestamps, and a trash that is never emptied.

**Open and unanswerable from any tree:** whether Apple Pencil pressure reaches an Electron app
through Sidecar. It gates ink quality on the iPad path and needs a hardware probe. Flagged in the
companion research as the same gap.

## M6 · Collections

`packages/project-store` is JSON files with atomic tmp+rename, and there is **no database anywhere
in the repo** — verified across all 21 package manifests. Spec 02 puts new corpus, vector or graph
storage out of scope.

Both reference designs are available under that constraint. Handwriting runs a synced multi-device
vault on per-document JSON sidecars, which is what `project-store` already does, so **the layer
store can start as sidecars and stay correct.** The point at which sidecars stop being enough is
cross-document query — every comment in this layer across forty documents — which is a collection
feature, not a layer feature, and is not in M1–M5.

When it does come into scope, Unity:Layers is the reference: SQLite + FTS5, a read-only overlay
that never writes the source files.

---

## What is out of scope

- New corpus, vector or graph storage before M6 is explicitly scoped (spec 02's exclusion, kept).
- OneNote import at any fidelity. Settled 2026-09-17: the archive is kept as high-quality PDF,
  Word and HTML exports and is not migrated.
- Rebuilding `apps/docs`, `apps/slides`, `apps/sheets` or `apps/pdf` around layers. This plan
  touches `apps/markdown` and the packages it needs.
- Copying code from the Handwriting plugin. Its mechanisms are taken; its source is CC BY-NC-ND and
  is not a source to copy from into a shipped product.

## Dependencies and parallel work

| | |
|---|---|
| **Blocks this plan** | nothing — officebay installs and builds on Windows as of 2026-09-17 |
| **Runs in parallel** | PLAN-2026-09-13 section C, the genspark→officebay whitelabel. Independent and mostly mechanical |
| **Should land first if either ships** | C, since the product cannot carry the officebay name until it does |
| **Spec 02** | its next action is running the inherited journey baselines (T1). That is still worth doing and is now unblocked, but it no longer gates this plan: the document type is decided |

## First action

Get this plan approved or corrected. Then M1, starting with the sidecar format and the resolution
rules as a runtime-free module with tests, before anything touches the editor.
