# mdlayers — design

**Date:** 2026-09-20. **Status:** DRAFT, for approval.
Evidence is in [002-measurements.md](002-measurements.md); what exists already and what may be
reused is in [003-prior-art-and-licences.md](003-prior-art-and-licences.md). This document states
decisions and cites those two for the reasons.

## 1 · Goal

Layers for Markdown, in the two editors already in use. Obsidian and VS Code both stay and open
the same files. Neither is replaced, and no third application is added. Each gets a plugin for what
it lacks, and the part the plugins share is a host-free core in this repo.

A **layer** here is user-visible: named, toggleable, holding marks (ink, highlights, comments,
drawings, placed documents). It is not a render layer. And the set of mark kinds is open: someone
can add a new graphics type or annotation mark without forking an editor.

| in | out |
|---|---|
| Markdown, and views of Markdown (source, rendered, presentation) | Word, Excel, PowerPoint or PDF as base formats |
| plugins for VS Code and Obsidian over one shared core | an application of our own, Electron or otherwise |
| a mark-kind registry third parties can extend | a fixed set of annotation types |
| several independent layers per file | one flat annotation store |
| open file formats both hosts can read | a format only our own plugin opens |

## 2 · Two kinds of file

| | **note** | **page** |
|---|---|---|
| what it is | an ordinary `.md`, edited by many tools, diffed in git | a large canvas, like a OneNote page, holding placed objects |
| file | `Note.md`, never rewritten by mdlayers except one frontmatter id on first ink | `Page.excalidraw.md`, a Markdown file used as a container |
| where marks live | beside it, in sidecars | inside it |
| why | formatters, other extensions and git all write to it; a note never annotated is never modified | one file, so sync cannot lose or duplicate a sidecar; Obsidian indexes its text and links; a full editor for it already exists on desktop and iPad |
| handwriting | the note's own ink, in the Handwriting plugin's sidecar format | drawing across the page is Excalidraw `freedraw` |
| who owns the view | the host's text editor (scroll, wrap, reflow) | the canvas (camera: pan and zoom) |

A note gets onto a page by reference. The page never rewrites it.

The smallest page is one note with ink over it, which is why the two kinds share one model (§3).

## 3 · The model: canvases, objects, layers

```
canvas   a coordinate space with an identity
object   { kind, position in its canvas, layer, payload }      kind comes from the registry (§4)
layer    { id, name, visible, locked }                         every object names one
```

Both file kinds are instances of it, and so is anything a note or a page shows that can itself be
written on: an image, and each page of a PDF.

```
page canvas  (Excalidraw scene coordinates; the page owns the camera)
 ├─ freedraw, shapes, text …                  page coordinates, in a page layer
 ├─ image / PDF page ── placement { x, y, scale } ── [[scan.png]] · [[paper.pdf#page=3]]
 │      └─ its own canvas (below), the same one a note shows
 └─ document object ── placement { x, y, scale, layoutWidth } ── [[Note.md]]
        └─ note canvas  (origin at the note's top-left; identity = page id in the note's frontmatter)
             ├─ rendered Markdown, wrapped at layoutWidth
             ├─ md.ink                     note coordinates, in the note's ink sidecar
             ├─ md.highlight / md.comment  range + quote, in the note's review sidecar
             └─ ![[scan.png]] · ![[paper.pdf#page=3]] ── placement = where the text flow puts it
                    └─ image canvas / PDF page canvas
                         (origin at its top-left, units its own pixels or points at scale 1;
                          identity = the file's content hash, plus the page number for a PDF)
                         └─ md.ink         image or page coordinates, in the file's ink sidecar

screen = page camera ∘ placement ∘ note coordinates ∘ placement ∘ image or PDF-page coordinates
```

### What decides where a mark is stored

1. **A mark is stored in the coordinates of the thing it is about.** Ink on a scan is in the scan's
   pixels; ink on page 3 of a PDF is in that page's points; ink on a note's text is in the note's
   canvas; an arrow from one placed object to another is in the page's. Every other position is
   computed by composing placements. This is what makes ink move, shrink and grow with a printout,
   where OneNote lets the two come apart once the background is unlocked.
