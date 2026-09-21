# Notebook contract

## Mental Model & Invariants

The owner has decided:

- OfficeBay retains GenOffice's existing Markdown, Docs, Sheets, Slides, PDF and HTML document types and editing behavior.
- Add a separate OneNote-like note-document type inside the suite. Each note document contains multiple organized notes grouped into sections; each note has an Excalidraw-based page. Do not implement it by changing the Markdown editor or converting existing user documents.
- Its pages use the Excalidraw-based MDLayers model. Native `.one` compatibility is not the chosen storage format.
- Deliver GenOffice feature parity for the new document type and the capabilities described by MDLayers. Shared-core reuse must make the same system implementable in VS Code and Obsidian.
- White-label the suite and remove the original hosted-service dependency. Required provenance stays in license/reference records.
- Research revision support without reopening the Excalidraw decision.

## Change boundary

Notebook code belongs in a new `apps/notebook` contribution and the shared MDLayers package. Build the extension mechanism and document manager first so later additions register through these seams. Shell registration, build wiring, document-type declarations and notebook translation keys are narrow integration edits. Existing editor implementations and existing user documents are not notebook migration targets.

Branding/provider removal is a separate concern: mechanical identity changes and removal of hosted-service callers may touch existing app files, with an enumerated diff and regression checks. This does not authorize changing those editors' document models or feature behavior. If replacement of a hosted capability would require such a change, raise that specific conflict during planning instead of silently removing the capability.

Opening plain `.md` retains its existing route. `.excalidraw.md` recognition precedes the generic Markdown suffix. Existing `.excalidraw.md` files gain no forced migration merely by being opened. The note-document catalog owns section/note organization; the document manager owns aggregate lifecycle. Each note page remains independently readable by compatible hosts. `document-manager.md` defines these distinct owners.

## Parity means observable behavior

The new type receives document lifecycle, editing, history, AI, project integration, export/print, theme, language, accessibility, and safety behavior appropriate to its document model. GenOffice's format-specific operations remain accessible through the existing editors and explicit notebook integration; flattening a workbook into a screenshot does not count as retaining its editing capability.

No feature may be marked equivalent because a dependency exists. Enumerate user commands and failure cases. Map each to a notebook-native implementation, a documented integration with the retained editor, or an unresolved requirement. Owner agreement is required before classifying a requirement as unnecessary. An unresolved row blocks a full-parity claim.

## Shared ownership

MDLayers owns the reusable container, canvas/layer/placement models, sidecar codecs, mark-kind registry and deterministic operations. Its source lives in the MDLayers repository and is consumed at a pinned package version by all hosts. Do not create an OfficeBay-only copy of this core.

Pure model and codec code has no DOM, Electron, filesystem, VS Code or Obsidian imports. Rendering and pointer capture belong in a separate reusable browser layer where needed. Host adapters own file access, dialogs, lifecycle and native editor integration.

Marks belong to the canvas they describe; containers store placements. Hidden layers remain persisted. Unknown fields survive edits. Referenced notes, images and PDF pages retain their identities. Third-party mark kinds have visible fallback behavior rather than silent deletion.
