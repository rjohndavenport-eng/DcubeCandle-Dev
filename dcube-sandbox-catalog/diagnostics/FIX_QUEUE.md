# FIX QUEUE — DCube Candle Co. Sandbox Theme
**Date:** 2026-03-01 | **Based on:** DRIFT_AUDIT.md + TOKENS_CHECK.md

---

## Priority Key
- **P1** — Visual breakage or incorrect display
- **P2** — Brand drift (wrong font/color, missing ritual)
- **P3** — Polish / cleanup

---

| # | Priority | Issue | Source File | Acceptance Criteria | Owner |
|---|---|---|---|---|---|
| 1 | P2 | Italiana font not loaded in Google Fonts CDN | `layout/theme.liquid:46` | CDN URL includes `family=Italiana:wght@400`; `--font-accent` resolves to actual Italiana display | CODEX-TYPOGRAPHY |
| 2 | P2 | `--font-accent` (Italiana) defined but never applied to visible elements | `snippets/scent-chapter.liquid`, `snippets/burn-gauge.liquid` | Scent note labels (Top/Heart/Base) and burn narrative label use Italiana | CODEX-TYPOGRAPHY |
| 3 | P2 | Announcement bar — no default mist background | `sections/announcement-bar.liquid` | Section renders with `#E6E1EB` mist background when `enable_dusty_sanctuary_palette` is active | CODEX-ACCENT-STRIPS |
| 4 | P2 | Static-text-with-icons — no default mist background | `sections/static-text-with-icons.liquid` | Section renders with `#E6E1EB` mist background when palette active | CODEX-ACCENT-STRIPS |
| 5 | P2 | Trust badge icons not Dusty-colored | `sections/static-text-with-icons.liquid` | Icons render in `#7E6B8F` or `#5A5560` Dusty token, not default black/grey | CODEX-ICONS |
| 6 | P2 | Bee icon missing from icon system | `snippets/icon.liquid` | `{% render 'icon' with 'dcube-bee' %}` renders a crisp bee SVG using `currentColor` | CODEX-ICONS |
| 7 | P2 | Product description max-width not constrained | `sections/product-content.liquid` | Description RTE block has `max-width: 680px; margin: 0 auto` for centered readable column | CODEX-PDP-LAYOUT |
| 8 | P2 | Scent chapter + burn gauge container not centered | `sections/product-content.liquid:339` | Container has `margin: 60px auto`, centered on page | CODEX-PDP-LAYOUT |
| 9 | P3 | `--font-accent` unused; Italiana purely ornamental | Multiple files | Applied to at least 2 visible accent elements | CODEX-TYPOGRAPHY |
| 10 | P3 | Luminari hardcoded in theme.css (overridden but fragile) | `assets/theme.css:82,444,472` | Low priority — already overridden by !important; document as tech debt | — |

---

## Acceptance Criteria for CODEX-FINALIZER

All of the following must be true before shipping:

- [ ] Google Fonts CDN includes `family=Italiana:wght@400`
- [ ] Scent chapter note labels (Top / Heart / Base) use Italiana (`--font-accent`)
- [ ] Announcement bar has mist `#E6E1EB` background when palette is active
- [ ] Static-text-with-icons has mist `#E6E1EB` background when palette is active
- [ ] Trust badge icon fill/color is Dusty accent `#7E6B8F` or muted `#5A5560`
- [ ] `dcube-bee` SVG icon is renderable via `{% render 'icon' with 'dcube-bee' %}`
- [ ] Product description block has max-width ~680px with `margin: 0 auto` centering
- [ ] Scent chapter + burn gauge container is centered on page
- [ ] All changes inside canonical folder only
- [ ] `--nodelete` on push, theme ID 160399261916

---

## Out of Scope (This Pass)
- Live theme: DO NOT TOUCH
- Metafield definitions for scent notes (needs Shopify admin action by store owner)
- Luminari theme.css override (already neutralized; fix in future theme.css edit pass)
- Product secondary image uploads (store owner action; code is correct)
