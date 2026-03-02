# MOBILE TYPOGRAPHY AUDIT
Date: 2026-03-02
Agent: CODEX-TYPE-AUDITOR

## 1. Hero Heading

| Property | Value | Source |
|---|---|---|
| Element | `<h3 class="heading heading--large">` | `sections/slideshow.liquid:102-104` |
| Font family | Cormorant Garamond (toggle-gated) | `snippets/css-variables.liquid:103` |
| Mobile font-size | 32px / 36px / 40px (small/med/large setting) | `snippets/css-variables.liquid:113-114` |
| Tablet (741px+) | 48px / 52px / 58px | css-variables.liquid breakpoint override |
| Desktop (1200px+) | 58px / 64px / 72px | css-variables.liquid breakpoint override |
| Mobile line-height | **1.11111** (no mobile override in theme.css) | `assets/theme.css:997-1002` |
| Letter-spacing | -0.9px | heading--large class |
| No clamp() | CONFIRMED — hard breakpoints only | — |

## 2. REVEAL / Apparition Animations

| Animation | Scope | Mobile-safe? |
|---|---|---|
| `[reveal]` + `[reveal-visibility]` | Always-on (no media query gate) | Yes — CSS opacity/transform, no perf issue on modern mobile |
| `<split-lines reveal>` in slideshow | Always-on | Low-end Android may stutter |
| `.dcube-primary-img--solo` hover | Scoped to `@media (pointer: fine)` | SAFE — desktop only |

No duplicate @keyframes in DCube style block. All DCube hover rules are `@media (pointer: fine)` gated.

## 3. CSS Variable Chain (when enable_dusty_sanctuary_palette = true)

```
--heading-font-family: 'Cormorant Garamond', serif
--text-font-family: 'Inter', sans-serif
--font-accent: 'Italiana', serif
--heading-large-font-size: 32|36|40px (mobile) → 48|52|58px (741px+) → 58|64|72px (1200px+)
--base-font-size: 16px
```

## 4. Font Loading

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/...Cormorant+Garamond...Inter...Italiana...display=swap" rel="stylesheet">
```
- `display=swap` confirmed — prevents FOIT, allows FOUT
- Local `@font-face` fallback in `snippets/css-variables.liquid:214-227` (CormorantGaramond-Medium.woff2, Italiana-Regular.woff2)
- Note: Local fallback files NOT verified to exist in `/assets` — potential FOUT if CDN fails

## 5. Duplicate Animations in DCube Style Block

None. The DCube block contains NO @keyframes. All animation is Focal's base system (`textUnderlinedAnimatedKeyframes`, `spinnerRotate`, etc.) — those are in theme.css and apply globally. No action needed.

## TYPOGRAPHY ISSUES FOUND

| # | Issue | Severity | Affected |
|---|---|---|---|
| T-1 | Mobile line-height 1.11 too tight for 40px Cormorant serif | Medium | Hero H1/H3 at 320-374px widths |
| T-2 | No clamp() — hard breakpoint jumps (40px → 48px at 741px) | Low | Visible on iPad mini |
| T-3 | Local font fallback files not verified in /assets | Medium | Brand on CDN failure |
| T-4 | Reveal animations not gated by prefers-reduced-motion | Low | Accessibility / low-end Android |

## RECOMMENDED FIXES (for dcube-mobile-fixes.css)

```css
/* T-1: Increase mobile line-height for Cormorant readability */
@media screen and (max-width: 740px) {
  .heading--large {
    line-height: 1.3 !important;
  }
}

/* T-4: Respect reduced motion preference */
@media (prefers-reduced-motion: reduce) {
  [reveal] {
    animation: none !important;
    opacity: 1 !important;
    transform: none !important;
  }
  [reveal-visibility] {
    visibility: visible !important;
    opacity: 1 !important;
  }
}
```

clamp() implementation and font-asset verification are deferred to next polish pass (non-blocking for current deploy).
