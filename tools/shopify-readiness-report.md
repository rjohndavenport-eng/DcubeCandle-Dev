# Shopify Readiness Report — DCube Candle Co.

**Date:** 2026-02-08
**Project:** DCube Candle Co. (becandle)
**Current Status:** Static HTML prototype with custom component includes system
**Target Platform:** Shopify Online Store 2.0

---

## Executive Summary

DCube is a premium candle e-commerce site with a deeply personal brand story (tribute to Brianna, bee motif). The current implementation is a well-structured static HTML prototype using a custom client-side includes system. The design is clean, accessible, and premium—excellent foundation for Shopify conversion.

**Readiness Score: 8/10**
- ✅ Clean, semantic HTML
- ✅ Component-based architecture (maps well to Shopify sections/snippets)
- ✅ Premium design with consistent brand identity
- ✅ Accessible focus states and ARIA labels
- ⚠️ No real product data (currently placeholder text)
- ⚠️ Client-side includes.js will be replaced by Liquid
- ⚠️ No cart/checkout functionality (will use Shopify native)

---

## Current Site Structure

### Pages Inventory
1. **Home** (`dcube-home.html`)
   - Hero with CTA
   - Benefits section
   - Story section
   - Featured products grid (4 products)

2. **Shop/Collection** (`dcube-shop.html`)
   - Page hero
   - Filter bar (scent, sort)
   - Product grid (12 products with quick-add cards)
   - Load more button

3. **Product Detail** (`dcube-product.html`)
   - Breadcrumb
   - Gallery (main image + thumbnails)
   - Product info (title, price, description)
   - Handmade badge with bee icon
   - Quantity selector
   - Add to cart / Buy now buttons
   - Collapsible detail sections (details, care, shipping)
   - Product story section
   - Related products (4 cards)

4. **About/Story** (`dcube-about.html`)
   - Page hero
   - Long-form story content
   - Family photos
   - Values grid (3 cards: Quality, Intention, Community)
   - Quote section
   - CTA block

### Component Architecture

**Common Components** (`components/common/`)
- `announcement.html` — Top announcement bar
- `header.html` — Main site header (logo, nav, cart/search icons)
- `footer.html` — Site footer (4 columns + bee mark)
- `bee-divider.html` — Decorative section divider

**Section Components** (`components/sections/`)
- `home-hero.html` — Homepage hero with image + CTA
- `home-benefits.html` — Benefits/features section
- `home-story.html` — Brand story teaser
- `page-hero.html` — Generic page header (accepts data-title, data-subtitle)
- `cta-block.html` — Reusable CTA block

**Card Components** (`components/cards/`)
- `product-card-basic.html` — Simple product card (image, name, price)
- `product-card-quickadd.html` — Product card with quick-add functionality
- `product-card-related.html` — Related product card variant

**Includes System** (`assets/js/includes.js`)
- Custom client-side component resolution
- Uses `data-include` + `data-*` attributes for variable injection
- Template variables: `{{variable}}` syntax
- **Will be replaced by Shopify Liquid during conversion**

---

## Shopify Online Store 2.0 Mapping

### What Maps Directly

| Current | Shopify OS 2.0 Equivalent | Notes |
|---------|---------------------------|-------|
| `dcube-home.html` | `templates/index.json` | JSON template referencing sections |
| `dcube-shop.html` | `templates/collection.json` | Collection template |
| `dcube-product.html` | `templates/product.json` | Product template |
| `dcube-about.html` | `templates/page.about.json` | Named page template |
| `components/common/header.html` | `sections/header.liquid` | Global section |
| `components/common/footer.html` | `sections/footer.liquid` | Global section |
| `components/sections/*.html` | `sections/*.liquid` | Reusable sections |
| `components/cards/*.html` | `snippets/*.liquid` | Included snippets |
| `assets/css/site.css` | `assets/site.css` | Direct copy (update asset URLs) |
| `assets/js/includes.js` | **DELETE** | Replaced by Liquid |

### What Must Change for OS 2.0 Compliance

#### 1. Template Structure
**Current:** Full HTML documents with `<html>`, `<head>`, `<body>`
**Required:** JSON templates that reference sections

