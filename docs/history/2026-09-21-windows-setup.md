# Windows recovery and OfficeBay handoff

## Current state

- Windows working copy: `officebay-win`, branch `officebay/main`.
- Origin: `https://github.com/kundeng/officebay.git` (renamed from `kundeng/genoffice` with owner approval).
- Upstream: `https://github.com/genspark-ai/genoffice.git`. Upstream refs were fetched; no rebase was performed.
- Fork starting commit: `bfe2b539ba20afa7262782f0935344d2e4d16c7b`.
- Specs live in `specs/`; the locally moved specs and unpushed research were carried from `genoffice`.
- Original `genoffice` branch reference repaired without resetting its index or working files. Its pre-existing staged changes remain there.
- MDLayers Git is healthy and current. Chat-sync was fast-forwarded by one `.gitignore` commit; its two local Python edits remain.
- Bayeslearner history and tracked settings came from `kundeng/obsidian-vaults`. All 32 plugin entrypoints were recovered from releases matching origin's manifests. OneDrive was not used.
- Windows-incompatible vault filenames and absent Mac symlinks are locally marked skip-worktree, preserving their tracked entries. The path list and configuration backups live outside sync in `C:/Users/kunde/git-recovery/`. Existing untracked `90-notion-import/.gitignore` was preserved.

## Agreed priority

OfficeBay's first product change is white-labeling and removal of the original hosted-service dependency. Then add a separate OneNote-like notebook surface sharing the MDLayers model and core with VS Code and Obsidian. See [the format decision](../design/2026-09-21-notebook-format.md).

Existing `PLAN-2026-09-13.md` section C maps the removal, including authentication, cloud projects, slide generation, provider fallback, analytics, update feeds, packaging, translations and package scope. Preserve upstream provenance and license notices in their designated records while removing provider identity from product surfaces.

## Next implementation unit

Refine the still-DRAFT baseline sprint around white-label regression evidence and the provider-removal work, then execute the removal as one verified unit. Inspect current callers before applying the older surface counts. Prove inherited document open/edit/save and bring-your-own-key behavior, plus failure on an incomplete provider configuration without falling back to the original service. Build and launch on Windows before claiming completion.

The notebook work follows the MDLayers container round-trip proof. There is no shared MDLayers code to reuse yet; the reusable core must be implemented once. No product code, branding removal, native OneNote support, or application build was completed during this recovery.
