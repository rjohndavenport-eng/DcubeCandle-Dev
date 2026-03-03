# MOBILE IMAGE ROOT CAUSE MAP
Date: 2026-03-02
Agent: CODEX-SHOPIFY-MOBILE-AUDITOR
Theme: Focal sandbox-160399261916

---

## ROOT CAUSE TABLE

| # | Issue | File:Line | Selector | Problem | Fix |
|---|---|---|---|---|---|
| 1 | Hero candle too dominant on mobile | `assets/slide-1..4__*__mobile.webp` | — | Images are tight product shots, 1200×1600 (0.75 ratio) — SAME ratio as mobile viewport (~390×519) so object-fit:cover scales with ZERO cropping; object-position has no effect | Image pipeline re-run with wider composition OR stronger gradient overlay for text contrast |
| 2 | Hero height too tall on mobile | `assets/theme.css:~3200` | `.slideshow--large` | `--slideshow-min-height: 160vw` → 624px on 390px phone (74% of viewport) | `dcube-mobile-fixes.css:39–43`: `min(133vw, 82vh)` caps to 519px ✓ |
| 3 | Desktop landscape image shown on tablet 768–999px | `assets/theme.css:24` | `.hidden-pocket` at ≤999px | Focal hides desktop image at ≤999px; mobile portrait shows from 375–999px. Spec wants portrait only on phones, desktop on tablets | `dcube-mobile-fixes.css:19–26`: restores `.hidden-pocket` at 768–999px ✓ |
| 4 | Hero text overlaps candle on mobile | `sections/slideshow.liquid:135` | `.slideshow__text-wrapper` | Default `align-items` centers text vertically in hero flex column | `dcube-mobile-fixes.css:99–104`: `align-self: flex-start; padding-top: 3rem` ✓ |
| 5 | Product card images in upper-left corner | `assets/dcube-mobile-fixes.css` (v2, deployed) | `.dcube-card-media__img` | v2 CSS only had `.dcube-primary-img` fixes (OLD system). product-item.liquid was updated to dcube-card-media in commit 6bb957a but mobile fixes for new system were NOT deployed | `dcube-mobile-fixes.css v3:117–151`: forces `aspect-ratio:1/1` on container + `position:absolute; inset:0; object-fit:cover` on `.dcube-card-media__img` |
| 6 | Lid transform fires on touch (unboxing animation on mobile) | `assets/dcube-overrides.css:94–96` | `@media (hover:none),(pointer:coarse)` | Belt-and-suspenders: already in overrides but v2 mobile-fixes lacked the `.dcube-card-media__lid` reset | `dcube-mobile-fixes.css v3:145–151`: `transform/filter/transition: none !important` on lid ✓ |

---

## SECTION A — HERO SLIDESHOW: ACTUAL VS EXPECTED

### Mobile Render Path (confirmed: sections/slideshow.liquid:59–86)

**Desktop image (≤999px hidden):**
```html
<div class="slideshow__image-wrapper hidden-pocket">
  <img class="slideshow__image" src="...desktop..." >
</div>
```
Hidden by `theme.css: .hidden-pocket { display: none !important; }` at ≤999px.

**Mobile image (≤999px visible):**
```html
<div class="slideshow__image-wrapper hidden-lap-and-up">
  <img class="slideshow__image" src="{{ block.settings.mobile_image_asset | asset_url }}"
    width="1200" height="1600" sizes="100vw">
</div>
```

### Aspect Ratio Analysis
- Mobile image: 1200×1600 = **0.750 ratio**
- iPhone 14 container: 390×519 = **0.751 ratio**
- Conclusion: `object-fit:cover` scales uniformly, **zero cropping occurs**
- `object-position: right bottom` has **no visible effect** on these compositions

### Image Composition Assessment
| Slide | Mobile File | Candle Position | Text-Safe Left? | Verdict |
|---|---|---|---|---|
| 1 Brand Statement | slide-1__brand-statement__mobile.webp | Centered, ~65% width | No (orange left) | Needs re-gen |
| 2 Coastal Collection | slide-2__coastal-collection__mobile.webp | Centered, ~65% width | No (citrus both sides) | Needs re-gen |
| 3 Evening Mood | slide-3__evening-mood__mobile.webp | Centered, dark navy bg | Yes (dark background) | CSS sufficient |
| 4 Gifting Premium | slide-4__gifting-premium__mobile.webp | Centered, ~65% width | No (orange left) | Needs re-gen |

---

## SECTION B — PRODUCT CARD: ACTUAL VS EXPECTED

### Confirmed HTML Structure (snippets/product-item.liquid:48–127)
```html
<a class="product-item__aspect-ratio aspect-ratio"
   style="padding-bottom: X%; --aspect-ratio: Y">
  <div class="dcube-card-media dcube-card-media--stack|--solo">
    <div class="dcube-card-media__underlay">  <!-- z-index:1 -->
      <img class="dcube-card-media__img" ...>
    </div>
    <div class="dcube-card-media__lid">       <!-- z-index:2 -->
      <img class="dcube-card-media__img product-item__primary-image" ...>
    </div>
  </div>
</a>
```

