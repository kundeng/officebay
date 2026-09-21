# Extension points and layers — what the fork can be extended through

**Date:** 2026-09-17. **Method:** CodeGraph queries against the indexed tree, plus targeted reads
of the files each query named. Every claim below cites `file:line`. **Relation:** continues
`2026-09-13-component-decomposition.md` (which inventories owners) and
`2026-09-11-extensibility-audit.md` (which corrects capability claims). This one answers a
different question: through which seams can behaviour be added, and at what cost.

Spec 02 task T2 produced the owner inventory. This is its other half, and it is the input T3
needs to compare the three candidate slices on cost rather than intuition.

## 1. Where the plan stands

Checked item by item against the tree on 2026-09-17. **None of the thirteen steps in
the earlier implementation proposal (A1–A3, B1–B2, C1–C5, D, E) has landed.** The seams each
step targets are present and unchanged: `AgentLoopEvents` (`packages/agent-core/src/loop.ts:32`)
has two callers, both internal; `extractIrDocument` (`packages/pdf2docx/src/pipeline.ts:261`) is
callable but `tools/probe-math-extraction.mjs` still measures only `getTextContent()` (line 42);
`packages/ai-search/src/gsk.ts` is 23 KB with 14 callers.

Four statements in the steering documents describe a state the code does not have.

| document | claim | what the tree shows |
|---|---|---|
| `pillars.md:139-140` | the `gsk` backend, `@genspark/cli`, the auto-updater and analytics "are removed", and `tools/check-no-genspark.mjs` fails the build | `gsk.ts` present and exported (`packages/ai-search/src/index.ts:19`); `@genspark/cli` declared (`packages/ai-search/package.json:19`); `initAutoUpdater` (`apps/shell/src/main/updater.ts:459`) and `initDocsAutoUpdater` (`apps/docs/src/main/updater.ts:215`) both live; the guard script does not exist and `.github/workflows/ci.yml` has no such step |
| `pillars.md:71` | the binding constraint is "the absence of a structural layer" | `extractIrDocument` (`pipeline.ts:261`) produces reading-order typed blocks with furniture detection, multi-column sections, tables and footnotes. What `IrPage` (`ir.ts:403`) lacks is identity, not structure: no `id` on the page, none on `TextBlock` (`ir.ts:130`); the only `id: string` in the file is `FootnoteIR.id` (`ir.ts:388`) |
| `tech.md:12`, `tech.md:37` | `@picobay/engine` is the transformation owner | zero occurrences of `picobay` in any `package.json` or `.ts` outside `node_modules` |
| `PLAN §C` | 1,005 `@genoffice/*` import paths; 35 e2e specs | 1,193 occurrences across 529 files (894 import lines under source directories); 32 `*.spec.ts`. The 21-manifest count is accurate and is the stable anchor |

Pillar P4's correction is the cheapest of these to settle: extend `tools/probe-math-extraction.mjs`
(76 lines, no pdf2docx reference today) to call `extractIrDocument()` beside `getTextContent()`.
That is plan step B1, it depends on nothing else, and it replaces an assertion with a measurement.

## 2. Extension points

### 2.1 The three registries

A registry here means: adding an entry adds a capability, and the addition does not require
editing unrelated code.

| registry | file:line | entries | cost to add one |
|---|---|---|---|
| slides op registry | `apps/slides/src/main/ops/registry.ts:194` — `Map<string, OpDef>` with `register()` at `:196` | 59 ops | one `register({name, validate, apply})` call; a new file also needs one `import './x-ops'` in `apps/slides/src/main/ops/index.ts:1-6` |
| docs op registry | `apps/docs/src/renderer/ai/ops.ts:144` — same shape, `register()` at `:146` | — | one call, plus two documentation strings (see below) |
| AI provider adapters | `packages/ai-provider/src/registry.ts:135` — `Record<AiProviderId, ProviderAdapter>` | 17 providers | three coordinated edits: the `AiProviderId` union (`types.ts:3`), the metadata array (`providers.ts:28`), the adapter entry |

The provider table is the only capability table in the repository with a compile-time
completeness gate. Because it is typed `Record<AiProviderId, …>`, TypeScript refuses to compile a
missing entry. The two op registries are `Map`s and have no such gate.

The docs registry carries an obligation enforced by a test: `apps/docs/tests/ops.test.ts:855`
fails when a registered op is absent from `AGENT_SYSTEM_PROMPT` or from the `apply_ops`
description. A registration API that replaced this would need to let a registered thing
contribute its own prompt fragment, or that invariant moves somewhere weaker.

