# DCube Candle Co. — Brand Specification
## Source: preview-brand.html (Dusty Sanctuary — LOCKED)
## Generated: 2026-03-01

---

## Palette: DUSTY

| Token | Hex | RGB | Shopify Var |
|---|---|---|---|
| Accent (Primary) | `#7E6B8F` | 126, 107, 143 | `--primary-button-background` |
| Mist (Surface) | `#E6E1EB` | 230, 225, 235 | `--secondary-background` |
| Gold | `#C8973A` | 200, 151, 58 | `--secondary-button-background` |
| Text | `#1E1A20` | 30, 26, 32 | `--heading-color`, `--text-color` |
| Background | `#FFFFFF` | 255, 255, 255 | `--background` |
| Muted | `#5A5560` | 90, 85, 96 | `--color-muted` |
| Border | `#D1C9DB` | 209, 201, 219 | `--border-color` |
| Shadow | rgba(126,107,143,0.1) | — | `--umbra-shadow` |

**Drift rule:** #D1C9DB ≠ #E6E1EB. Border color was drifting — corrected 2026-03-01.

---

## Typography: MODERN CLASSIC

| Role | Font | Weight | Variable |
|---|---|---|---|
| Heading | Cormorant Garamond | 300 (light) | `--heading-font-family` |
| Body | Inter | 300–500 | `--text-font-family` |
| Accent/Script | Italiana | 400 | `--font-accent` |

Source: Google Fonts CDN (loaded conditionally when Dusty Sanctuary toggle ON)
URL: `Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,600`

---

## Atmosphere: SANCTUARY

- Section surfaces use `--color-surface` / `--color-accent-soft` (#E6E1EB) as background
- Box shadow: `0 30px 60px rgba(126, 107, 143, 0.1)` (brand umbra)
- Noise texture overlay: SVG fractalNoise, opacity 0.025, mix-blend-mode: overlay, fixed inset

---

## Interaction Rituals: ALL ACTIVE

### 1. Unboxing Reveal
- Trigger: hover on `sections/unboxing-product.liquid`
- Effect: box outer slides up + rotates, inner product descends into view
- Wired: `templates/index.json` → `"unboxing-reveal"` section

### 2. Hover-to-Light (Match Strike)
- Trigger: hover on `.button--primary`
- Effect: radial gradient bloom from center, gold (#C8973A) radial, opacity 0→1, 0.5s ease
- Implemented: `layout/theme.liquid` → `.button--primary::after`

### 3. Scent Bloom
- Trigger: hover on `.scent-chapter-bloom` wrapper
- Effect: two concentric rings expand (100px → 400px / 600px), opacity fades
- Wired: `sections/product-content.liquid` → `{% render 'scent-chapter' %}`

### 4. Burn Gauge
- Present on all product pages alongside Scent Chapter
- Vertical 4px track, First Light → Present Moment → Ethereal Memory
- Wired: `sections/product-content.liquid` → `{% render 'burn-gauge' %}`

---

## Advanced Visual Elements: ACTIVE

- Wax seal icon (SVG, `--color-accent` fill)
- Sunbeam drift animation (`--color-gold` gradient, 12s infinite alternate)
- Blueprint cube (wireframe, `--color-accent` stroke)
- Scent journey map (Top/Heart/Base notes)
- Coordinates: 27.3364° N, 82.5307° W — Sarasota, FL

---

## B Icon / Logo Rules

- MUST be SVG — no raster PNG
- Wings required
- Crisp at 400% browser zoom — zero raster artifacts
- Status: `{% render 'icon' with 'dcube-bee' %}` referenced in unboxing section (vector icon required)
