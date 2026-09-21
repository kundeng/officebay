# Claude UI design request

Status: prepared for the owner to paste into Claude with repository screenshots. No external message has been sent. The linked prototype is an interaction study; it does not implement the production notebook.

## Attach these images

Attach existing GenOffice [Markdown](../assets/readme/markdown-ai.webp) and [Docs](../assets/readme/docs-ai.webp) screenshots first. Then attach the OfficeBay study's [writing view](../../prototypes/notebook-ui/desktop-writing.png), [replay gap](../../prototypes/notebook-ui/desktop-replay-gap.png), [version preview](../../prototypes/notebook-ui/desktop-version-preview.png), and [narrow window](../../prototypes/notebook-ui/narrow-replay.png). The [blank note](../../prototypes/notebook-ui/narrow-new-note.png) and [dark chrome](../../prototypes/notebook-ui/desktop-dark.png) are additional states. Use these repository images rather than older OneDrive copies.

## Paste-ready request

Please design the new **OfficeBay note-document workspace**, extending the attached GenOffice UI. Treat this as an office editing application. Preserve its recognizable tabs, ribbon, shared chrome, agent panel and document status bar. Avoid turning it into a generic dashboard or marketing site.

OfficeBay keeps its existing Markdown, Docs, Sheets, Slides, PDF and HTML editors. Add a separate note-document type: one document contains ordered sections, each with multiple notes, and each note owns an Excalidraw-based page. The new notebook must support the existing suite's capabilities through native features or explicit integration with retained editors; this request does not authorize dropping requirements or replacing existing editors.

The canvas should comfortably mix freehand ink, shapes, editable rich text, Markdown references, PDF/image placements and Office reference cards. Show the active canvas/layer input target, layer order, visibility and locks. Marks attach to their source canvas; placement and source identity are distinct. Include attached, stale and orphaned reference-mark states. Preserve original source editing through an explicit open-in-editor/return workflow.

Use the supplied prototype as a reviewable first pass, not a fixed visual answer. It puts the agent at the left, sections/notes next to the canvas, Layers/Versions on the right, and an optional replay tray below the page. Improve density, page space, command placement and state clarity while retaining suite conventions. Teal is a proposed notebook accent; use the existing semantic chrome tokens for light/dark/system themes. Authored document colors must not change with UI theme.

**Replay and versions are distinct experiences.** Versions are immutable note or whole-document checkpoints; their scope must be explicit. Preview is read-only. Restore creates a new version and retains the prior current version; it does not rewind shared source documents silently.

Replay animates **captured timing**: explicit Record session, visible recording state, play/pause, restart, scrub, speed and elapsed time. Saved `.excalidraw.md` stays the ordinary final editable scene. Timing belongs to an adjacent synchronized track under `Notebook.history`, linked by stable page identity. Snapshot differences and Excalidraw points alone do not establish pen timing. External edits, snapshot-only intervals, interrupted capture and missing chunks need clear coverage/gap labels. Hold or jump between known states without fabricating drawing motion. Show which track/branch is selected; do not merge branches by wall-clock time. Keep playback read-only and offer restore only from verified checkpoints, not an arbitrary partial stroke. Returning to live must preserve the working page.

Agent assistance must use the inherited agent/provider/project owners and the same validated editing commands and locks as the UI. Show selected context, source references, proposed/applied work, tool progress, cancellation and failures. Separate chat/tool activity from durable versions and the timed replay track. The attached prototype's agent conversation and replay are clearly labeled samples.

Please produce:

1. A coherent screen composition for desktop writing, new/empty note, rich text/reference editing, layer inspection, agent assistance, version preview and recorded replay.
2. A 1000px-wide window variant with sensible pane collapse/overlay behavior, plus keyboard focus and pen/touch target guidance. Preserve readable replay controls and a clear return-to-live action.
3. Detailed replay states: recording, paused/playing, scrubbing inside a stroke, unknown external transition, snapshot-only history, incomplete track and branch selection. Specify copy and enabled/disabled actions.
4. A component/state map and implementation-ready handoff aligned with `prototypes/notebook-ui/design-spec.jsonc` and the current `specs/` contracts. Name uncertain choices and unresolved parity requirements explicitly.
5. A short critique of the supplied study: what to retain, what to change and why. Screenshots should show concrete states, not only a palette or component catalog.

Production implementation is a new `apps/notebook` contribution consuming a shared MDLayers core and host adapters. MDLayers is currently design and measurement work, **not an implemented dependency**. Reuse/adaptation must study and measure the reference editors, then implement and prove shared behavior. Keep Electron filesystem and validated IPC outside the pure core. No changes to existing editor implementations are requested by this UI study.

Read the repository contracts before proposing implementation: [notebook contract](notebook-contract.md), [document manager](document-manager.md), [extension mechanism](extension-mechanism.md), [data architecture](data-architecture.md), [feature parity](feature-parity.md), [editor adaptation](editor-adaptation.md), and [recorded replay](replay.md). The [prototype README](../../prototypes/notebook-ui/README.md) identifies simulated behavior and verification limits.

## Review boundary

The study exercises UI states with HTML/SVG and in-memory data. It does not settle `.excalidraw.md` interoperability, full feature parity, production replay storage, deterministic event reduction, source restoration, native pen latency, or cross-host sync. Those remain owned by the canonical contracts and sprint acceptance experiments.