### 2.2 There is no plugin loader

Every seam is compile-time. `await import(...)` appears 28 times in `src/`; each one is a static
specifier lazy-loading a heavy dependency (`pdf-lib` at `apps/docs/src/main/docs-main.ts:3784`,
`@embedpdf/pdfium` at `apps/pdf/src/main/text-edit.ts:126`, undici's ProxyAgent at
`apps/shell/src/main/index.ts:4178`) or breaking a cycle. No template literal or variable ever
appears inside an `import()`. There is no manifest concept, no `contributes` block, and nothing
is loaded from user data. Even the two `register()`-based registries are fed by static
side-effect imports and are sealed at bundle time.

This has a consequence for how the earlier audit's mistake happened. When nothing can be added
without recompiling, "the wiring is absent" and "the capability is absent" look identical from
outside the build. They are different to a developer inside it, which is what that audit was
correcting, but the confusion was earned.

It also bounds what "extension mechanism" should mean here. Nothing in the tree calls for a
runtime extension host. What the tree does call for is one internal registration API replacing
ten hand-maintained duplications.

### 2.3 The one interface already shaped like a plugin

`AgentSkill` (`packages/agent-core/src/skill.ts:16`) declares id, system prompt, tools, per-turn
context, a tool executor and a response verifier. `composeSkills` (`:44`) merges several,
rejects duplicate tool names (`:57`), dispatches by owner (`:64`) and chains verifiers (`:71`).

Two properties it has that a replacement would need to keep:

- **Lazy enumeration.** `tools` and `systemPrompt` are getters recomputed on every access
  (`:47-49`, `:52`, `:55`), because a sub-skill varies its tool list with runtime capability —
  image generation availability, login state. A snapshot-at-registration API breaks five call
  sites.
- **A global tool namespace.** The duplicate-name throw at `:57` is the only thing preventing
  two skills from claiming one tool name.

What it lacks is registration. Each app composes a literal array at its own call site, so a new
skill costs two edits: the file, and the array entry.

### 2.4 The cost ladder

Counted by following each seam to every site that must change.

| to add | sites | where |
|---|---|---|
| a slides op | 1–2 | `register()` call; import line if a new file |
| a tool to an existing app | 2–4 | the `AGENT_TOOLS` array, a `switch` case, and for docs a third literal list — the async/sync fork at `apps/docs/src/renderer/ai/tools.ts:711-740` is a name disjunction, so a tool added to the array and the switch still runs on the wrong path unless that list is edited too |
| a Tiptap node that only renders | 1–2 | the extension array (`apps/markdown/src/renderer/editor/extensions.ts:27`, or `apps/docs/src/renderer/editor/extensions.ts:5504`) |
| a Tiptap node that must survive a save | more | plus a converter in `apps/docs/src/renderer/editor/convert.ts` and format support in `packages/docx-engine`. A node can register and silently lose its data on save |
| an AI provider | 3 | union, metadata, adapter. A new wire protocol adds two more (`AiProtocol` at `registry.ts:7`, the switch in `stream.ts:34`) |
| a readable PDF annotation subtype | 3–4 | see §2.5 |
| a document type | ~17 in shell alone | see §2.6 |
| a UI locale | 270+ | `Lang` union (`packages/i18n/src/index.ts:1`), `LANGS` (`:23`), `HTML_LANGS` (`:65`), 14 shard-import blocks each listing all 20 languages by hand, and roughly 240 per-locale modules |

### 2.5 The PDF annotation read filter

The earlier audit recorded this as one missing map entry. It is three or four sites, and one of
them is not a map.

`MARKUP_TYPE_BY_ANNOT` (`apps/pdf/src/renderer/edit-state.ts:10`) is
`{9:'highlight', 10:'underline', 12:'strikeout'}`. Adding a subtype needs that entry, the
`MarkupType` union (`apps/pdf/src/shared/ipc.ts:101`), and the write-side `SUBTYPE` map
(`apps/pdf/src/main/save-pdf.ts:144`). Then `loadSavedAnnots` (`annotation-catalog.ts:26`)
filters on `a.quadPoints.length >= 8` at `:28`. **Ink annotations have no QuadPoints**, so an Ink
entry in the map returns nothing on its own; ink needs a separate read branch keyed on
`/InkList`.

The asymmetry generalises. Writable today: Highlight, Underline, StrikeOut, threaded Text notes
(`/IRT` + `/RT`, `save-pdf.ts:326-330`), Ink (`:377`), Square and Circle (`:383`), Line and arrow
(`:391`), Stamp (`:230`), Form (`:136`). Readable today: Highlight, Underline, StrikeOut, Text.
Five subtypes the application writes, it cannot read back.

