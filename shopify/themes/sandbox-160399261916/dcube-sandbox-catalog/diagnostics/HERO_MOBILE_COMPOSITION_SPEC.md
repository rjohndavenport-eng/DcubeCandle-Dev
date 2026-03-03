# HERO MOBILE COMPOSITION SPEC
Date: 2026-03-02
Agent: CODEX-GRAPHIC-COMPOSITION
Theme: Focal sandbox-160399261916

---

## IMAGE ASSESSMENT

All 4 mobile images have been visually inspected (1200×1600px each).

| Slide | File | Description | Candle Position | Left Negative Space | Text Safe? | CSS Sufficient? |
|---|---|---|---|---|---|---|
| 1 | slide-1__brand-statement__mobile.webp | White candle, bamboo lid, "SARASOTA SUNSHINE", beach/ocean bg, orange half left, small starfish lower-left | Centered, ~65% of width | None (orange slice) | No | No |
| 2 | slide-2__coastal-collection__mobile.webp | White candle, bamboo lid, "FRESH START", beach bg, orange halves both sides, starfish lower-left | Centered, ~65% of width | None (orange both sides) | No | No |
| 3 | slide-3__evening-mood__mobile.webp | Same candle lit/glowing amber, "SARASOTA SUNSHINE", dark navy night scene, orange left, moon upper-right | Centered but dark background provides natural contrast | Left has dark navy + orange (blend ok) | Yes (dark bg) | Yes |
| 4 | slide-4__gifting-premium__mobile.webp | White candle "SWEET SERENITY", beach bg, orange half left, starfish lower-left | Centered, ~65% of width | None (orange) | No | No |

---

## COMPOSITION VERDICT

**VERDICT: CSS-only is sufficient for Slide 3 only. Slides 1, 2, 4 require image pipeline re-generation.**

**Root cause:** The images were generated as tight product shots. The 1200×1600 mobile image and the ~390×519 mobile viewport have the SAME 0.75 aspect ratio — `object-fit: cover` fills the container with zero cropping, rendering `object-position` ineffective.

---

## FINAL COMPOSITION SPEC

### Text Safe Area
- **Target:** Left 55% of hero width, top 40% of hero height
- **Coordinate (390px viewport):** x=0–214px, y=0–208px
- **Currently achieved by:** `dcube-mobile-fixes.css` — `align-self: flex-start; padding-top: 3rem` on `.slideshow__text-wrapper`

### Subject Area
- **Target:** Right 35–45% of hero width, bottom 40% of hero height
- **Currently:** Candle centered and dominant in all 4 slides — NOT MEETING SPEC for slides 1, 2, 4

### Text Contrast Improvement (CSS path, this sprint)
Strengthened gradient overlay in `dcube-mobile-fixes.css`:
```css
background: linear-gradient(
  to right,
  rgba(230, 225, 235, 0.35) 0%,     /* 35% brand mist on far left */
  rgba(230, 225, 235, 0.20) 35%,    /* 20% at 1/3 of width */
  rgba(230, 225, 235, 0.06) 55%,    /* near-transparent at mid */
  transparent 75%                    /* fully clear at 75% */
);
```
Combined with `text-shadow: 0 1px 8px rgba(255,255,255,0.5)` on dark-text slides (1, 2, 4).

---

## IMAGE RE-GENERATION REQUIREMENTS (future sprint)

### Prompt Guidance for Image Pipeline
For slides 1, 2, 4 re-run:
- Field of view: **wider** — candle should occupy only 30–40% of frame height
- Candle placement: **lower-right quadrant** (candle base at bottom-right)
- Left zone (~55% width): clean background — open ocean, sand, sky — no competing objects (no citrus, no starfish)
- Lighting: preserve existing warm/coastal mood
- Size: output at 1200×1600px WebP, quality 85

### Slide-specific guidance
| Slide | Current Problem | Re-gen Instruction |
|---|---|---|
| 1 Brand Statement | Orange left, candle center | Widen scene; move orange to bg out-of-focus; candle bottom-right at 30% width |
| 2 Coastal Collection | Citrus both sides, candle center | Minimize citrus decorations to soft-focus background; candle bottom-right |
| 3 Evening Mood | Candle center, dark bg | **No change needed** — dark bg handles text contrast |
| 4 Gifting Premium | Orange left, starfish, candle center | Move candle to right; open sky/ocean left zone |

### Naming Convention (maintain)
```
slide-{N}__{slug}__desktop.webp   ← 2160×1080 landscape
slide-{N}__{slug}__mobile.webp    ← 1200×1600 portrait
```

---

## OBJECT-POSITION SPEC (per slide, for CSS targeting when images are re-generated)

Once images are re-generated with candle in bottom-right:
```css
/* Global mobile baseline */
.slideshow__image-wrapper.hidden-lap-and-up .slideshow__image {
  object-fit: cover;
  object-position: right bottom;  /* Works when subject IS in bottom-right */
}
```

For slide 3 (existing night image — dark bg handles text contrast regardless):
```css
.slideshow__slide--slide-3-evening .slideshow__image-wrapper.hidden-lap-and-up .slideshow__image {
  object-position: center top;  /* Show flame + dark sky in upper area */
}
```
Note: Requires `slideshow__slide--{{ block.id | handleize }}` class on slide element (see implementer task).

---

## ACCEPTANCE CRITERIA (after image re-generation)

| Check | Target |
|---|---|
| Candle width | ≤ 35% of mobile hero width (137px at 390px viewport) |
| Left text zone | ≥ 55% clear of subject — no competing objects |
| Text contrast | Subhead + Heading fully readable at 390px without gradient overlay |
| Gradient overlay | Optional enhancement, ≤20% opacity (should not be load-bearing) |
| Slide 3 (evening) | Candle visible + dark background; text reads without overlay |
