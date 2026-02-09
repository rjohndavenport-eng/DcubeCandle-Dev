# DCube Shopify Theme — Online Store 2.0

**Status:** Foundational scaffolding complete ✅
**Theme Version:** 1.0.0
**Shopify Compatibility:** Online Store 2.0
**Brand:** DCube Candle Co.

---

## What's Included

This is a minimal but valid Shopify OS 2.0 theme scaffold that preserves the DCube brand identity from the static HTML prototype.

### Directory Structure

```
shopify-theme-dcube/
├── assets/
│   ├── site.css          # Complete DCube styles (copied from prototype)
│   └── site.js           # Cart drawer, quantity controls, gallery
│
├── config/
│   ├── settings_schema.json  # Theme customizer settings (colors, logo, social)
│   └── settings_data.json    # (Auto-generated after first push)
│
├── layout/
│   └── theme.liquid      # Master layout with DCube fonts, meta tags
│
├── locales/
│   └── en.default.json   # English translations
│
├── sections/
│   ├── announcement-bar.liquid  # Top announcement bar
│   ├── header.liquid            # Global header (logo, nav, cart)
│   ├── footer.liquid            # Global footer (4 menu columns + bee)
│   ├── hero.liquid              # Homepage hero section
│   ├── main-collection.liquid   # Collection/shop page
│   ├── main-product.liquid      # Product detail page
│   └── main-page.liquid         # Generic page template
│
├── snippets/
│   ├── meta-tags.liquid     # SEO meta tags + Open Graph + JSON-LD
│   ├── icon-bee.liquid      # Bee motif SVG
│   ├── icon-search.liquid   # Search icon
│   ├── icon-cart.liquid     # Cart icon
│   └── product-card.liquid  # Reusable product card
│
└── templates/
    ├── index.json       # Homepage (with hero section)
    ├── collection.json  # Collection page
    ├── product.json     # Product detail page
    └── page.json        # Generic page
```

---

## Brand Identity Preserved

✅ **Typography**
- Cormorant Garamond (serif, headings)
- Inter (sans-serif, body)
- Italiana (accent font)

✅ **Color Palette**
- Lavender primary: `#8f6db7`
- Lavender soft: `#efe7f9`
- Gold accent: `#d4af6a`
- Cream background: `#faf9f6`
- Charcoal text: `#2a2a2a`

✅ **Bee Motif**
- SVG icon in `snippets/icon-bee.liquid`
- Used in footer and product pages
- `.bee-mark` and `.bee-watermark` CSS classes ready

✅ **Premium Aesthetic**
- All CSS custom properties preserved
- Card shadows, spacing, typography maintained

---

## Getting Started

### Prerequisites
- Shopify store created
- Shopify CLI installed (✅ detected on this machine)
- Git installed (optional, recommended)

### Step 1: Authenticate with Shopify
```bash
shopify auth login
```

### Step 2: Start Development Server
```bash
cd /d/onedrive/Desktop/becandle/shopify-theme-dcube
shopify theme dev
```

This will:
- Sync theme to Shopify development theme
- Start local preview at `http://127.0.0.1:9292`
- Hot-reload changes as you edit files

### Step 3: Push to Shopify (Unpublished Draft)
```bash
shopify theme push --unpublished
```

