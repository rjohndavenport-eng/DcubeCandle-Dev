# DESIGN INSERTION POINTS (MAPPING)

## 1. UNBOXING REVEAL
- **Target File:** `sections/featured-product.liquid`
- **Logic:** Add a `div.unboxing-reveal` wrapper around the product media. Trigger `transform: translateY(0)` on scroll-intersection via IntersectionObserver.

## 2. SCENT BLOOM
- **Target File:** `snippets/product-info.liquid`
- **Logic:** Insert the bloom rings SVG behind the "Scent Notes" list items. Trigger `:hover` animation on the parent container.

## 3. HOVER TO LIGHT
- **Target File:** `snippets/product-item.liquid` (Product Card)
- **Logic:** Add a circular `:after` pseudo-element to the "Quick Add" button with a `radial-gradient` glow effect.

## 4. BRAND TOKENS (GLOBAL)
- **Target File:** `snippets/css-variables.liquid`
- **Logic:** Inject the "Dusty Sanctuary" hex codes into Focal's internal variable map.
