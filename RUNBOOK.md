# DCube Candle Co. — Shopify Theme Development Runbook
## Last updated: 2026-03-01

---

## Prerequisites

| Requirement | Check |
|---|---|
| Shopify CLI installed | `shopify version` → should print `3.x.x` |
| Authenticated | `shopify auth status` → shows `dcubecandle.myshopify.com` |
| Repo cloned | `git remote -v` → shows `rjohndavenport-eng/DcubeCandle-Dev` |
| Run from repo root | `pwd` → `D:/onedrive/Desktop/becandle` |
| PowerShell available | Script: `scripts/shopify_theme_sync.ps1` |

---

## The Single Canonical Theme Directory

```
shopify/themes/sandbox-160399261916/
```

**This is the ONLY place to edit theme files.**
Never edit files in `dcube-sandbox-catalog/theme-download/` or `shopify-theme-dcube/` — those are legacy.

---

## Daily Workflow

### 1. Start of session — pull latest from Shopify
```powershell
.\scripts\shopify_theme_sync.ps1 pull
```
Or bare CLI:
```bash
shopify theme pull --theme 160399261916 --path "shopify/themes/sandbox-160399261916"
```

### 2. Make edits
Edit files inside `shopify/themes/sandbox-160399261916/` only.

### 3. Push to sandbox
```powershell
.\scripts\shopify_theme_sync.ps1 push
```
Or bare CLI (ALWAYS include --nodelete):
```bash
shopify theme push --theme 160399261916 --path "shopify/themes/sandbox-160399261916" --nodelete
```

### 4. Preview your changes
Open in browser — must use this URL:
```
https://dcubecandle.myshopify.com/?preview_theme_id=160399261916
```
Hard refresh: `Ctrl+Shift+R`

### 5. Commit to Git
```bash
git add shopify/themes/sandbox-160399261916/
git commit -m "feat(sandbox): <describe what changed>"
git push origin main
```

---

## Exact Commands Reference

| Action | Command |
|---|---|
| Pull sandbox | `shopify theme pull --theme 160399261916 --path "shopify/themes/sandbox-160399261916"` |
| Push sandbox | `shopify theme push --theme 160399261916 --path "shopify/themes/sandbox-160399261916" --nodelete` |
| List themes | `shopify theme list` |
| Preview URL | `https://dcubecandle.myshopify.com/?preview_theme_id=160399261916` |
| Theme Editor | `https://dcubecandle.myshopify.com/admin/themes/160399261916/editor` |
| Check git diff | `git diff --name-only -- shopify/themes/sandbox-160399261916/` |

---

## Theme ID Reference

| Theme | ID | Role | Notes |
|---|---|---|---|
| focal-verson-8-7-2 | 144142631132 | **LIVE** | ⛔ NEVER TOUCH |
| Copy of focal-verson-8-7-2 | **160399261916** | unpublished | ✅ SANDBOX — all work goes here |
| Copy of focal-verson-8-7-2 | 144211083484 | unpublished | Different copy — do not confuse |
| Dawn | 143365963996 | unpublished | Unused |
| Studio | 143366652124 | unpublished | Unused |

---

## Do / Don't

