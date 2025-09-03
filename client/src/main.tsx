import React from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { queryClient } from "@/lib/queryClient";
import App from "./App";
import "./index.css";
import "./colors.css";

console.log("Starting Adaptalyfe app...");
console.log("React version:", React.version);
console.log("Current URL:", window.location.href);
console.log("User agent:", navigator.userAgent);
console.log("Screen size:", screen.width, "x", screen.height);

const container = document.getElementById("root");
if (!container) {
  throw new Error("Failed to find the root element");
}

// Check for mobile browser compatibility issues
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
console.log("Mobile device detected:", isMobile);

// Polyfills for mobile compatibility
if (!window.URLSearchParams && (window as any).URL) {
  console.log("Adding URLSearchParams polyfill for mobile");
  // Basic URLSearchParams polyfill for older mobile browsers
  (window as any).URLSearchParams = function(this: any, search: string) {
    const params: Record<string, string> = {};
    if (search) {
      search.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(str, key, value) {
        params[key] = decodeURIComponent(value);
        return str;
      });
    }
    this.get = function(key: string) { return params[key] || null; };
    return this;
  };
}

try {
  const root = createRoot(container);
  console.log("Creating React root and rendering app...");
  
  // Add mobile-specific rendering
  if (isMobile) {
    console.log("Applying mobile-specific optimizations");
    // Prevent zoom on input focus for mobile
    const metaViewport = document.querySelector('meta[name="viewport"]');
    if (metaViewport) {
      metaViewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
    }
  }
  
  root.render(
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <App />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
  console.log("App rendered successfully");
} catch (error) {
  console.error("Error rendering app:", error);
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorDetails = isMobile ? 
    `Mobile device: ${navigator.userAgent}. Error: ${errorMessage}` : 
    `Desktop device. Error: ${errorMessage}`;
  
  document.body.innerHTML = `
    <div style="min-height: 100vh; background: linear-gradient(to bottom right, #e0f2fe, #f3e8ff, #f0fdfa); display: flex; align-items: center; justify-content: center; padding: 1rem;">
      <div style="text-align: center; background: white; padding: 2rem; border-radius: 0.5rem; box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1); max-width: 90vw; width: 28rem;">
        <h2 style="font-size: 1.5rem; font-weight: bold; color: #dc2626; margin-bottom: 1rem;">App Loading Error</h2>
        <p style="color: #4b5563; margin-bottom: 1rem;">Failed to start the application on ${isMobile ? 'mobile' : 'desktop'} device.</p>
        <div style="background: #f3f4f6; padding: 1rem; border-radius: 0.25rem; margin-bottom: 1rem; font-size: 0.875rem; text-align: left; overflow-wrap: break-word;">
          ${errorDetails}
        </div>
        <button onclick="window.location.reload()" style="background: #2563eb; color: white; padding: 0.75rem 1.5rem; border-radius: 0.25rem; border: none; cursor: pointer; font-size: 1rem;">
          Reload Page
        </button>
      </div>
    </div>
  `;
}