2. **Whatever can be marked is a canvas with an identity that travels with it:** the file itself
   where that is enough, a content hash where the file may be renamed or embedded twice, a minted
   id where there is no file (a note's frontmatter id, a slide's hash).
3. **A container stores placements, never the marks of what it places.** A note places an image by
   its text flow; a page places notes, images and PDF pages by `{ x, y, scale }`. The marks stay
   with the placed thing, so the same scan shows the same ink in every note and on every page.
4. **Marks live beside the marked thing, in a sidecar keyed by its canvas id.** A note is edited by
   many tools, and an image or a PDF is binary and may be shared: none of them is rewritten.
5. **One sidecar per source document, with a registry of its canvases.** A PDF, or a printout of
   forty page images, is one sidecar whose strokes name their page, not forty files. It is the
   shape Handwriting already writes for a PDF (002 §A4a).
6. **Coordinates use the canvas's own size at scale 1,** with a versioned name (`page-css@1`,
   `image-px@1`). Resizing an embed changes its placement and nothing in the sidecar.
7. **Whether a stroke is about the object or about the arrangement is declared, not guessed**
   (002 §A2): the focused object takes the pen, as in **Focus** below; unfocused, ink goes to the
   container's layer.

- **A note's marks are never converted to page coordinates.** They stay in the note's sidecars, in
  the note's coordinates. The page stores one placement per note. Moving or scaling the note
  changes that one record; the ink moves with it because it is drawn inside the note's frame.
- **The same note shows the same marks everywhere:** alone in Obsidian, alone in VS Code, and on
  every page that places it.
- **Page drawing is about the page.** A stroke drawn across a placed note belongs to a page layer
  and stays where it is when the note moves, the same rule measured for ink over text (002 §A2).
- **`layoutWidth` keeps a note's ink on its words.** Ink has fixed coordinates and text re-wraps
  with width (002 §A2). A placed note is laid out at the width its ink was made at and scaled as a
  whole; resizing the object changes `scale`, never the wrap width. Whether Handwriting records
  that width is not yet measured (§9).
- **Focus.** Entering a note object hands input to the note's own editor and ink layer: the page
  camera locks, the rest of the page dims, pen strokes go to `md.ink` in note coordinates, typing
  goes to the text. Leaving returns input to the page. Opening the note in its own tab is the same
  thing with no new code and is what the first versions do.

### Anchoring

Three mechanisms, because a page, an embedded object and text are different things.

| anchor | used by | behaviour |
|---|---|---|
| **canvas coordinates** | ink, page objects | a text edit does not move them, and that is correct: a drawing is about the page. Verified byte-identical across an edit that moved the text seven lines (002 §A2) |
| **the embedded object's own coordinates** | ink on an image or on a PDF page | the ink is drawn inside the object's frame, so it follows the object when text above it grows, when the embed is resized, and into every other note or page that shows the same file. Ink over an image kept in note coordinates instead stays where it was while the image moves down the note |
| **range + quote + context**, resolved against the source each load | annotations (highlight, underline, comment) and suggestions (replace, insert, delete, later move) | rendered as host-owned text decorations, so the editor supplies scrolling, wrapping and reflow |

Annotations discuss the source and never change it; a highlight with a body is a commented
highlight, and replies, AI questions and repeated encounters are payload, not new anchoring.
Suggestions propose a mutation, stay pending until accepted or rejected, and need stale-anchor
detection plus a diff before apply. A selection-driven agent action is an ephemeral surface over
the same range: a question becomes an annotation thread, a concrete proposal becomes a linked
suggestion, and the agent has no path around acceptance.

A canvas needs an identifier only where it has no natural one:

| canvas | its id |
|---|---|
| a note | a page id in frontmatter, minted on first mark, awaited before the sidecar is written, never rewritten (002 §A4) |
| a presentation slide (`---`-delimited) | index plus a content hash, because one inserted `---` shifts every later index (002 §A4a) |
| a page | the file itself |
| a PDF page | the PDF's content hash plus the page number; the sidecar lists the paths the PDF has been seen at, as Handwriting's `pdf-<hash>.json` does with `pdfPaths` (002 §A4a) |
| an image | the image's content hash, with the same path registry; a printout's page images share one sidecar and are told apart as its pages |

