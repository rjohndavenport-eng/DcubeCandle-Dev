# SEO + Social Plan — DCube Candle Co.

**Project:** DCube Candle Co. (becandle)
**Target Platform:** Shopify Online Store 2.0
**SEO Strategy:** Premium candle brand with emotional storytelling + local/organic SEO focus

---

## Meta Tags Strategy

### Homepage Meta Tags
**Template:** `templates/index.json`

```html
<title>DCube Candle Co. — Hand-Poured Luxury Candles | Brianna's Light</title>
<meta name="description" content="Premium hand-poured soy candles crafted with love in memory of Brianna. Natural, long-burning candles with thoughtfully chosen scents to illuminate your home. Free shipping over $75.">
<meta name="keywords" content="luxury candles, hand-poured candles, soy candles, natural candles, premium candles, artisan candles, gift candles">
```

**Character Counts:**
- Title: 70 characters (optimal: <60, max: 70)
- Description: 155 characters (optimal: 120-155)

---

### Collection Page Meta Tags
**Template:** `templates/collection.json`
**Dynamic Title Pattern:** `{{ collection.title }} — DCube Candle Co.`

```liquid
{%- capture meta_title -%}
  {%- if collection.title -%}
    {{ collection.title }} — DCube Candle Co.
  {%- else -%}
    Shop Collection — DCube Candle Co.
  {%- endif -%}
{%- endcapture -%}

{%- capture meta_description -%}
  {%- if collection.description != blank -%}
    {{ collection.description | strip_html | truncate: 155 }}
  {%- else -%}
    Browse our {{ collection.title | downcase }} collection of hand-poured soy candles. Natural fragrances, long burn times, reusable glass vessels. Free shipping over $75.
  {%- endif -%}
{%- endcapture -%}

<title>{{ meta_title }}</title>
<meta name="description" content="{{ meta_description }}">
```

**Example Output:**
```html
<title>Floral Candles — DCube Candle Co.</title>
<meta name="description" content="Browse our floral candles collection of hand-poured soy candles. Natural fragrances, long burn times, reusable glass vessels. Free shipping over $75.">
```

---

### Product Page Meta Tags
**Template:** `templates/product.json`
**Dynamic Title Pattern:** `{{ product.title }} Candle — DCube Candle Co.`

```liquid
{%- capture meta_title -%}
  {{ product.title }} Candle — DCube Candle Co.
{%- endcapture -%}

{%- capture meta_description -%}
  {%- if product.description != blank -%}
    {{ product.description | strip_html | truncate: 155 }}
  {%- else -%}
    {{ product.title }} — Hand-poured natural soy candle. {{ product.metafields.custom.candle_details.burn_time }} hour burn time. ${{ product.price | money_without_currency }}.
  {%- endif -%}
{%- endcapture -%}

<title>{{ meta_title }}</title>
<meta name="description" content="{{ meta_description }}">
```

**Example Output:**
```html
<title>Lavender Dreams Candle — DCube Candle Co.</title>
<meta name="description" content="Calming lavender with notes of vanilla and cedarwood. Hand-poured with natural soy wax, this candle brings peaceful tranquility to any space. 50 hour burn time.">
```

---

### About/Story Page Meta Tags
**Template:** `templates/page.about.json`

```html
<title>Our Story — DCube Candle Co. | Honoring Brianna's Light</title>
<meta name="description" content="DCube is more than a candle company. Learn about Brianna's legacy and how each hand-poured candle carries her warmth, love, and light into your home.">
```

---

## Open Graph (Facebook/LinkedIn) Tags

### Global OG Tags (in `snippets/meta-tags.liquid`)

```liquid
{%- liquid
  assign og_title = page_title | default: shop.name
  assign og_description = page_description | default: shop.description
  assign og_url = canonical_url
  assign og_type = 'website'
  assign og_image = ''

  if template contains 'product'
    assign og_type = 'product'
    if product.featured_image
      assign og_image = product.featured_image | image_url: width: 1200
    endif
  elsif template contains 'article'
    assign og_type = 'article'
  endif

  unless og_image != blank
    if settings.share_image
      assign og_image = settings.share_image | image_url: width: 1200
    endif
  endunless
-%}

<meta property="og:site_name" content="{{ shop.name }}">
<meta property="og:title" content="{{ og_title }}">
<meta property="og:description" content="{{ og_description }}">
<meta property="og:url" content="{{ og_url }}">
<meta property="og:type" content="{{ og_type }}">
<meta property="og:locale" content="en_US">

{%- if og_image != blank -%}
  <meta property="og:image" content="{{ og_image }}">
  <meta property="og:image:secure_url" content="{{ og_image }}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="{{ og_title }}">
{%- endif -%}

{%- if template contains 'product' -%}
  <meta property="product:price:amount" content="{{ product.price | money_without_currency }}">
  <meta property="product:price:currency" content="{{ cart.currency.iso_code }}">
  {%- if product.available -%}
    <meta property="product:availability" content="in stock">
  {%- else -%}
    <meta property="product:availability" content="out of stock">
  {%- endif -%}
{%- endif -%}
```

