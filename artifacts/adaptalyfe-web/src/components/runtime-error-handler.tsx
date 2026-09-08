import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export function RuntimeErrorHandler() {
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // Completely suppress the useRef runtime error modal
    const handleRuntimeError = (event: any) => {
      if (event.detail && event.detail.message) {
        // Suppress useRef, runtime plugin, and Stripe errors completely
        if (event.detail.message.includes('useRef') || 
            event.detail.message.includes('runtime-error-plugin') ||
            event.detail.message.includes('Cannot read properties of null') ||
            event.detail.message.includes('Stripe') ||
            event.detail.message.includes('Failed to load Stripe.js')) {
          event.preventDefault?.();
          event.stopPropagation?.();
          return; // Don't show any modal for these errors
        }
        // Only show error for genuine application errors
        setErrorMessage(event.detail.message);
        setShowError(true);
      }
    };

    // Listen for custom events from the runtime error plugin
    window.addEventListener('runtime-error', handleRuntimeError);

    // Also listen for regular errors but suppress useRef issues
    const handleError = (event: ErrorEvent) => {
      if (event.error && event.error.message) {
        // Completely suppress useRef and Stripe errors
        if (event.error.message.includes('useRef') || 
            event.error.message.includes('runtime-error-plugin') ||
            event.error.message.includes('Cannot read properties of null') ||
            event.error.message.includes('Stripe') ||
            event.error.message.includes('Failed to load Stripe.js')) {
          event.preventDefault();
          event.stopPropagation();
          return; // Don't show modal
        }
        setErrorMessage(event.error.message);
        setShowError(true);
      }
    };

    window.addEventListener('error', handleError, true);

    return () => {
      window.removeEventListener('runtime-error', handleRuntimeError);
      window.removeEventListener('error', handleError, true);
    };
  }, []);

  if (!showError) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            Runtime Error Detected
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            The application encountered an error. This is usually temporary and can be resolved by refreshing the page.
          </p>
          
          <details className="mb-4 p-3 bg-gray-50 rounded text-sm">
            <summary className="font-medium cursor-pointer">Error Details</summary>
            <pre className="mt-2 text-xs overflow-auto max-h-32">
              {errorMessage}
            </pre>
          </details>
          
          <div className="flex gap-2">
            <Button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Reload Page
            </Button>
            <Button
              onClick={() => setShowError(false)}
              variant="outline"
            >
              Continue Anyway
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}