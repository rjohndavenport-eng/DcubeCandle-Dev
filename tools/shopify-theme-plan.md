# Shopify Theme Plan — DCube Candle Co.

**Theme Name:** dcube-theme
**Shopify Version:** Online Store 2.0
**Base Architecture:** Custom (built from scratch, not Dawn fork)
**Design System:** Preserved from static prototype

---

## Required Shopify Theme Structure

```
shopify-theme-dcube/
├── assets/
│   ├── site.css                    # Main stylesheet (from current assets/css/)
│   ├── site.js                     # Theme JavaScript (cart, mobile nav)
│   ├── dcube-logo.webp             # Logo
│   ├── icon-bee.svg                # Bee motif icon
│   └── [product images]            # Migrated from root & Shopify CDN
│
├── config/
│   ├── settings_schema.json        # Theme customizer settings
│   └── settings_data.json          # Theme setting values (auto-generated)
│
├── layout/
│   └── theme.liquid                # Master layout template
│
├── locales/
│   └── en.default.json             # Translations (English default)
│
├── sections/
│   ├── announcement-bar.liquid     # Top announcement
│   ├── header.liquid               # Global header (logo, nav, cart)
│   ├── footer.liquid               # Global footer (links, bee mark)
│   ├── hero.liquid                 # Hero section (home, pages)
│   ├── benefits.liquid             # Product benefits/features grid
│   ├── story-block.liquid          # Brand story section
│   ├── featured-products.liquid    # Product grid (home)
│   ├── product-grid.liquid         # Collection product grid
│   ├── product-details.liquid      # Product page main content
│   ├── product-gallery.liquid      # Product image gallery
│   ├── related-products.liquid     # Related products section
│   ├── page-hero.liquid            # Generic page header
│   ├── story-content.liquid        # About page long-form content
│   ├── values-grid.liquid          # About page values (3 cards)
│   ├── quote-section.liquid        # Quote callout block
│   ├── cta-block.liquid            # Call-to-action section
│   └── cart-drawer.liquid          # Slide-out cart
│
├── snippets/
│   ├── icon-bee.liquid             # Bee SVG icon
│   ├── icon-search.liquid          # Search icon
│   ├── icon-cart.liquid            # Cart icon
│   ├── product-card.liquid         # Standard product card
│   ├── product-card-quickadd.liquid # Product card with quick add
│   ├── product-card-related.liquid  # Related product card variant
│   ├── bee-divider.liquid          # Decorative bee divider
│   ├── meta-tags.liquid            # SEO meta tags + JSON-LD
│   └── color-swatches.liquid       # Product color options (future)
│
├── templates/
│   ├── index.json                  # Homepage template
│   ├── collection.json             # Collection/shop template
│   ├── product.json                # Product detail template
│   ├── page.json                   # Default page template
│   ├── page.about.json             # About/story page template
│   ├── page.contact.json           # Contact page template (future)
│   ├── cart.json                   # Cart page template
│   └── 404.json                    # 404 error page
│
└── config.yml                      # Shopify theme metadata (optional)
```

---

## Section Architecture (Detailed)

### 1. Global Sections

#### `sections/announcement-bar.liquid`
**Purpose:** Top announcement bar (free shipping, promos)
**Current:** `components/common/announcement.html`
**Schema Settings:**
- `show_announcement` (checkbox)
- `announcement_text` (text)
- `announcement_link` (url)

**Liquid:**
```liquid
{% if section.settings.show_announcement %}
  <div class="announcement-bar">
    {% if section.settings.announcement_link != blank %}
      <a href="{{ section.settings.announcement_link }}">
        {{ section.settings.announcement_text }}
      </a>
    {% else %}
      {{ section.settings.announcement_text }}
    {% endif %}
  </div>
{% endif %}

{% schema %}
{
  "name": "Announcement Bar",
  "settings": [
    {
      "type": "checkbox",
      "id": "show_announcement",
      "label": "Show announcement",
      "default": true
    },
    {
      "type": "text",
      "id": "announcement_text",
      "label": "Announcement text",
      "default": "Free shipping on orders over $75"
    },
    {
      "type": "url",
      "id": "announcement_link",
      "label": "Link (optional)"
    }
  ]
}
{% endschema %}
```

