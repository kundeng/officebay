# MDLayers reference

Source: https://github.com/kundeng/mdlayers
Commit: `c0a367fa7b106f8247a9401a20eb9bd8f6ae4b71`
Copied: 2026-09-21

These are the design and measurements used for OfficeBay's notebook planning. The source repository currently contains documentation, not a reusable implementation. Build the host-independent core there and consume one versioned package from OfficeBay, VS Code, and Obsidian. Do not copy a second implementation into each host.

These pinned source documents describe their original scope. OfficeBay uses the current contracts under `docs/design/`: its host is a separate note-document contribution, not an extension of its existing Markdown editor. Historical external paths in the source excerpts are not runtime or planning dependencies.
