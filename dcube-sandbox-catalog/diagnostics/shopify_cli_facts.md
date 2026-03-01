# SHOPIFY CLI FACTS — DCube Candle Co.
Generated: 2026-03-01
Auditor: CODEX-AGENT-1: PIPELINE AUDITOR

---

## Shopify CLI Version

Shopify CLI was not available in the audit shell PATH at the time of this diagnostic run.
The CLI is invoked via the PowerShell script: scripts/shopify_theme_sync.ps1
The shopify.app.toml file at repo root specifies api_version: 2026-01

To retrieve version: run shopify version in a terminal where the CLI is installed.

---

## Auth Status

Auth state file found at: apps/cataloger-internal/.shopify
This file is the Shopify CLI app-level auth cache for the Cataloger Internal app.
It does NOT represent theme CLI auth state.

No theme-level CLI auth cache (.shopify files) found in theme directories.
The CLI requires --store flag on every theme command for auth context.

To check auth: shopify auth status or shopify whoami

---

## Store Connected

- Store: dcubecandle.myshopify.com
- App: Cataloger Internal (client_id: b8b91a0ba65596469cf9d88b11cb3772)
- App scopes: read_files, write_files, read_products, write_products
- Webhook API version: 2026-01

---

## Theme List

Derived from theme_identity.md and execution_trace.md diagnostics:

| Theme ID | Name | Role | Notes |
|---|---|---|---|
| 144142631132 | focal-verson-8-7-2 (or similar) | LIVE (published) | Live store theme. NO DCube changes. Never modify this theme. |
| 160399261916 | Copy of focal-verson-8-7-2 | UNPUBLISHED (sandbox) | Sandbox theme. Contains all DCube brand overlays. Target for all push/pull operations. |

To get current theme list: shopify theme list --store dcubecandle.myshopify.com

---

## Key Finding: Which Theme Is Live vs Sandbox

- LIVE theme ID: 144142631132
  - Visiting dcubecandle.com or dcubecandle.myshopify.com directly shows THIS theme.
  - Has NO DCube brand changes.
  - Must NEVER be targeted by push operations.

- SANDBOX theme ID: 160399261916 ("Copy of focal-verson-8-7-2")
  - Contains all DCube brand overlays.
  - Access via: Shopify Admin > Online Store > Themes > locate by name > Customize or Preview.
  - The enable_dusty_sanctuary_palette setting must be toggled ON and saved in Theme Editor to see DCube visuals.
  - This is the ONLY valid push/pull target for development work.

---

## Key Finding: --nodelete Flag Behavior

The Shopify CLI shopify theme push command has two behaviors regarding remote file deletion:

DEFAULT (no --nodelete flag):
- The CLI pushes all files found in --path to the remote theme.
- Files that exist on the remote but are NOT present in the local --path are DELETED from the remote.
- This is the "strip" behavior that can wipe out remote-only files.
- Example: if --path has 2 files and remote has 145 files, 143 remote files get deleted.

WITH --nodelete flag:
- The CLI pushes all files found in --path.
- Files on the remote that are NOT in the local --path are PRESERVED (not deleted).
- This is the safe flag for partial pushes.
- The shopify_theme_sync.ps1 script correctly uses --nodelete on all push operations.

IMPORTANT CLARIFICATION for this project:
The theme-download/ directory (144 files) is a near-complete copy of the remote (145 files).
Using --nodelete when pushing from theme-download/ is still recommended as a safety guard,
especially to preserve settings_data.json which is generated and managed by the Shopify Editor.

---

## Key Finding: What Happens When Push Path Has Fewer Files Than Remote (The Strip Incident)

Scenario: shopify theme push --path dcube-sandbox-catalog/diagnostics/fix-push/

The fix-push/ directory contains only 2 files:
- layout/theme.liquid
- snippets/css-variables.liquid

What happened (without --nodelete):
1. CLI scanned fix-push/ and found 2 files.
2. CLI compared to remote (145 files).
3. CLI pushed the 2 local files, updating them on the remote.
4. CLI queued deletion of 143 remote files not present in fix-push/.
5. After push completion, remote had only 2 files instead of 145.
6. Theme was broken (missing sections, templates, config, assets, locales).

What would happen (with --nodelete):
1. CLI scanned fix-push/ and found 2 files.
2. CLI pushed the 2 local files, updating them on the remote.
3. CLI skipped deletion of remote files not in local path.
4. Remote retained all 145 files. Theme remained intact.
5. Only the 2 specified files were updated.

Recovery method: Pull the full remote state into a directory and then push back.
This is why dcube-sandbox-catalog/diagnostics/remote-full/ and final-verify/ exist
(they are full pull snapshots used to verify remote state after incidents).

Key takeaway: The strip incident is caused by using a PARTIAL local directory as the push
source WITHOUT the --nodelete flag. The fix is twofold:
1. Always use --nodelete.
2. Always push from the FULL theme-download/ directory, never from partial diagnostic dirs.

---

## CLI Command Reference

Full push (safe):
  shopify theme push --store dcubecandle.myshopify.com --theme 160399261916 --path dcube-sandbox-catalog/theme-download --nodelete

Full pull (into canonical path):
  shopify theme pull --store dcubecandle.myshopify.com --theme 160399261916 --path dcube-sandbox-catalog/theme-download

Diagnostic pull (into timestamped dir, no conflict with canonical):
  shopify theme pull --store dcubecandle.myshopify.com --theme 160399261916 --path dcube-sandbox-catalog/diagnostics/[dated-dir]

Partial push (safe, single file update):
  shopify theme push --store dcubecandle.myshopify.com --theme 160399261916 --path dcube-sandbox-catalog/theme-download --only layout/theme.liquid --nodelete

List themes:
  shopify theme list --store dcubecandle.myshopify.com

---

## Sandbox Preview Access Instructions

To preview DCube brand changes on sandbox theme 160399261916:

1. Go to Shopify Admin > Online Store > Themes
2. Locate "Copy of focal-verson-8-7-2" (ID 160399261916)
3. Click "Customize"
4. In editor: Theme Settings (gear icon) > Dcube Brand (Sandbox)
5. Check "Enable Dusty Sanctuary Palette"
6. Click SAVE (top right)
7. Click the "..." menu > Preview

DO NOT visit dcubecandle.com directly. That shows the live theme (144142631132) with no DCube changes.
