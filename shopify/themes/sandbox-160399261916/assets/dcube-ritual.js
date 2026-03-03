/**
 * dcube-ritual.js — Daily Ritual Reveal interaction engine
 * Interaction Lead: CODEX-SHOPIFY-THEME-EXPERT-2
 *
 * Constraints:
 *   - Vanilla JS only. No jQuery. No external libs.
 *   - requestAnimationFrame for DOM write batching.
 *   - No setInterval. No mutation observers.
 *   - localStorage wrapped in try/catch.
 *   - All animations degrade if JS fails (noscript CSS handles that).
 *   - < 6KB minified.
 */

(function () {
  'use strict';

  /* ── Storage helpers ──────────────────────────────────────────── */

  function storageGet(key) {
    try { return localStorage.getItem(key) !== null; } catch (_) { return false; }
  }

  function storageSet(key) {
    try { localStorage.setItem(key, '1'); } catch (_) { /* silent */ }
  }

  /* ── Class: DcubeRitual ───────────────────────────────────────── */

  function DcubeRitual(el) {
    this.el           = el;
    this.lid          = el.querySelector('.dcube-ritual-lid');
    this.base         = el.querySelector('.dcube-ritual-base');
    this.productLink  = el.querySelector('[data-product-link]');
    this.titleEl      = el.querySelector('.dcube-ritual-base__title');
    this.audioEl      = el.querySelector('[data-ritual-audio]') ||
                        document.getElementById('dcube-ritual-audio-' + el.closest('[id]')?.id?.replace('shopify-section-', ''));
    this.storageKey   = el.dataset.storageKey   || '';
    this.productUrl   = el.dataset.productUrl   || '';
    this.soundEnabled = el.dataset.soundEnabled === 'true';

    this.isRevealed   = false;
    this.isAnimating  = false;
    this.isCompleted  = this.storageKey ? storageGet(this.storageKey) : false;
    this.observer     = null;

    this._init();
  }

  DcubeRitual.prototype = {

    _init: function () {
      var self = this;

      /* Apply memory state */
      if (this.isCompleted) {
        this.el.classList.add('dcube-ritual--completed');
      }

      /* Detect touch vs pointer */
      var isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

      if (isTouch) {
        this._initTouch();
      } else {
        this._initPointer();
      }

      /* Keyboard: Enter / Space */
      this.el.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (!self.isRevealed) {
            self._reveal();
          } else {
            /* Second activation: follow product link */
            if (self.productLink) self.productLink.click();
          }
        }
      });

      /* Mobile shimmer via IntersectionObserver */
      if (isTouch && typeof IntersectionObserver !== 'undefined') {
        this.observer = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting && !self.isCompleted) {
              self.el.classList.add('dcube-ritual--shimmer');
            } else {
              self.el.classList.remove('dcube-ritual--shimmer');
            }
          });
        }, { threshold: 0.5 });
        this.observer.observe(this.el);
      }

      /* Lazy-load audio if enabled */
      if (this.soundEnabled && this.audioEl) {
        this.audioEl.preload = 'metadata';
      }
    },

    _initPointer: function () {
      var self = this;
      this.el.addEventListener('mouseenter', function () {
        if (!self.isRevealed && !self.isAnimating) self._reveal();
      });
      this.el.addEventListener('mouseleave', function () {
        if (self.isRevealed && !self.isCompleted && !self.isAnimating) self._close();
      });
      this.el.addEventListener('focusin', function () {
        if (!self.isRevealed && !self.isAnimating) self._reveal();
      });
    },

    _initTouch: function () {
      var self = this;
      this.el.addEventListener('click', function (e) {
        if (!self.isRevealed) {
          /* First tap: reveal, prevent navigation */
          e.preventDefault();
          if (!self.isAnimating) self._reveal();
        }
        /* Second tap falls through — <a> inside base navigates naturally */
      });
    },

    _reveal: function () {
      if (this.isAnimating) return;
      var self = this;
      this.isAnimating = true;

      /* Stop shimmer */
      this.el.classList.remove('dcube-ritual--shimmer');

      /* Play sound on user interaction */
      if (this.soundEnabled && this.audioEl) {
        this.audioEl.play().catch(function () { /* autoplay policy — silent */ });
      }

      /* Batch DOM write in next animation frame to avoid forced reflow */
      requestAnimationFrame(function () {
        self.el.classList.add('dcube-ritual--revealed');
      });

      /* Wait for lid transform to finish */
      var onEnd = function (e) {
        if (e.propertyName !== 'transform') return;
        self.lid.removeEventListener('transitionend', onEnd);
        self.isAnimating = false;
        self.isRevealed  = true;

        /* Make base navigable */
        if (self.base) {
          self.base.removeAttribute('aria-hidden');
        }

        /* Transfer focus to product title for screen readers */
        if (self.titleEl) {
          self.titleEl.setAttribute('tabindex', '-1');
          self.titleEl.focus({ preventScroll: true });
        }

        /* Persist ritual completion */
        if (!self.isCompleted && self.storageKey) {
          storageSet(self.storageKey);
          self.isCompleted = true;
          self.el.classList.add('dcube-ritual--completed');
        }
      };

      this.lid.addEventListener('transitionend', onEnd);
    },

    _close: function () {
      if (this.isAnimating) return;
      var self = this;
      this.isAnimating = true;

      requestAnimationFrame(function () {
        self.el.classList.remove('dcube-ritual--revealed');
      });

      if (this.base) {
        this.base.setAttribute('aria-hidden', 'true');
      }

      var onEnd = function (e) {
        if (e.propertyName !== 'transform') return;
        self.lid.removeEventListener('transitionend', onEnd);
        self.isAnimating = false;
        self.isRevealed  = false;
      };

      this.lid.addEventListener('transitionend', onEnd);
    }

  };

  /* ── Init all ritual elements on the page ────────────────────── */

  function initAll() {
    var els = document.querySelectorAll('[data-ritual]');
    for (var i = 0; i < els.length; i++) {
      new DcubeRitual(els[i]);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }

})();
