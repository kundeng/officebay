# OfficeBay product

OfficeBay retains GenOffice's office suite and adds a separate OneNote-like note-document type. Existing Markdown, Docs, Sheets, Slides, PDF and HTML editors keep their document models and behavior.

A note document contains multiple organized notes, grouped into sections. Each note has an Excalidraw-based page with text, media, references, marks and layers. The document manager coordinates the aggregate; opening one page is not equivalent to opening the whole note document.

The planned reusable document/page/mark core is MDLayers; it has not been implemented. Its implementation follows the [source-adaptation map](../design/editor-adaptation.md). OfficeBay, VS Code and Obsidian consume one implementation with host-specific adapters. Their authored file contracts, identities and coordinate semantics agree.

## Product requirements

- Map and retain the existing suite's capabilities, with executed baseline evidence.
- Provide a full extension mechanism so new document types and capabilities attach through registered contributions rather than repeated edits to legacy editors.
- Provide a document manager for document lifecycle, stable identities and organized note documents.
- Ship as OfficeBay, with independent providers and no original hosted-service fallback.
- Give the new note-document type GenOffice feature parity and MDLayers' canvas, sidecar, layer, anchoring and extension capabilities. Every capability needs a testable disposition; none is silently dropped.
- Support durable revisions and animated authoring replay. [Timed tracks](../design/replay.md) preserve observed actions alongside snapshots; external edits show coverage gaps. Excalidraw remains the page format.
- Integrate notebook AI through the inherited agent/provider/project machinery, with source-linked, verified edits and recoverable state.

Existing user files are not migrated or rewritten merely by opening them in OfficeBay. Required upstream attribution remains in license/reference records. Native OneNote file compatibility and live collaborative merging are separate capabilities, not implied by the notebook name.
