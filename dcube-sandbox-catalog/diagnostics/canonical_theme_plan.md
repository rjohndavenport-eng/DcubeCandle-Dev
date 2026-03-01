# Canonical Theme Plan — DCube Candle Co.
## Generated: 2026-03-01

## Canonical Path
```
shopify/themes/sandbox-160399261916/
```

This is now the ONLY folder where theme files should be edited.
Do NOT edit files in any other directory.

## Why This Path
- Unambiguous: theme ID is part of the path name
- Clean: no previous CLI state cache
- Isolated: under `shopify/themes/` which is clearly the theme workspace
- Git-trackable: all edits are versioned under one directory

## Pull Command Used
```bash
shopify theme pull --theme 160399261916 --path "shopify/themes/sandbox-160399261916"
```

## Verification — Pull Produced a Real Theme Tree

| Folder     | File Count | Status |
|------------|------------|--------|
| sections/  | 64         | ✅ PASS |
| snippets/  | 25         | ✅ PASS |
| templates/ | 24         | ✅ PASS |
| assets/    | 10         | ✅ PASS |
| config/    | 2          | ✅ PASS |
| layout/    | 2          | ✅ PASS |

All expected directories present. Pull is complete and real.

## Legacy Directories (to be retired)
| Path | Status |
|---|---|
| `dcube-sandbox-catalog/theme-download/` | OLD — do not edit. Will be removed after migration confirmed. |
| `shopify-theme-dcube/` | LEGACY — do not edit. |
| `dcube-sandbox-catalog/diagnostics/remote-*/` | Transient diagnostic pulls — .gitignored |

## Sync Script
Use `scripts/shopify_theme_sync.ps1` for all pulls and pushes:
```powershell
.\scripts\shopify_theme_sync.ps1 pull    # download latest from Shopify
.\scripts\shopify_theme_sync.ps1 push    # upload edits (always --nodelete)
.\scripts\shopify_theme_sync.ps1 status  # see what changed
```
