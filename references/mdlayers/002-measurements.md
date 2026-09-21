# mdlayers — measurements

**Status:** evidence. Dated measurements against shipping software. [001-design.md](001-design.md)
cites these sections for its decisions; nothing here is a decision.

| part | subject | measured |
|---|---|---|
| A | the Handwriting plugin for Obsidian, 1.4.19: how ink is stored, anchored, scrolled and saved | 2026-09-17 |
| B | the Obsidian Excalidraw plugin's `.excalidraw.md` container | 2026-09-20 |

"M1" to "M6" in part A are the milestones of officebay's
`docs/steering/PLAN-2026-09-17-markdown-layers.md`, which takes its mechanisms from the same plugin.

---

# Part A — Handwriting 1.4.19

Measured live in the bayeslearner vault, 2026-09-17 17:14–17:16: 23 strokes (826 points) drawn by
pen on `20-projects/dsa_rapid/002 xmeans.md`, then seven blank lines inserted at the top of that
note, with the sidecar hashed before and after.

## A1. A stroke, as stored

```json
{
  "id": "91be9b22-3b29-421a-980e-97e4844c4abf",
  "tool": "pen",
  "color": "#2f6de0",
  "width": 2.2,
  "createdAt": 1789679657559,
  "pressureProfile": "exp7",
  "pts": [78.41, 495.32, 0.128, 0,  77.41, 495.32, 0.128, 8,  76.91, 495.32, 0.128, 15, …]
}
```

`pts` is flat — `[x, y, pressure, t, …]` — in document-space px, pressure 0–1, `t` in ms from
stroke start. Sampling ~120 Hz (8 ms steps), pressure genuinely varying (0.128 → 0.409 → 0.889).
`bbox` is **not** serialised; it is recomputed on load.

**Seven fields, and none of them is an anchor.** The stored address of a stroke is `(x, y)`.

This is the concrete case for M1. Handwriting has no block identity because it has no anchor at
all; the coordinate *is* the identity.

## A2. A text edit does not move ink

```
sha256 before   2fc9aed71aa23f6ebdeccf822d2516333a160591b5996fa622e89f5b04ef1daf
sha256 after    2fc9aed71aa23f6ebdeccf822d2516333a160591b5996fa622e89f5b04ef1daf
bbox  before    x 71.9..407.9   y 374.6..603.8
bbox  after     x 71.9..407.9   y 374.6..603.8
```

Byte-identical. The sidecar's mtime (17:14:27) predates the edit (17:16) — the file was not
rewritten and was not read.

**This is correct behaviour for a drawing, not a defect.** A sketch is about the page. Ink that
chased reflowing text would land somewhere its author never put it. The plugin's own manual states
it as policy: *"Markdown reflows wherever it wants. Your ink stays where you put it. Only the insert
space tool moves it, by design."*

The consequence for a layer model is that "does this follow the text" must be **declared**, not
assumed — which is what M1's `anchorKind` provides. `page` is the correct default for an ink layer
and the wrong one for a comment.

## A3. Scroll and reflow are different motions

| | what moves | what the ink does |
|---|---|---|
| text edit | the content | nothing (§A2) |
| scroll | the viewport | follows, 1:1 |

And the mechanism, from `.obsidian/plugins/handwriting/data.json`:

```json
"cameras": {}
```

**Empty.** The inline surface persists no camera. It reads the host editor's scroll offset every
frame and derives its transform. There is no second scroll position, so there is nothing to
synchronise and nothing that can drift. (`cameras` serves only the standalone canvas view.)

> **Rule: a layer never owns a scroll position.** It reads the host's. A layer that stores its own
> offset has created a reconciliation problem that then has to be maintained forever.

Not currently in the plan, and worth adding to M3/M4 — a layer record with a stored viewport would
reintroduce exactly this.

## A4. First-stroke identity write

Observed within one second: the note was rewritten to gain `handwriting-page-id: 2cb1315a-…` in
frontmatter, *then* the sidecar appeared. The id write is **awaited**, because a sidecar keyed to an
id cannot exist before the id does. A note never inked on is never modified.

Confirms M2's frontmatter approach, including the ordering constraint.

## A4a. Three surfaces, measured — the whole format

