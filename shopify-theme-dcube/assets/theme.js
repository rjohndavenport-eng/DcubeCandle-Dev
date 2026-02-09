(() => {
  const menuToggle = document.querySelector('[data-menu-toggle]');
  const siteNav = document.querySelector('[data-site-nav]');

  if (menuToggle && siteNav) {
    menuToggle.addEventListener('click', () => {
      const isOpen = siteNav.classList.toggle('is-open');
      menuToggle.setAttribute('aria-expanded', String(isOpen));
    });
  }

  document.querySelectorAll('[data-sort-select]').forEach((select) => {
    select.addEventListener('change', () => {
      const form = select.closest('form');
      if (form) {
        form.submit();
      }
    });
  });

  document.querySelectorAll('[data-tag-select]').forEach((select) => {
    select.addEventListener('change', () => {
      if (select.value) {
        window.location.href = select.value;
      }
    });
  });

  document.querySelectorAll('[data-product-root]').forEach((root) => {
    const mainImage = root.querySelector('[data-main-image] img');
    const thumbs = root.querySelectorAll('[data-thumb]');

    thumbs.forEach((thumb) => {
      thumb.addEventListener('click', () => {
        const image = thumb.getAttribute('data-image');
        if (mainImage && image) {
          mainImage.setAttribute('src', image);
        }

        thumbs.forEach((btn) => btn.classList.remove('active'));
        thumb.classList.add('active');
      });
    });
  });

  document.querySelectorAll('[data-qty-wrap]').forEach((wrap) => {
    const input = wrap.querySelector('input[type="number"]');
    const minus = wrap.querySelector('[data-qty-minus]');
    const plus = wrap.querySelector('[data-qty-plus]');

    if (!input || !minus || !plus) {
      return;
    }

    minus.addEventListener('click', () => {
      const value = Number(input.value || 1);
      input.value = String(Math.max(1, value - 1));
    });

    plus.addEventListener('click', () => {
      const value = Number(input.value || 1);
      input.value = String(value + 1);
    });
  });
})();
