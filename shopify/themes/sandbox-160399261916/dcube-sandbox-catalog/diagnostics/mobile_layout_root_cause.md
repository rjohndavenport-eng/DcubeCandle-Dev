# MOBILE LAYOUT ROOT CAUSE AUDIT
Date: 2026-03-02
Agent: CODEX-MOBILE-AUDITOR

## 1. Product Card Structure

| Element | Class(es) | Role |
|---|---|---|
| Outer wrapper | `.product-item__image-wrapper` + `--multiple` (conditional) | Clipping container, `overflow: hidden` |
| Aspect-ratio container | `.product-item__aspect-ratio .aspect-ratio .aspect-ratio--{size}` | Height controller |
| Primary image | `.product-item__primary-image .dcube-primary-img` | Top layer, z-index 5 |
| Secondary image | `.dcube-secondary-img` | Bottom layer, z-index 1 |

Height mechanism: inline `padding-bottom: {{ 100 / aspect_ratio }}%` on `.product-item__aspect-ratio`.
`@supports (aspect-ratio: 1/1)` block in theme.css overrides padding-bottom with native `aspect-ratio` on modern browsers.

## 2. Height Mechanism Detail

- **Padding-bottom (legacy):** `assets/theme.css:2105-2115` — `.aspect-ratio--square { padding-bottom: 100% !important }`
- **@supports override:** `assets/theme.css:2117-2141` — sets `padding-bottom: 0 !important; aspect-ratio: var(--aspect-ratio)`
- **Position:** `.aspect-ratio { position: relative }` — `assets/theme.css:2069`
- **Overflow:** `.product-item__image-wrapper { overflow: hidden }` — `assets/theme.css:12791`
- **Inline style on aspect-ratio element:** `style="padding-bottom: X%; --aspect-ratio: X"` (product-item.liquid:50-51)

## 3. Mobile Breakpoint Rules

| Rule | File:Line | Notes |
|---|---|---|
| Focal hover crossfade | `theme.css:12895-12914` | Scoped to `@media screen and (pointer: fine)` — desktop only |
| Solo lift/glow transform | `theme.liquid:201-206` | Scoped to `@media (pointer: fine)` — desktop only |
| Secondary hide (DCube) | `theme.liquid:170-174` | `@media (hover: none)` — correctly hides secondary on touch |
| No transform/translateY on mobile images | — | CONFIRMED — no mobile transforms on product images |
| No visibility:hidden on mobile primary | — | CONFIRMED — no mobile visibility rules on primary |

## 4. DCube Current CSS State (layout/theme.liquid lines 154-207)

**.dcube-primary-img** (lines 185-195):
```css
position: absolute !important;
top: 0 !important;
left: 0 !important;
width: 100% !important;
height: 100% !important;
max-width: none !important;
max-height: none !important;
object-fit: cover !important;
object-position: center !important;
z-index: 5 !important;
```

**.dcube-secondary-img** (lines 157-167):
```css
position: absolute !important;
inset: 0 !important;
z-index: 1 !important;
width: 100% !important;
height: 100% !important;
object-fit: cover !important;
object-position: center !important;
opacity: 1 !important;
display: block !important;
```

**@media (hover: none)** (lines 170-174):
```css
@media (hover: none) {
  .dcube-secondary-img { display: none !important; }
}
```

**.dcube-primary-img--solo** (lines 199-207):
```css
/* Desktop only — pointer:fine scoped */
transition: transform 0.75s cubic-bezier(...), filter 0.4s ease !important;
/* hover: scale(1.04) translateY(-5px) + brightness(1.02) */
```

## 5. Existing dcube-mobile-fixes.css

**DOES NOT EXIST** — must be created at `assets/dcube-mobile-fixes.css`.

## 6. Stylesheet Load Order (theme.liquid head)

```
1. Google Fonts CDN (lines 43-46) — toggle-gated
2. theme.css <link> (line 81) — Focal base
3. styles.css <link> (line 82) — minor overrides
4. vendor.js / theme.js / custom.js (lines 84-86) — deferred scripts
5. {{ content_for_header }} (line 88) — Shopify injections
6. DCube inline <style> block (lines 90-278) — toggle-gated, !important overrides
   ← NEW: dcube-mobile-fixes.css <link> MUST GO HERE (after line 278) to load LAST
```

Note: A `<link>` placed after the inline `<style>` block, still in `<head>`, loads after it in cascade order. With `!important` in the mobile file, it will override the inline block's `!important` rules on mobile breakpoints.

## 7. Hero Typography

| Property | Value | Source |
|---|---|---|
| Subheading element | `<h2 class="heading heading--small">` | `sections/slideshow.liquid:96-98` |
| Main heading element | `<h3 class="heading heading--large">` | `sections/slideshow.liquid:102-104` |
| Desktop font-size | `--heading-large-font-size` (40px/36px/32px per settings) | `snippets/css-variables.liquid:113-114` |
| Mobile line-height | `line-height: 1` on `.heading--large` | `assets/theme.css:997-1002` |
| Mobile font-size | **NO OVERRIDE** — same as desktop | Missing `clamp()` |

Risk: 40px heading with `line-height: 1` at 320px viewport width = potential overflow/overlap.

## ROOT CAUSE SUMMARY

The product card layout uses a dual-image absolute-positioning stack inside an `aspect-ratio` container. On modern mobile browsers, `@supports (aspect-ratio: 1/1)` replaces the padding-bottom height trick with native `aspect-ratio`, which is correct. However, the primary image `position: absolute !important` inside the DCube inline block wins only if the containing block has defined height — which it does via `aspect-ratio`. The slicing observed previously was likely caused by `max-width: 100%` from Focal's `.aspect-ratio img` (theme.css:2076) capping the image width before the DCube fix added `max-width: none !important`. That fix has been applied (commit 5574c13). Current risk is residual mobile layout instability on narrow viewports where the aspect-ratio container may not correctly establish height if inline padding-bottom is overridden without the @supports block applying.

## RECOMMENDED FIX APPROACH

Create `assets/dcube-mobile-fixes.css` and load it AFTER the DCube inline `<style>` block in theme.liquid. Content:

1. `@media (max-width: 768px)` block:
   - Set `.product-item__aspect-ratio` to `aspect-ratio: 1/1 !important; overflow: hidden !important` (explicit square container, no reliance on inline padding-bottom value)
   - Set `.dcube-primary-img` to `position: relative !important; width: 100% !important; height: 100% !important` (removes absolute positioning that requires container height)
   - Disable solo card lift animation on mobile (no transform, no filter)

2. Keep desktop hover logic (crossfade) intact — the mobile file only applies `max-width: 768px` rules.
