# OfficeBay notebook format

Status: recommended direction; compatibility proof remains to be executed.

## Objective

Add a OneNote-like notebook surface alongside the inherited office editors. Share its document, canvas, layer and placement implementation with VS Code and Obsidian through MDLayers. White-label OfficeBay and remove the original hosted-service dependencies first.

## Format choice

Use the MDLayers `.excalidraw.md` page container and plain Markdown notes with sidecars as the first implementation target. This matches the existing design and the requirement to open the same authored content across hosts.

Native OneNote is a different target: Microsoft specifies `.one` and `.onetoc2` as the OneNote revision-store format, not Office Open XML. Implementing that store would require its own reader, writer, and interoperability tests; it does not provide a reusable editor. Native OneNote import/export may be a later adapter if required. Do not describe the initial feature as native OneNote compatibility.

Sources checked 2026-09-21:

- [Microsoft MS-ONESTORE](https://learn.microsoft.com/en-us/openspecs/office_file_formats/ms-onestore/ae670cd2-4b38-4b24-82d1-87cfb2cc3725).
- [Excalidraw scene format](https://github.com/excalidraw/excalidraw/blob/master/dev-docs/docs/codebase/json-schema.mdx).
- [Pinned MDLayers design and measurements](../../references/mdlayers/README.md).

## Shared ownership

The proposed MDLayers core owns container parsing/writing, canvas identity, layer membership, placement transforms, and mark-kind registration. It imports no Electron, Obsidian, VS Code, DOM, or filesystem APIs. Host adapters own file access, lifecycle, UI, and rendering integration.

A note's marks remain in its own coordinates and sidecars. A page stores placements of referenced notes, images, and PDF pages. Moving or scaling an embed changes its placement rather than rewriting its marks. Page-level ink remains owned by the page.

MDLayers has no core code yet. The next implementation is its planned container codec, consumed by OfficeBay as a package. Read the Obsidian plugin for interoperability; do not copy its implementation into the core.

## Required proof before adoption

1. Parse and write both JSON and compressed-JSON containers; unchanged input returns identical bytes.
2. Preserve unknown scene properties, sections, frontmatter, embedded-file mappings, and links.
3. Round-trip layer tables and per-element metadata through Obsidian's real save path.
4. Render the same fixture through OfficeBay and a minimal VS Code host without changing stored coordinates.
5. Verify that placing one marked source twice shares its marks and keeps page-level strokes independent.

Failure of the round-trip proof requires a revised storage design before notebook implementation expands.