---

#### `sections/header.liquid`
**Purpose:** Site header with logo, navigation, search, cart
**Current:** `components/common/header.html`
**Schema Settings:**
- `logo` (image_picker)
- `logo_width` (range, 100-300px)
- `menu` (link_list) — defaults to 'main-menu'

**Liquid Structure:**
```liquid
<header class="site-header site-header--dcube">
  <div class="site-header__inner">
    {%- if section.settings.logo -%}
      <a href="/" class="logo site-logo">
        <img src="{{ section.settings.logo | image_url: width: section.settings.logo_width }}"
             alt="{{ shop.name }}"
             width="{{ section.settings.logo_width }}">
      </a>
    {%- else -%}
      <a href="/" class="logo site-logo logo-text">{{ shop.name }}</a>
    {%- endif -%}

    <div class="site-header__nav-row">
      <nav class="site-nav">
        {%- for link in linklists[section.settings.menu].links -%}
          <a href="{{ link.url }}">{{ link.title }}</a>
        {%- endfor -%}
      </nav>

      <div class="header-icons">
        <a href="/search" aria-label="Search">
          {% render 'icon-search' %}
        </a>
        <a href="#cart-drawer" aria-label="Cart ({{ cart.item_count }})">
          {% render 'icon-cart' %}
          {%- if cart.item_count > 0 -%}
            <span class="cart-count">{{ cart.item_count }}</span>
          {%- endif -%}
        </a>
      </div>
    </div>
  </div>
</header>
```

**Mobile Menu:** Add hamburger toggle + drawer (site.js)

---

#### `sections/footer.liquid`
**Purpose:** Site footer with links, newsletter, bee mark
**Current:** `components/common/footer.html`
**Schema:** 4 menu blocks (Shop, About, Support, Connect)

**Liquid Structure:**
```liquid
<footer class="site-footer site-footer--dcube">
  <div class="footer-content">
    {%- for block in section.blocks -%}
      {%- case block.type -%}
        {%- when 'menu' -%}
          <div class="footer-column">
            <h4>{{ block.settings.title }}</h4>
            <ul>
              {%- for link in linklists[block.settings.menu].links -%}
                <li><a href="{{ link.url }}">{{ link.title }}</a></li>
              {%- endfor -%}
            </ul>
          </div>
      {%- endcase -%}
    {%- endfor -%}
  </div>

  <div class="footer-bottom">
    <div class="footer-bee bee-mark" aria-hidden="true">
      {% render 'icon-bee' %}
    </div>
    <p>© {{ 'now' | date: '%Y' }} {{ shop.name }}. All rights reserved.</p>
  </div>
</footer>

{% schema %}
{
  "name": "Footer",
  "blocks": [
    {
      "type": "menu",
      "name": "Menu column",
      "settings": [
        { "type": "text", "id": "title", "label": "Heading" },
        { "type": "link_list", "id": "menu", "label": "Menu" }
      ]
    }
  ]
}
{% endschema %}
```

---

### 2. Homepage Sections

#### `sections/hero.liquid`
**Purpose:** Homepage hero with image, heading, CTA
**Current:** `components/sections/home-hero.html`
**Schema Settings:**
- `image` (image_picker)
- `heading` (text)
- `subheading` (textarea)
- `button_text` (text)
- `button_link` (url)

**Liquid:**
```liquid
<section class="hero">
  <div class="hero-image bee-watermark">
    {%- if section.settings.image -%}
      <img class="hero-image-media"
           src="{{ section.settings.image | image_url: width: 2000 }}"
           alt="{{ section.settings.heading }}">
    {%- endif -%}
  </div>
  <div class="hero-content">
    <h1>{{ section.settings.heading }}</h1>
    <p>{{ section.settings.subheading }}</p>
    <a href="{{ section.settings.button_link }}" class="btn btn-primary btn-wax-seal">
      {{ section.settings.button_text }}
    </a>
  </div>
</section>
```

