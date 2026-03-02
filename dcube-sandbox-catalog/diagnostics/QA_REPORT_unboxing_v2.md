# QA REPORT — Unboxing Reveal v2

**Date (UTC):** 2026-03-01 01:23:59 UTC
**Commit Hash:** `26d7db359a11997d6c5ab42e584864411380c2dd`
**Theme ID:** `160399261916` (unpublished sandbox — "Copy of focal-verson-8-7-2")
**Store:** `dcubecandle.myshopify.com`
**Preview URL:** `https://dcubecandle.myshopify.com?preview_theme_id=160399261916`
**Theme Editor:** `https://dcubecandle.myshopify.com/admin/themes/160399261916/editor`

---

## 1A — snippets/product-item.liquid

| # | Check | Result |
|---|-------|--------|
| 1 | No `.dcube-unbox` div | PASS |
| 2 | No `product-item__secondary-image` img | PASS |
| 3 | `dcube_has_secondary` assignment is BEFORE secondary img injection | PASS (line 54 assigns; line 59 uses) |
| 4 | `product.media[1].media_type == 'image'` guard is present | PASS (line 55) |
| 5 | Primary `<img>` has both `product-item__primary-image` and `dcube-primary-img` classes | PASS (line 69) |
| 6 | Primary `<img>` has `{% unless dcube_has_secondary %} dcube-primary-img--solo{% endunless %}` | PASS (line 69) |
| 7 | Swatch variant loop images ALSO have `{% unless dcube_has_secondary %} dcube-primary-img--solo{% endunless %}` | PASS (line 85) |
| 8 | `hide_secondary_image` param is still respected | PASS (line 55: `hide_secondary_image != true`) |
| 9 | `dcube-secondary-img` uses `{% render 'image-attributes' %}` correctly | PASS (line 64) |

**1A RESULT: ALL PASS**

---

## 1B — layout/theme.liquid

| # | Check | Result |
|---|-------|--------|
| 1 | No `.dcube-unbox` CSS in `<head>` style block | PASS |
| 2 | No `.product-item__primary-image { transform:` rule (old slide-up gone) | PASS |
| 3 | `.product-item { border: 1px solid rgba(209, 201, 219, 0.6); ... }` present | PASS (lines 140-147) |
| 4 | `.product-item:hover { border-color: rgba(126, 107, 143, 0.35); ... }` present | PASS (lines 148-152) |
| 5 | Focal override: `.product-item__image-wrapper--multiple:hover .product-item__primary-image.dcube-primary-img { visibility: visible !important; opacity: 1 !important; }` | PASS (lines 155-158) |
| 6 | `.dcube-secondary-img { position: absolute; inset: 0; z-index: 1; ... }` present | PASS (lines 161-171) |
| 7 | `.product-item__label-list { z-index: 3; }` present | PASS (lines 174-176) |
| 8 | `.dcube-primary-img { position: relative; z-index: 2; ... }` present | PASS (lines 179-184) |
| 9 | `@media (pointer: fine)` wraps the `.product-item:hover .dcube-primary-img:not(.dcube-primary-img--solo)` hover rule | PASS (lines 185-189) |
| 10 | `.dcube-primary-img--solo { transition: box-shadow ... !important; }` present | PASS (lines 192-194) |
| 11 | `@media (prefers-reduced-motion: reduce)` crossfade block present | PASS (lines 197-214) |
| 12 | Only ONE `body::before` rule in `<head>` style block (authoritative one in `</body>` block) | PASS — zero `body::before` in `<head>` style; single authoritative rule in body block (lines 332-349) |
| 13 | `.product-item-meta__title, .product-item-meta__title:visited { color: rgb(30, 26, 32) !important; }` present | PASS (lines 236-239) |
| 14 | `h4, h5, h6 { font-weight: 400 !important; }` present | PASS (lines 217-220) |
| 15 | `p, body, .rte, nav, .button ... { font-family: 'Inter', sans-serif; }` present | PASS (lines 221-225) |

**1B RESULT: ALL PASS**

---

## 1C — snippets/css-variables.liquid

| # | Check | Result |
|---|-------|--------|
| 1 | `--font-display: 'Cormorant Garamond', serif;` inside sanctuary palette block | PASS (line 199) |
| 2 | `--font-body: 'Inter', sans-serif;` present | PASS (line 200) |
| 3 | `--font-accent: 'Italiana', serif;` present (not duplicated) | PASS (line 201, single occurrence) |
| 4 | All three are inside `:root {}` scope | PASS (the `{%- if settings.enable_dusty_sanctuary_palette -%}` block at lines 179-210 is nested inside `:root {}` spanning lines 58-211) |

**1C RESULT: ALL PASS**

---

## OVERALL QA GATE: ALL 28 CHECKS PASSED

---

## Git Commit

```
Hash:    26d7db359a11997d6c5ab42e584864411380c2dd
Branch:  main
Time:    2026-03-01 20:23:59 -0500 (01:23:59 UTC)
Files:   3 changed, 102 insertions(+), 52 deletions(-)

  shopify/themes/sandbox-160399261916/layout/theme.liquid
  shopify/themes/sandbox-160399261916/snippets/css-variables.liquid
  shopify/themes/sandbox-160399261916/snippets/product-item.liquid
```

---

## Shopify Push

**Command:**
```
shopify theme push \
  --path shopify/themes/sandbox-160399261916 \
  --theme 160399261916 \
  --nodelete \
  --only "snippets/product-item.liquid" \
  --only "layout/theme.liquid" \
  --only "snippets/css-variables.liquid"
```

**Result:** SUCCESS
**CLI output:** "The theme 'Copy of focal-verson-8-7-2' (#160399261916) was pushed successfully."
**Files pushed:**
- `snippets/product-item.liquid`
- `layout/theme.liquid`
- `snippets/css-variables.liquid`

**Note:** `--nodelete` flag was used; no remote files were deleted.
**Theme ID confirmed:** `160399261916`

---

## Preview Links

| Purpose | URL |
|---------|-----|
| Storefront preview | https://dcubecandle.myshopify.com?preview_theme_id=160399261916 |
| Theme editor | https://dcubecandle.myshopify.com/admin/themes/160399261916/editor |