### Two rules that cost someone else real data (002 §A3, §A6)

> **Over a text editor, a layer never owns a scroll position.** It reads the host's. Handwriting
> stores no camera for its inline surface, which is why its ink and text cannot drift apart. On a
> page the canvas owns the camera, as any canvas does; the rule is about marks over someone else's
> scrolling view.

> **The location of a layer store travels with the document, not in a settings file.** Handwriting
> kept its ink-folder choice in `data.json`, sync did not carry that file, and a second device
> wrote a duplicate sidecar per page id.

## 4 · The mark-kind registry

```ts
interface MarkKind {
  name: string            // namespaced: "md.ink", "md.highlight", "page.draw", "acme.waveform"
  version: number
  schema: ZodType         // validates persisted marks at the boundary

  bounds(mark): Rect            // hit-testing and damage, in canvas coordinates
  render(mark, ctx, camera)
  degrade(mark): string         // what a host lacking this kind shows instead

  tool?: ToolSpec               // how a user makes one; a kind nobody can create is a developer feature
  edit?: EditSpec
  hitTest?(mark, pt): boolean
}
```

> **Unknown kinds round-trip verbatim.** A mark whose `name` this build does not know is preserved
> byte-for-byte through a load and a save and rendered through a generic fallback. This is what
> stops an older build destroying a newer one's data in a synced folder.

> **Unknown fields on a known kind survive too.** Measured working in Handwriting (002 §A7) and
> required by MRSF's spec (003 §2): two unrelated sidecar systems reached the same rule.

| kind | stored as |
|---|---|
| `md.ink` | Handwriting's sidecar format (002 §A1, §A4a), read and written, so the shipping Obsidian plugin is the other host for it. Its three surfaces are kept as they are: `inline` (a note), `slides`, `pdf` (`coordSpace "page-css@1"`, a `page` on each stroke). Ink on an image is a fourth surface of the same format, `image` with `coordSpace "image-px@1"`, which Handwriting keeps without drawing (unknown fields and kinds round-trip, 002 §A7) |
| `md.comment`, `md.highlight` | MRSF `Note.md.review.yaml` (003 §2): adopted, not reinvented; it has a spec, a VS Code extension, a CLI and an MCP server |
| `md.document` | on a page: an Excalidraw embeddable whose file id maps to `[[Note.md]]`, plus the placement |
| `page.draw`, shapes, text, image | Excalidraw scene elements, as they are |
| a kind with no element equivalent, on a page | a `customData` payload on a placeholder rectangle, so a host without the kind still shows where it is |

## 5 · The page container: `.excalidraw.md`, used as it is

The Obsidian Excalidraw plugin's container is adopted, not redesigned.

| reason | evidence |
|---|---|
| the scene inside is the upstream Excalidraw schema, unchanged | 002 §B1 |
| Obsidian already has a full editor for it, on desktop and iPad | obsidian-excalidraw-plugin, engine `@zsviczian/excalidraw`, an MIT fork of the MIT library (003 §6) |
| it already places notes, images, PDFs and LaTeX on the canvas by reference | `## Embedded Files` maps a scene `fileId` to a `[[wikilink]]`, a URL or `$$latex$$` |
| canvas text is searchable and linkable as Markdown | `## Text Elements` holds each text element's raw text with a `^elementId` block reference |
| the plugin keeps what it does not own | 002 §B2 (source read; the run is §9) |
| a container of our own would need a second Obsidian plugin to open it, and would have no iPad editor | — |

