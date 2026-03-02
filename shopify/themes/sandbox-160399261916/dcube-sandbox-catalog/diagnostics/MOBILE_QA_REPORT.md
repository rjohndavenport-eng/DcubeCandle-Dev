# MOBILE IMAGE COHESION FIX — QA REPORT
Date: 2026-03-02
Pipeline: CODEX-MOBILE-AUDITOR → CODEX-MOBILE-ENGINEER → CODEX-MOBILE-ADVERSARY → CODEX-MOBILE-FINALIZER
Verdict: DEPLOYED

## Problem
Mobile product card images rendered as thin vertical slices.
Root cause: `.dcube-primary-img` lacked `object-fit: cover` and `max-width/max-height: none` to counter Focal's `.aspect-ratio img` specificity (0,1,1 > DCube's 0,1,0).
Secondary symptom: `.dcube-secondary-img` visible on touch devices (always opacity:1 with no hover possible).

## Fixes Applied (layout/theme.liquid)

### Fix 1 — Primary image sizing
Added to `.dcube-primary-img`:
- `max-width: none !important`
- `max-height: none !important`
- `object-fit: cover !important`
- `object-position: center !important`

### Fix 2 — Secondary image touch hide
Added:
```css
@media (hover: none) {
  .dcube-secondary-img { display: none !important; }
}
```
Note: Uses `hover: none` (not `pointer: coarse`) — more reliable across Instagram iOS in-app browser.

## Adversary Findings
- 9/10 checks PASSED
- 1 WARN: pointer:coarse detection misses Instagram iOS in-app browser → corrected to hover:none
- Final verdict: CONDITIONAL PASS → corrected → DEPLOY

## Preview URL
https://dcubecandle.myshopify.com/?preview_theme_id=160399261916

## Verification Checklist
- [ ] iPhone 12/13/14 Safari: single image fills card fully (no slicing)
- [ ] Android Chrome: single image fills card fully
- [ ] Desktop hover: primary fades → secondary revealed (crossfade intact)
- [ ] Products with 1 image: solo lift/glow animation on hover (no secondary)
- [ ] Instagram iOS in-app browser: no secondary image visible on product cards
