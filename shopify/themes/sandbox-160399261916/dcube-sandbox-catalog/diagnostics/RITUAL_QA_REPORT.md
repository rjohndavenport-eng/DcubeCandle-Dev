# Ritual System QA Report — DCube Rituals Restore
Date: 2026-03-02
Pipeline: CODEX-DESIGN → CODEX-IMPLEMENT → CODEX-CHALLENGE (corrected) → CODEX-FINALIZE
Verdict: DEPLOYED

## Rituals Implemented

### 1. Unboxing Reveal (product cards)
- HTML: dcube-card-media--stack (2 images) / dcube-card-media--solo (1 image)
- CSS: lid translateY(-45%) on (hover:hover) and (pointer:fine)
- Touch: transform:none — stable card
- Reduced motion: opacity crossfade instead of slide
- Focal crossfade neutralized: primary stays opacity:1

### 2. Hover-to-Light (CTAs)
- Selectors: .button--primary, .shopify-payment-button__button--unbranded
- Effect: translateY(-2px), box-shadow Dusty accent glow, brightness(1.04)
- Scoped to pointer:fine only

### 3. Scent Bloom
- Selector: .scent-chapter-bloom (snippets/scent-chapter.liquid)
- Bloom ring CSS already in snippet; --color-accent token confirmed in :root

## Files Changed
- snippets/product-item.liquid — dcube-card-media structure
- assets/dcube-overrides.css — NEW ritual CSS file
- layout/theme.liquid — link tag added, dead CSS removed

## Adversary Fix Applied
- Added position:absolute; inset:0 to .dcube-card-media__img (swatch variant stacking)

## Preview URL
https://dcubecandle.myshopify.com/?preview_theme_id=160399261916

## Manual Verification Checklist
- [ ] Home grid — 2-image products: lid slides up on hover, secondary visible
- [ ] Home grid — 1-image products: no slide, brightness glow on hover
- [ ] Collection page — same behavior as home grid
- [ ] Mobile: no animation, stable 1:1 square cards
- [ ] CTA buttons: lift + purple glow on desktop hover
- [ ] Scent chapter section: bloom rings expand on hover (if section visible)
- [ ] Reduced motion: opacity fade instead of slide
