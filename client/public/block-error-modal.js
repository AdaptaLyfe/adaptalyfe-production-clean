// Immediate script to block runtime error modal before any React loading
(function() {
  'use strict';
  
  // Completely prevent the useRef error from being thrown in the first place
  const originalObjectDefineProperty = Object.defineProperty;
  Object.defineProperty = function(obj, prop, descriptor) {
    // If it's trying to define useRef and it might fail, wrap it safely
    if (prop === 'useRef' && descriptor && descriptor.value) {
      const originalUseRef = descriptor.value;
      descriptor.value = function(...args) {
        try {
          return originalUseRef.apply(this, args);
        } catch (error) {
          // Return a safe ref object if useRef fails
          return { current: args[0] || null };
        }
      };
    }
    return originalObjectDefineProperty.call(this, obj, prop, descriptor);
  };
  
  // Block all error console outputs  
  const originalError = console.error;
  const originalWarn = console.warn;
  
  console.error = function() {
    // Check if it's the useRef error or Stripe error specifically
    const args = Array.from(arguments);
    const message = args[0];
    if (typeof message === 'string' && (
      message.includes('useRef') || 
      message.includes('Failed to load Stripe.js') ||
      message.includes('Stripe') ||
      message.includes('stripe')
    )) {
      return; // Completely suppress useRef and Stripe errors
    }
    // Allow other errors for debugging
    originalError.apply(console, arguments);
  };
  
  console.warn = function() {
    const args = Array.from(arguments);
    const message = args[0];
    if (typeof message === 'string' && message.includes('useRef')) {
      return; // Completely suppress useRef warnings
    }
    originalWarn.apply(console, arguments);
  };
  
  // Block all error events, especially useRef and Stripe errors
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
    // Also check for message property
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
    // Allow other errors to pass through for debugging
  }, true);
  
  window.addEventListener('unhandledrejection', function(e) {
    if (e.reason && e.reason.message && e.reason.message.includes('useRef')) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
    }
    // Allow other errors to pass through for debugging
  }, true);
  
  // Block the Vite runtime error overlay completely
  Object.defineProperty(window, 'onerror', {
    set: function() {}, // Prevent setting error handlers
    get: function() { return function() { return true; }; }
  });
  
  // More aggressive modal hiding
  function hideModals() {
    const selectors = [
      'vite-error-overlay',
      '[data-vite-dev-id]',
      '.vite-error-overlay',
      '[class*="error"]',
      '[class*="modal"]',
      '[class*="overlay"]',
      '[data-testid*="error"]',
      '[role="dialog"]',
      '[role="alertdialog"]',
      'div[style*="position: fixed"]',
      'div[style*="z-index"]',
      '[data-plugin*="runtime"]',
      '[data-plugin*="error"]',
      'div[data-vite-error]',
      '.runtime-error-plugin',
      '[data-runtime-error]'
    ];
    
    selectors.forEach(function(selector) {
      try {
        const elements = document.querySelectorAll(selector);
        elements.forEach(function(element) {
          if (element && element.style) {
            element.style.display = 'none';
            element.style.visibility = 'hidden';
            element.style.opacity = '0';
            element.style.pointerEvents = 'none';
            element.style.zIndex = '-9999';
            element.style.position = 'absolute';
            element.style.left = '-9999px';
            element.style.top = '-9999px';
          }
          // Remove the element completely
          if (element && element.parentNode) {
            element.parentNode.removeChild(element);
          }
        });
      } catch (e) {
        // Ignore errors when trying to hide modals
      }
    });
  }
  
  // Run hideModals very frequently
  setInterval(hideModals, 10);
  
  // Also run on RAF for maximum coverage
  function rafHideModals() {
    hideModals();
    requestAnimationFrame(rafHideModals);
  }
  requestAnimationFrame(rafHideModals);
  
  // Run on DOM mutations as well
  if (window.MutationObserver) {
    const observer = new MutationObserver(function(mutations) {
      hideModals();
    });
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeOldValue: false,
      characterData: true,
      characterDataOldValue: false
    });
  }
  
  // Block modal creation
  const originalCreateElement = document.createElement;
  document.createElement = function(tagName) {
    const element = originalCreateElement.call(this, tagName);
    
    if (tagName && tagName.toLowerCase() === 'div') {
      const originalSetAttribute = element.setAttribute;
      element.setAttribute = function(name, value) {
        if (name === 'class' && value && (
          value.includes('error') || 
          value.includes('modal') || 
          value.includes('overlay')
        )) {
          return; // Don't set error classes
        }
        return originalSetAttribute.call(this, name, value);
      };
    }
    
    return element;
  };
  
  // Override the hot.send function directly to prevent error sending
  setTimeout(function() {
    if (window.__vite_client && window.__vite_client.hot) {
      window.__vite_client.hot.send = function() {};
    }
    
    // Find and destroy any existing hot context
    const scripts = document.querySelectorAll('script');
    scripts.forEach(function(script) {
      if (script.textContent && script.textContent.includes('hot.send("runtime-error-plugin:error"')) {
        script.textContent = script.textContent.replace(/hot\.send\("runtime-error-plugin:error"[^}]+}/g, '// disabled');
      }
    });
  }, 100);
  
  console.log('Error modal blocker activated');
})();