```
---
excalidraw-plugin: parsed
tags: [excalidraw]
mdlayers: 1                          ← ours; unknown frontmatter keys are left alone by the plugin
mdlayers-layers:                     ← the layer table: order, name, visible, locked
  - { id: base,   name: Documents, visible: true }
  - { id: draw-1, name: Drawing,   visible: true }
  - { id: rev-1,  name: Review,    visible: false }
---
<free Markdown, kept as-is by the plugin>

# Excalidraw Data
## Text Elements        raw text ^elementId
## Element Links        elementId: [[link]]
## Embedded Files       fileId: [[Note.md]] | [[img.png]] | URL | $$latex$$
## Drawing
```compressed-json | json
{ "type":"excalidraw", "version":2, "elements":[ … { …, "customData": { "mdlayers": { "layer":"draw-1", "kind":"page.draw" } } } … ], "appState":{…}, "files":{} }
```
```

- The layer table is the frontmatter key `mdlayers-layers`. Membership is
  `customData.mdlayers.layer` on each element; an element without it belongs to the first layer.
- Hiding a layer is a view filter, never a change to the elements: a hidden layer's elements are
  left out of what is handed to the renderer and written back untouched.
- Images stay references: `files` is empty in the stored scene, filled from `## Embedded Files` on
  load by resolving wikilinks to vault files, and stripped on save, as the plugin does.

### Compatibility contract

Each line is a test with a fixture written by the shipping Obsidian plugin.

1. **Read.** Both heading generations (`# Text Elements` from 1.9.x; `# Excalidraw Data` /
   `## Text Elements` today), `json` and `compressed-json` blocks (LZ-String base64 in
   256-character lines), with or without the `%%` comment fences.
2. **Write is conservative.** The codec rewrites the sections it changed and copies every other
   byte. A file opened and saved with no edit is byte-identical.
3. **Unknown survives:** element keys, `customData`, `appState` keys, element types, frontmatter
   keys, sections.
4. **Images stay references** (above).
5. **Round trip through the other host.** Edit in VS Code → open and save in Obsidian → diff: only
   plugin-owned fields change (`version`, `versionNonce`, `updated`, `appState`); the layer table
   and `customData.mdlayers` survive. The same in the other direction.
6. **Format drift is caught.** One author controls the format and it has changed before. Fixtures
   are regenerated from each plugin release, and a failing read test is the signal.

## 6 · Parts and hosts

```
┌───────────────────────────────────────────────────────────────────┐
│ core — host-free TypeScript. No DOM beyond canvas + PointerEvent,  │
│        no editor, no filesystem, no `vscode`, no `obsidian`.       │
│   · canvas identity, layer records, mark-kind registry             │
│   · page container codec (§5) · note sidecar codecs (ink, MRSF)    │
│   · ink: geometry, smoothing, render, erase                        │
│   · unknown-field preservation in every codec                      │
└──────────────┬─────────────────────────────────┬──────────────────┘
      VS Code  │                                 │  Obsidian
┌──────────────▼──────────────────┐   ┌──────────▼───────────────────────┐
│ notes: CustomTextEditorProvider │   │ notes: Handwriting (ink) and      │
│  at priority "option",          │   │  Sidemark (comments), installed,  │
│  annotate-only webview          │   │  as they are                      │
│ pages: fork of excalidraw-vscode│   │ pages: obsidian-excalidraw-plugin │
│  (MIT): React + @excalidraw in  │   │  as it is, plus a small companion │
│  a webview, core codec, wikilink│   │  for the layer panel (an          │
│  resolver, Markdown embeddable  │   │  Excalidraw Automate script or a  │
│  renderer, layer panel          │   │  tiny plugin)                     │
└─────────────────────────────────┘   └───────────────────────────────────┘
```

- **The split is real, not hoped for.** 140 of Handwriting's 159 source files, 38,578 of 71,541
  lines, import neither its host nor its editor (002 §A8).
- **VS Code is where most of the code goes**, because Obsidian already has the plugins. It is also
  the hardest anchoring test available: users edit the same `.md` in VS Code's own editor, in a git
  checkout, with formatters writing to it. A webview reloads in a second.
- **Notes are annotate-only in VS Code.** The custom editor opts in at `priority: "option"`, so the
  file still opens normally for text editing. A WYSIWYG Markdown editor normalises the file on
  save, and in a git checkout that is a hundred-line diff nobody asked for. Editing text is
  VS Code's job; mdlayers owns the layers.
