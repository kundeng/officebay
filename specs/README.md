# Sprint queue

The agreed direction is a separate note document containing multiple organized notes, with Excalidraw pages and a shared MDLayers core. Existing GenOffice editors retain their behavior. Current plans replace obsolete plans; Git carries prior versions.

| Sprint | State | Outcome |
|---|---|---|
| [01-fork-foundation](01-fork-foundation/spec.md) | CLOSED / SHIPPED | Map existing and planned owners; fork provenance |
| [02-notebook-baseline](02-notebook-baseline/spec.md) | DRAFT | Baseline inherited behavior and enumerate full parity |
| [03-extension-mechanism](03-extension-mechanism/spec.md) | DRAFT | Complete extension map, contribution registry and bounded bridge |
| [04-document-manager](04-document-manager/spec.md) | DRAFT | Document lifecycle and note documents containing organized notes |
| [05-independent-officebay](05-independent-officebay/spec.md) | DRAFT | White-label and replace hosted-service dependencies |
| [06-mdlayers-container](06-mdlayers-container/spec.md) | DRAFT | Shared core codec and real Obsidian round-trip proof |
| [07-notebook-document](07-notebook-document/spec.md) | DRAFT | Notebook editor through document-manager contributions |
| [08-notebook-layers](08-notebook-layers/spec.md) | DRAFT | MDLayers marks, sidecars, layers, anchoring and input |
| [09-notebook-revisions](09-notebook-revisions/spec.md) | DRAFT | Aggregate/note history, restore and conflict recovery |
| [10-notebook-agent](10-notebook-agent/spec.md) | DRAFT | AI parity through existing runtime and notebook tools |
| [11-notebook-host-parity](11-notebook-host-parity/spec.md) | DRAFT | VS Code/Obsidian reuse and complete release evidence |

Next unit: **02-notebook-baseline**. No implementation sprint is ACTIVE. Foundation is closed as a documentation deliverable, not a claim that new runtime code exists. The owner agrees with the direction and sequence; baseline runs and each sprint's technical readiness still precede implementation activation.

Dependencies run in this order. The extension bridge comes before document management; document management comes before the full note editor. White-label work remains a separate bounded diff. Full parity requires every row in [the capability inventory](../docs/design/feature-parity.md) to have evidence or an explicit owner-approved disposition.
