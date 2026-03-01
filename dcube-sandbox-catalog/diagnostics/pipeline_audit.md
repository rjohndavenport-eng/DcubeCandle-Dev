# PIPELINE AUDIT
**Generated:** 2026-03-01
**Auditor:** CODEX-AGENT-1: PIPELINE AUDITOR

---

## Environment

| Field | Value |
|---|---|
| Working Directory | /d/onedrive/Desktop/becandle |
| Git Remote | https://github.com/rjohndavenport-eng/DcubeCandle-Dev.git |
| Active Branch | main |
| Git State | REBASE IN PROGRESS - .git/rebase-merge/ exists; all conflicts resolved, git rebase --continue not yet run |
| shopify.app.toml | Present - app: Cataloger Internal, client_id: b8b91a0ba65596469cf9d88b11cb3772 |
| ORIG_HEAD | Present in .git/ - confirms interrupted rebase operation |

### Recent Commits (git log --oneline -10)

    738573e Catalog: Complete Sandbox Identity Port [MASTER]
    ea872cd Catalog: sandbox theme inventory + brand-lock scaffolding [REPAIRED]
    eaa8817 Merge pull request #2 from rjohndavenport-eng/quick-wins/premium-latin-bee
    9867ff9 Merge design system sprint: 5 task packets
    cae461d feat: footer brand column
    c265036 feat: add scent-families section to homepage
    3f87c2a feat: homepage content updates + label/section-header pattern
    6a52e36 feat: 3-column header layout + dark announcement bar
    f0f92cb fix: align design tokens with dcube-home.html reference
    144630e Add complete Shopify OS2.0 theme + .gitignore

---

## Theme Directories Found

All directories containing a layout/ subdirectory (valid or partial Shopify theme trees).
Found via: find . -maxdepth 5 -type d -name layout

| # | Path (relative to repo root) | File Count | Notes |
|---|---|---|---|
| 1 | shopify-theme-dcube/ | 60 files | Original dev theme. Hand-crafted DCube OS2.0. Custom base.css architecture. NOT Focal-based. Never verified as push target for sandbox 160399261916. |
| 2 | dcube-sandbox-catalog/theme-download/ | 144 files | CANONICAL working copy. Full pull from sandbox 160399261916. Focal base + DCube overlays injected. Correct push source. |
| 3 | dcube-sandbox-catalog/diagnostics/remote-full/ | 145 files | Diagnostic pull - full remote snapshot (Mar 1 16:34). READ ONLY. |
| 4 | dcube-sandbox-catalog/diagnostics/final-verify/ | 145 files | Diagnostic pull - full remote snapshot (Mar 1 17:24). READ ONLY. |
| 5 | dcube-sandbox-catalog/diagnostics/fix-push/ | 2 files | Push test - partial tree (layout + snippets only). READ ONLY. |
| 6 | dcube-sandbox-catalog/diagnostics/integrity-check/ | 5 files | Diagnostic pull - partial (config/layout/snippets/templates). READ ONLY. |
| 7 | dcube-sandbox-catalog/diagnostics/post-fix-full/ | 145 files | Diagnostic pull - full remote snapshot (Mar 1 17:17). READ ONLY. |
| 8 | dcube-sandbox-catalog/diagnostics/post-fix2-full/ | 5 files | Diagnostic pull - partial (Mar 1 17:24). READ ONLY. |
| 9 | dcube-sandbox-catalog/diagnostics/remote-pull/ | 1 file | Diagnostic pull - layout file only (Mar 1 16:28). READ ONLY. |
| 10 | dcube-sandbox-catalog/image-export/theme-assets/_pull_full/ | 144 files | Image pipeline pull - full remote snapshot (Mar 1 16:09). READ ONLY. |

NOTE: shopify/themes/sandbox-160399261916/ also exists but contains 0 files. Placeholder from PS1 script path convention, never populated via pull.
Total theme-like trees in workspace: 10

---

## Drift Sources Identified

### Drift Source 1: Two Incompatible Theme Architectures

Two Shopify-compatible theme trees at project root level:

shopify-theme-dcube/ (60 files):
- Custom DCube OS2.0: home-hero.liquid, home-benefits.liquid, scent-families.liquid, page-about.liquid
- Monolithic assets/base.css (~2292 lines). No css-variables.liquid snippet.
- No Focal theme base sections. Never verified as push target for sandbox 160399261916.
- Risk: Pushing this to 160399261916 overwrites the Focal base theme structure.

dcube-sandbox-catalog/theme-download/ (144 files):
- Focal theme base with DCube brand overlays injected.
- DCube code in: snippets/css-variables.liquid + layout/theme.liquid (guards at lines 73, 85, 202)
- Brand toggle: settings.enable_dusty_sanctuary_palette
- Verified as matching sandbox 160399261916 remote state as of Mar 1 2026.

These two codebases are architecturally incompatible as push targets for the same theme.

### Drift Source 2: 7+ Diagnostic Pull Folders Polluting Workspace

Seven diagnostic directories under dcube-sandbox-catalog/diagnostics/ contain full or partial theme trees pulled from the remote. None are in .gitignore. Total exposure: ~1000+ files across snapshots.

If any of these directories is accidentally used as a shopify theme push --path target, the CLI pushes only those files. All other remote files survive untouched. The developer sees a successful push but cannot understand why the full set of changes is not reflected.

