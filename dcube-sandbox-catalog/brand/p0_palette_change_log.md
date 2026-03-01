# P0-1: DUSTY PALETTE FOUNDATION — CHANGE LOG

## 1. CHANGES EXECUTED
- **File:** `config/settings_schema.json`
  - Added "Dcube Brand (Sandbox)" section.
  - Added `enable_dusty_sanctuary_palette` (Checkbox, default: false).
- **File:** `snippets/css-variables.liquid`
  - Injected CSS override block using `!important` flags.
  - Mapped Focal variables to Dusty Sanctuary tokens (Accent, Mist, Gold, Text, BG).

## 2. MAPPING LOGIC
| Token | Hex | RGB (Mapped) | Target Focal Variable |
| :--- | :--- | :--- | :--- |
| Accent | #7E6B8F | 126, 107, 143 | `--primary-button-background` |
| Mist | #E6E1EB | 230, 225, 235 | `--secondary-background`, `--border-color` |
| Gold | #C8973A | 200, 151, 58 | `--secondary-button-background` |
| Text | #1E1A20 | 30, 26, 32 | `--heading-color`, `--text-color` |
| BG | #FFFFFF | 255, 255, 255 | `--background` |

## 3. VALIDATION CHECKLIST
- [ ] **Toggle OFF:** Verify site matches Focal default colors.
- [ ] **Toggle ON:** Verify "Dusty" lavender tones appear on buttons and backgrounds.
- [ ] **Typography Contrast:** Check that Warm Charcoal text (#1E1A20) is legible over Mist (#E6E1EB).
- [ ] **Layout Integrity:** Confirm no jumping or layout shifts when toggling the flag.

## 4. COMMAND LOG
- `shopify theme push --theme 160399261916 --path "dcube-sandbox-catalog	heme-download"`
