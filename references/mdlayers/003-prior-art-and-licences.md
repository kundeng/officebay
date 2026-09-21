# mdlayers — prior art and licences

**Status:** evidence. §1–§5 checked 2026-09-18 (annotation across two editors); §6–§7 checked
2026-09-20 (drawing and canvas in VS Code). Licences are read from each repo's LICENSE file.

**Question for §1–§5:** does anything other than Sidemark ship *both* an Obsidian plugin and a VS Code
extension *and* keep annotations out of the markdown file?

**Answer: no.** Sidemark/MRSF is the only system found that meets all three. Everything else drops
one — cross-editor but writing marks into the document, or sidecar but bound to one host.

Searched 2026-09-18 across the Obsidian community plugin directory, obsidianstats.com, the VS Code
marketplace, GitHub, and the vendors' own sites. A negative result over that surface, not a proof.

---

## 1. Sidemark is two projects, and the split is the interesting part

| part | repo | author | licence |
|---|---|---|---|
| MRSF — the format | [wictorwilen/MRSF](https://github.com/wictorwilen/MRSF) | Wictor Wilén | MIT |
| Obsidian plugin | [coddingtonbear/obsidian-sidemark](https://github.com/coddingtonbear/obsidian-sidemark) | Adam Coddington | MIT |

The Obsidian plugin is written by someone other than the spec author, against a published schema. So
MRSF is a markdown-annotation sidecar format that a third party has implemented from the spec alone
— the property mdlayers needs from its own format, and the one no other candidate here has. Checked via the GitHub API on 2026-09-18 — MRSF 30 stars, last push 2026-08-18; the plugin
1 star, last push 2026-09-18.

Other implementations listed on [sidemark.org](https://sidemark.org/) and in the spec README: a VS
Code extension, Monaco, Tiptap (experimental), Milkdown + Crepe, markdown-it / Marked / Marp /
rehype renderers, `@mrsf/cli` (npm), `mrsf` (PyPI), and `@mrsf/mcp`.

## 2. The format

One sidecar per note, `Note.md.review.yaml`, beside the file.

```yaml
mrsf_version: "1.0"
document: Note.md
comments:
  - id: …
    author: …
    timestamp: …            # ISO 8601
    text: …
    resolved: false
    type: question          # optional
    line: 12                # anchor: line is primary
    end_line: 14            # optional
    start_column: 4         # optional
    end_column: 30          # optional
    selected_text: "…"      # fallback match for re-anchoring
```

Comments are flat — no nested reply model in the spec. Sidemark's own additions (`x_prefix`,
`x_suffix`, `x_suggestion`) are `x_`-prefixed extension fields, and **the spec requires an
implementation to preserve unknown minor versions and unknown `x_` fields verbatim through a read
and a write.**

That is the same guarantee 002 §A7 measured in Handwriting's sidecars, arrived at independently and
written into a published spec rather than into one codebase's migration function. Two unrelated
sidecar systems both concluded that unknown-field preservation is what makes a sidecar extensible by
a second tool. Treat it as a requirement of the mdlayers codec, not as a nicety.

**Anchoring** is line/column plus `selected_text`, with the Obsidian plugin adding ±20 characters of
context each side and describing the model as W3C `TextQuoteSelector`-shaped. Re-anchoring is
automatic on edit, with git diffs used where available, and manual re-anchoring is exposed in the UI
(select new text → *Re-anchor to selection*) for when it fails. That last item is a design
admission: automatic resolution is expected to miss, and the fallback is a human, not a heuristic.

## 3. The field, and where each candidate falls short

| tool | Obsidian | VS Code | storage |
|---|---|---|---|
| **Sidemark / MRSF** | ✅ | ✅ | `.md.review.yaml` sidecar, open spec |
| [Side Comments](https://community.obsidian.md/plugins/side-comments) | ✅ | — | one JSON sidecar per note, source untouched |
| [obsidian-annotation-marker](https://github.com/uuq007/obsidian-annotation-marker) | ✅ | — | separate annotation files |
| [Commentary](https://github.com/jaredhughes/commentary) | — | ✅ (+Cursor, Windsurf) | VS Code workspace state, or a git-tracked `.comments/` folder |
| [Code Notes Sidecar](https://marketplace.visualstudio.com/items?itemName=Misty02600.code-notes-sidecar), [code-context-notes](https://github.com/jnahian/code-context-notes) | — | ✅ | `.code-notes/`, range-based |
| CriticMarkup — [Commentator](https://github.com/Fevol/obsidian-criticmarkup) + [vscode-criticmarkup](https://github.com/DJRHails/vscode-criticmarkup) | ✅ | ✅ | **in the `.md`** — syntax in the document |
| [Relay Comments](https://community.obsidian.md/plugins/relay-comments) | ✅ | — | in the `.md`, CriticMarkup |
| [Markco](https://github.com/babonet/Markco) | — | ✅ | in the `.md`, JSON inside a trailing HTML comment |
| [obsidian-annotator](https://github.com/elias-sundqvist/obsidian-annotator), hypothes.is syncers | ✅ | — | annotations land *in* markdown notes |

CriticMarkup is the only other thing spanning both editors, and it spans them by putting the marks in
the document. It is the design mdlayers rejects, and it has more implementations than anything else
in the table: the option that interoperates across editors today is the intrusive one.

Two anchoring models appear in the non-intrusive single-host tools, both relevant to M1. Commentary falls back in three layers: exact quote plus 100 characters of context → character
offset → nearest heading plus fuzzy search. `code-context-notes` claims notes that follow code
through moves, renames and refactors. Neither is cross-host.

## 4. Dual-host precedent outside annotation

Excalidraw and tldraw each ship an Obsidian plugin and a VS Code extension, with drawings in their
own files. No prior art was found for geometric marks anchored into a third party's `.md` across
two hosts, which is the note side of mdlayers (001 §2). For the page side, the Excalidraw pair is
the precedent and §6 measures how far it goes: the two hosts share a scene schema and do not share
a file format.

## 5. What this settles for mdlayers

**MRSF already owns the text-comment mark kind.** It has a spec, a preservation rule, a permissive
licence, and implementations in more than one host — including one written by a third party. Three
consequences:

1. **Adopt it as a mark kind rather than inventing a parallel comment format.** `md.comment` reading
   and writing `*.md.review.yaml` costs one codec and buys the VS Code extension, the CLI, and the
   MCP server as interop for free. Inventing a second YAML comment sidecar buys nothing.
2. **Unknown-field preservation is a requirement of the sidecar codec**, from two independent
   sources (002 §A7 and MRSF's spec text), and it is what lets a third-party mark kind survive a
   round-trip through a host that does not know it.
3. **The gap is geometric marks.** MRSF anchors to line/column/quote and has no coordinate model, no
   canvas identity, and no layer record. `md.ink` and the `MarkKind` registry are unclaimed, and
   a layer over a document is the open ground.

Licence-wise this is the opposite of Handwriting (002 §A8, CC BY-NC-ND): MRSF and the Obsidian plugin
are both MIT, so the format may be implemented and the code may be read and reused with attribution.

## 6. Drawing and canvas in VS Code

The owner's constraint: plugins for the two editors in use, not another application. Web-sourced
on 2026-09-20; versions from `package.json`, the GitHub API and the Marketplace gallery API.
Nothing in this section was tested by hand. The full note, with the candidates not worth a row
here, is `~/Projects/cloud_backup/docs/history/research-vscode-canvas-and-excalidraw-options-2026-09-20.md`.

| candidate | licence | state | files | bearing on mdlayers |
|---|---|---|---|---|
| [excalidraw/excalidraw](https://github.com/excalidraw/excalidraw) (the library) | MIT | v0.18.1, active | `.excalidraw` JSON | the page renderer in VS Code; React peer dependency |
| [excalidraw/excalidraw-vscode](https://github.com/excalidraw/excalidraw-vscode) (`pomdtr.excalidraw-editor` 3.9.3) | MIT | low-rate maintenance | custom editor for `*.excalidraw`, `.excalidraw.json`, `.excalidraw.svg`, `.excalidraw.png`; **not** `.excalidraw.md` (issue #98 closed as not planned) | the base to fork; the fork stays a fork |
| [lancehunt/excalidraw-unified-vscode](https://github.com/lancehunt/excalidraw-unified-vscode) | MIT | one feature commit, not on the Marketplace | adds `*.excalidraw.md` with a 100-line adapter | reference only: its `serialize()` drops `## Element Links` and `## Embedded Files` on save |
| [zsviczian/obsidian-excalidraw-plugin](https://github.com/zsviczian/obsidian-excalidraw-plugin) | AGPL-3.0 (LICENSE added 2026-05-13; `package.json` still says MIT) | very active | `.excalidraw.md`; engine `@zsviczian/excalidraw`, an MIT fork of the library | the Obsidian host for pages, as it is; its format is implemented, its code is not copied |
| [JSON Canvas](https://jsoncanvas.org/spec/1.0/) (`obsidianmd/jsoncanvas`) | MIT | spec 1.0 | `.canvas` | not the page format: Obsidian Canvas has no ink and is not a Markdown container. Its node model (file, text, link, group) matches 001 §3's objects |
| [Infinite Canvas](https://github.com/lout33/infinite_canvas_vscode), [Skena](https://github.com/dmarienko/skena) | MIT | stale; active but heavy | `.canvas` custom editors for VS Code | open existing `.canvas` files today; Skena is a reference for a canvas custom editor on `@xyflow/react` |
| [tldraw](https://github.com/tldraw/tldraw) | its own licence | active | `.tldr` | ruled out: "Not to use the Software in Production Environments" without a key, key enforcement may not be disabled, watermark |
| [hediet/vscode-drawio](https://github.com/hediet/vscode-drawio) | GPL-3.0 | active | `.drawio` | different format; a fork stays GPL |
| BlockSuite (in [AFFiNE](https://github.com/toeverything/AFFiNE) `blocksuite/`) | MIT for `blocksuite/`; AFFiNE's backend is under its Enterprise licence | active | a Yjs document, not Markdown | architecture reference for joining documents with an edgeless canvas |
| [perfect-freehand](https://github.com/steveruizok/perfect-freehand) | MIT | v1.2.3 | — | pressure points → stroke outline; one pure function, used for `md.ink` geometry |
| [Milkdown](https://github.com/Milkdown/milkdown) | MIT | v7.22.1 | Markdown stays the source | candidate for the Markdown embeddable renderer, if WYSIWYG is wanted there |

Obsidian plugins do not run in VS Code: `obsidianmd/obsidian-api` is type definitions only and the
implementation is inside the closed app. The shims found are test mocks.

## 7. Licences, in one place

| source | licence | consequence |
|---|---|---|
| Handwriting | CC BY-NC-ND 4.0, © 2026 Alan Liu (002 §A8) | no derivatives: its format is implemented, its source is not copied, and it cannot be forked |
| obsidian-excalidraw-plugin | AGPL-3.0 | a distributed derivative would have to be AGPL: read, do not copy |
| Excalidraw library and its VS Code extension, `@zsviczian/excalidraw`, MRSF, obsidian-sidemark, JSON Canvas, perfect-freehand, Milkdown | MIT | use, fork, reuse with attribution |
| tldraw | custom | not usable without a licence key |

## Sources

Checked 2026-09-18: [sidemark.org](https://sidemark.org/) ·
[sidemark.org/vscode](https://sidemark.org/vscode/) ·
[wictorwilen/MRSF](https://github.com/wictorwilen/MRSF) ·
[coddingtonbear/obsidian-sidemark](https://github.com/coddingtonbear/obsidian-sidemark) ·
plus the per-tool links in §3.
