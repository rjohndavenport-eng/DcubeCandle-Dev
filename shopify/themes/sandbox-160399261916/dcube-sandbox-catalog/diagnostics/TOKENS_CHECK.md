# TOKENS_CHECK — DCUBE SANDBOX (2026-03-02)

## Dusty Palette (Canonical)
- `--color-bg`: #FFFFFF
- `--color-surface`: #E6E1EB
- `--color-text`: #1E1A20
- `--color-muted`: #5A5560
- `--color-accent`: #7E6B8F
- `--color-accent-soft`: #E6E1EB
- `--color-gold`: #C8973A
- `--color-border`: #D1C9DB
- `--shadow-color`: rgba(126, 107, 143, 0.1)

## Current Application
- **Announcement Bar**: Observed `#d1c3fa` | Expected `#E6E1EB`. (Fix settings_data.json)
- **Footer**: Observed `#d1c3fa` | Expected `#E6E1EB`. (Fix settings_data.json)
- **Primary Buttons**: Correctly using `#7E6B8F` via `--primary-button-background`.
- **Secondary/Buy Now**: Correctly using `#E6E1EB` via `--secondary-button-background`.

## Typography (Canonical)
- `--font-serif`: 'Cormorant Garamond', serif (Medium 500)
- `--font-sans`: 'Inter', sans-serif (Light 300 / Regular 400)
- `--font-accent`: 'Italiana', serif

## Typography Application Status
- **Headings**: Mismatched in `custom-font.liquid`. (Action: Disable custom-font section)
- **Product Descriptions**: Mismatched in `custom-font.liquid`. (Action: Disable custom-font section)
- **Variable Mapping**: `layout	heme.liquid` has correct mappings for Inter/Cormorant.
- **Font-weight**: Mismatched. Expected 300 for Cormorant headers. `layout	heme.liquid` already forces 300 in many places but `custom-font.liquid` overpowers it.
