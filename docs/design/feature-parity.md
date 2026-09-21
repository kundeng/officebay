# Notebook parity inventory

Date: 2026-09-21. Repository base: `9df040e`. Status: planning inventory, not executed parity evidence.

The owner wants a separate notebook document with GenOffice and MDLayers capabilities. The table preserves that scope. Rows group capabilities for planning; the baseline sprint must expand the current menus, commands, tool registrations, settings and tests into individually testable rows before any claim of exhaustive coverage. Each final row needs an ID, baseline source/command, notebook behavior, implementation owner, test, and result. Nothing becomes N/A without an explicit rationale and owner agreement.

## CodeGraph evidence

- `TabKind`, `apps/shell/src/shared/tabs-api.ts:1`: seven kinds, including home; no notebook kind.
- `routeDocumentPath`, `apps/shell/src/main/index.ts:2658`: per-format routing, including a generic Markdown match. Add the compound notebook-page suffix before it.
- `openMarkdownTab`, `apps/shell/src/main/tab-manager.ts:244`: a pattern for separate tab lifecycle, not a place to implement notebook editing.
- `AgentSkill`, `packages/agent-core/src/skill.ts:15`: tool/context/response-verification contract that a new notebook skill can implement.
- `AgentLoopOptions`, `packages/agent-core/src/loop.ts:54`, and tool execution near line 705: snapshot callback and first-mutation notification; durable page history is not supplied by those callbacks alone.
- `packages/project-store/src/types.ts`: project files, stable chat identity and messages. Reuse these owners for project/chat behavior.

CodeGraph was initialized for this clone and indexed 2,245 files. Source inspection establishes available seams, not successful runtime behavior. Existing `e2e/` tests and per-app tests are the starting evidence set; no application build or journey test ran in this planning change.

## GenOffice parity families

| ID | Capability to baseline | Notebook target | Owner |
|---|---|---|---|
| G01 | New, open, recent, tabs, duplicate-open, close prompts | Separate notebook/page type and shell route | Notebook editor |
| G02 | Save, Save As, autosave, reopen, dirty state, recovery | Notebook-aware page/catalog saves; no source-file migration | Notebook editor, Revisions |
| G03 | Undo/redo, clipboard, keyboard commands, selection | Canvas and text editing with consistent command semantics | Notebook editor |
| G04 | Text styling, lists, links, tables, images, math and diagrams exposed by existing editors | Test each representation in notebook text objects or explicit embedded-editor integration | Notebook editor, Host parity |
| G05 | Search/find, navigation, document structure | Notebook/section/page tree, page titles, links, search | Notebook editor, Host parity |
| G06 | Zoom, presentation, print, export and import | Define page/selection bounds and format fidelity; enumerate formats rather than assuming equivalence | Notebook editor, Host parity |
| G07 | Theme, languages, accessibility, focus, pen/touch, fullscreen | Shared suite conventions with notebook-specific accessible controls | Notebook editor, Layers, Host parity |
| G08 | Project membership, rename/move and file-linked chat | Existing project store, notebook identity and path repair | Notebook editor, Notebook agent |
| G09 | Provider selection, BYOK, attachments and multimodal context | Existing provider stack; no fallback to removed hosted service | Independent identity/providers, Notebook agent |
| G10 | AI read/locate/explain/create/edit with streaming and cancellation | Notebook skill over the same validated commands used by UI | Notebook agent |
| G11 | AI safety, snapshots, tool results, error reporting, retry/compaction | Reuse AgentLoop and add durable notebook commit/restore behavior | Revisions, Notebook agent |
| G12 | Search/image/transcription/generation formerly using hosted service | Supported independent replacement per capability; removal alone is not parity | Independent identity/providers, Notebook agent |
| G13 | Format-specific workbook formulas/charts, slide masters/animations, PDF edits/conversions, Docs review, HTML source | Preserve original editors; test notebook reference/embed/open/edit/return workflows; unresolved notebook-native requirements stay explicit | Baseline, Host parity |
| G14 | Packaging, file associations, startup, security boundaries, update policy | Notebook included in Windows build; original document routes regressions | Independent identity/providers, Host parity |
| G15 | Source-grounded outputs, failures and partial work | Record source/revision references and inspectable results | Notebook agent |

This table does not promise that a canvas becomes a spreadsheet engine. It does require an explicit per-feature disposition before calling the notebook complete. Existing apps remaining available is necessary but is not, by itself, proof of the new document's integration parity.

## MDLayers parity families

