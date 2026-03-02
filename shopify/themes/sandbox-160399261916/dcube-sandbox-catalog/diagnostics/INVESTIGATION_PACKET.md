# INVESTIGATION PACKET — DCube Candle Shopify Sandbox
**Date:** 2026-03-02
**Investigator:** CODEX-SHOPIFY-INVESTIGATOR (via Claude Code shell wrapper)
**Canonical Theme Root:** `shopify/themes/sandbox-160399261916/`
**Status:** COMPLETE — Ready for Phase 3 Engineer dispatch

---

## SUMMARY TABLE

| Category | Issues Found | Severity | Actionable |
|---|---|---|---|
| A) Unboxing Breakpoint | 2 | P0 | YES — Focal crossfade + secondary image positioning |
| B) CTA Color Leak | 1 real + 4 structural | P0/P1 | YES — announcement bar is actively wrong |
| C) Typography Ghost | 3 | P1 | YES — Montserrat in settings, Copperplate block live |

---

## A) UNBOXING BREAKPOINT MAP

### A-1 — Focal Crossfade Defeats DCube Transform Slide [P0]

**FILE:LINE**
`assets/theme.css:12812-12814` (transition definition)
`assets/theme.css:12900-12908` (hover rule — the kill shot)

**EXACT RULES (VERIFIED)**
```css
/* Line 12812-12814 — applies BOTH opacity and visibility transitions */
.product-item__image-wrapper--multiple .product-item__primary-image,
.product-item__image-wrapper--multiple .product-item__secondary-image {
  transition: opacity 0.3s ease-in-out, visibility 0.3s ease-in-out;
}

/* Line 12900-12908 — on hover, primary fades to zero */
@media screen and (pointer: fine) {
  .product-item__image-wrapper--multiple:hover .product-item__primary-image {
    visibility: hidden;
    opacity: 0;
  }
  .product-item__image-wrapper--multiple:hover .product-item__secondary-image {
    visibility: visible;
    opacity: 1;
  }
}
```

**WHY IT MATTERS**
Focal's base mechanism is a pure opacity/visibility crossfade. The DCube ritual uses
`transform: translateY(-80%)` to slide the primary image UP. These two mechanisms conflict:
- Focal's `opacity: 0` makes the primary vanish → no slide visible
- Focal's `visibility: hidden` removes interactivity → transform has no visible effect
- Focal's transition rule includes `opacity` + `visibility` → these WILL run unless explicitly overridden

**CURRENT DCube COUNTER (theme.liquid:155-158)**
```css
.product-item:hover .product-item__image-wrapper--multiple .product-item__primary-image.dcube-primary-img {
  visibility: visible !important;
  opacity: 1 !important;
}
```
This counter-rule IS present and SHOULD override Focal due to `!important` + later load order.
**However:** The DCube `<style>` block is in `<head>` after the `<link>` for `theme.css` (line 81).
This should be sufficient — but MUST be confirmed via preview.

**ALSO: Focal's `.product-item__secondary-image` CSS at line 12826-12838**
```css
.product-item__secondary-image {
  display: none;      ← hidden by default
  visibility: hidden;
  opacity: 0;
  top: 50% !important;
  left: 50% !important;
  transform: translate(-50%, -50%) !important;
}
```
The DCube secondary uses class `dcube-secondary-img` (NOT `product-item__secondary-image`), so
Focal's rules at 12826-12838 do NOT apply. DCube secondary correctly uses `inset: 0`.

**STATUS:** DCube counter-rules exist. Confirm visually. If still broken, move CSS to late-loaded asset.

**PROPOSED FIX (if counter fails)**
Create `assets/dcube-ritual.css` that loads via `<link>` AFTER `theme.css`. Move all unboxing CSS there.
This guarantees load order without `!important` reliance.

---

### A-2 — Secondary Image `display: none` Outside Pointer Fine Media Query [P0]

**FILE:LINE**
`assets/theme.css:12826-12830`

**EXACT RULE**
```css
.product-item__secondary-image {
  display: none;     ← default
  visibility: hidden;
  opacity: 0;
}
```
`display: block` is restored inside `@media screen and (pointer: fine)` at line 12896.

