# OfficeBay documentation

## Current direction

- [Product](steering/product.md), [technical ownership](steering/tech.md), [pillars](steering/pillars.md).
- [Sprint queue](../specs/README.md): current order and next unit.

## Design contracts

- [Notebook contract](design/notebook-contract.md): separate note documents; existing editors preserved.
- [Extension mechanism](design/extension-mechanism.md): full contribution map and the bounded shell bridge.
- [Document manager](design/document-manager.md): managed documents, sections and organized notes.
- [Data architecture](design/data-architecture.md): authoritative state, derived state, revisions and failure recovery.
- [Feature parity](design/feature-parity.md): GenOffice and MDLayers capability families and acceptance ownership.

These are implementation proposals where labeled; the product direction is agreed. Baseline evidence must resolve open technical choices before the corresponding sprint activates.

## Evidence

- [OneNote revisions](research/onenote-revisions.md): source-linked explanation and Excalidraw-compatible history design.
- [MDLayers reference](../references/mdlayers/README.md): pinned design and measurements; one shared implementation is planned.
- [Fork provenance](../references/genoffice.md).
- Other files in `research/` retain useful source measurements, not current sprint instructions.

Keep one current plan per topic. Git stores superseded versions. Do not create a parallel handoff/history hierarchy for ordinary planning changes.
