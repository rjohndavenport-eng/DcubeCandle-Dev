# DCube Design Spec — Interaction Rituals
Date: 2026-03-02
Source: preview-brand.html + canonical CSS from brief

---

## Color Tokens (verified from preview-brand.html)
| Token | Hex | Use |
|---|---|---|
| Dusty Accent | `#7E6B8F` / `rgb(126,107,143)` | Primary CTA, hover glow |
| Mist/Surface | `#E6E1EB` / `rgb(230,225,235)` | Card background |
| Honey Gold | `#C8973A` / `rgb(200,151,58)` | Secondary CTA |
| Border | `#D1C9DB` / `rgba(209,201,219,.6)` | Card border |
| Text | `#1E1A20` / `rgb(30,26,32)` | Headings |

---

## Ritual 1 — Unboxing Reveal (Two-Image Stack)

### HTML Structure (replaces flat img siblings inside `.product-item__aspect-ratio`)

**Stack variant (product has 2+ images):**
```html
<div class="dcube-card-media dcube-card-media--stack">
  <div class="dcube-card-media__underlay">
    <img class="dcube-card-media__img" src="..." alt="..." loading="lazy">
  </div>
  <div class="dcube-card-media__lid">
    <img class="dcube-card-media__img product-item__primary-image" src="..." alt="..." loading="eager">
  </div>
</div>
```

**Solo variant (product has 1 image):**
```html
<div class="dcube-card-media dcube-card-media--solo">
  <div class="dcube-card-media__lid">
    <img class="dcube-card-media__img product-item__primary-image" src="..." alt="..." loading="eager">
  </div>
</div>
```

**Notes:**
- `product-item__primary-image` kept on primary img for Focal JS compatibility
- `dcube-card-media` replaces old flat `.dcube-primary-img` / `.dcube-secondary-img` system
- `.dcube-card-media` is placed INSIDE `.product-item__aspect-ratio` — must fill it via `position: absolute; inset: 0`

### CSS (canonical — verbatim from brief)
```css
.dcube-card-media {
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(209,201,219,.6);
  border-radius: 12px;
  background: #E6E1EB;
  aspect-ratio: 1 / 1;
}

.dcube-card-media__underlay,
.dcube-card-media__lid {
  position: absolute;
  inset: 0;
}

.dcube-card-media__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  display: block;
}

.dcube-card-media__lid {
  z-index: 2;
  transform: translateY(0);
  transition: transform 520ms cubic-bezier(.2,.8,.2,1), box-shadow 240ms ease, filter 240ms ease;
}

.dcube-card-media__underlay { z-index: 1; }

@media (hover:hover) and (pointer:fine) {
  .product-item:hover .dcube-card-media--stack .dcube-card-media__lid {
    transform: translateY(-45%);
  }
  .product-item:hover .dcube-card-media--solo .dcube-card-media__lid {
    transform: none;
    filter: brightness(1.02);
    box-shadow: 0 10px 30px rgba(0,0,0,.08);
  }
}

@media (hover:none), (pointer:coarse) {
  .dcube-card-media__lid { transform: none !important; }
}

@media (prefers-reduced-motion: reduce) {
  .dcube-card-media__lid { transition: opacity 180ms ease !important; }
  @media (hover:hover) and (pointer:fine) {
    .product-item:hover .dcube-card-media--stack .dcube-card-media__lid { opacity: 0; }
  }
}

/* Neutralize Focal crossfade on primary */
.product-item__image-wrapper--multiple:hover .product-item__primary-image {
  opacity: 1 !important;
  visibility: visible !important;
}

/* Fill parent aspect-ratio container when nested in Focal */
.product-item__aspect-ratio > .dcube-card-media {
  position: absolute;
  inset: 0;
  aspect-ratio: unset;
  border-radius: 12px;
}
```

---

## Ritual 2 — Hover-to-Light (CTA Glow)

Source: preview-brand.html "The Match Strike" — border-color to gold, box-shadow glow.
Adapted for Shopify CTAs using Dusty Accent.

```css
@media (hover:hover) and (pointer:fine) {
  .button--primary:hover,
  .shopify-payment-button__button--unbranded:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 20px rgba(126,107,143,0.35);
    filter: brightness(1.04);
  }
}

.button--primary,
.shopify-payment-button__button--unbranded {
  transition: transform 200ms ease, box-shadow 240ms ease, filter 240ms ease;
}
```

---

## Ritual 3 — Scent Bloom

Source: `snippets/scent-chapter.liquid` — already has `.scent-chapter-bloom` and `.bloom-ring` elements with bloom CSS inside the snippet. Verify CSS is present in the snippet; if not, provide in overrides.

Spec from preview-brand.html:
```css
@media (hover:hover) and (pointer:fine) {
  .scent-chapter-bloom:hover .bloom-ring:nth-child(1) {
    width: 400px; height: 400px; opacity: 0.1;
  }
  .scent-chapter-bloom:hover .bloom-ring:nth-child(2) {
    width: 600px; height: 600px; opacity: 0.05;
    transition-delay: 0.2s;
  }
}
```
Timing: `1.2s cubic-bezier(0.23, 1, 0.32, 1)`

---

## Sections That Render product-item (must all receive the ritual)
1. `sections/featured-collections.liquid`
2. `sections/main-collection.liquid`
3. `sections/product-recommendations.liquid`
4. `sections/recently-viewed-products.liquid`
5. `sections/cart-recommendations.liquid`
6. `sections/mini-cart.liquid`
7. `sections/main-search.liquid`
8. `sections/promotion-blocks.liquid`
9. `sections/product-content.liquid`

Since all use `{%- render 'product-item' ... -%}`, changing `snippets/product-item.liquid` ONCE propagates to all.

---

## Acceptance Criteria
| Scenario | Expected |
|---|---|
| 2-image card, desktop hover | Lid slides up 45%, underlay (secondary) fully visible |
| 1-image card, desktop hover | No slide; brightness(1.02) + shadow glow |
| Mobile (hover:none) | No transform, stable square card, no secondary bleed |
| Reduced motion | Lid fades opacity 0 instead of sliding |
| Focal crossfade conflict | Neutralized — primary stays opacity:1 on hover |
| CTA hover (desktop) | Lifts 2px, Dusty accent glow shadow |
| Scent bloom hover | Rings expand outward with opacity |

---

## Migration Notes
- Old `.dcube-primary-img` + `.dcube-secondary-img` CSS in theme.liquid → becomes dead code after migration; remove or leave (harmless)
- Old `dcube-mobile-fixes.css` `.dcube-primary-img` rules → becomes dead code; mobile stabilization now handled by `(hover:none)` in overrides
- `dcube-mobile-fixes.css` typography + reduced-motion rules → KEEP (still valid, not image-related)
