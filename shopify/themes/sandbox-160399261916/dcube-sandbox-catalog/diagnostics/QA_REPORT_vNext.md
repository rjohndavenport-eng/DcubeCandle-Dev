# QA REPORT — DCube Candle Sandbox

**Date:** 2026-03-02
**Session:** Visual Cohesion Mission v3 — Proof-Based Pipeline
**Theme ID:** 160399261916 (sandbox, unpublished)
**Preview URL:** https://dcubecandle.myshopify.com/?preview_theme_id=160399261916

---

## FILES MODIFIED

### 1. `config/settings_data.json`
- **Change:** Announcement bar `button_background` value corrected from `#000000` to `#7E6B8F`
- **Reason:** Active color leak — the black default was overriding the brand muted purple on the announcement bar CTA button.

### 2. `config/settings_data.json`
- **Change:** Copperplate Gothic font block removed from the `custom-font` section
- **Reason:** Dead code hazard — the font was never part of the DCube brand spec. Its presence created a risk of the font being accidentally re-enabled via the Theme Editor, reintroducing an off-brand typeface. Removed cleanly; JSON structure validated.

### 3. `layout/theme.liquid`
- **Change:** Global button backstop CSS added before `</style>`
- **Reason:** Section-level style overrides in Focal can re-introduce color leaks on buttons. The backstop ensures `background-color: rgb(126, 107, 143)` is applied globally as a fallback, preventing future regressions from new sections or app embeds.

---

## ADVERSARIAL CHECK RESULTS

| Check | Result | Notes |
|-------|--------|-------|
| CHECK 1: Announcement bar CTA button color | Initially FAIL (rgba → black), corrected to PASS (now #7E6B8F) | Active color leak was found and fixed in settings_data.json |
| CHECK 2: Dusty Sanctuary toggle gate | PASS with caveat | Toggle currently enabled; if disabled by admin, Unboxing Ritual and palette overrides disappear. See Known Risks. |
| CHECK 3: Duplicate CSS rule | WARN | Backstop rule in theme.liquid is redundant — lines 111-120 already cover button styling. Harmless duplicate; no functional regression. |
| CHECK 4: Copperplate Gothic removal | PASS | JSON validated clean after block removal. No parse errors. |
| CHECK 5: prefers-reduced-motion crossfade | PASS | Reduced-motion media query correctly triggers crossfade instead of slide on Unboxing Reveal cards. |
| CHECK 6: Icon color | PASS | Icons use brand purple (#7E6B8F / rgb(126, 107, 143)) consistently. |
| CHECK 7: Typography completeness | PASS | All headings: Cormorant Garamond. Body/nav/buttons: Inter. No Montserrat or Copperplate visible in rendered elements. |

---

## VERIFICATION CHECKLIST

For human verification in Shopify theme preview. Check each item off after manual visual inspection.

- [ ] Announcement bar CTA button renders muted purple (#7E6B8F), not black
- [ ] Home featured product card: Unboxing slide-up on hover (primary image slides up, secondary revealed)
- [ ] Home featured product card: Solo-image card lifts/glows only (no slide)
- [ ] Collection grid: Unboxing works on all product cards
- [ ] prefers-reduced-motion: crossfade instead of slide (test via DevTools — Rendering > Emulate CSS media feature prefers-reduced-motion)
- [ ] Primary CTAs system-wide: #7E6B8F (check View All, Shop Now, Add to Cart)
- [ ] Typography: All headings in Cormorant Garamond, body/nav/buttons in Inter
- [ ] No Copperplate Gothic font loaded in network tab (DevTools > Network > filter by Font)
- [ ] No Montserrat font visible in rendered elements (DevTools > Elements > computed styles)

---

## PREVIEW URL

```
https://dcubecandle.myshopify.com/?preview_theme_id=160399261916
```

---

## KNOWN REMAINING RISKS

### Risk 1: Dusty Sanctuary Toggle Gating
The Unboxing Ritual CSS, brand typography, and palette overrides are all gated behind the `settings.enable_dusty_sanctuary_palette` toggle in `settings_schema.json`. If any admin navigates to the Theme Editor and disables this toggle, the entire visual system collapses: Cormorant Garamond reverts to Focal defaults, the Unboxing hover animations disappear, and the palette reverts.

**Recommended hardening (future pass):** Move the Unboxing Ritual CSS and core brand typography rules outside the conditional Liquid block in `theme.liquid` so they are unconditional. Reserve the toggle for palette color overrides only (which are lower risk to revert). Alternatively, document in the Theme Editor using a locked section config that the toggle must remain enabled.

### Risk 2: Backstop CSS Redundancy
The global button backstop added in `theme.liquid` duplicates existing coverage from lines 111-120. This is harmless now but creates a maintenance surface — if the button color ever needs to change, two locations must be updated. Future hardening should consolidate into a single rule, preferably as a CSS custom property reference.

### Risk 3: settings_data.json Drift
`settings_data.json` is overwritten by Theme Editor saves. Any admin who edits a section via the Theme Editor and saves will regenerate this file. The `button_background: #7E6B8F` fix for the announcement bar could be reverted to `#000000` if an admin re-saves the Announcement Bar section without selecting the correct color. Recommend documenting this in a pinned Theme Editor note or enforcing via a section preset default.

---

## AUDIT TRAIL

| Artifact | Location |
|----------|----------|
| Investigation packet | `dcube-sandbox-catalog/diagnostics/INVESTIGATION_PACKET.md` |
| This QA report | `dcube-sandbox-catalog/diagnostics/QA_REPORT_vNext.md` |
| Brand spec | `dcube-sandbox-catalog/brand_spec.md` |
| Design tokens | `dcube-sandbox-catalog/brand_tokens.json` |
| Acceptance criteria | `dcube-sandbox-catalog/acceptance_criteria.md` |
| Runbook | `RUNBOOK_SANDBOX_VISUAL.md` |