This creates a draft theme in Shopify admin (safe, doesn't affect live site).

### Step 4: Customize in Shopify Admin
1. Go to Shopify Admin → Online Store → Themes
2. Find your unpublished theme
3. Click "Customize"
4. Add logo, adjust colors, configure sections
5. Preview on mobile/desktop

### Step 5: Publish When Ready
```bash
shopify theme publish --theme=<THEME_ID>
```

⚠️ **WARNING:** This makes the theme LIVE on your store. Test thoroughly first!

---

## What's Working

✅ **Layout & Structure**
- Master layout (theme.liquid) with DCube fonts
- Header with logo, navigation, cart icon
- Footer with menu columns and bee mark
- Skip-to-content link (accessibility)

✅ **Homepage**
- Hero section with image, heading, CTA button
- Fully customizable via Shopify theme editor

✅ **Collection/Shop Page**
- Product grid (12 per page)
- Pagination support
- Uses reusable product-card snippet

✅ **Product Detail Page**
- Image gallery with thumbnails
- Product info (title, price, description)
- Quantity selector with +/− controls
- Add-to-cart form
- Handmade badge with bee icon
- Breadcrumb navigation

✅ **SEO & Meta Tags**
- Open Graph tags (Facebook, LinkedIn)
- Twitter Card tags
- JSON-LD structured data (Organization, Product)
- Canonical URLs
- Dynamic page titles

✅ **Accessibility**
- Semantic HTML
- ARIA labels on icons
- Focus states (keyboard navigation)
- Skip-to-content link

---

## What's NOT Yet Implemented

These features exist in the static prototype but need Shopify-specific implementation:

❌ **Cart Drawer**
- Section created (`sections/cart-drawer.liquid`) but not built
- JavaScript hooks exist in `site.js`
- **Next step:** Build cart drawer section with Shopify AJAX Cart API

❌ **Product Image Gallery Switching**
- Thumbnails render but click event needs product images array
- **Next step:** Implement in `site.js` using Shopify product object

❌ **Filter/Sort on Collection Page**
- No filter dropdown yet
- **Next step:** Add collection filtering using Shopify tags

❌ **Mobile Navigation**
- No hamburger menu yet
- **Next step:** Add mobile menu drawer

❌ **Related Products Section**
- Not yet created
- **Next step:** Create `sections/related-products.liquid`

❌ **Benefits/Story Sections**
- Homepage only has hero section
- **Next step:** Convert `components/sections/home-benefits.html` to Liquid section

❌ **About Page Template**
- Uses generic `page.json` template
- **Next step:** Create `templates/page.about.json` with custom sections

❌ **Real Product Data**
- No products exist in Shopify yet
- **Next step:** Create 10-15 products in Shopify admin

---

## Day 2 Worklist

**Priority 1 (Core Functionality):**
1. [ ] Create 10-15 products in Shopify admin with images
2. [ ] Set up collections (All Candles, Best Sellers, Scent Families)
3. [ ] Configure navigation menus in Shopify
4. [ ] Build cart drawer section
5. [ ] Test add-to-cart → checkout flow
6. [ ] Add mobile hamburger menu

**Priority 2 (Content & Sections):**
7. [ ] Convert home-benefits section to Liquid
8. [ ] Convert home-story section to Liquid
9. [ ] Create about page template with custom sections
10. [ ] Create related-products section
11. [ ] Add product metafields (burn time, scent family, etc.)

**Priority 3 (Polish):**
12. [ ] Upload real product photography
13. [ ] Write product descriptions
14. [ ] Add collection filtering/sorting
15. [ ] Create 404 page template
16. [ ] Test on mobile devices
17. [ ] Run Lighthouse audit
18. [ ] Fix accessibility issues
19. [ ] Set up Google Analytics
20. [ ] Configure shipping rates

---

## Theme Customization

### Adding Colors
1. Go to Shopify Admin → Themes → Customize
2. Click theme settings (usually bottom of sidebar)
3. Navigate to "Colors" section
4. Adjust lavender, gold, background colors
5. Changes apply globally via CSS custom properties

### Changing Logo
1. In theme customizer, go to "Logo & Brand"
2. Upload logo image (recommended: 600×600px PNG with transparency)
3. Adjust logo width slider

### Editing Hero Section
1. In theme customizer, select "Hero" section on homepage
2. Upload hero image (recommended: 2000×1200px)
3. Edit heading, subheading, button text
4. Link button to collection URL

### Adding Footer Menu Columns
1. In theme customizer, select "Footer" section
2. Click "Add block" → "Menu column"
3. Set heading and choose menu (create menus in Navigation settings)

---

## Troubleshooting

### "Theme not syncing"
- Check internet connection
- Verify `shopify auth login` is valid
- Restart `shopify theme dev`

### "Liquid syntax error"
- Run `shopify theme check` to validate
- Check for unclosed `{% %}` tags
- Review Shopify Liquid documentation

### "CSS not loading"
- Verify `assets/site.css` exists
- Check theme.liquid references `{{ 'site.css' | asset_url | stylesheet_tag }}`
- Hard refresh browser (Ctrl+Shift+R)

### "Products not showing"
- Create products in Shopify admin first
- Assign products to collections
- Verify collection handle matches template settings

---

## Resources

**Documentation:**
- [Shopify Theme Architecture](https://shopify.dev/docs/themes/architecture)
- [Liquid Reference](https://shopify.dev/docs/api/liquid)
- [CLI Commands](https://shopify.dev/docs/themes/tools/cli)

**Project Docs:**
- `/tools/shopify-readiness-report.md` — Full site audit
- `/tools/shopify-theme-plan.md` — Detailed theme architecture
- `/tools/seo-social-plan.md` — SEO & social media strategy
- `/tools/shopify-cli-setup.md` — CLI commands reference

**Support:**
- [Shopify Community Forums](https://community.shopify.com/)
- [Shopify Partner Slack](https://shopifypartners.slack.com)

---

## Version History

### v1.0.0 (Current)
- Initial scaffolding
- Layout, header, footer sections
- Hero section (homepage)
- Collection, product, page templates
- SEO meta tags (OG, Twitter, JSON-LD)
- Product card snippet
- Theme customizer settings
- DCube brand styles (CSS)

---

**Questions?** Reference the `/tools` directory documentation or run `shopify theme check` to validate.