One note, `handwriting-slides-test.md`, inked in the editor **and** in presentation. It produced
**two sidecars under one page id**, plus a third from a PDF, giving all three coordinate worlds:

```
handwriting/f2e53d30-….json          surface "inline"   —              (no registry)
handwriting/f2e53d30-….slides.json   surface "slides"   coordSpace "slide-logical"
                                     deck {width:960,height:700}
                                     slides [{index,hash} × 4]      ← canvas registry
handwriting/pdf-646f9768….json       surface "pdf"      coordSpace "page-css@1"
                                     pdfPaths ["…/mit15_773_s24_lec01.pdf"]   ← canvas registry
```

The whole format, generalised from those three:

```
sidecar = { schemaVersion, pageId, surface, coordSpace?, <canvas registry>?,
            textBoxes, images, strokes }
stroke  = { id, tool, color, width, createdAt, pressureProfile?, page?, pts }
```

| field | role |
|---|---|
| `surface` | which coordinate world |
| `coordSpace` | versioned name of the convention. Absent on `inline` |
| canvas registry | identifies canvases **only where they have no natural id** |
| `page` on a stroke | which canvas, 1-based. Absent when the surface has one canvas |
| `pressureProfile` | present only for a pen at non-uniform width. All four slide strokes were highlighter and none carried it — consistent with `tool === "pen" && widthMode !== "uniform"` |

### The registry mechanism, reproduced

Slide identity is `sectionHash` — FNV-1a 32-bit over the **trimmed section text**, 8 hex digits:

```js
let h = 0x811c9dc5;
for (const c of text.trim()) h = Math.imul(h ^ c.charCodeAt(0), 0x01000193);
return (h >>> 0).toString(16).padStart(8, "0");
```

Re-implemented independently against the note's source and checked against the stored registry:

```
[0] b7289749 == b7289749   # Slides ink test
[1] 7e000c95 == 7e000c95   ## Slide two
[2] 0ea4e6c3 == 0ea4e6c3   ## Slide three
[3] bc83d020 == bc83d020   ## Slide four        4/4
```

Sections split on thematic breaks, with setext underlines, fences, indented code and `%%`/HTML
comment blocks excluded from counting as breaks, and the first group kept when frontmatter exists.

### What this settles for mdlayers

**Handwriting already ships a two-layer system — it is just hardcoded.** One document, one page id,
two surfaces, two sidecars, each with its own coordinate space and canvas registry. Study ink and
presentation ink are different layers of the same file, exactly as the goal puts it, with the split
frozen at two and the layers unnamed.

So the generalisation is small, and it is the project: **make the surface a layer record rather than
a hardcoded pair.** A layer names its coordinate space and its canvas registry; a mark names its
layer and its canvas. Everything measured above becomes one instance of that, and a third drawing
layer costs a row instead of a code path.

## A5. Write cadence, observed

```
17:14:19    871 B    page created, first strokes
17:14:21   6579 B    +2 s
17:14:25  17868 B    +4 s   ← the 5-second ceiling firing mid-burst
17:14:27  22728 B    +2 s
```

700 ms after the last change, under a 5-second ceiling that later changes do not reset. Nothing is
written on the pen path. This is the policy M5 proposes to take, confirmed in the wild rather than
from the plugin's documentation.

## A6. Where the sidecar lives — and the rule it cost

The plugin's `storage.md` says ink lives in `.handwriting/`. In this vault it lives in
`handwriting/`, and `.handwriting/` is an empty husk. Both are right, because the folder is a
setting, and the reason it became one is recorded in `src/persistence/InkFolder.ts`:

> `.handwriting` was chosen so the ink stays out of the way […] The cost only showed up once people
> had two devices — **Obsidian Sync ignores dot-folders**, so ink written on a tablet never reached
> the desktop and looked like data loss (reported on release day, 2026-08-27, by a user who
> diagnosed it himself).

And then the second-order failure:

> The folder choice lives ONLY in `data.json`, and Obsidian Sync does not carry that file […] So the
> second device starts on `.handwriting` while every sidecar sits in `handwriting/` beside it. It
> reads nothing, and then writes a SECOND sidecar for every page id it is asked to save.