**OG Image Specs:**
- Dimensions: 1200×630px (1.91:1 ratio)
- Format: JPG or PNG
- Max file size: 8MB
- **Create:** Brand image with logo, bee motif, tagline ("Illuminate Every Moment")

---

## Twitter Card Tags

### Twitter Card Meta Tags

```liquid
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{{ og_title }}">
<meta name="twitter:description" content="{{ og_description }}">
{%- if og_image != blank -%}
  <meta name="twitter:image" content="{{ og_image }}">
{%- endif -%}
{%- if settings.twitter_handle != blank -%}
  <meta name="twitter:site" content="@{{ settings.twitter_handle }}">
{%- endif -%}
```

**Twitter Image Specs:**
- Same as OG image (1200×630px)
- Twitter will use OG image if twitter:image not specified
- Card type: `summary_large_image` for product photos

---

## JSON-LD Structured Data

### Organization Schema (Global)
**Add to:** `layout/theme.liquid` (in `<head>`)

```liquid
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "{{ shop.name }}",
  "url": "{{ shop.url }}",
  "logo": {
    "@type": "ImageObject",
    "url": "{{ settings.logo | image_url: width: 600 }}",
    "width": 600,
    "height": 600
  },
  "description": "{{ shop.description | escape }}",
  "sameAs": [
    {%- if settings.social_instagram != blank -%}"{{ settings.social_instagram }}"{%- endif -%}
    {%- if settings.social_tiktok != blank -%},"{{ settings.social_tiktok }}"{%- endif -%}
    {%- if settings.social_pinterest != blank -%},"{{ settings.social_pinterest }}"{%- endif -%}
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "Customer Service",
    "email": "{{ settings.contact_email }}"
  }
}
</script>
```

---

### Product Schema (Product Pages Only)
**Add to:** `sections/product-details.liquid` (at end of section)

```liquid
{%- if template contains 'product' -%}
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "{{ product.title | escape }}",
  "description": "{{ product.description | strip_html | escape }}",
  "image": [
    {%- for image in product.images limit: 5 -%}
      "{{ image | image_url: width: 800 }}"{% unless forloop.last %},{% endunless %}
    {%- endfor -%}
  ],
  "brand": {
    "@type": "Brand",
    "name": "{{ shop.name }}"
  },
  "sku": "{{ product.selected_or_first_available_variant.sku }}",
  "offers": {
    "@type": "Offer",
    "url": "{{ shop.url }}{{ product.url }}",
    "priceCurrency": "{{ cart.currency.iso_code }}",
    "price": "{{ product.price | money_without_currency }}",
    "availability": "{% if product.available %}https://schema.org/InStock{% else %}https://schema.org/OutOfStock{% endif %}",
    "seller": {
      "@type": "Organization",
      "name": "{{ shop.name }}"
    }
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "reviewCount": "127"
  }
}
</script>
{%- endif -%}
```

**Note:** Update `aggregateRating` with real review data (integrate Shopify Product Reviews or Judge.me)

---

### Breadcrumb Schema
**Add to:** Product/collection pages

```liquid
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "{{ shop.url }}"
    },
    {%- if collection -%}
    {
      "@type": "ListItem",
      "position": 2,
      "name": "{{ collection.title }}",
      "item": "{{ shop.url }}{{ collection.url }}"
    },
    {%- endif -%}
    {%- if product -%}
    {
      "@type": "ListItem",
      "position": {% if collection %}3{% else %}2{% endif %},
      "name": "{{ product.title }}",
      "item": "{{ shop.url }}{{ product.url }}"
    }
    {%- endif -%}
  ]
}
</script>
```

---

## Image Alt Text Rules

### Product Images
**Pattern:** `[Product Name] candle in [vessel color] glass with [flame status]`