The payload channel for our own data already exists and is in use: `save-pdf.ts` writes custom
keys `GenOfficeFormField` and `GenOfficeStaticFormFills` onto annotation dictionaries. An anchor
id or a recognition result can ride the same way without inventing a sidecar format.

### 2.6 Document-type routing

Adding a document type touches, in `apps/shell` alone: the `TabKind` union
(`src/shared/tabs-api.ts:1`), a extension regex (`src/main/index.ts:2545-2550`),
`OPEN_DIALOG_EXTENSIONS` (`:2560`), the `supportedFileIn` disjunction (`:2576`), a
`routeDocumentPath` branch (`:2658`), an `applyMenuFor` case (`:2302`), a `TAB_MENU_ICON` entry
(`:3296`), the icon-key ladder (`:2285`), the open-dialog filters (`:2940`), the rename fan-out
(`:3033`), a `MenuIconSet` asset, and then in `tab-manager.ts` the import block (`:5-45`), an
`openXTab` function, the dirty scan (`:388`), the close guard (`:428-439`), `findXTabByPath`
(`:481-505`) and the kind predicate (`:520`). The app module must also export the
`createXView` / `requestXClose` / `xIsDirty` / `xFileRenamed` quartet.

None of these sites references any other. That set is also the specification of what a
`DocumentType` registration entry would carry, since it is the literal union of what the six
existing types each supply by hand.

### 2.7 Ten duplications against five shared seams

Shared in `packages/`: `AgentSkill`/`composeSkills`, the provider registry, `LangDicts` and
`createI18n`, `parseFileToText` (`packages/file-parse/src/parse.ts:43`), and the menu templates
in `packages/electron-utils/src/app-menu.ts`.

Duplicated per app, most mechanical first:

1. **`createFilesSkill`** — four copies (`apps/docs/src/renderer/ai/files-skill.ts:27`,
   `apps/html/…:27`, `apps/sheets/…:28`, `apps/slides/…:32`), each carrying a comment saying it
   matches the others. Slides' copy adds one `onRead` parameter. This is the cheapest
   consolidation available.
2. **`web_search`** — five places in two shapes: a skill in html, markdown and sheets; an inline
   tool in docs (`ai/tools.ts` async branch `:520`) and slides (`slides-skill.ts:293`).
3. **Image tools** — `image_search` / `generate_image` / `insert_image` in five apps, all gating
   on the same `imageGenerationAvailable()`.
4. **`OpDef`** — written twice with near-identical fields (`apps/docs/src/renderer/ai/ops.ts:130`,
   `apps/slides/src/main/ops/registry.ts:186`): a name, a plan-time `validate` returning a guided
   error, an `apply` returning a before/after record. Both are load-bearing — `runTxn` rollback
   and the op journal depend on the before/after shape.
5. `create_document`, the six `AiPanel.tsx` copies, two `asset-lifecycle.ts` files, six IPC
   channel objects with no shared router, and two different answers to Tiptap assembly (a bare
   array in docs, an options-taking builder in markdown).

One structural observation. Slides is the only app whose write surface is registry-backed: 59 ops
behind `execute_slide_script` and `apply_ops`, which is why its tool array is 17 entries while
PDF's is 45. PDF pushed every capability up into the tool list instead of down into an op
vocabulary. Whichever direction officebay takes, that divergence is the choice being made.

## 3. Layers

### 3.1 What exists

`apps/pdf` stacks roughly eighteen overlays inside one `.pdf-page` div
(`apps/pdf/src/renderer/App.tsx:6741`), sharing `PageGeom` (`annotations.ts:14`) and the
`pdfToView` / `viewToPdf` / `pdfRectToCss` trio (`:28`, `:42`, `:56`). The named components:
`DrawLayer` (495 lines), `NoteMargin` (493), `ImageEditLayer` (395), `ocr-layer` (223),
`FormLayer` (193), `SignDropOverlay` (93), `LinkLayer` (78), plus a dozen inline overlays for
text blocks, search hits, stamps and previews.

`apps/slides` has `InkOverlay` for editing and a separate `InkLayer`
(`components/ShowInk.tsx:14`) for the presenter and audience windows. `apps/docs` has
`InkOverlay` plus the `dark-page.ts` colour-twin layer. **`apps/markdown` and `apps/html` have no
overlay layer of any kind** — searched, not assumed. There is no shared layer code in
`packages/`.