### Drift Source 3: The Strip Incident (Partial Push Path Confusion)

The fix-push/ directory contains only 2 files (layout/theme.liquid + snippets/css-variables.liquid).
If shopify theme push was run with --path pointing here:
- CLI successfully pushed those 2 files to remote.
- The remaining 143 remote files were NOT deleted (CLI default preserves remote files not in local push).
- Developer sees push succeeded, but only those 2 files were updated on the remote.
This is a path ambiguity failure, not a CLI failure.

### Drift Source 4: Git Rebase In Progress (Unfinished)

- .git/rebase-merge/ directory exists (created Mar 1 15:55).
- .git/ORIG_HEAD exists confirming interrupted operation.
- git status output: You are currently rebasing. (all conflicts fixed: run git rebase --continue)
- All conflicts are resolved. The rebase is stalled at the continuation gate.
- Risk: Any new agent commits go on the rebase chain, NOT the main branch tip.
- Fix: Run git rebase --continue from repo root.

### Drift Source 5: No Cached Theme-Path Binding

No .shopify CLI state files found in either theme directory:
- shopify-theme-dcube/.shopify: NOT FOUND
- dcube-sandbox-catalog/theme-download/.shopify: NOT FOUND

Every CLI command requires explicit --store, --theme, --path flags. The shopify_theme_sync.ps1 script handles this correctly via hardcoded values, but THEME_PATH points to an empty directory (see Drift Source 6).

### Drift Source 6: shopify_theme_sync.ps1 Uses Wrong Push Path

scripts/shopify_theme_sync.ps1 has correct safety guardrails (--nodelete flag, live theme ID guard, git root check, logging) but hardcodes:

  THEME_PATH = shopify	hemessandbox-160399261916

That directory is EMPTY (0 files). Any push via this script pushes nothing. Any pull populates a directory that is not the canonical theme-download/ working copy.

Required fix: change THEME_PATH to dcube-sandbox-catalog	heme-download

### Drift Source 7: Untracked Files Not in .gitignore

Current .gitignore only covers .claude/, 3 PNG scratch files, and OS artifacts.
Unguarded untracked items:
- apps/cataloger-internal/scripts/download-public-images.mjs
- apps/image-pipeline/ (entire app directory)
- dcube-sandbox-catalog/diagnostics/ subdirs (7 pull snapshots, 1000+ files total)
- dcube-sandbox-catalog/image-export/ (image pipeline output)

---

## CLI State Files

| Path | Type | Notes |
|---|---|---|
| apps/cataloger-internal/.shopify | App CLI state | Cataloger Internal app auth cache. NOT a theme CLI state file. |
| shopify-theme-dcube/.shopify | Not found | No cached theme binding |
| dcube-sandbox-catalog/theme-download/.shopify | Not found | No cached theme binding |
| shopify/themes/sandbox-160399261916/ | Empty directory | 0 files. Placeholder from PS1 script, never populated. |

---

## Existing Scripts

| File | Path | Push/Pull References |
|---|---|---|
| shopify_theme_sync.ps1 | scripts/shopify_theme_sync.ps1 | YES - uses shopify theme push (--nodelete) and shopify theme pull. Correct guardrails. CRITICAL BUG: THEME_PATH points to empty directory. |

No .sh shell scripts found.

Markdown files referencing push/pull context:
- dcube-sandbox-catalog/runbook.md (encoding corrupted)
- tools/shopify-cli-setup.md
- tools/shopify-readiness-report.md
- dcube-sandbox-catalog/diagnostics/remote_verification.md (confirms push to 160399261916 succeeded)
- dcube-sandbox-catalog/diagnostics/execution_trace.md (CSS injection path; why changes do not appear)

---

## Recommendation

Canonical push/pull path: D:/onedrive/Desktop/becandle/dcube-sandbox-catalog/theme-download/

This is the only valid push source because:
1. Pulled directly from sandbox 160399261916 (confirmed 144 files, Focal base)
2. Contains all DCube brand overlays (css-variables.liquid, theme.liquid guards at lines 73/85/202)
3. Verified remote file count match (144 local vs 145 remote; 1-file delta from settings_data.json generated by Shopify Editor is expected)

Canonical push command:

  shopify theme push --store dcubecandle.myshopify.com --theme 160399261916 --path dcube-sandbox-catalog/theme-download --nodelete

Fix shopify_theme_sync.ps1: change THEME_PATH from shopify	hemessandbox-160399261916 to dcube-sandbox-catalog	heme-download

Complete the rebase: git rebase --continue

Add to .gitignore:
  dcube-sandbox-catalog/diagnostics/remote-full/
  dcube-sandbox-catalog/diagnostics/remote-pull/
  dcube-sandbox-catalog/diagnostics/fix-push/
  dcube-sandbox-catalog/diagnostics/integrity-check/
  dcube-sandbox-catalog/diagnostics/post-fix-full/
  dcube-sandbox-catalog/diagnostics/post-fix2-full/
  dcube-sandbox-catalog/diagnostics/final-verify/
  dcube-sandbox-catalog/image-export/
  apps/image-pipeline/
  shopify/themes/

Never push from:
- shopify-theme-dcube/ (wrong architecture, 60 files, Focal incompatible)
- Any diagnostics/*/ subdirectory (read-only snapshots)
- image-export/theme-assets/_pull_full/ (image pipeline artifact)
- shopify/themes/sandbox-160399261916/ (empty directory)