The repair is `adoptInkFolder()`, which sniffs for a folder that *holds live pages* — excluding
`.conflict-` and `.damaged-` residue, because a dot-folder holding only wreckage was being read as
"this vault keeps its ink here" and re-arming the fork.

> **Rule: the location of the layer store must travel with the document, not in a settings file.**

Three corrections, each from a user losing real data, none derivable from a design document. For
officebay this lands on M6: sidecars are fine, but whatever names their location has to be
recoverable from the document or the store itself.

## A7. A test harness that needs no fork

`storage.md`, backed by `PageData.migratePageData`:

> **Unknown fields survive.** Anything Handwriting does not recognise, at the top level or on an
> individual stroke or box, is preserved verbatim through a load and save.

So an anchor can be written onto a real stroke —

```json
{ "id": "91be9b22-…", "tool": "pen", "width": 2.2, "pts": [...],
  "anchor": { "blockId": "blk_7f3a", "hash": "…", "lastIndex": 12, "anchorKind": "block" } }
```

— and Handwriting 1.4.19 round-trips it untouched while continuing to draw at the stored
coordinates. **M1's resolution rules can be built and tested against live files produced by the
shipping plugin**, with no fork, no licence question, and no reimplementation of ink capture. Draw
in Obsidian, resolve with M1's module, re-run the edit and check where it lands.

It also makes the format extension backward-compatible: a stroke with no anchor is page-anchored and
fixed, which is exactly §A2.

## A8. Licence

CC BY-NC-ND 4.0, © 2026 Alan Liu. Read and measure; do not copy source. This matches the plan's
"What is out of scope": *"Copying code from the Handwriting plugin. Its mechanisms are taken; its
source is CC BY-NC-ND and is not a source to copy from into a shipped product."*

How the code divides: 140 of its 159 source files, 38,578 of 71,541 lines, import neither its host
nor its editor. Its three largest files are its three host adapters, and its 16 `obsidian`-importing
files carry nearly half its line count. The host-specific part is small and separable.

Worth noting for weighting: the repository is 71,541 non-test LOC written in **22 days**
(2026-08-23 → 2026-09-14, 85 commits, one account), with 513 third-person references to the owner in
source comments and 570 dated field observations. Those observations — iOS WebKit's pressure
ceiling, a Boox NoteAir's ~800 ms full-canvas-clear freeze, a prediction horizon tuned to measured
latency and then halved, silent lift, nib release travel — are the part no design document
reproduces and the part worth harvesting.

---

## A9. Deltas against `genoffice/references/handwriting.md` and its extracts

Those extracts are Handwriting's *own* `docs/storage.md` and source comments, vendored verbatim.
`storage.md` opens by saying: *"Where this document and the code disagree, the code is right."*
Three places where it does.

### A9a. Handwriting does capture and store pressure

The extract lists a stroke as *"`id`, `tool`, `color`, `width`, `createdAt`, and points"*, and the
companion research concludes **"No pressure field is recorded anywhere in the extracts."**

Measured, on disk: every stroke carries `pressureProfile: "exp7"`, and pressure is the **third
element of every point quad** in `pts` — real values, 0.128 → 0.409 → 0.889 across one stroke, at
~120 Hz.

This matters for M5 and for the §3.5 gap in the extension-points doc. The open question there —
*"whether Apple Pencil pressure reaches an Electron app through Sidecar"* — is still open, but it is
now a question about Electron, not about whether the reference implementation has pressure to model.
It does, with a named profile.

### A9b. The sidecar folder is a setting, and this vault does not use the documented default

The reference states ink lives in `.handwriting/` at the vault root. In the measured vault it lives
in `handwriting/` — no dot — and `.handwriting/` is an empty husk.

```ts
export const DEFAULT_INK_FOLDER = ".handwriting";
export const SYNCED_INK_FOLDER  = "handwriting";
```

Both are correct; the folder is the `inkFolder` setting. The reason it became one, and the
second-order fork it caused, is §A6 above. Anything in M6 that assumes a fixed `.handwriting/` path
will be wrong on a synced vault — which is the only kind that matters.

### A9c. Points are packed, not objects

`pts` is a flat `[x, y, pressure, t, …]` array; `bbox` is not serialised at all. The extract's
"and points" is accurate but underspecified, and `storage.md` explicitly marks the packing as
internal and unstable. A reader of the sidecar format needs to know it is quads, not records.

