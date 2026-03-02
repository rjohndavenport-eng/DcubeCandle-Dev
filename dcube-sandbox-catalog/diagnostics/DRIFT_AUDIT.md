# DRIFT AUDIT — DCube Candle Co. Sandbox Theme
**Theme:** Copy of focal-verson-8-7-2 (ID: 160399261916)
**Baseline Commit:** 26d7db3 — feat: Unboxing Reveal v2
**Audit Date:** 2026-03-01
**Auditor:** CODEX-AUDITOR

---

## Legend
- ✅ PASS — Compliant with brand board
- ⚠️ DRIFT — Misaligned, needs fix
- ❌ MISSING — Feature/token not implemented

---

## A) Product Cards — Unboxing Reveal

| Component | Observed | Expected | Source File | Status | Fix Plan |
|---|---|---|---|---|---|
| `dcube-secondary-img` injection | Present at lines 59–65 | Absolute secondary image behind primary | `snippets/product-item.liquid:59` | ✅ | — |
| `dcube-primary-img` class | Present on primary `<img>` L69 | Relative primary at z-index 2 | `snippets/product-item.liquid:69` | ✅ | — |
| `--solo` modifier | Applied via `{% unless dcube_has_secondary %}` | Suppresses slide for 1-image products | `snippets/product-item.liquid:69` | ✅ | — |
| `media_type == 'image'` guard | Present in `dcube_has_secondary` assignment L55 | Prevents video from being used as secondary | `snippets/product-item.liquid:55` | ✅ | — |
| Swatch variant images | `--solo` modifier added L85 | No slide when no secondary exists | `snippets/product-item.liquid:85` | ✅ | — |
| `show_secondary_image` setting | `true` in settings_data.json | Must be true for secondary to render | `config/settings_data.json` | ✅ | — |
| Focal cross-fade override | Present in theme.liquid | Neutralizes Focal's opacity:0 on primary | `layout/theme.liquid` | ✅ | — |
| Card sanctuary border/shadow | Present at .product-item | `1px solid rgba(209,201,219,0.6)` border | `layout/theme.liquid:141` | ✅ | — |
| **Wiring: home featured** | `render 'product-item'` in featured-collections.liquid | All contexts use same snippet | `sections/featured-collections.liquid` | ✅ | — |
| **Wiring: collection grid** | `render 'product-item'` in main-collection.liquid | All contexts use same snippet | `sections/main-collection.liquid` | ✅ | — |
| **Root cause of owner observation** | Products may not have secondary images uploaded in catalog | Without secondary images, all cards show `--solo` mode (no slide, only border glow) | Shopify admin / product catalog | ⚠️ | Upload secondary images per product OR make --solo sanctuary feel more prominent |

---

## B) Typography

| Component | Observed | Expected | Source File | Status | Fix Plan |
|---|---|---|---|---|---|
| Heading font (h1–h6) | Cormorant Garamond via `!important` in theme.liquid | Cormorant Garamond, weight 300–400 | `layout/theme.liquid:134` | ✅ | — |
| Heading font in theme.css | `'Luminari', sans-serif` hardcoded at lines 82, 444, 472 | Should use `var(--heading-font-family)` | `assets/theme.css:82,444,472` | ⚠️ | Overridden by !important in theme.liquid; fragile if palette disabled |
| Body font | Inter via css-variables and theme.liquid | `'Inter', sans-serif` | `snippets/css-variables.liquid:198` | ✅ | — |
| RTE body text | Forced to Inter + rgb(30,26,32) in theme.liquid | Inter, charcoal text | `layout/theme.liquid:228` | ✅ | — |
| Product description font | `.rte` inherits Inter via cascade | Inter sans-serif | `sections/product-content.liquid:147` | ✅ | — |
| Cormorant Garamond CDN | Loaded in theme.liquid L46, weights 300–700 + italic | All required weights | `layout/theme.liquid:46` | ✅ | — |
| Inter CDN | Loaded in theme.liquid L46, weights 300–400–500 | Required weights | `layout/theme.liquid:46` | ✅ | — |
| **Italiana CDN** | **NOT in Google Fonts CDN link** | Must load `family=Italiana:wght@400` | `layout/theme.liquid:46` | ❌ | Add Italiana to CDN URL |
| `--font-display` var | Set to Cormorant Garamond in css-variables.liquid L199 | Correct alias | `snippets/css-variables.liquid:199` | ✅ | — |
| `--font-body` var | Set to Inter in css-variables.liquid L200 | Correct alias | `snippets/css-variables.liquid:200` | ✅ | — |
| `--font-accent` var | Set to Italiana in css-variables.liquid L201 | Correct alias | `snippets/css-variables.liquid:201` | ⚠️ | Defined but never applied to visible elements |
| Scent chapter note titles | Use `var(--heading-font-family)` | Should use `--font-accent` (Italiana) for signature feel | `snippets/scent-chapter.liquid:14` | ⚠️ | Apply Italiana to note labels (Top/Heart/Base) |
| Burn gauge label | Uses `var(--heading-font-family)` | Could use `--font-accent` for "Ethereal Memory" label | `snippets/burn-gauge.liquid:14` | ⚠️ | Apply Italiana to burn narrative labels |
| Product description max-width | No explicit max-width constraint | ~65ch or 600px max-width for readability | `sections/product-content.liquid` | ⚠️ | Add container constraint on PDP description |