### Critical Cascade (theme.css:2068–2121)
```css
/* theme.css:2069 */
.aspect-ratio { position: relative; }  /* ← provides containing block */

/* theme.css:12817 */
.product-item__aspect-ratio { isolation: isolate; }  /* NO position:relative here */

/* @supports block in theme.css:2117 */
.aspect-ratio { padding-bottom: 0 !important; aspect-ratio: var(--aspect-ratio); }
```
`.product-item__aspect-ratio` inherits `position:relative` from `.aspect-ratio` class. The `.dcube-card-media` (position:absolute;inset:0) fills it correctly.

### Mobile Fix (dcube-mobile-fixes.css v3: 117–151)
```css
@media screen and (max-width: 767px) {
  .product-item__aspect-ratio {
    aspect-ratio: 1 / 1 !important;   /* override var(--aspect-ratio) */
    overflow: hidden !important;
    padding-bottom: 0 !important;
  }
  .dcube-card-media__img {
    position: absolute !important;     /* explicit for mobile */
    inset: 0 !important;
    width: 100% !important; height: 100% !important;
    object-fit: cover !important;
    object-position: center !important;
    max-width: none !important; max-height: none !important;
  }
  .dcube-card-media__lid {
    transform: none !important;
    filter: none !important; transition: none !important; box-shadow: none !important;
  }
}
```

---

## SECTION C — CSS LOAD ORDER (CONFIRMED)

From `layout/theme.liquid:81–229`:

```
1. theme.css          — Focal base (aspect-ratio, slideshow, product-item)
2. styles.css         — Focal brand
3. <style> inline     — DCube palette (gated: enable_dusty_sanctuary_palette)
4. dcube-overrides.css — DCube Ritual System v2 (gated)
5. dcube-mobile-fixes.css — DCube Mobile v3 (gated, LAST)
```

**Gate:** Files 4 and 5 only load when `settings.enable_dusty_sanctuary_palette = true`.

---

## SECTION D — ADDITIONAL COLLISION RISKS

| Risk | File:Line | Status |
|---|---|---|
| Focal crossfade (primary image fade on hover) | theme.css:12900 | FIXED — dcube-overrides.css:113 neutralizes with `opacity:1 !important` |
| Focal secondary-image absolute centering (`top:50%;left:50%;transform:translate(-50%,-50%)`) | theme.css:12826 | NOT A RISK — DCube images use `.dcube-card-media__img` class, not `.product-item__secondary-image` |
| Inline `padding-bottom` from product-item.liquid:51 | product-item.liquid:51 | HANDLED — `@supports` zeroes it; DCube `!important` override on mobile |
| `hidden-pocket` on desktop image shows tablet wrong image | theme.css:24 | FIXED — dcube-mobile-fixes.css:19–26 |

---

## SECTION E — DEPLOY CHECKLIST (ORDERED)

1. ☑ `layout/theme.liquid` — load order correct (dcube-overrides → dcube-mobile-fixes)
2. ☐ `assets/dcube-overrides.css` — push to Shopify assets
3. ☐ `assets/dcube-mobile-fixes.css` (v3) — push to Shopify assets
4. ☐ `sections/slideshow.liquid` — push (mobile_image_asset support)
5. ☐ `templates/index.json` — push (4 slides with mobile_image_asset filenames)
6. ☐ `assets/slide-1__brand-statement__desktop.webp` + all 7 sibling WebP files — push
7. ☐ Theme Editor — verify `enable_dusty_sanctuary_palette` is ON and SAVED
8. ☐ Test on iPhone (390px, 375px, 320px) — hero height, text top-left, cards square
9. ☐ Test on tablet (768px) — desktop landscape image visible, no mobile portrait

---

## IMAGE RE-GENERATION SPEC (FUTURE SPRINT)

For slides 1, 2, 4: Re-run image pipeline with prompt guidance:
- Candle should occupy **bottom-right quadrant only** (≤35% of frame width)
- Left 55% of image: clean background / scene / negative space
- Candle vertically: bottom 40% of frame
- Scene: same beach/sanctuary mood, wider field of view

Sharp crop workaround (improvement only, not full fix):
```javascript
import sharp from 'sharp';
// Slides 1, 2, 4: cut citrus from left, extend with brand mist
sharp('slide-X__mobile.webp')
  .extract({ left: 240, top: 0, width: 960, height: 1600 })
  .resize(1200, 1600, { fit: 'fill' })
  .webp({ quality: 85 })
  .toFile('slide-X__mobile__recomposed.webp');
```
Note: This shifts candle ~20% rightward but cannot create true negative space from a tight product shot. Full fix requires image re-generation.