**Example conversion:**
```json
{
  "sections": {
    "announcement": { "type": "announcement" },
    "header": { "type": "header" },
    "hero": { "type": "hero" },
    "footer": { "type": "footer" }
  },
  "order": ["announcement", "header", "hero", "footer"]
}
```

#### 2. Component Includes → Liquid Sections/Snippets
**Current:** `<div data-include="components/cards/product-card.html" data-name="{{name}}"></div>`
**Required:** `{% render 'product-card', name: product.title %}`

#### 3. Data Sources
**Current:** Hardcoded product data in HTML
**Required:** Shopify product/collection objects

**Example:**
```liquid
{% for product in collection.products %}
  {% render 'product-card', product: product %}
{% endfor %}
```

#### 4. Layout Files
**Current:** Full HTML structure repeated in each page
**Required:** Single `layout/theme.liquid` with `{{ content_for_header }}` and `{{ content_for_layout }}`

#### 5. Asset References
**Current:** `href="assets/css/site.css"`
**Required:** `{{ 'site.css' | asset_url | stylesheet_tag }}`

#### 6. URLs
**Current:** `href="/dcube-shop.html"`
**Required:** `{{ routes.collections_url }}` or `{{ collection.url }}`

#### 7. Images
**Current:** Direct file references (`dcube_350x.webp`)
**Required:** Shopify CDN URLs with image filters
- Logo: `{{ section.settings.logo | image_url: width: 350 }}`
- Product images: `{{ product.featured_image | image_url: width: 800 }}`

#### 8. Navigation
**Current:** Hardcoded nav links
**Required:** Liquid linklist
```liquid
{% for link in linklists.main-menu.links %}
  <a href="{{ link.url }}">{{ link.title }}</a>
{% endfor %}
```

#### 9. Settings Schema
**Current:** None
**Required:** `config/settings_schema.json` + section schema blocks

#### 10. Cart Functionality
**Current:** Placeholder icons
**Required:**
- Cart drawer section with AJAX API
- `POST /cart/add.js` for add-to-cart
- `{{ cart.item_count }}` for cart badge

---

## Accessibility Audit

### ✅ Current Strengths
1. **Focus States:** All interactive elements have visible focus outlines (`outline: 2px solid var(--honey-gold)`)
2. **ARIA Labels:** Icons have `aria-label` attributes (search, cart)
3. **Semantic HTML:** Proper use of `<header>`, `<main>`, `<footer>`, `<nav>`, `<section>`
4. **Alt Text Hooks:** Image placeholders ready for alt text
5. **Keyboard Navigation:** Standard HTML links/buttons work with keyboard

### ⚠️ Gaps & Quick Wins

#### HIGH PRIORITY
1. **Missing Alt Text on Images**
   - Current: Most images are placeholders with no alt attributes
   - Fix: Add meaningful alt text to all images
   - Example: `<img src="..." alt="Lavender Dreams candle in frosted glass vessel with lit flame">`

