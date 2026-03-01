# VALIDATION STEPS — How to See the DCube Changes

## NO PATCH NEEDED. All code is live on theme #160399261916.

---

## STEP 1: Enable the Feature Toggle

1. Go to **Shopify Admin → Online Store → Themes**
2. Find **"Copy of focal-verson-8-7-2"** — the one labeled `[unpublished]` with ID ending in **...261916**
   ⚠️ There are TWO themes with this name. Pick the correct one (ID #160399261916).
3. Click **"Customize"** (not Preview)
4. In the left panel, click the **gear icon (⚙ Theme Settings)**
5. Scroll down to **"Dcube Brand (Sandbox)"**
6. Toggle **"Enable Dusty Sanctuary Palette"** → ON
7. Click **Save** (top right corner)

## STEP 2: Preview the Correct Theme

**DO NOT** visit `dcubecandle.com` — that shows the live theme with NO DCube changes.

**Correct preview URL:**
```
https://dcubecandle.myshopify.com/?preview_theme_id=160399261916
```

Or from the Theme Editor:
- Click the **"..."** menu next to the theme name → **"View preview"**

## STEP 3: What You Should See (Toggle ON vs OFF)

| Element | Toggle OFF | Toggle ON |
|---|---|---|
| Background | Focal default (white/grey) | Dusty lavender/sanctuary palette |
| Headings | Default Focal font | Cormorant Garamond serif |
| Body text | Default | Inter sans-serif |
| Buttons (primary) | Focal default | Muted purple `rgb(126, 107, 143)` |
| Buttons (secondary) | Focal default | Honey gold `rgb(200, 151, 58)` |
| Body overlay | None | Subtle noise texture (opacity 0.03, mix-blend: overlay) |

## STEP 4: Add "Dcube Unboxing Reveal" Section to a Page

The `unboxing-product.liquid` section exists on the theme but is not on any page yet.
To add it:

1. In Theme Editor, navigate to the page where you want it (e.g., Home or a Product page)
2. Click **"Add section"** in the left panel
3. Search for **"Dcube Unboxing Reveal"** (or scroll to find it)
4. Click to add it
5. Configure the section settings (product, imagery, reveal text)
6. Click **Save**

---

## QUICK VERIFICATION CHECKLIST

- [ ] I am previewing via `...myshopify.com/?preview_theme_id=160399261916`
- [ ] I turned ON "Enable Dusty Sanctuary Palette" in Theme Settings > Dcube Brand (Sandbox)
- [ ] I clicked Save after toggling
- [ ] Hard-refreshed the browser (Ctrl+Shift+R or Cmd+Shift+R)
- [ ] Heading font is now Cormorant Garamond (serif, elegant)
- [ ] Body font is Inter (clean sans-serif)
- [ ] Primary button color is muted purple (not Focal's default)

---

## TROUBLESHOOTING

| Issue | Fix |
|---|---|
| Still seeing old Focal theme colors | Check preview URL — must have `?preview_theme_id=160399261916` |
| Toggle not visible in Theme Settings | Confirm you're in the right theme — click theme name in editor header |
| Colors changed but fonts look the same | Font files (CormorantGaramond-Medium.woff2) may not be uploaded to assets — verify in theme files |
| Noise texture too strong / blocking UI | Opacity is set to 0.03 and `pointer-events: none` — should not block anything |
| Unboxing section not visible in "Add section" | It may appear under a category; scroll the full list |
| Changes disappeared after refresh | Confirm you Saved before leaving the editor |