---

#### `sections/featured-products.liquid`
**Purpose:** Featured product grid on homepage
**Current:** Inline product grid in dcube-home.html
**Settings:**
- `heading` (text)
- `collection` (collection picker)
- `products_to_show` (range, 4-12)

**Liquid:**
```liquid
<section class="featured">
  <div class="featured-header">
    <h2>{{ section.settings.heading }}</h2>
  </div>
  <div class="product-grid">
    {%- assign collection = collections[section.settings.collection] -%}
    {%- for product in collection.products limit: section.settings.products_to_show -%}
      {% render 'product-card', product: product %}
    {%- endfor -%}
  </div>
  <div class="featured-cta">
    <a href="{{ collection.url }}" class="btn btn-secondary">View All Candles</a>
  </div>
</section>
```

---

### 3. Product Sections

#### `sections/product-details.liquid`
**Purpose:** Main product content (title, price, form)
**Current:** Product info section from dcube-product.html

**Liquid Structure:**
```liquid
<section class="product-detail">
  <div class="product-info">
    <h1>{{ product.title }}</h1>
    <div class="product-price">{{ product.price | money }}</div>
    <div class="product-description">{{ product.description }}</div>

    <div class="handmade-badge">
      <span class="bee-icon bee-mark" aria-hidden="true">
        {% render 'icon-bee' %}
      </span>
      Handcrafted with love
    </div>

    <form action="/cart/add" method="post" class="product-form">
      <input type="hidden" name="id" value="{{ product.selected_or_first_available_variant.id }}">

      <div class="quantity-selector">
        <label>Quantity:</label>
        <div class="quantity-controls">
          <button type="button" data-qty-decrement>−</button>
          <input type="number" name="quantity" value="1" min="1">
          <button type="button" data-qty-increment>+</button>
        </div>
      </div>

      <button type="submit" class="btn btn-primary">
        {%- if product.available -%}
          Add to Cart
        {%- else -%}
          Sold Out
        {%- endif -%}
      </button>
      <button type="button" class="btn btn-secondary" data-buy-now>Buy Now</button>
    </form>

    {%- if product.metafields.details -%}
      <div class="product-details">
        {%- render 'product-collapsible-details', product: product -%}
      </div>
    {%- endif -%}
  </div>
</section>
```

**JavaScript:** Handle quantity increment/decrement, AJAX cart add in site.js

---

#### `sections/product-gallery.liquid`
**Purpose:** Product image gallery
**Current:** Gallery div in dcube-product.html

**Liquid:**
```liquid
<div class="gallery">
  <div class="main-image">
    <img src="{{ product.featured_image | image_url: width: 800 }}"
         alt="{{ product.featured_image.alt | escape }}">
  </div>
  <div class="thumbnails">
    {%- for image in product.images -%}
      <button class="thumbnail {% if forloop.first %}active{% endif %}"
              data-image-index="{{ forloop.index0 }}">
        <img src="{{ image | image_url: width: 100 }}"
             alt="{{ image.alt | escape }}">
      </button>
    {%- endfor -%}
  </div>
</div>
```

---

### 4. Collection Section

#### `sections/product-grid.liquid`
**Purpose:** Collection page product grid with filters
**Current:** dcube-shop.html product grid

**Liquid:**
```liquid
<section class="shop-section">
  {%- if section.settings.show_filters -%}
    <div class="filter-bar">
      <div class="filter-group">
        <select id="filter-tag">
          <option value="">Filter by Scent</option>
          {%- for tag in collection.all_tags -%}
            <option value="{{ tag | handle }}">{{ tag }}</option>
          {%- endfor -%}
        </select>
      </div>
      <select id="sort-by">
        <option value="manual">Sort by</option>
        <option value="price-ascending">Price: Low to High</option>
        <option value="price-descending">Price: High to Low</option>
        <option value="created-descending">Newest</option>
        <option value="best-selling">Best Selling</option>
      </select>
    </div>
  {%- endif -%}

  <div class="product-grid">
    {%- for product in collection.products -%}
      {% render 'product-card-quickadd', product: product %}
    {%- endfor -%}
  </div>

  {%- if paginate.pages > 1 -%}
    <div class="load-more">
      {%- if paginate.next -%}
        <a href="{{ paginate.next.url }}" class="btn">Load More Products</a>
      {%- endif -%}
    </div>
  {%- endif -%}
</section>
```

