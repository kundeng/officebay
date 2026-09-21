# OfficeBay agent instructions

specs_root: specs/

OfficeBay is the fork at `kundeng/officebay`; upstream is `genspark-ai/genoffice`. Use `officebay-win` on Windows, branch `officebay/main`. Upstream's `CLAUDE.md` remains applicable and is not edited for fork-specific instructions.

## Direction

Preserve the existing Markdown, Docs, Sheets, Slides, PDF and HTML editor implementations. Add a separate note-document type containing multiple organized notes. Pages use Excalidraw and one shared MDLayers core. Build the extension mechanism and document manager so subsequent features attach through contributions.

White-labeling and removal of the original hosted dependency are separate from notebook feature changes. Enumerate their necessary existing-app edits and protect inherited behavior with regression tests. Keep required provenance and licenses.

## Required reading and process

- Load `house-rules`, `work-discipline` and `spec-driven-dev`; use `agentic-system-dev` when planning or changing agent/tool behavior.
- Read `docs/README.md`, current `docs/steering/` and the design anchors named by the selected sprint.
- Resolve the next unit from `specs/README.md`: the ACTIVE sprint, otherwise the first open DRAFT. Do not claim implementation from a plan.
- Use CodeGraph for source structure, callers and impact. This clone has a local `.codegraph/` index; check freshness before relying on it. Use exact search for literals and gaps.
- Keep one ACTIVE sprint, with requirements, design, tasks and executable acceptance evidence. Preserve every requested parity capability unless the owner explicitly changes it.
- Keep current docs and sprint plans clean. The owner uses Git for superseded plans; do not keep parallel historical plans or archive checklists in current docs.
- Scratch/deletion staging directories are not evidence dependencies. Keep required references in this repository or cite a stable source and pinned version.

## Fork boundaries

Implement notebook features in new contributions/packages and the shared MDLayers core. The shell currently has hardcoded registration; a small, reviewed one-time bridge is allowed by the extension plan. Later contributions must not require repeated legacy-editor changes.

Upstream publishes snapshot commits. Keep the fork diff localized for snapshot rebases. Check `ee/` and licensing boundaries on every rebase. New runtime components must reuse existing agent/provider/project owners before adding another implementation.

## Where truth lives

- `docs/steering/`: product, technical ownership and pillar health.
- `docs/design/`: current notebook, extension, document-manager, data and parity contracts.
- `docs/research/onenote-revisions.md`: revision-store explanation and design implications.
- `docs/research/`: measured evidence; older investigations do not override current design.
- `references/`: pinned outside provenance/design evidence.
- `specs/`: the current ordered sprint plans. No dot-prefixed spec directory.
