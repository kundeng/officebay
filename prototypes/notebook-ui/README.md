# OfficeBay notebook UI study

An isolated interactive prototype for reviewing a new note-document type inside the existing office shell. It is design evidence, not the notebook implementation or a feature-parity result.

Open [index.html](index.html) directly in a browser. There are no dependencies to install and no build step. Keep it inside this repository: it loads the existing [suite tokens](../../packages/ui/src/tokens.css). Alternatively, serve the repository root with a local static server and visit `/prototypes/notebook-ui/`.

## Try it

1. Choose notes in **Architecture** or **Research**, or create a **New note**. Each note keeps its text and strokes in memory until reload.
2. Choose **Pen**, optionally start **Record session**, then draw on the paper. Choose **Text** to focus the editable text card. Hide or lock Working ink in **Layers**. Locking rejects new pointer strokes; hiding preserves them.
3. Open **Replay**, then play, pause, scrub and change speed. The supplied synthetic session lasts 24 seconds. At 9–14 seconds the last known scene stays visible; at 14 seconds an external-edit snapshot adds the Office reference. The gap is labeled rather than animated as invented pen input.
4. Open **Versions** and choose a checkpoint. Its preview is read-only. **Return to live** preserves live edits; **Restore as new** adds a new version and exits preview. Replay positions have no restore button; restore uses checkpoint boundaries.
5. Toggle **Agent**, **Layers**, and the light/dark button. The source links open an explanation of the retained editor handoff. They do not invoke an Office editor in this study.

## Scope and limitations

- HTML/CSS/SVG/JavaScript only. No Excalidraw engine, MDLayers implementation, Electron host, filesystem persistence, codec, provider, real agent, export or source-editor integration.
- The existing Markdown, Docs, Sheets, Slides, PDF and HTML implementations are untouched.
- The sample replay uses synthetic SVG paths with assigned timing. It is not an authentic captured session or reconstructed timing from `.excalidraw.md` geometry. The sample cards and scene are illustrative.
- Record session captures new pointer coordinates, pressure and timestamps in browser memory. Those new samples are **not connected to playback**; Replay demonstrates the supplied sample track. Text and layer actions are not recorded by this prototype. Production recording must capture accepted operations as specified in [replay.md](../../docs/design/replay.md).
- Multiple notes retain independent working text, pointer strokes and checkpoint arrays in memory. Sample scene layouts are shared illustrations. Layer visibility/lock are study-wide view state, not a finished per-page persistence model.
- Restore demonstrates appending a note checkpoint and retaining old versions. It does not exercise dependency archives, crash consistency, conflicts, branches or aggregate restore. The document-scope button explains the larger scope without pretending to implement it.
- Selection is a neutral pointer mode; object transform, erasing, undo, and text formatting controls are not implemented. Text edits use the named contenteditable card. The fitted page scales down in narrow windows; production zoom and pen/touch usability remain design work.
- Reload resets everything. No data leaves the browser and no user document is written.

## Design grounding

Reviewed repository screenshots: [Markdown with AI](../../docs/assets/readme/markdown-ai.webp), [Docs with AI](../../docs/assets/readme/docs-ai.webp), and [suite overview](../../docs/assets/readme/hero.webp). The study retains the suite tab strip, command ribbon, left agent pane, flat borders, shared semantic chrome tokens, and bottom document status. Teal is a proposed notebook-only accent. Authored page colors remain unchanged across themes.

Source inspection: `packages/ui/src/tokens.css`, `apps/markdown/src/renderer/styles.css`, and CodeGraph's `Ribbon` definitions in Markdown, Docs, Slides, HTML and Sheets. `codegraph status` reported the 2,245-file index up to date on 2026-09-21. No production component was copied or modified.

Contracts: [notebook](../../docs/design/notebook-contract.md), [document manager](../../docs/design/document-manager.md), [extension mechanism](../../docs/design/extension-mechanism.md), [data architecture](../../docs/design/data-architecture.md), [feature parity](../../docs/design/feature-parity.md), [editor adaptation](../../docs/design/editor-adaptation.md), and [recorded replay](../../docs/design/replay.md). [design-spec.jsonc](design-spec.jsonc) records layout, platform constraints, state distinctions and acceptance criteria. [Claude design request](../../docs/design/claude-ui-design-request.md) is ready to paste with the screenshots; it has not been sent externally.

## Verification

Chromium via `agent-browser`, 2026-09-21. `node --check app.js` passed. Eighteen browser interaction checks passed: navigation, per-note text retention, visibility preservation, lock state, explicit recording, read-only replay, timed progress, pause, speed, external gap/transition, preserved live edits, version preview, restore-as-new, blank note and theme switching. The [check script](verify-browser.js) exercises the rendered UI. A separate [CDP pointer check](verify-pointer.mjs) delivered a real browser pointer stroke with seven samples and confirmed locked input adds no stroke. No browser page errors were reported. These checks cover the study, not production app behavior.

To repeat on Windows PowerShell from the repository root:

```powershell
agent-browser --session officebay-study --allow-file-access open "file:///$((Get-Location).Path.Replace('\','/'))/prototypes/notebook-ui/index.html"
agent-browser --session officebay-study set viewport 1600 1000
$studyScript = Get-Content -Raw prototypes/notebook-ui/verify-browser.js
$studyEncoded = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($studyScript))
agent-browser --session officebay-study eval -b $studyEncoded
$studyCdp = agent-browser --session officebay-study get cdp-url
node prototypes/notebook-ui/verify-pointer.mjs $studyCdp
```

The installed CLI does not implement `skills get core`; its local help supplied supported commands. Its separate `mouse move`/`mouse down` calls produced a pointer at `(0,0)` during this run, so the pointer check uses CDP with explicit coordinates. No prototype code was weakened to accommodate that tooling behavior.

Visually inspected evidence:

- [Desktop writing, 1600 × 1000](desktop-writing.png)
- [Desktop replay gap, 1600 × 1000](desktop-replay-gap.png)
- [Narrow replay, 1000 × 820](narrow-replay.png)
- [Version preview, 1600 × 1000](desktop-version-preview.png)
- [Blank note, 1000 × 820](narrow-new-note.png)
- [Dark chrome, 1600 × 1000](desktop-dark.png)

The narrow layout automatically hides agent and inspector panes; their ribbon buttons open dismissible overlays. Below 760px the note list also becomes an overlay. Controls use native buttons/select/range, named regions, focus outlines, keyboard focus and disabled edit actions during preview. This is a design check, not a full accessibility audit.
