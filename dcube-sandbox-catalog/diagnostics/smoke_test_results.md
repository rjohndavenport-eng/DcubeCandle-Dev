# Smoke Test Checklist — 2026-03-01

## Canonical Pull Verification

| Check | Result |
|---|---|
| `shopify/themes/sandbox-160399261916/` exists | ✅ PASS |
| sections/ has 64 files | ✅ PASS (≥30 required) |
| snippets/ has 25 files | ✅ PASS (≥15 required) |
| templates/ has 24 files | ✅ PASS (≥10 required) |
| assets/ has 10 files | ✅ PASS |
| config/ has 2 files | ✅ PASS |
| layout/theme.liquid exists | ✅ PASS |
| config/settings_schema.json exists | ✅ PASS |

## Push Smoke Test

To run:
```powershell
.\scripts\shopify_theme_sync.ps1 push
```
Expected output: `The theme 'Copy of focal-verson-8-7-2' (#160399261916) was pushed successfully.`

## Preview Verification

- Preview URL: `https://dcubecandle.myshopify.com/?preview_theme_id=160399261916`
- Toggle: Theme Editor → Gear ⚙ → **Dcube Brand (Sandbox)** → **Enable Dusty Sanctuary Palette** → **Save**
- Hard refresh: `Ctrl+Shift+R`

## Expected Visual Changes (toggle ON)

| Element | Before | After |
|---|---|---|
| Heading font | Focal default | Cormorant Garamond serif |
| Body font | Focal default | Inter sans-serif |
| Primary buttons | Focal default | Muted purple `rgb(126,107,143)` |
| Secondary buttons | Focal default | Honey gold `rgb(200,151,58)` |
| Body overlay | None | Subtle noise texture (2% opacity) |