- **React is how the page editor runs in VS Code:** a custom editor's webview is a browser page, and
  excalidraw-vscode already runs React and the Excalidraw component in one.
- Ink geometry in the core uses `perfect-freehand` (MIT): one function from pressure points to a
  stroke outline, no DOM and no state (003 §6). Capture, storage and rendering stay ours.

## 7 · Licence boundaries

| source | licence | what is allowed |
|---|---|---|
| Handwriting (Obsidian plugin) | CC BY-NC-ND 4.0 | read and measure; implement its file format; copy no source |
| obsidian-excalidraw-plugin | AGPL-3.0 (LICENSE added 2026-05-13) | read; implement its container format from its files and behaviour; copy no source |
| `@excalidraw/excalidraw`, `@zsviczian/excalidraw`, excalidraw-vscode, perfect-freehand, MRSF and obsidian-sidemark, JSON Canvas | MIT | use, fork, reuse with attribution |
| tldraw | its own licence: no production use without a key | not used |

mdlayers is MIT. Details and dates in 003.

## 8 · Order of work

1. **Page container codec** in the core, with plugin-written fixtures; contract lines 1–4.
2. **Round trip through Obsidian** (line 5). It is the largest unknown, so it comes before any
   editor is built on the container; its result may move the layer data (§9).
3. **Fork excalidraw-vscode:** register `*.excalidraw.md`, core codec on load and save, wikilink
   resolver for images.
4. **Layer table and panel**, VS Code first, then the Obsidian companion.
5. **Note sidecar codecs** (Handwriting ink, MRSF) and the mark-kind registry, provable against
   live sidecars before any note editor exists (002 §A7).
6. **The VS Code note host, annotate-only**, with ink display as the first kind, then highlight
   and comment, which is where range anchoring gets tested.
7. **Notes on pages:** the Markdown embeddable renderer in VS Code, placement with `layoutWidth`,
   focus.
8. **Ink capture in VS Code** (mouse and Windows pen). Last, because pen feel is the long tail and
   the iPad, where most handwriting happens, runs Obsidian with Handwriting.

The current sprint is [../PLAN-2026-09-20-page-container.md](../PLAN-2026-09-20-page-container.md).

## 9 · Open

| question | how it gets answered |
|---|---|
| Does the Obsidian plugin keep `mdlayers-layers` and `customData.mdlayers` through a real save? (§5 rests on a source read) | order-of-work step 2; if not, the layer data moves to where it survives, e.g. a header section |
| Does a Handwriting sidecar record the width its ink was drawn at? | inspect one; if absent, write it as an extra field, which Handwriting round-trips (002 §A7) |
| In Obsidian, can a note embedded on a page be edited in place, and does Handwriting draw inside that embedded view? | try it; if not, Obsidian uses "open in tab" for writing on a placed note |
| How closely must VS Code match Obsidian when rendering a placed note (callouts, wikilinks, math)? | the owner's call; it sets the cost of step 7 |
| What does Handwriting do today with ink drawn over an image embedded in a note: note coordinates (it drifts when text above changes) or something of the image's own? | ink over an embedded image, add a paragraph above it, read the sidecar |
| Is Handwriting's `pdf-<hash>` a hash of the PDF's bytes or of its path? It decides whether ink survives a rename with no registry hit | compute both for the measured file (002 §A4a) and compare |
| Does Handwriting leave a sidecar with `surface: "image"` alone through a load and a save? §4 rests on 002 §A7, measured for fields, not for a whole surface | write one by hand, open and ink the note in Obsidian, diff |
| A printout brought in from OneNote: page images with an `image` sidecar, or one PDF whose pages are embedded (`![[scan.pdf#page=3]]`), which Handwriting can already ink per page on the iPad? | convert one printout both ways and try each on the iPad; the PDF route needs no new code |

## Relationship to officebay

Separate project, overlapping core. officebay's `docs/steering/PLAN-2026-09-17-markdown-layers.md`
covers the same ground for its own `apps/markdown`, which is Tiptap 3.31. If both end up wanting
the same core, the core is this repo and each host binds to it. Nothing here depends on that.
