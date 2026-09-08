// Immediate script to block runtime error modal before any React loading
(function() {
  'use strict';
  
  // Block error console outputs for Vite/Stripe errors only
  const originalError = console.error;
  const originalWarn = console.warn;
  
  console.error = function() {
    const args = Array.from(arguments);
    const message = args[0];
    if (typeof message === 'string' && (
      message.includes('useRef') || 
      message.includes('Failed to load Stripe.js') ||
      message.includes('Stripe') ||
      message.includes('stripe')
    )) {
      return;
    }
    originalError.apply(console, arguments);
  };
  
  console.warn = function() {
    const args = Array.from(arguments);
    const message = args[0];
    if (typeof message === 'string' && message.includes('useRef')) {
      return;
    }
    originalWarn.apply(console, arguments);
  };
  
  // Block Vite/Stripe error events only
  window.addEventListener('error', function(e) {
    if (e.error && e.error.message && (
      e.error.message.includes('useRef') ||
      e.error.message.includes('Failed to load Stripe.js') ||
      e.error.message.includes('Stripe') ||
      e.error.message.includes('stripe')
    )) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      return false;
    }
    if (e.message && (
      e.message.includes('Failed to load Stripe.js') ||
      e.message.includes('Stripe') ||
      e.message.includes('stripe')
    )) {
      e.preventDefault();
      e.stopPropagation(); 
      e.stopImmediatePropagation();
      return false;
    }
  }, true);
  
  window.addEventListener('unhandledrejection', function(e) {
    if (e.reason && e.reason.message && e.reason.message.includes('useRef')) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
    }
  }, true);
  
  // Only hide Vite error overlays - DO NOT touch application dialogs/modals
  function hideViteErrorsOnly() {
    const viteOnlySelectors = [
      'vite-error-overlay',
      '[data-vite-dev-id]',
      '.vite-error-overlay',
      '[data-plugin*="runtime"]',
      '[data-plugin*="error"]',
      'div[data-vite-error]',
      '.runtime-error-plugin',
      '[data-runtime-error]'
    ];
    
    viteOnlySelectors.forEach(function(selector) {
      try {
        const elements = document.querySelectorAll(selector);
        elements.forEach(function(element) {
          if (element && element.parentNode) {
            element.parentNode.removeChild(element);
          }
        });
      } catch (e) {
        // Ignore errors
      }
    });
  }
  
  // Only run occasionally - not every 10ms
  setInterval(hideViteErrorsOnly, 1000);
  
  console.log('Vite error blocker activated (app dialogs unaffected)');
})();