2. **Color Contrast (Purple on Cream)**
   - Current: Some text uses `--color-accent` (#8f6db7) on light backgrounds
   - WCAG AA: Requires 4.5:1 contrast for normal text
   - Check: Test all accent-colored text against backgrounds
   - Quick win: Use `--color-accent-punch` (#5f3a8f) for better contrast

3. **Form Labels**
   - Current: Quantity selector has visible label ✅
   - Missing: Search input needs associated label (currently icon-only)
   - Fix: Add visually-hidden label or `aria-label` to search input

4. **Collapsible Sections (Product Details)**
   - Current: Uses div with visual indicator (▾)
   - Missing: `aria-expanded` attribute
   - Fix: Convert to `<button>` with proper ARIA states
   ```html
   <button aria-expanded="false" aria-controls="detail-content-1">
     Details
   </button>
   <div id="detail-content-1" hidden>...</div>
   ```

#### MEDIUM PRIORITY
5. **Skip to Content Link**
   - Missing: No skip link for keyboard users
   - Fix: Add visually-hidden skip link at top of theme.liquid
   ```html
   <a href="#main-content" class="skip-link">Skip to content</a>
   ```

6. **Heading Hierarchy**
   - Current: Appears correct (need to verify after Liquid conversion)
   - Check: Ensure no heading levels are skipped (h1 → h2 → h3, not h1 → h3)

7. **Loading States**
   - Current: "Load More" button has no loading indicator
   - Fix: Add `aria-live="polite"` region for dynamic content loading

8. **Mobile Navigation**
   - Current: No visible mobile menu implementation
   - Required: Add hamburger menu with proper ARIA (`aria-expanded`, `aria-controls`)

#### LOW PRIORITY (Nice to Have)
9. **Reduced Motion**
   - Add `@media (prefers-reduced-motion: reduce)` for animations
   - Disable bee watermark animations if any

10. **Focus Management**
    - When modal/drawer opens, trap focus inside
    - Return focus to trigger element on close

---

## Technical Debt & Blockers

### Minor
- Product images are placeholders (need real product photography)
- No contact page (referenced in nav but missing)
- Hardcoded copyright year (2024 — should be dynamic)
- Legacy image files in root (move to /assets after Shopify conversion)

### None (Blockers)
- No authentication/login blockers
- No external API dependencies
- Clean, maintainable codebase
- Well-documented refactor notes

---

## Brand Identity Preservation Checklist

✅ **Typography**
- Cormorant Garamond (serif, headings)
- Inter (sans-serif, body)
- Italiana (accent, decorative)
- → Add to `{{ 'font-name' | font_url | stylesheet_tag }}` in theme.liquid

✅ **Color Palette**
- Lavender/purple primary (#8f6db7, #5f3a8f)
- Cream/off-white background (#faf9f6)
- Gold accents (#d4af6a)
- → Preserve CSS custom properties in assets/site.css

✅ **Bee Motif**
- Line-art bee SVG used throughout (`.bee-mark`, `.bee-watermark`)
- → Convert to Liquid snippet `{% render 'icon-bee' %}`
- → Consider adding to Shopify icon library

✅ **Premium Aesthetic**
- Generous whitespace
- Soft shadows on cards
- Serif headings
- → Maintain exact spacing/shadow values from site.css

✅ **Tone of Voice**
- Warm, personal, heartfelt
- Family-centered, tribute-focused
- → Preserve exact copy from about page in Shopify metafields

---

## Recommended Timeline

### Phase 1: Foundation (Day 1-2)
- ✅ Create Shopify theme folder structure
- ✅ Build theme.liquid layout
- ✅ Convert header/footer to sections
- ✅ Migrate CSS/fonts to assets

### Phase 2: Templates (Day 3-5)
- Create JSON templates (index, collection, product, page)
- Convert section components to Liquid sections
- Convert card components to Liquid snippets
- Test with sample products

### Phase 3: Data & Settings (Day 6-7)
- Create Shopify products (10-15 candles)
- Add product metafields (scent family, burn time, etc.)
- Configure settings_schema.json
- Set up navigation menus

### Phase 4: Cart & Checkout (Day 8-9)
- Build cart drawer section
- Implement AJAX add-to-cart
- Test checkout flow (Shopify native)

### Phase 5: Polish (Day 10-12)
- Accessibility audit & fixes
- Mobile responsive testing
- Performance optimization (lazy loading, image optimization)
- Cross-browser testing

### Phase 6: Launch Prep (Day 13-14)
- SEO setup (meta tags, JSON-LD)
- Social media integration
- Analytics setup (GA4, Meta Pixel)
- Domain setup & SSL

---

## Success Metrics

**Pre-Launch:**
- ✅ WCAG 2.1 AA compliance (90%+ via automated tools)
- ✅ Lighthouse score >90 (performance, accessibility, SEO)
- ✅ All pages render correctly in Chrome, Firefox, Safari
- ✅ Mobile responsive breakpoints function properly

**Post-Launch:**
- 📊 Page load time <2s (Shopify CDN + optimized images)
- 📊 Zero console errors
- 📊 Cart abandonment <70%
- 📊 Conversion rate baseline established

---

## Next Steps

1. ✅ **Read this report**
2. 📄 Review Shopify Theme Plan (tools/shopify-theme-plan.md)
3. 📄 Review SEO + Social Plan (tools/seo-social-plan.md)
4. 🔧 Set up Shopify store (if not done)
5. 🚀 Begin Phase 1 implementation

---

**Questions? Reference:**
- `REFRACTOR_README.md` for current component system
- `tools/shopify-theme-plan.md` for detailed file structure
- `tools/shopify-cli-setup.md` for CLI commands
