# Editor and layer adaptation

Status: implementation strategy. MDLayers currently contains design and measurements, with no implemented core. Build that core by studying working editors/plugins, reproducing useful behavior behind shared interfaces, and proving it with fixtures. Reference selection does not mean an adapter already works.

## Source-to-component map

| Reference | Read and measure | Planned adaptation / owner | Proving experiment |
|---|---|---|---|
| [Obsidian Handwriting](https://github.com/ellimist-afk/handwriting) | Capture, pressure, erasing, coordinates, inline/slide/PDF surfaces | Independently implement ink model/codec in core and input/rendering in browser package | Synthetic sidecars preserve pressure/time; Windows pen, eraser and resize measurements |
| [Sidemark](https://github.com/coddingtonbear/obsidian-sidemark) / [MRSF](https://github.com/wictorwilen/MRSF) | Review sidecars, selected text/context, anchors and orphan UI | Shared review codec/anchor resolver; host comment UI | Insert/delete/move text; distinguish anchored, stale and orphan |
| [Cherry Markdown](https://github.com/Tencent/cherry-markdown) | SyntaxBase, MenuBase, parser/preview boundary, custom menus/change callbacks | Evaluate reusable parsing/rendering and adapt notebook text-card editing | Tables, math, images, selection and undo in a new notebook card; save/reopen |
| [Markdown Preview Enhanced](https://github.com/shd101wyy/vscode-markdown-preview-enhanced) / [Crossnote](https://github.com/shd101wyy/crossnote) | Host preview lifecycle versus MarkdownEngine, diagrams, math and exports | Isolate rendering/export services and host preview adapter | Three-host fixture fidelity; classify unsupported executable chunks |
| [Obsidian Excalidraw](https://github.com/zsviczian/obsidian-excalidraw-plugin) | Container serialization, compression, text/link/file sections, embeds | Independent shared `.excalidraw.md` codec and compatible renderer/host integration | Real plugin open-save-open preserving links, files and unknown fields |
| [Excalidraw](https://github.com/excalidraw/excalidraw) / [VS Code extension](https://github.com/excalidraw/excalidraw-vscode) | Scene model, stable IDs, editor API, custom-editor lifecycle | Reuse suitable engine APIs; adapt host around same core; capture timed input | Scene/sidecar round-trip and timing before stroke simplification |
| [perfect-freehand](https://github.com/steveruizok/perfect-freehand) | Pressure-to-outline geometry | Candidate shared rendering dependency | Deterministic complete/partial strokes at multiple scales |

Cherry and MPE are new candidates; portable notebook suitability remains to be measured. MPE imports Crossnote, whose engine uses filesystem paths and export machinery. Do not put that entire engine in a browser-neutral core. These references inform new notebook surfaces; existing GenOffice Markdown and other editors keep their behavior.

## Read, measure, rewrite, prove

1. Pin source commit, symbols, package versions and license. Trace behavior and capture minimal input/output fixtures; a README is insufficient.
2. Separate deterministic format/model algorithms, reusable browser input/rendering, and host filesystem/commands.
3. Record the component decision: compatible dependency, permitted source adaptation with attribution, or independent implementation of measured behavior.
4. Compare reference and new implementation on the same fixtures. Record differences, unknown-data preservation, failures and performance. UI screenshots do not prove codec compatibility.
5. Release one pinned shared core for OfficeBay, VS Code and Obsidian. Keep ink, anchoring, replay and serialization out of duplicated host implementations.

Handwriting's recorded CC BY-NC-ND terms mean the existing project policy is source study and independent implementation. Obsidian Excalidraw's repository LICENSE is AGPL-3.0 despite historical MIT package metadata; use it as the compatibility reference and assess source reuse separately. The Excalidraw engine and VS Code extension have different licenses. Verify exact files/dependencies and preserve applicable notices.

## Evidence and inspection pins

The [MDLayers reference](../../references/mdlayers/README.md), [prior art](../../references/mdlayers/003-prior-art-and-licences.md), and [Handwriting measurement](../research/2026-09-17-handwriting-measured.md) retain source evidence. Handwriting is pinned at `fbc81280b6252ddc9c2799fe9e85ce56351a6472`. Measured `pts` tuples contain x/y/pressure/milliseconds from stroke start. Validate units/order before importing timing. Fixed ink intentionally stays fixed when Markdown reflows.

Additional source inspection on 2026-09-21:

| Repository / commit | Inspected source | Finding |
|---|---|---|
| Tencent/cherry-markdown `1634d64aae831f3af9547decb0ced15e5156e395` | `packages/cherry-markdown/src/Cherry.js`, `core/SyntaxBase.js`, `toolbars/MenuBase.js`, `LICENSE` | makeHtml, customMenu, afterChange/afterInit boundaries; Apache-2.0 with listed third-party components |
| shd101wyy/vscode-markdown-preview-enhanced `54a3c1b94202d74ae2cf5d5f4246ddfeda28936d` | `src/extension.ts`, `LICENSE.md` | Crossnote import, VS Code commands and desktop process lifecycle; NCSA |
| shd101wyy/crossnote `c5a8db191f50a73a27a44096ad49bffdf4925f59` | `src/markdown-engine/index.ts`, `LICENSE.md` | MarkdownEngine rendering/export with filesystem coupling; NCSA |
| excalidraw/excalidraw `97c68dd371e13c017a8dcca49f8b3995ba7890a8` | `packages/element/src/types.ts`, ExcalidrawFreeDrawElement | Geometry/pressure with no per-point timestamps in this type |

These are inspection pins, not approved runtime versions. Baseline still pins exact Sidemark/MRSF and host fixture releases. No claim is made that all community animation scripts have been surveyed.

## Sprint ownership

Baseline selects source slices/fixtures and reviews the [UI study](../../prototypes/notebook-ui/README.md). Container builds the codec/release boundary. Notebook-document evaluates Cherry/MPE patterns. Layers implements ink/review/coordinates. Revisions adds [timed replay](replay.md) alongside immutable checkpoints. Host parity proves behavior in all three hosts. Each sprint records source-to-component decisions and evidence instead of treating MDLayers as an implemented dependency.
