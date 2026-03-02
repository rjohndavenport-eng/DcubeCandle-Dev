# DRIFT AUDIT — DCUBE SANDBOX (2026-03-02)

| Page | Component | Observed | Expected | Source file(s) | Proposed fix | Acceptance criteria |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Global | Typography | Copperplate Gothic Std 29BC everywhere. | Modern Classic (Cormorant Garamond + Inter). | `sections\custom-font.liquid` | Disable custom-font section in settings_data.json. | No Copperplate font remains. Descriptions use Inter/Cormorant. |
| Global | Unboxing Reveal | Only on cards with secondary images + hover. | Consistent ritual across all grid items. | `snippets\product-item.liquid`, `layout	heme.liquid` | Add solo-image fallback animation (subtle zoom/glow) and ensure secondary image logic is robust. | All product cards have a hover ritual. |
| PDP | Content Blocks | Scent Chapter & Burn Gauge are left-aligned or unbalanced. | Centered/Balanced sanctuary layout. | `sections\product-content.liquid`, `snippets\burn-gauge.liquid` | Center the rituals grid and individual component wrappers. | Rituals section is centered on PDP. |
| Home | Trust Badges | CDN images with mismatched colors. | Unified SVG family in Dusty tokens. | `sections\static-text-with-icons.liquid`, `snippets\icon.liquid` | Create SVG icons for Shipping, Vegan, Secure and map them in icon.liquid. | Icons match Bee icon family and use Dusty colors. |
| Global | Accent Strips | Announcement bar & Footer use #d1c3fa (Old Lavender). | Dusty Mist #E6E1EB. | `config\settings_data.json` | Update background colors to #E6E1EB. | Accent strips match Dusty palette exactly. |
| Global | View All Button | Color might be inconsistent in some sections. | Dusty Accent #7E6B8F. | `sections\featured-collections.liquid` | Ensure all CTA/View All buttons use --primary-button-background correctly. | Buttons match Dusty accent token. |