### A9d. Three things measurement adds that reading could not

1. **`cameras: {}`** — the inline surface persists no camera (§A3). The rule that follows belongs in
   M3/M4: a layer record must not carry a viewport.
2. **The ink-folder fork** (§A6) — the rule that the store's location travels with the document.
   Belongs in M6.
3. **The unknown-field harness** (§A7) — the research already vendors the guarantee
   (*"Unknown fields survive… preserved verbatim through a load and save"*). The consequence it
   does not draw: M1's resolution rules can be exercised against live sidecars from the shipping
   plugin, with no fork and no licence exposure.

### A9e. Two scope notes, not corrections

- The research prescribes **five** ordered steps and defers collections explicitly (*"not in this
  slice"*). The plan's M6 is a plan-level extension, not something the evidence establishes.
- **`uncertain` has no field anywhere in the research.** It exists there as behaviour — keep the
  index, never delete, never merge, surface it — and the only "ask the human" precedent is Sigla,
  which its own reference file forbids citing as mechanism. If M1 gives `uncertain` a stored field,
  that is new work, not a port.

---

# Part B — the `.excalidraw.md` container

## B1. The scene inside is the upstream Excalidraw schema

Two files from the owner's vault, written by plugin 1.9.0 and 1.9.20, decoded with `lz-string` and
compared with the upstream element schema (2026-09-20; record `probe-84` and script
`excalidraw_md_scene_vs_upstream_schema.cjs` in
`~/Projects/cloud_backup/investigations/2026-09-16-cloud-surface-reduction/`).

| | `Drawing 2023-05-12 15.34.01` | `Drawing 2023-10-03 13.19.01` |
|---|---|---|
| scene `type` / `version` | `excalidraw` / 2 | `excalidraw` / 2 |
| top-level keys | `type version source elements appState files` | the same |
| elements | 42: 39 `freedraw`, 2 `image`, 1 `ellipse` | 7: 6 `freedraw`, 1 `image` |
| element keys outside the upstream schema | 0 | 0 |
| `files` entries in the stored scene | 0, with 2 image elements | 0, with 1 image element |
| headings in the wrapper | `# Text Elements`, `# Embedded files`, `# Drawing` | `# Text Elements`, `# Drawing` |
| drawing block | `json` | `json` |

So a VS Code Excalidraw editor and the Obsidian plugin draw the same scene. They differ in the
wrapper, and in images: the stored scene carries none, and the `fileId → [[wikilink]]` list in the
wrapper is the only pointer to each image. A scene lifted out of the wrapper shows its shapes and
ink and leaves every image blank.

The wrapper has changed between plugin versions. These 1.9.x files use first-level headings;
plugin 2.27.3 writes `# Excalidraw Data` with `## Text Elements`, `## Element Links`,
`## Embedded Files` and `## Drawing` under it, optionally inside `%%` comment fences, with the
scene either as `json` or as `compressed-json` (`LZString.compressToBase64`, cut into
256-character lines).

## B2. What the plugin keeps on save — read from source, not yet run

Plugin 2.27.3 at commit `a818289` (2026-09-20), AGPL-3.0, read only.

- The save path in `src/view/ExcalidrawView.ts` builds the file as header + generated data section.
  The header comes from `getExcalidrawMarkdownHeaderSection(sourceTextSnapshot, keys)`
  (`src/shared/excalidrawMarkdownParsing.ts`): everything above the data section, taken from the
  file's current text, with only the plugin's own frontmatter keys updated. Frontmatter keys and
  Markdown it does not know are carried over.
- `generateMDBase` in `src/shared/ExcalidrawData.ts` writes the data section from the scene;
  `customData` is an upstream element field and is serialised with the element. The plugin itself
  uses `customData` (Mermaid source, Markdown image data), so it is a travelled path.
- It sets `scene.files = {}` before saving: images are written to the vault and referenced from
  `## Embedded Files`.

What this does not establish: that a layer table in frontmatter and `customData.mdlayers` survive a
real open, edit and save in Obsidian, including the plugin's merge and recovery logic keyed on
`## Text Elements`. That is the first run to make (001 §9).