### 3.2 Ink exists three times, in four coordinate spaces

| app | type | points | space |
|---|---|---|---|
| pdf | `DrawingInput {kind:'ink', paths: number[][]}` | flat `[x1,y1,x2,y2,…]` | PDF user space, y-up, absolute on the page |
| docs | `InkStroke` (`editor/ink.ts:22`) in `InkAnnotation {anchorIndex}` (`:37`) | `{x,y}[]` | CSS px at 100 % zoom, relative to the anchor paragraph |
| slides edit | `InkStroke` (`slides/ink.ts:28`) | `{x,y}[]` | fitWidth viewport px, made relative to the stroke's bounding box at commit |
| slides show | `InkStroke {color, points: number[]}` (`ShowInk.tsx:8`) | flat, normalized 0..1 | the slide frame; width derived as `max(2, width*0.003)` (`:38`) |

The stroke payloads are the same idea four times: a polyline with a colour and, in three of four,
a width and a tool. What differs is the anchor. A shared
`Stroke { tool, colorHex, width, points }` plus a discriminated anchor —
`{space:'pdfUserSpace', pageIndex} | {space:'blockRelative', anchorIndex} | {space:'framePx', slideIndex} | {space:'normalized'}`
— covers all four. The remaining differences are cosmetic: PDF uses `[r,g,b]` 0..1 and flat
arrays where the others use hex and `{x,y}`, PDF's y axis is flipped, and the presentation
variant carries no tool or width.

### 3.3 Read-back is three different capabilities

- **docs — full vector round-trip.** `packages/docx-engine/src/parse.ts:451` finds the ink runs
  and emits `InkInfo` carrying `anchorIndex` and the `descr` payload;
  `apps/docs/src/renderer/editor/ink.ts:93` decodes it back into live strokes. Where decoding
  fails it degrades to an image annotation that can still be moved and erased (`ink.ts:32-36`).
  Called on open (`file-actions.ts:391`) and after save-reparse (`:990`).
- **slides — hit-testing only.** `inkNodesOf` (`ink.ts:81`) decodes `descr` on every render so the
  eraser can find strokes (`InkOverlay.tsx:55`). Konva paints the saved PNG; the vectors are
  never re-rendered.
- **pdf — none.** Saved ink is write-only. Reopen a file you inked and the strokes are frozen in
  the annotation layer: not editable, not erasable. `subtype === 'Ink'` is read in exactly one
  place, `form-catalog.ts:207`, to decide whether a signature widget looks signed; `/InkList` is
  never parsed.

The docs pattern — raster for interoperability, vectors in a metadata field for re-editing — is
the one to carry forward. It is also what PDF's custom-key precedent (§2.5) would support.

### 3.4 Modes

There is no mode system. There are six things that behave a little like one.

`readMode` in docs (`App.tsx:703`) is the only document-wide read mode: it sets the editor
non-editable (`:1223`), unmounts the ink overlay (`:4893`), and makes header and footer read-only
(`:4837`). `isProtected` (`:1199-1211`), derived from docx write protection, produces the only
**visible-but-locked** state in the repository: `tool={isProtected ? 'select' : inkTool}`
(`:4895`).

PDF has no read-versus-edit mode at all. It has a `ribbonTab` and six independent booleans —
`editTextMode` (`:394`), `drawTool` (`:372`), `pendingSign` (`:704`), `imagePick` (`:610`),
`editImageMode` (`:604`), `noteMarginOn` (`:1291`) — that each render site combines by hand.
`readOnly` (`:1220`) is not a user mode either; it means the document is encrypted, and it is
threaded manually into ten call sites.

Slides' presentation mode mounts a separate component tree (`App.tsx:4127`, `:4138`) with its own
third ink implementation, rather than changing state on the editor's layers.

Interactivity is expressed four different ways today: `tool={readOnly ? null : drawTool}`
(`apps/pdf/…/App.tsx:7704`), `tool={isProtected ? 'select' : inkTool}`
(`apps/docs/…/App.tsx:4895`), a wrapper class `pdf-imgedit-passive` (`apps/pdf/…/App.tsx:7573`),
and CSS `pointer-events` pairs (`styles.css:1530` with `:1540`).

### 3.5 Stylus input

Searched `apps/` and `packages/` for `pointerType`, `.pressure`, `getCoalescedEvents` and
`palm`: no hits. There is no pressure, no coalesced-event batching, no palm rejection and no
pen-versus-touch discrimination. Strokes are raw polylines; docs and slides apply a 0.8 px
minimum-distance filter (`InkOverlay.tsx:163`, `:92`), PDF applies none.