---

## C) Buttons

| Component | Observed | Expected | Source File | Status | Fix Plan |
|---|---|---|---|---|---|
| View All / primary CTA button | `.button--primary` uses `rgb(126,107,143)` via theme.liquid !important | Dusty accent #7E6B8F | `layout/theme.liquid:111` | ✅ | — |
| Button hover (Match Strike) | Radial gold glow `rgba(200,151,58,0.35)` via `::after` | Hover-to-Light ritual | `layout/theme.liquid:121` | ✅ | — |
| ATC button on PDP | `#7E6B8F` (dusty accent) in templates/product.json | Dusty accent | `templates/product.json` | ✅ | — |
| Buy-now button | `#E6E1EB` (mist) background, `#1E1A20` text | Mist secondary | `templates/product.json` | ✅ | — |

---

## D) Lavender Accent Strips

| Component | Observed | Expected | Source File | Status | Fix Plan |
|---|---|---|---|---|---|
| Announcement bar background | Transparent (rgba(0,0,0,0)) — no default mist | Should use `#E6E1EB` (mist) for top strip | `sections/announcement-bar.liquid` | ⚠️ | Add mist background via CSS or section settings |
| Static-text-with-icons background | No default mist | Should use `#E6E1EB` (mist) as bottom section strip | `sections/static-text-with-icons.liquid` | ⚠️ | Add mist background via CSS override |
| Slideshow hero overlay | `#E6E1EB` with 60% opacity ✅ | Mist overlay | `templates/index.json` | ✅ | — |
| Secondary background CSS var | `rgb(230,225,235)` = mist | Correct | `snippets/css-variables.liquid:185` | ✅ | — |

---

## E) Icon System

| Component | Observed | Expected | Source File | Status | Fix Plan |
|---|---|---|---|---|---|
| Icon SVG definition system | 50+ icons, `stroke="currentColor"` inheritance | Dynamic color from CSS context | `snippets/icon.liquid` | ✅ | — |
| Icon stroke width | `stroke-width="{{ settings.icon_stroke_width }}"` | Configurable | `snippets/icon.liquid` | ✅ | — |
| Header icons (search/cart/account) | Use `currentColor` = charcoal (#1E1A20) | Correct for header context | `snippets/icon.liquid` | ✅ | — |
| Trust badge icons | Configurable per block; use `currentColor` | Should be Dusty accent (#7E6B8F) or muted (#5A5560) | `sections/static-text-with-icons.liquid:95` | ⚠️ | Set icon container color to Dusty accent in DCube style block |
| **Bee icon** | **No `dcube-bee` case in icon.liquid** | DCube brand bee SVG for trust badges / rituals | `snippets/icon.liquid` | ❌ | Add `when 'dcube-bee'` SVG case |
| Quick-buy icon | Dynamic via `settings.quick_buy_icon` | Correct | `snippets/product-item.liquid:117` | ✅ | — |

---

## F) PDP Layout

| Component | Observed | Expected | Source File | Status | Fix Plan |
|---|---|---|---|---|---|
| Scent chapter snippet | Rendered in product-content.liquid | Present with bloom rings, scent hierarchy | `sections/product-content.liquid` / `snippets/scent-chapter.liquid` | ✅ | — |
| Burn gauge snippet | Rendered in product-content.liquid | Present with 45-hour markers | `sections/product-content.liquid` / `snippets/burn-gauge.liquid` | ✅ | — |
| Scent chapter + burn gauge grid | `display: grid; grid-template-columns: 1fr 1fr; max-width: 900px` | Two-column side-by-side | `sections/product-content.liquid:338` | ✅ | — |
| Scent chapter margin centering | `margin-top: 60px; margin-bottom: 60px` in inline container | Sanctuary spacing | `sections/product-content.liquid:339` | ✅ | — |
| **Product description centering** | No `margin: auto` or `max-width` on description block | Centered column, ~600px max | `sections/product-content.liquid` | ⚠️ | Add max-width + margin:auto to description container |
| Scent/burn container centering | `max-width: 900px` but no `margin: auto` | Should be centered within page | `sections/product-content.liquid:339` | ⚠️ | Add `margin: 60px auto` |

---

## G) General Drift

| Component | Observed | Expected | Source File | Status | Fix Plan |
|---|---|---|---|---|---|
| Heading color enforcement | `--heading-color: 30,26,32` with !important | Charcoal #1E1A20 | `layout/theme.liquid:93` | ✅ | — |
| Product card title color | `rgb(30,26,32) !important` on `.product-item-meta__title` | Charcoal text | `layout/theme.liquid:237` | ✅ | — |
| Border color token | `--border-color: 209,201,219` | Correct Dusty border token | `snippets/css-variables.liquid:190` | ✅ | — |
| Noise grain overlay | `body::before` with `opacity:0.02; mix-blend-mode:overlay` | Sanctuary atmosphere | `layout/theme.liquid (body block)` | ✅ | — |
| Homepage index.json | Slideshow + unboxing-product + featured-collections | Correct section order | `templates/index.json` | ✅ | — |
