# DCube Candle Co. — Sandbox Visual Verification Runbook
## Last Updated: 2026-03-01

---

## Preview URL (Bookmark This)

```
https://dcubecandle.myshopify.com/?preview_theme_id=160399261916
```

**Important:** Always use `/?` (with slash before `?`) to land on the **homepage**, not a 404.
If you see a 404 page, add `/` before the `?` in the URL.

---

## Toggle Dusty Sanctuary Mode

1. Go to: https://dcubecandle.myshopify.com/admin/themes/160399261916/editor
2. Click **Theme settings** (bottom-left gear icon)
3. Scroll to **DCube Identity** section
4. Toggle **Enable Dusty Sanctuary Palette** → ON
5. Click Save
6. Refresh the preview URL above

---

## What You Should See — Homepage

| Area | Expected |
|---|---|
| Hero background | Soft lavender mist (#E6E1EB) |
| "HAND CRAFTED LUXURY SCENTS" | Cormorant Garamond, weight 300 (thin elegant serif) |
| "SHOP NOW" button | Dusty purple #7E6B8F |
| Hover "SHOP NOW" | Warm gold glow radiates from center (Hover-to-Light ritual) |
| Below hero | Unboxing Ritual section (hover to see box lift + product reveal) |
| Below unboxing | "OUR COLLECTION" product grid |

---

## Where to See Each Ritual

### 1. Unboxing Reveal — Homepage
- Scroll past the hero
- Hover over the dark box with "DCUBE" text
- The box lifts upward, the candle slides into view

### 2. Hover-to-Light (Match Strike) — Any Button
- Hover any `.button--primary` (SHOP NOW, EXPLORE COLLECTION, Add to Cart)
- A warm amber/gold radial glow blooms from the center of the button

### 3. Scent Bloom — Product Pages
- Open any product: `/?preview_theme_id=160399261916` → click any candle
- Scroll below the product description tabs
- Hover the **Scent Chapter** panel
- Two concentric rings expand outward (bloom ritual)

### 4. Burn Gauge — Product Pages
- Same product page, next to Scent Chapter
- Shows the candle's burn journey: First Light → Present Moment → Ethereal Memory

---

## Locked Brand Tokens (Do Not Drift)

| Token | Hex | Used For |
|---|---|---|
| Accent | `#7E6B8F` | Buttons, highlights, rings |
| Mist | `#E6E1EB` | Surfaces, secondary backgrounds |
| Gold | `#C8973A` | Hover glows, testimonial borders |
| Text | `#1E1A20` | All body and heading text |
| Border | `#D1C9DB` | All borders (NOT #E6E1EB — was a known drift) |
| Muted | `#5A5560` | Labels, subtext |

---

## Push Workflow (Daily)

```powershell
# Edit files in: shopify\themes\sandbox-160399261916\

# Push to Shopify sandbox
.\scripts\shopify_theme_sync.ps1 push

# Commit + push to GitHub
git add shopify/themes/sandbox-160399261916/
git commit -m "feat(sandbox): <description>"
git push origin main
```

**NEVER:** push without `--nodelete` | touch live theme | push from a partial directory

---

## QA Checklist Before Any Deploy

- [ ] Button color = #7E6B8F (not black, not #4A148C)
- [ ] Border color = #D1C9DB (not #E6E1EB)
- [ ] Hero H1 = Cormorant Garamond serif (not sans-serif)
- [ ] Unboxing section visible on homepage (scroll below hero)
- [ ] Scent Chapter + Burn Gauge visible on product page
- [ ] Hover-to-Light gold glow on button hover
- [ ] No theme strip (used --nodelete)
- [ ] Theme 160399261916 is UNPUBLISHED

---

## Recovery: If Sandbox Gets Stripped

```powershell
# Restore from canonical local copy
shopify theme push --theme 160399261916 --path shopify\themes\sandbox-160399261916 --nodelete
```