**Pagination:** Wrap in `{% paginate collection.products by 12 %}`

---

## Snippets (Reusable Components)

### `snippets/product-card.liquid`
**Purpose:** Standard product card
**Current:** `components/cards/product-card-basic.html`

**Liquid:**
```liquid
<a class="product-card product-card-link card"
   href="{{ product.url }}"
   aria-label="{{ product.title }}">
  <div class="product-image">
    {%- if product.featured_image -%}
      <img src="{{ product.featured_image | image_url: width: 400 }}"
           alt="{{ product.featured_image.alt | escape }}">
    {%- else -%}
      {{ 'product-1' | placeholder_svg_tag: 'placeholder' }}
    {%- endif -%}
  </div>
  <div class="product-info">
    <div class="product-name">{{ product.title }}</div>
    <div class="product-price">{{ product.price | money }}</div>
  </div>
</a>
```

---

### `snippets/meta-tags.liquid`
**Purpose:** SEO meta tags + Open Graph + JSON-LD
**See:** tools/seo-social-plan.md for full implementation

**Usage in theme.liquid:**
```liquid
<head>
  {% render 'meta-tags' %}
  <!-- other head content -->
</head>
```

---

## JSON Templates

### `templates/index.json`
**Homepage template**

```json
{
  "sections": {
    "announcement": {
      "type": "announcement-bar"
    },
    "header": {
      "type": "header"
    },
    "hero": {
      "type": "hero",
      "settings": {
        "heading": "Illuminate Every Moment",
        "subheading": "Hand-poured candles crafted with love to bring warmth and light into your home.",
        "button_text": "Shop Our Collection",
        "button_link": "/collections/all"
      }
    },
    "benefits": {
      "type": "benefits"
    },
    "bee-divider-1": {
      "type": "bee-divider"
    },
    "story": {
      "type": "story-block"
    },
    "bee-divider-2": {
      "type": "bee-divider"
    },
    "featured-products": {
      "type": "featured-products",
      "settings": {
        "heading": "Discover Our Signature Scents",
        "collection": "all",
        "products_to_show": 4
      }
    },
    "footer": {
      "type": "footer"
    }
  },
  "order": [
    "announcement",
    "header",
    "hero",
    "benefits",
    "bee-divider-1",
    "story",
    "bee-divider-2",
    "featured-products",
    "footer"
  ]
}
```

---

### `templates/product.json`
**Product detail template**

```json
{
  "sections": {
    "announcement": { "type": "announcement-bar" },
    "header": { "type": "header" },
    "main": {
      "type": "main-product",
      "blocks": [
        { "type": "breadcrumb" },
        { "type": "gallery" },
        { "type": "product-info" },
        { "type": "product-story" },
        { "type": "related-products" }
      ]
    },
    "footer": { "type": "footer" }
  },
  "order": ["announcement", "header", "main", "footer"]
}
```

---

## Data Sources & Product Architecture

### Shopify Products
**Create Collections:**
1. **All Candles** (all products)
2. **Best Sellers** (manual collection)
3. **New Arrivals** (auto: created_at < 30 days)
4. **Scent Families:**
   - Floral (lavender, rose)
   - Woody (cedarwood, palo santo)
   - Fresh (eucalyptus, coastal breeze)
   - Sweet (vanilla, honey, cinnamon)

### Product Metafields
**Namespace:** `custom.candle_details`