`touch-action: none` is set on five surfaces but **not** on `.pdf-draw-layer`
(`apps/pdf/src/renderer/styles.css:1530`), so inking a PDF on a touch device scrolls the page.

### 3.6 What a layer contract has to express

Each item below is something the code does today in more than one way.

1. **A coordinate space tag** plus a `project` / `unproject` pair. Four spaces are in use (§3.2);
   PDF has the pair already, docs and slides re-derive theirs inline from `getBoundingClientRect`.
2. **An optional reflow anchor.** Only docs needs `anchorIndex` with live re-measurement via
   `ResizeObserver` and `MutationObserver` (`InkOverlay.tsx:96-108`). PDF pages and slides are
   fixed canvases and should not pay that cost.
3. **Three interactivity states** — `hidden`, `visible-locked`, `interactive` — resolved per
   layer per mode and mapped to one mechanism rather than the four in §3.4.
4. **Mount separated from gate.** Some layers unmount (`noteMarginOn` at `App.tsx:7792`, docs ink
   at `:4893`); others stay mounted and go inert (`DrawLayer` with `tool=null`). Unmounting
   discards in-progress state, and for docs ink would drop unsaved annotations.
5. **A visibility axis independent of mode.** `rowVisible` (`App.tsx:6688`) gates most PDF layers
   for performance. Conflating it with policy would break `pendingSign` and `imagePick`, which
   deliberately render outside that guard (`:6815`, `:6826`).
6. **A persistence descriptor with a read-back bit** — `none | write-only | round-trip` (§3.3) —
   so the interface stops offering "erase" on strokes it cannot address.
7. **Export participation.** `dark-page.ts:11-13` and `PaginationPreview` (`App.tsx:5088`) each
   hand-roll an opt-out. Per-layer `inScreen` / `inPrint` / `inClipboard` / `inExport` replaces
   ad-hoc CSS escapes.
8. **A declared z-band.** PDF assigns integers 1–8 across eighteen CSS sites; `OcrTextLayer` has
   no z-index and depends on JSX order (`styles.css:3510`, `App.tsx:7674`). Slides and docs pick
   unrelated numbers.
9. **An input profile** — `touchAction`, whether the layer wants stylus or finger, whether it
   wants coalesced events. Nothing owns this today, which is why `.pdf-draw-layer` is missing
   `touch-action: none`.

## 4. What this says about the three candidate slices

Spec 02 §Design lists three. Their costs are now measurable rather than estimated.

| slice | what it touches | cost from this inventory |
|---|---|---|
| highlight/note → transformation → new editable document with source links | the read path (`annotation-catalog.ts:26`, already reads highlights and notes), `create_document` (duplicated in three apps), and anchor identity | the read side works today for the three markup types plus notes. The missing piece is identity: `IrPage` and `TextBlock` have no ids (`ir.ts:403`, `:130`), so a link into the source cannot survive an edit |
| project files → agent-visible listing → source selection | `packages/project-store` (already exposed over IPC per the earlier audit) and one tool registration | cheapest by a wide margin: an entry in an existing `AGENT_TOOLS` array plus a switch case, against a substrate that ships |
| ink read-back → recognition/crop → anchored agent context | §2.5 and §3.3 | larger than the audit recorded. It needs a new read branch keyed on `/InkList`, not a map entry, and PDF today has no vector round-trip to build on — docs' pattern would have to be ported |

The second slice remains the cheapest registration-only option, and spec 02's selection rule
warns against picking a cheap registration slice that cannot produce a meaningful outcome. The
first is the one that forces the identity work, which every later layer feature also needs.

## 5. Limits of this note

Read from the indexed tree on 2026-09-17; no journeys were run, so nothing here reports observed
behaviour. Two facts were established by running commands rather than reading: `npm install`
completes on Windows with `electron.exe` fully extracted (225 MB), and
`npm run build -w @genoffice/pdf` exits 0 producing 9.3 MB in `apps/pdf/out`, against the 9.8 MB
recorded on macOS/arm64 in `2026-09-13-codebase-walk.md`. Rust is needed only for the sheets
sidecar (`apps/sheets/native/xlsx-engine/Cargo.toml`), so the other apps build without it.

Not covered: the sheets app's layers, `packages/pptx-engine` internals beyond the absence of an
element-handler registry, and whether Apple Pencil pressure reaches an Electron app through
Sidecar — which decides how far §3.5 can be taken and is not answerable from this tree.
