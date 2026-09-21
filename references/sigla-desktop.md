# Sigla — vendored reference

| field | value |
|---|---|
| Upstream | `https://github.com/z18520736823-coder/sigla-desktop.git` |
| Author | Mr. ZhouPeng |
| Licence | **Proprietary, all rights reserved.** "No permission is granted to copy, modify…" |
| Source code | **Private.** The public repo is the product page, docs and release notes only |
| Working clone | `~/Projects/_refs/sigla-desktop` (depth 50, outside this repo) |
| Pinned commit | `da40485bdf86d12fb0fa32994cc59f0e4206c8d1` |
| Commit date | 2026-07-23 00:41:36 +0800 |
| Subject | `docs: complete public preview launch checklist` |
| Size at clone | 43 files, 1 tag (`v1.0.0-preview.1`), macOS 11+ only |
| Recorded | 2026-09-17 |

## Why it is here

It is the closest shipped product to one of officebay's target layers — human review of markdown,
with annotations anchored to the source, while the original files stay read-only — and its stated
anchor policy is the third valid answer alongside Handwriting's hash remap.

The contribution is one sentence from `README.md`:

> Annotations live in Sigla's private local database. When the document changes externally, Sigla
> rechecks the anchor and **asks for confirmation when the match is uncertain**.

Also on point: annotations are compiled into an editing brief with exact locations, requested
changes and acceptance criteria, to hand back to an agent. That is the AI-Q&A layer with a defined
output shape rather than a chat transcript.

## What this reference is NOT

**No mechanism here is verified.** The source is private, so everything above is a product claim
from marketing copy, not a read of an implementation. It is recorded at that strength deliberately
and must not be cited as evidence of how anything works. Where this project needs a verified
anchoring mechanism, [handwriting.md](handwriting.md) and [unity-layers.md](unity-layers.md) are
the references that carry one.

Nothing is vendored from this repo: it is proprietary, and there is no source to vendor.

## Verification

```
git -C ~/Projects/_refs/sigla-desktop log -1 --format=%H    # da40485bdf86...
git -C ~/Projects/_refs/sigla-desktop ls-files | wc -l      # 43
head -3 ~/Projects/_refs/sigla-desktop/LICENSE              # proprietary
```

## What was read

`README.md`, `LICENSE`, `docs/` (product page assets and screenshots only).

Findings are in
[docs/research/2026-09-17-markdown-block-model-and-layer-anchoring.md](../docs/research/2026-09-17-markdown-block-model-and-layer-anchoring.md).