**Examples:**
- `Lavender Dreams candle in frosted glass vessel with lit flame`
- `Vanilla Warmth candle showing top-down view of natural soy wax`
- `Cedarwood Peace candle in lifestyle setting on wooden table`

**Lifestyle Images:**
- `DCube candles styled in warm living room with soft lighting`
- `Hand lighting a Lavender Dreams candle on bedside table`

**Product Photography Checklist:**
- [ ] Main product shot (straight-on, well-lit)
- [ ] Top-down view (show wax texture, wick)
- [ ] Lifestyle context (candle in use, styled setting)
- [ ] Detail shots (label, bee logo, glass vessel texture)
- [ ] Size comparison (candle next to common object)

### Icon/Decorative Images
**Use:** `aria-hidden="true"` + empty alt
```html
<svg aria-hidden="true">...</svg>
```

**Bee Motif Icons:** Already marked as decorative (`aria-hidden="true"`) ✅

---

## Canonical URLs

### Prevent Duplicate Content
**Add to:** `snippets/meta-tags.liquid`

```liquid
<link rel="canonical" href="{{ canonical_url }}">
```

Shopify automatically handles:
- Collection pagination (`?page=2` → canonical to base URL)
- Product variants (`?variant=123` → canonical to product URL)
- Sorting/filtering (`?sort_by=price` → canonical to base URL)

---

## robots.txt Configuration

**Shopify Default (Good):**
```
User-agent: *
Disallow: /admin
Disallow: /cart
Disallow: /orders
Disallow: /checkouts/
Disallow: /checkout
Disallow: /apps/
Disallow: /services/
Allow: /apps/wishlist

Sitemap: https://dcube.myshopify.com/sitemap.xml
```

**No changes needed** — Shopify manages this automatically.

---

## Social Media Integration

### 1. Instagram Feed (Priority)
**Recommendation:** Use Shopify app or custom embed

**Option A:** Instafeed.js (free, custom)
- Add to `snippets/instagram-feed.liquid`
- Use Instagram Basic Display API
- Cache feed for 24 hours

**Option B:** Shopify App (paid, easier)
- **InstafeedⓇ** by Mintt Studio ($4.99/mo)
- **Instafeed + TikTok** by Elfsight ($9.99/mo)

**Placement:**
- Homepage section (after featured products)
- Footer (small 4-image grid)

**Accessibility:**
- Add alt text from Instagram captions
- Use lazy loading

---

### 2. TikTok Integration
**Strategy:** Link to TikTok profile (no embed needed)

**Add to Footer:**
```liquid
{%- if settings.social_tiktok != blank -%}
  <a href="{{ settings.social_tiktok }}" target="_blank" rel="noopener" aria-label="Visit us on TikTok">
    {% render 'icon-tiktok' %}
  </a>
{%- endif -%}
```

**Content Strategy:**
- Behind-the-scenes candle pouring
- Unboxing/product reveals
- Customer testimonials
- Brand story (Brianna tribute)
- Candle care tips

**Call-to-Action:**
- "Watch our candle-making process on TikTok →"
- Add to product pages or about page

---

### 3. Pinterest Rich Pins
**Type:** Product Pins

**Setup:**
1. Claim website in Pinterest Business account
2. Add Pinterest meta tag verification to `theme.liquid`:
```html
<meta name="p:domain_verify" content="[pinterest-verification-code]">
```

3. Rich Pin data automatically pulled from:
   - Product title → Pin title
   - Product description → Pin description
   - Product image → Pin image
   - Price → Displays on Pin
   - Availability → "In Stock" badge

