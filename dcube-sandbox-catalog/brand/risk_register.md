# RISK REGISTER

| Risk | Impact | Mitigation |
| :--- | :--- | :--- |
| **CSS Collision** | Focal's internal variables may fight with new brand tokens. | Use `!important` sparingly; prefer mapping to Focal's settings. |
| **Logo Degradation** | Editing icons may introduce artifacts. | Read-only access to master; output only verified SVGs. |
| **Performance** | Animations (Bloom/Unboxing) may increase LCP. | Use CSS GPU-accelerated transforms (translate3d). |
| **Live Store Drift** | Accidental push to production. | **STRICT MODE** enforced; CLI targets sandbox ID only. |