Source: pinned `references/mdlayers/001-design.md`, sections 2-9; measurements and compatibility claims retain their stated limits.

| ID | Capability | Proof required | Owner |
|---|---|---|---|
| M01 | Plain notes and Excalidraw pages | Untouched note bytes stay untouched; existing page opens without migration | Shared container core, Notebook editor |
| M02 | Canvas identities, nested placements, image/PDF page coordinates | Same source placed twice shows same marks; resize moves placement only | Layers |
| M03 | Named, ordered, visible/hidden, locked layers | Hide/show preserves data; locked input rejects UI and agent mutation | Layers, Notebook agent |
| M04 | Extensible mark kinds | Register third-party kind; unknown kind preserved with fallback | Layers |
| M05 | Handwriting-compatible ink sidecars | Read/write fixtures, pressure, smoothing, eraser, page identity | Layers |
| M06 | MRSF comments/highlights and re-anchoring | Edit before/inside target; moved/stale/orphan visibly distinguished | Layers |
| M07 | Page drawing, shapes, text, image, note/PDF/LaTeX references | Render/save/reopen each type without flattening references | Notebook editor, Layers |
| M08 | Container generations, JSON/compressed JSON, comment fences | Byte-identical no-op and conservative changed-section writes | Shared container core |
| M09 | Unknown fields, embedded files, links, plugin format drift | Plugin-produced fixtures plus round trips and version pinning | Shared container core, Host parity |
| M10 | layoutWidth, source scale, focused source vs page ink | Change placement without wrapping source ink; explicit input target | Layers |
| M11 | Note source and presentation/annotation views | Shared marks across views and modes; separate visible layers | Layers, Host parity |
| M12 | VS Code normal editor plus annotate-only view | Opening plain Markdown retains normal text editing | Host parity |
| M13 | Obsidian Excalidraw companion and existing sidecar plugins | Real saves retain layers, IDs and unknown data | Shared container core, Host parity |
| M14 | Windows pen and mouse capture | Measured pressure/latency/erase behavior, deterministic fixtures | Layers |
| M15 | Open questions in MDLayers section 9 | Measure sidecar width/hash/image behavior and embedded-note focus; retain unresolved rows | Shared container core, Layers, Host parity |

## Added revision requirements

R01: immutable checkpoints survive restart. R02: preview uses archived dependencies. R03: restore creates a new revision without rewinding shared sources. R04: incomplete sync and competing edits are visible and recoverable. R05: retention never discards reachable history or unresolved conflicts. R06: undo, AI activity, history and sync are separate contracts. All map to the revisions sprint and cross-host verification.

## Extension and document-manager capabilities

| ID | Capability | Proof required | Owner |
|---|---|---|---|
| E01 | Complete contribution surface | Routing, lifecycle, UI, IPC, build, services, AI and codec ownership traced | Extension mechanism |
| E02 | Contribution isolation | New type/command/mark added without another legacy-editor diff | Extension mechanism |
| E03 | Activation and disposal | Duplicates, cycles, ambiguity and partial activation unwind tested | Extension mechanism |
| D01 | Multi-note aggregate | Open/create/reopen one note document with ordered sections and notes | Document manager |
| D02 | Stable organization | Rename/reorder/move/duplicate/delete with valid identities and references | Document manager |
| D03 | Lifecycle coordination | Multiple dirty notes, Save As, close cancellation, two-window conflict | Document manager |
| D04 | Cross-feature identity | Project/chat/search/history/agent consumers agree on document and note IDs | Document manager |
| D05 | Aggregate history | Revisions capture catalog/membership and distinguish note from document restore | Revisions |

## Adaptation, replay and UI evidence

| ID | Capability | Proof required | Owner |
|---|---|---|---|
| A01 | Reference-based implementation | Pinned source/symbol, reuse decision, behavior fixture and new-core comparison for each [adaptation](editor-adaptation.md) | Baseline, Container, Notebook editor, Layers |
| R07 | Timed authoring replay | Pressure/time preservation; play/pause/seek/speed; deterministic archived scene, live bytes unchanged | Layers, Revisions |
| R08 | Honest replay coverage | External/geometry-only edits show gaps; import timing coverage declared; incomplete/branched tracks retained | Revisions, Host parity |
| U01 | GenOffice-grounded notebook UI | Review source screenshots and interactive design study; hierarchy, layers, agent and versions/replay in desktop and narrow layouts | Baseline, Notebook editor |

These rows are planned and unimplemented. The prototype supplies design evidence, not application or format compatibility evidence.