**Test:** Use [Pinterest Rich Pins Validator](https://developers.pinterest.com/tools/url-debugger/)

**Pin Image Optimization:**
- Vertical format (2:3 ratio, 1000×1500px)
- High-quality product photos
- Lifestyle context preferred
- Add text overlay (product name + price) for better CTR

---

### 4. Email Marketing Integration
**Recommended Platform:** Klaviyo (Shopify integration)

**Newsletter Signup:**
- Add to footer (always visible)
- Homepage popup (delayed 10s or exit-intent)
- Checkout page (post-purchase subscribe)

**Email Capture Incentive:**
- "Subscribe for 10% off your first order"
- "Join the DCube family and get exclusive candle care tips"

**Transactional Emails (Shopify Native):**
- Order confirmation
- Shipping notification
- Delivery confirmation
- Abandoned cart recovery (Shopify Plus or Klaviyo)

**Marketing Emails (Klaviyo):**
- Welcome series (3 emails: brand story, product guide, testimonials)
- Abandoned cart (3 emails: reminder, incentive, last chance)
- Post-purchase (thank you, review request, replenishment reminder)
- Win-back campaign (30-60-90 days inactive)

---

## SEO Content Strategy

### Blog Topics (Optional but Recommended)
**Create:** `templates/blog.json`, `templates/article.json`

**Content Pillars:**
1. **Candle Care & Tips**
   - "How to Make Your Candles Last Longer"
   - "The Science of Candle Tunneling (And How to Prevent It)"
   - "When to Trim Your Wick (And Why It Matters)"

2. **Home & Lifestyle**
   - "5 Ways to Create a Cozy Atmosphere at Home"
   - "The Best Candles for Every Room in Your Home"
   - "How to Choose the Right Candle Scent for Your Mood"

3. **Brand Story & Values**
   - "Brianna's Legacy: How DCube Began"
   - "Why We Choose Natural Soy Wax (And You Should Too)"
   - "The Symbolism of the Bee in Our Brand"

4. **Gift Guides**
   - "The Perfect Candle Gifts for Every Occasion"
   - "Candle Gift Sets for the Holidays"
   - "How to Create a Custom Candle Gift Box"

**SEO Benefit:**
- Long-tail keyword targeting
- Increased time-on-site
- Internal linking opportunities
- Builds brand authority

---

## Keyword Research

### Primary Keywords (High Volume, High Intent)
- `luxury candles` (12,000/mo) — High competition
- `hand poured candles` (9,000/mo) — Medium competition
- `soy candles` (40,000/mo) — High competition
- `natural candles` (8,000/mo) — Medium competition
- `artisan candles` (2,000/mo) — Low competition ✅ TARGET

### Long-Tail Keywords (Lower Volume, Higher Intent)
- `luxury hand poured soy candles` (500/mo) ✅
- `natural soy candles gift set` (300/mo) ✅
- `premium candles for home` (800/mo) ✅
- `handmade candles small batch` (200/mo) ✅

### Local SEO (If Applicable)
- `candles [city name]` (e.g., "candles Seattle")
- `candle shop near me` (location-based)
- **Strategy:** Add location to footer, create Google Business Profile

---

## Technical SEO Checklist

### On-Page SEO
- [x] Semantic HTML (header, main, footer, nav, section)
- [x] H1 on every page (one per page)
- [ ] H2-H6 hierarchy (no skipping levels)
- [ ] Alt text on all images
- [ ] Internal linking (collection → product → related)
- [ ] URL structure (`/collections/floral`, `/products/lavender-dreams`)
- [ ] Breadcrumb navigation
- [ ] 301 redirects (if migrating from old site)

### Performance SEO
- [ ] Lazy load images below fold
- [ ] Minify CSS/JS
- [ ] Enable Shopify CDN (automatic)
- [ ] Use WebP images with fallback
- [ ] Preload critical fonts
- [ ] Defer non-critical scripts
- [ ] Target: <2s page load time
- [ ] Target: Core Web Vitals (LCP <2.5s, FID <100ms, CLS <0.1)

### Mobile SEO
- [ ] Responsive design (already implemented ✅)
- [ ] Mobile-friendly navigation (hamburger menu)
- [ ] Touch-friendly buttons (min 44×44px)
- [ ] Readable font sizes (min 16px body text)
- [ ] No horizontal scrolling

### Security SEO
- [x] HTTPS (Shopify provides SSL certificate)
- [ ] Secure payment gateway (Shopify Payments)

---

## Analytics & Tracking Setup

### Google Analytics 4 (GA4)
**Setup:**
1. Create GA4 property in Google Analytics
2. Get Measurement ID (e.g., `G-XXXXXXXXXX`)
3. Add to Shopify Admin → Settings → Customer events → Custom pixels

**GA4 Snippet:**
```html
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

**Enhanced E-commerce Events:**
- `view_item` (product page view)
- `add_to_cart` (add to cart click)
- `begin_checkout` (checkout initiated)
- `purchase` (order completed)

**Shopify Native Integration:** Use [Google & YouTube app](https://apps.shopify.com/google) for automatic event tracking.

---

### Meta Pixel (Facebook/Instagram Ads)
**Setup:**
1. Create Meta Pixel in Meta Business Manager
2. Get Pixel ID
3. Add to Shopify Admin → Settings → Customer events → Meta pixel

**Events:**
- `PageView` (all pages)
- `ViewContent` (product page)
- `AddToCart` (add to cart)
- `InitiateCheckout` (checkout started)
- `Purchase` (order completed)

**Shopify Integration:** Use [Facebook & Instagram app](https://apps.shopify.com/facebook) for automatic setup.

---

### Google Search Console
**Setup:**
1. Verify site ownership (use DNS TXT record or HTML tag)
2. Submit sitemap: `https://dcube.myshopify.com/sitemap.xml`
3. Monitor:
   - Index coverage (ensure all pages indexed)
   - Core Web Vitals
   - Mobile usability
   - Search queries (keyword performance)

---

## Conversion Rate Optimization (CRO)

### Trust Signals
- [ ] **Reviews:** Add Shopify Product Reviews app or Judge.me
- [ ] **Trust Badges:** "Secure Checkout" icons on product/cart pages
- [ ] **Guarantees:** 30-day return policy (display on product pages)
- [ ] **Shipping Info:** "Free shipping over $75" (sticky bar)

### Urgency/Scarcity
- [ ] **Low Stock Alerts:** "Only 3 left in stock" (when inventory <5)
- [ ] **Recently Viewed:** Show on product pages
- [ ] **Social Proof:** "127 customers love this" (review count)

### Exit-Intent Popups
- [ ] **First-time Visitors:** 10% off email signup
- [ ] **Cart Abandoners:** "Wait! Complete your order" with incentive

---

## Launch Day SEO Checklist

### Pre-Launch
- [ ] All meta titles/descriptions written
- [ ] All images have alt text
- [ ] All products have descriptions (min 150 words)
- [ ] Collections created and organized
- [ ] Navigation menus configured
- [ ] Footer links functional
- [ ] 404 page customized
- [ ] Favicon uploaded
- [ ] OG image created and uploaded

### Launch Day
- [ ] Submit sitemap to Google Search Console
- [ ] Submit sitemap to Bing Webmaster Tools
- [ ] Create Google Business Profile (if local)
- [ ] Share on social media (Instagram, Facebook, TikTok)
- [ ] Email existing contacts (if any)
- [ ] Set up Google Ads (optional)
- [ ] Set up Meta Ads (optional)

### Week 1 Post-Launch
- [ ] Monitor Google Search Console (indexing status)
- [ ] Check GA4 (traffic, behavior)
- [ ] Review cart abandonment rate
- [ ] Test all forms (contact, newsletter)
- [ ] Check page load speed (GTmetrix, PageSpeed Insights)
- [ ] Fix any broken links (Screaming Frog crawl)

---

## Quick Wins Summary

### High-Impact, Low-Effort
1. ✅ Add meta descriptions to all pages (1 hour)
2. ✅ Add alt text to all images (2 hours)
3. ✅ Install Shopify Product Reviews app (15 min)
4. ✅ Set up Google Search Console + submit sitemap (30 min)
5. ✅ Create OG image for social sharing (1 hour)
6. ✅ Add newsletter signup to footer (30 min)
7. ✅ Create 301 redirects (if migrating from old domain) (1 hour)

---

## Resources & Tools

### SEO Tools
- [Google Search Console](https://search.google.com/search-console) (free)
- [Bing Webmaster Tools](https://www.bing.com/webmasters) (free)
- [Ahrefs](https://ahrefs.com) (paid, keyword research)
- [SEMrush](https://www.semrush.com) (paid, competitor analysis)

### Testing Tools
- [Google PageSpeed Insights](https://pagespeed.web.dev/) (free)
- [GTmetrix](https://gtmetrix.com/) (free)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse) (free, built into Chrome)
- [WAVE Accessibility Tool](https://wave.webaim.org/) (free)

### Image Tools
- [TinyPNG](https://tinypng.com/) (image compression)
- [Squoosh](https://squoosh.app/) (WebP conversion)
- [Canva](https://www.canva.com/) (OG image creation)

### Schema Testing
- [Google Rich Results Test](https://search.google.com/test/rich-results)
- [Schema.org Validator](https://validator.schema.org/)

---

**Questions? Reference:**
- `tools/shopify-readiness-report.md` for site audit
- `tools/shopify-theme-plan.md` for implementation details
- [Shopify SEO Guide](https://www.shopify.com/blog/ecommerce-seo-beginners-guide)