| DO | DON'T |
|---|---|
| Always use `--nodelete` on push | Never push without `--nodelete` |
| Always use `--theme 160399261916` | Never omit `--theme` (CLI may default to wrong theme) |
| Always push from `shopify/themes/sandbox-160399261916/` | Never push from a partial/staging directory |
| Always preview via `?preview_theme_id=160399261916` | Never check `dcubecandle.com` directly (that's live) |
| Always verify pull has 50+ sections after pulling | Never trust a pull that shows 0 sections |
| Use `--nodelete` even if files were deleted locally | If you want to delete remote files, do it explicitly via Theme Editor |
| Commit only `shopify/themes/sandbox-160399261916/` | Never commit `.env`, `.shopify/`, `node_modules/` |
| Enable "Dusty Sanctuary Palette" toggle to see DCube changes | Don't expect changes without the toggle ON and Saved |

---

## Enable DCube Visual Changes

In Theme Editor for sandbox:
1. Go to `https://dcubecandle.myshopify.com/admin/themes/160399261916/editor`
2. Click the **gear icon ⚙** (Theme Settings)
3. Scroll to **"Dcube Brand (Sandbox)"**
4. Toggle **"Enable Dusty Sanctuary Palette"** → ON
5. Click **Save**
6. Preview at `?preview_theme_id=160399261916` + hard refresh

Expected visual changes:
- Headings: Cormorant Garamond (elegant serif)
- Body: Inter (clean sans-serif)
- Primary buttons: muted purple `rgb(126, 107, 143)`
- Secondary buttons: honey gold `rgb(200, 151, 58)`

---

## Recovery Protocol — "Theme Got Stripped"

This happened when pushing from a partial directory (only 2 files) without `--nodelete`. The CLI deleted all remote files not present locally.

### Immediate recovery steps:
```bash
# 1. Verify what the remote actually has now
shopify theme pull --theme 160399261916 --path "dcube-sandbox-catalog/diagnostics/recovery-check"
ls "dcube-sandbox-catalog/diagnostics/recovery-check/sections/" | wc -l
# If count < 10 → theme is stripped → proceed to step 2

# 2. Push the full canonical directory to restore
shopify theme push --theme 160399261916 --path "shopify/themes/sandbox-160399261916" --nodelete

# 3. Verify restore
shopify theme pull --theme 160399261916 --path "dcube-sandbox-catalog/diagnostics/recovery-verify"
ls "dcube-sandbox-catalog/diagnostics/recovery-verify/sections/" | wc -l
# Should show 60+
```

### Why the strip happens:
The Shopify CLI `push` without `--nodelete` runs a "clean" step that deletes all remote files NOT present in the local `--path` directory. If you push from a directory with only 2 files, the entire remote theme gets deleted.

### Prevention:
- **Always** use `--nodelete`
- **Always** push from the full canonical directory
- **Never** create a staging subdirectory with a subset of files

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Pull produces empty dirs (0 sections) | `--only` flag with bad syntax, or path issue | Run full pull without `--only` from repo root |
| Push says "0 files uploaded" | CLI diff cache thinks nothing changed | Push from a fresh directory, or use `--nodelete` from canonical path |
| Preview looks like default Focal theme | Wrong URL (hitting live theme) | Use `?preview_theme_id=160399261916` |
| DCube colors/fonts not showing | Toggle is OFF | Enable in Theme Editor → Dcube Brand (Sandbox) → Save |
| Fonts show as generic serif fallback | `CormorantGaramond.woff2` not in assets | Font loads via Google Fonts CDN — check internet access |
| Theme totally broken after push | Pushed from partial dir without `--nodelete` | Run recovery protocol above |
| `shopify: command not found` | CLI not in PATH | Reinstall: `npm install -g @shopify/cli` |
| Push uploads to wrong theme | `--theme` flag omitted | Always pass `--theme 160399261916` explicitly |
| Two themes with same name confusion | Both named "Copy of focal-verson-8-7-2" | Always use ID `160399261916` (ends in 916), never by name |

---

## File Structure — What Lives Where

```
D:/onedrive/Desktop/becandle/
│
├── shopify/
│   └── themes/
│       └── sandbox-160399261916/     ← THE CANONICAL THEME (edit here only)
│           ├── assets/
│           ├── config/
│           ├── layout/
│           ├── locales/
│           ├── sections/
│           ├── snippets/
│           └── templates/
│
├── scripts/
│   └── shopify_theme_sync.ps1        ← Pull/push script (use this)
│
├── .github/
│   └── workflows/
│       └── shopify-sandbox-deploy.yml ← Future CI/CD (manual trigger only)
│
├── dcube-sandbox-catalog/
│   ├── diagnostics/                  ← Diagnostic outputs (gitignored transient pulls)
│   ├── theme-download/               ← LEGACY (do not edit — retire soon)
│   └── brand/ inventory/ etc.       ← Catalog assets
│
├── shopify-theme-dcube/              ← LEGACY (do not edit — retire after migration)
├── apps/                             ← Cataloger internal app
└── RUNBOOK.md                        ← This file
```

---

## GitHub Deployment Paths

### Path A — CLI-first (CURRENT, recommended)
```
local edit → git commit → .\scripts\shopify_theme_sync.ps1 push
```
Fast, no CI, full control. Use this now.

### Path B — GitHub Actions (future)
```
push to sandbox/* branch → GitHub Action auto-runs shopify theme push
```
Requires: `SHOPIFY_CLI_THEME_TOKEN` secret in repo Settings → Secrets.
Workflow draft: `.github/workflows/shopify-sandbox-deploy.yml`

### Path C — Shopify GitHub Integration (not recommended)
Shopify's native GitHub sync requires specific plans and is limited to published themes. Use CLI push instead.

---

## Next action: run smoke test proof change and confirm visible result.

```bash
# 1. Make a tiny visible change to confirm push works end-to-end
# Edit shopify/themes/sandbox-160399261916/snippets/css-variables.liquid
# Add a comment marker: /* RUNBOOK SMOKE TEST - 2026-03-01 */

# 2. Push
.\scripts\shopify_theme_sync.ps1 push

# 3. Verify in browser
# https://dcubecandle.myshopify.com/?preview_theme_id=160399261916
# Enable toggle → Save → hard refresh → confirm changes visible
```
