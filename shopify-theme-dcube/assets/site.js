/**
 * DCube Theme JavaScript
 * Handles cart drawer, mobile nav, and interactive elements
 */

(function () {
  'use strict';

  // Cart Drawer
  const cartToggle = document.querySelector('[data-cart-toggle]');
  const cartDrawer = document.getElementById('cart-drawer');

  if (cartToggle && cartDrawer) {
    cartToggle.addEventListener('click', function (e) {
      e.preventDefault();
      cartDrawer.hidden = !cartDrawer.hidden;
      document.body.classList.toggle('cart-open');
    });
  }

  // Quantity Controls
  const quantityIncrements = document.querySelectorAll('[data-qty-increment]');
  const quantityDecrements = document.querySelectorAll('[data-qty-decrement]');

  quantityIncrements.forEach(function (btn) {
    btn.addEventListener('click', function () {
      const input = btn.parentElement.querySelector('input[type="number"]');
      input.value = parseInt(input.value) + 1;
    });
  });

  quantityDecrements.forEach(function (btn) {
    btn.addEventListener('click', function () {
      const input = btn.parentElement.querySelector('input[type="number"]');
      if (parseInt(input.value) > 1) {
        input.value = parseInt(input.value) - 1;
      }
    });
  });

  // Product Gallery Thumbnails
  const thumbnails = document.querySelectorAll('.thumbnail[data-image-index]');
  const mainImage = document.querySelector('.main-image img');

  thumbnails.forEach(function (thumb) {
    thumb.addEventListener('click', function () {
      const imageIndex = this.getAttribute('data-image-index');
      thumbnails.forEach(function (t) {
        t.classList.remove('active');
      });
      this.classList.add('active');
      // Update main image (implement based on product images array)
    });
  });

  console.log('DCube theme loaded');
})();
