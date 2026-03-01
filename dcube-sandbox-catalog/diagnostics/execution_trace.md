# EXECUTION TRACE — How DCube Changes Fire (or Don't)

## CSS Variables Injection Path (CONFIRMED CORRECT)

```
layout/theme.liquid (line 73)
  └─ {% render 'css-variables', direction: direction %}
       └─ snippets/css-variables.liquid
            ├─ Lines 181–196: @font-face Cormorant Garamond
            ├─ Line 197: --heading-font-family: 'Cormorant Garamond', serif
            └─ Line 202: /* DCUBE DUSTY SANCTUARY OVERRIDES */
                         (guarded by: if settings.enable_dusty_sanctuary_palette)

layout/theme.liquid (line 85)
  └─ {%- if settings.enable_dusty_sanctuary_palette -%}
       └─ Inline <style> block: CSS var overrides for colors + typography

layout/theme.liquid (line 202)
  └─ {%- if settings.enable_dusty_sanctuary_palette -%}
       └─ /* DCUBE MASTER OVERLAYS */ (body decorations, noise texture)
```

## Why Nothing Shows: The Single Toggle Gate

Every DCube visual override is gated behind:
  `settings.enable_dusty_sanctuary_palette`

This setting DOES exist in `config/settings_schema.json` (line 711, section "Dcube Brand (Sandbox)" at line 703).

**If this setting is OFF (default), ZERO visual changes appear — by design.**

## Root Cause of "I'm not seeing updates"

The overwhelming probability is ONE of these:

1. **Previewing the live theme** — visiting `dcubecandle.com` or `dcubecandle.myshopify.com` directly
   shows theme #144142631132 (live "focal-verson-8-7-2") which has NONE of the DCube changes.

2. **Setting not enabled** — the `enable_dusty_sanctuary_palette` toggle in Theme Settings
   was never turned ON and Saved in the Theme Editor for sandbox theme #160399261916.

3. **Unboxing section not added to a page** — `sections/unboxing-product.liquid` exists on
   remote but is referenced in ZERO templates. It will never render until added via Theme Editor.

## What IS Executing Right Now (with correct preview + flag ON)

- CSS variable overrides (colors, typography) via inline `<style>` in theme.liquid ✅
- @font-face Cormorant Garamond loading ✅
- DCUBE MASTER OVERLAYS (body::before noise texture) ✅
- DCUBE DUSTY SANCTUARY OVERRIDES from css-variables.liquid ✅

## What WILL NOT Show Until Added via Theme Editor

- `unboxing-product.liquid` (Dcube Unboxing Reveal section) — needs to be manually added
  to the desired page template via the Theme Editor customizer.