**WHY IT MATTERS**
The DCube secondary (`dcube-secondary-img`) is NOT affected by this (different class). BUT this
confirms Focal's intent: secondary images are HIDDEN on touch/coarse-pointer devices.
The DCube ritual secondary (`dcube-secondary-img`) uses `display: block` always (set via `inset: 0`
implicit block display in theme.liquid:161-171). This means on touch devices the secondary is visible
beneath the primary — which is fine architecturally (stacked, no reveal behavior).

**STATUS:** Not a direct break. No fix needed for DCube classes. Confirm mobile stack renders cleanly.

---

## B) CTA COLOR LEAK MAP

### B-1 — Announcement Bar: Active Black Override [P0 — CONFIRMED LIVE]

**FILE:LINE**
`config/settings_data.json:114`

**CURRENT VALUE**
```json
"button_background": "#000000"
```

**WHERE IT APPEARS**
Inside `"current" > sections > announcement-bar > settings`. This is the ACTIVE live template section.

**HOW IT OVERRIDES GLOBAL**
`sections/announcement-bar.liquid:9`:
```liquid
--primary-button-background: {{ section.settings.button_background.red }}, ...;
```
This outputs `--primary-button-background: 0, 0, 0` directly in a `<style>` block on the page,
scoped to the section. It beats the global CSS variable set by `css-variables.liquid`.

**SHOULD BE:** `"#7E6B8F"` or `"rgba(0,0,0,0)"` (transparent → inherits global)

**PROPOSED FIX**
Change `config/settings_data.json:114` from `"#000000"` to `"rgba(0,0,0,0)"` so the section
inherits the global `--primary-button-background: 126, 107, 143` from css-variables.liquid.

---

### B-2 — Section-Level Override Pattern Exists Across Multiple Sections [P1]

**FILES**
- `sections/featured-collections.liquid:24-37`
- `sections/contact-form.liquid:24-37`
- `sections/image-with-text-block.liquid:30-43`
- `sections/image-with-text-overlay.liquid:29-42`

**PATTERN (identical in all)**
```liquid
{%- if section.settings.button_background == 'rgba(0,0,0,0)' -%}
  {%- assign button_background = settings.primary_button_background -%}
{%- else -%}
  {%- assign button_background = section.settings.button_background -%}  ← OVERRIDE PATH
{%- endif -%}
```
Current `settings_data.json` for these sections shows `"rgba(0,0,0,0)"` (transparent) — so they
correctly fall through to global. No active leak here today, but the structure is fragile.

**PROPOSED FIX**
No immediate code change needed. Document: admin MUST leave section button_background transparent.
Optional hardening: override `--primary-button-background` globally in `dcube-ritual.css` to force
`126, 107, 143` with `!important` as a backstop.

---

## C) TYPOGRAPHY GHOST MAP

### C-1 — Montserrat in settings_data.json current settings [P1]

**FILE:LINE**
`config/settings_data.json:36-39`

**EXACT VALUES**
```json
"heading_font": "montserrat_n4",
"text_font": "montserrat_n4",
```

**WHY IT'S A GHOST**
When `enable_dusty_sanctuary_palette: true`, `snippets/css-variables.liquid:103-106` outputs:
```css
--heading-font-family: 'Cormorant Garamond', serif !important;
--text-font-family: 'Inter', sans-serif !important;
```
These override any font variable Focal sets from the `heading_font` / `text_font` settings.
But Focal DOES load Montserrat via the Shopify font system and may inject a `@font-face` for it.

**RISK**
- Montserrat may still be network-fetched (wasted bandwidth, small)
- Font flash: if DCube CSS is slow to load, Montserrat could briefly render

**PROPOSED FIX**
These should be updated to reflect actual fonts, but since Shopify `font_picker` doesn't support
custom fonts, the safer approach is to leave them and let the CSS override hold.
Document: Montserrat is a dead font reference, overridden by Dusty Sanctuary toggle.

---

### C-2 — Copperplate Gothic Block in settings_data.json [P1]