| Field | Type | Purpose |
|-------|------|---------|
| `scent_family` | single_line_text_field | Floral, Woody, Fresh, Sweet |
| `burn_time` | number_integer | Hours (e.g., 50) |
| `wax_type` | single_line_text_field | Natural Soy Wax |
| `wick_type` | single_line_text_field | Cotton Wick |
| `vessel_type` | single_line_text_field | Reusable Glass |
| `weight` | single_line_text_field | 8 oz |
| `care_instructions` | multi_line_text_field | Detailed care guide |
| `ingredients` | multi_line_text_field | Fragrance notes |

**Access in Liquid:**
```liquid
{{ product.metafields.custom.candle_details.burn_time }} hour burn time
```

---

### Theme Settings (config/settings_schema.json)

**Required Settings Groups:**
1. **Logo & Brand**
   - Logo image
   - Logo width
   - Favicon

2. **Colors**
   - Primary color (lavender)
   - Accent color (gold)
   - Background color (cream)
   - Text color (charcoal)

3. **Typography**
   - Heading font (Cormorant Garamond)
   - Body font (Inter)
   - Accent font (Italiana)

4. **Social Media**
   - Instagram URL
   - TikTok URL (optional)
   - Pinterest URL (optional)
   - Email

5. **Cart**
   - Enable cart drawer
   - Free shipping threshold

6. **Product Pages**
   - Show related products
   - Number of related products
   - Enable quick view

---

## Shopify CLI Workflow

### Initial Setup
```bash
cd /d/onedrive/Desktop/becandle
shopify theme init shopify-theme-dcube
cd shopify-theme-dcube
```

### Development
```bash
shopify theme dev
# Opens local preview at http://127.0.0.1:9292
```

### Push to Shopify
```bash
shopify theme push --unpublished
# Creates draft theme in Shopify admin
```

### Go Live
```bash
shopify theme publish
```

---

## Performance Optimizations

1. **Image Loading**
   - Use `loading="lazy"` on all images below fold
   - Serve WebP with fallback
   - Responsive images: `srcset` with multiple sizes

2. **CSS**
   - Keep site.css under 50KB
   - Inline critical CSS in theme.liquid <head>
   - Defer non-critical CSS

3. **JavaScript**
   - Minimal site.js (cart, mobile nav, gallery)
   - Use vanilla JS (no jQuery)
   - Load analytics async

4. **Fonts**
   - Preload critical fonts (Cormorant Garamond, Inter)
   - Use `font-display: swap`
   - Subset fonts if possible (Latin only)

5. **Third-Party Scripts**
   - Load GA4/Meta Pixel async
   - Defer Instagram embed if used

---

## Day 2 Implementation Checklist

**After scaffolding is complete:**

- [ ] Create 10-15 products in Shopify admin
- [ ] Add product images (real photography)
- [ ] Set up collections (All, Best Sellers, Scent Families)
- [ ] Configure navigation menus
- [ ] Add product metafields
- [ ] Test add-to-cart functionality
- [ ] Implement cart drawer
- [ ] Test checkout flow
- [ ] Set up shipping rates
- [ ] Configure Shopify Payments (or payment gateway)
- [ ] Add domain and SSL
- [ ] Test mobile responsiveness
- [ ] Run Lighthouse audit
- [ ] Test accessibility (WCAG 2.1 AA)
- [ ] Set up Google Analytics 4
- [ ] Add Meta Pixel (if using Facebook ads)
- [ ] Create blog for content marketing (optional)
- [ ] Set up email marketing (Klaviyo integration recommended)

---

## Questions & Next Steps

1. ✅ Review this theme plan
2. 📄 Review SEO + Social Plan (tools/seo-social-plan.md)
3. 🔧 Run Shopify CLI commands (tools/shopify-cli-setup.md)
4. 🚀 Begin scaffolding implementation
5. 📸 Schedule product photography session
6. 📝 Write product descriptions
7. 🎨 Finalize brand assets (logo, favicon, social images)

**Need help?** Reference Shopify documentation:
- [Shopify Theme Architecture](https://shopify.dev/docs/themes/architecture)
- [Liquid Reference](https://shopify.dev/docs/api/liquid)
- [Section Schema](https://shopify.dev/docs/themes/architecture/sections/section-schema)
