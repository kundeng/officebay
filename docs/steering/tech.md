# OfficeBay technical policy

## Ownership

| Responsibility | Owner |
|---|---|
| Existing Office/Markdown/PDF/HTML editing | Existing GenOffice apps and format packages |
| Contribution lifecycle and attachment points | OfficeBay extension registry and bounded shell bridge |
| Managed document identity/open/save/close | Document manager with per-type adapters |
| Note-document sections and organized notes | New notebook contribution and its catalog |
| Page codec, canvas/layer/placement/mark semantics | One versioned MDLayers core |
| Rendering and pointer input | Reusable browser components plus host adapters |
| Filesystem and native integration | Host persistence/IPC adapters |
| AI loop and providers | Existing agent-core and ai-provider; notebook AgentSkill |
| Projects and chat | Existing project-store |
| Notebook revisions | Shared revision contract with host persistence, separate from chat and undo |
| Import/export/conversion | Existing format engines where applicable; explicit notebook adapters |

## Integration rules

Inventory the complete extension surface before changing it. Current shell routing/tab types are explicit and require a reviewed one-time bridge. After that bridge, a new contribution should require no legacy-editor edits. Validate this using a demonstration type, command and mark kind.

Notebook feature work belongs in new packages/contributions. Do not extend or repurpose the existing Markdown editor. White-label/provider work may require separately enumerated mechanical identity and caller changes; regression tests protect existing features.

Register commands, codecs, mark kinds, tools, exporters and document types through typed contracts. Keep dependency ordering, activation failures, duplicate resolution and disposal explicit. UI and AI share validation, state guards and persistence boundaries.

Pure MDLayers codecs/models have no host or DOM dependencies. Keep rendering/pointer utilities in a separate reusable layer. Consume pinned packages rather than sibling-directory runtime imports or copied implementations.

## State and delivery

Current files and sidecars are authored truth. Search/thumbnails are derived. History uses immutable snapshots with explicit dependency capture and conflict handling. File synchronization is not a distributed transaction. Store portable note-document metadata in non-dot-prefixed paths.

Use existing provider configuration and secret handling; no notebook-specific credential store. Build configuration is devtime, identity/update policy deploy-time, and user/history preferences runtime with named owners.

Use CodeGraph for symbols/callers and exact searches for literals. Measure baseline behavior and format round trips in real hosts. A package import or passing unit test does not prove full application parity. Upstream attribution and the snapshot-rebase strategy remain part of fork maintenance.
