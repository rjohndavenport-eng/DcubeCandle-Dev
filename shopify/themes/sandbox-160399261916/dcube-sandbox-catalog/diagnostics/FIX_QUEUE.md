# FIX_QUEUE — DCUBE SANDBOX (2026-03-02)

## P0: Core Cohesion (Typography + Unboxing)
- [ ] **Typography Fix**: Disable `custom-font` section in `settings_data.json`.
  - DOD: Site matches `preview-brand.html` typography (Cormorant Garamond headers, Inter body).
  - Proof: `settings_data.json` diff + preview screenshot.
- [ ] **Unboxing Universal Reveal**: Update `layout	heme.liquid` and `snippets\product-item.liquid` for consistent hover rituals on ALL cards.
  - DOD: Every product card (featured or collection) has a hover ritual (slide-up reveal or fallback).
  - Proof: Diffs + GIF/Video of hover on different cards.

## P1: Visual Pipeline + Palette
- [ ] **Dusty Palette Strip Alignment**: Update `settings_data.json` background for announcement bar and footer to `#E6E1EB`.
  - DOD: All accent strips use the Dusty Mist/Soft token.
  - Proof: `settings_data.json` diff.
- [ ] **Trust Badge Icon family unification**: Update `sections\static-text-with-icons.liquid` to use unified SVG family.
  - DOD: Shipping, Vegan, Secure Payment icons match the Bee icon style and colors.
  - Proof: `snippets\icon.liquid` additions + `static-text-with-icons.liquid` rendering evidence.

## P2: PDP Balance
- [ ] **Centering Rituals Grid**: Update `sections\product-content.liquid` and related snippets to perfectly center content.
  - DOD: PDP rituals section is balanced sanctuary layout.
  - Proof: Diffs + PDP screenshot.
