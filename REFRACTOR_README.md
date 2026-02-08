# Refactor Notes

## Where to change styles for the next premium redesign
- Global tokens and shared component styles live in `assets/css/site.css`.
- Update visual foundation in `:root` tokens near the top of `assets/css/site.css`.
- Header/footer/nav/button changes should be made once in:
  - `components/common/header.html`
  - `components/common/footer.html`
  - `components/index/header.html`
  - `components/index/footer.html`
- Shared page fragments are in `components/sections/`.
- Shared card fragments are in `components/cards/`.

## Include system
- `assets/js/includes.js` resolves every element with `data-include`.
- Component variables are passed through `data-*` attributes and injected into `{{variable}}` placeholders.

## Bee motif hooks for later styling
- Use `.bee-mark` for visible line-art bee accents (icons/dividers/signatures/footer mark).
- Use `.bee-watermark` for subtle background motif overlays.
- Both hooks are already declared in `assets/css/site.css` and can be expanded without changing page markup.