**FILE:LINE**
`config/settings_data.json:294-315` (within `custom-font` section)

**EXACT BLOCK**
```json
"name": "Copperplate Gothic Std 29BC",
"custom_font_url": "https://cdn.shopify.com/s/files/1/0706/6412/6684/files/Copperplate-Gothic-Std-29-BC.ttf",
"apply_h1": true, "apply_h2": true, ... "apply_h6": true, "apply_p": true,
"apply_custom": "a, button, .shopify-policy__body *, .contact , .newsletter-modal, .page-content"
```
Section status: `"enable": false`

**WHY IT'S A GHOST**
The custom-font section is DISABLED, so it doesn't output any CSS. The font URL is NOT being fetched.
The `apply_custom: "button"` is dormant but dangerous — if re-enabled it would force Copperplate
onto all buttons.

**PROPOSED FIX**
Delete the Copperplate block from `config/settings_data.json`. Removes dead code hazard.
OR: remove `"button"` from `apply_custom` as minimum safety measure.

---

### C-3 — Hardcoded Font-Family in theme.liquid (Non-Variable) [P1]

**FILE:LINE**
`layout/theme.liquid:103, 106, 135, 229, 235, 241, 249`

**PATTERN**
```css
font-family: 'Cormorant Garamond', serif !important;  /* lines 103, 135, 229, 249 */
font-family: 'Inter', sans-serif !important;           /* lines 106, 235, 241 */
```

**ASSESSMENT**
These are DCube's OWN intentional overrides (not Focal ghosts). They directly reference font
names rather than CSS variables. This is acceptable as a last-resort fix but creates coupling.

**PROPOSED FIX**
These WORK correctly and are intentional. Optional improvement: replace with
`var(--heading-font-family)` / `var(--text-font-family)` to use the variable system properly.
Only change if refactoring the inline style block into `dcube-ritual.css`.

---

## WIRING & LOAD ORDER CONFIRMED

```
<head>
  Line 46: Google Fonts CDN → Cormorant Garamond, Inter (gated by enable_dusty_sanctuary_palette)
  Line 81: theme.css (Focal base)
  Line 82: styles.css (minor homepage overrides only)
  Line 91-289: <style> block (DCube Dusty Sanctuary overrides — loads AFTER theme.css ✓)
</head>
<body>
  Line 381-396: <style> block (section-level inline styles — further down)
</body>
```

The DCube `<style>` block at line 91 loads after `theme.css` at line 81.
`!important` + later load order = DCube wins on all conflict points.

---

## IMPLEMENTATION PLAN FOR ENGINEER (PHASE 3)

### Fix 1 (P0) — Announcement Bar Color Leak
- File: `config/settings_data.json`
- Change line 114: `"button_background": "#000000"` → `"rgba(0,0,0,0)"`
- Verification: Preview announcement bar CTA → should show muted purple (#7E6B8F)

### Fix 2 (P1) — Copperplate Gothic Dead Block
- File: `config/settings_data.json`
- Remove lines 293-316 (entire Copperplate custom font block)
- Verification: No Copperplate font loaded in network tab; custom-font section still present but empty

### Fix 3 (P1 / Optional) — Unboxing CSS to Dedicated Asset
- Create `assets/dcube-ritual.css` with all unboxing + typography override CSS
- Add `<link rel="stylesheet" href="{{ 'dcube-ritual.css' | asset_url }}">` in theme.liquid AFTER theme.css link (line 82 or after)
- Remove corresponding CSS from `<style>` block in theme.liquid
- Rationale: Deterministic load order without depending on `<style>` block position
- Only implement if unboxing visually fails in preview; otherwise defer

### Fix 4 (P1 / Optional) — Global Button Color Backstop
- Add to dcube-ritual.css (or existing `<style>` block):
```css
/* Backstop: force Dusty accent on all primary CTAs regardless of section override */
.button--primary,
.shopify-payment-button__button--unbranded,
[data-action="add-to-cart"] {
  background: rgb(126, 107, 143) !important;
  color: #fff !important;
}
```
- Only implement if section color leaks become visible in preview

---

**End of INVESTIGATION_PACKET.md**
