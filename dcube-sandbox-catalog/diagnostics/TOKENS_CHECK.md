# TOKENS CHECK — DCube Candle Co. Sandbox Theme
**Baseline:** 26d7db3 | **Date:** 2026-03-01

---

## Color Tokens

| Token | Hex | RGB | Used Where | Status |
|---|---|---|---|---|
| Accent (Primary) | `#7E6B8F` | `126, 107, 143` | Primary buttons, card borders, bloom shadow, ATC button | ✅ COMPLIANT |
| Mist (Soft BG) | `#E6E1EB` | `230, 225, 235` | Overlays, secondary BG, card surfaces | ✅ COMPLIANT — but NOT as default for announcement-bar/static-icons strips |
| Gold (Secondary Accent) | `#C8973A` | `200, 151, 58` | Hover-to-Light radial bloom, secondary button | ✅ COMPLIANT |
| Text (Charcoal) | `#1E1A20` | `30, 26, 32` | All body text, headings, product titles | ✅ COMPLIANT (enforced via !important) |
| Border | `#D1C9DB` | `209, 201, 219` | Card borders, dividers | ✅ COMPLIANT |
| Muted | `#5A5560` | `90, 85, 96` | Secondary text, labels | ✅ COMPLIANT |
| Surface | `#FFFFFF` | `255, 255, 255` | Page background | ✅ COMPLIANT |

---

## CSS Variable Assignments (css-variables.liquid, enable_dusty_sanctuary_palette block)

| Variable | Value | Status |
|---|---|---|
| `--heading-color` | `30, 26, 32` | ✅ |
| `--text-color` | `30, 26, 32` | ✅ |
| `--background` | `255, 255, 255` | ✅ |
| `--secondary-background` | `230, 225, 235` | ✅ |
| `--primary-button-background` | `126, 107, 143` | ✅ |
| `--secondary-button-background` | `200, 151, 58` | ✅ |
| `--primary-button-text-color` | `255, 255, 255` | ✅ |
| `--secondary-button-text-color` | `255, 255, 255` | ✅ |
| `--border-color` | `209, 201, 219` | ✅ |
| `--heading-font-family` | `'Cormorant Garamond', serif` | ✅ |
| `--heading-font-weight` | `300` | ✅ |
| `--text-font-family` | `'Inter', sans-serif` | ✅ |
| `--font-display` | `'Cormorant Garamond', serif` | ✅ |
| `--font-body` | `'Inter', sans-serif` | ✅ |
| `--font-accent` | `'Italiana', serif` | ⚠️ DEFINED BUT NOT APPLIED |
| `--color-accent` | `rgb(126, 107, 143)` | ✅ |
| `--color-mist` | `rgb(230, 225, 235)` | ✅ |
| `--color-gold` | `rgb(200, 151, 58)` | ✅ |
| `--color-text` | `rgb(30, 26, 32)` | ✅ |
| `--color-muted` | `rgb(90, 85, 96)` | ✅ |
| `--color-border` | `rgb(209, 201, 219)` | ✅ |
| `--color-surface` | `rgb(230, 225, 235)` | ✅ |
| `--umbra-shadow` | `0 30px 60px rgba(126,107,143,0.1)` | ✅ |

---

## Font Loading (layout/theme.liquid)

| Font | Source | Weights Loaded | Status |
|---|---|---|---|
| Cormorant Garamond | Google Fonts CDN (line 46) | 0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,600 | ✅ |
| Inter | Google Fonts CDN (line 46) | 0,300;0,400;0,500 | ✅ |
| **Italiana** | **NOT in Google Fonts CDN** | **None — font will not load** | ❌ MISSING |
| Luminari | fonts.cdnfonts.com (line 42, unconditional) | default | ⚠️ Loaded unconditionally; overridden by !important but wastes CDN call |

**Required CDN fix:**
Change line 46 URL from:
```
family=Cormorant+Garamond:ital,wght@...&family=Inter:wght@300;400;500
```
To:
```
family=Cormorant+Garamond:ital,wght@...&family=Inter:wght@300;400;500&family=Italiana:wght@400
```

---

## Hardcoded Color Audit (grep findings)

| Value | File | Context | Issue |
|---|---|---|---|
| `#7E6B8F` | templates/product.json | ATC button color | ✅ Correct |
| `#7E6B8F` | templates/index.json | Slideshow button | ✅ Correct |
| `#E6E1EB` | templates/*.json | Overlay colors | ✅ Correct |
| `#1E1A20` | templates/*.json | Text colors | ✅ Correct |
| `'Luminari'` | assets/theme.css:82,444,472 | Fallback font on html/.heading | ⚠️ Overridden but fragile |
| No `#282828` found in templates | — | — | ✅ Black removed |
| No `purple` CSS keyword found | — | — | ✅ Removed from page templates |
