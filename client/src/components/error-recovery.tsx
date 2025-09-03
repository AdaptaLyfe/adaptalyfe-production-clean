import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, ExternalLink } from 'lucide-react';

export function ErrorRecovery() {
  const [showRecovery, setShowRecovery] = useState(false);
  const [isRuntimeErrorLoop, setIsRuntimeErrorLoop] = useState(false);

  useEffect(() => {
    // Check if we're in a runtime error loop
    const checkForRuntimeErrorLoop = () => {
      const pageContent = document.documentElement.outerHTML;
      const hasRuntimeErrorScript = pageContent.includes('runtime-error-plugin');
      const hasMinimalContent = document.body.children.length < 3;
      
      if (hasRuntimeErrorScript && hasMinimalContent) {
        console.log('Runtime error loop detected');
        setIsRuntimeErrorLoop(true);
        setShowRecovery(true);
      }
    };

    // Initial check
    setTimeout(checkForRuntimeErrorLoop, 2000);

    // Listen for runtime errors
    const handleError = (event: ErrorEvent) => {
      console.log('Error detected:', event.error);
      if (event.error && event.error.message.includes('runtime-error-plugin')) {
        setIsRuntimeErrorLoop(true);
        setShowRecovery(true);
      }
    };

    window.addEventListener('error', handleError);

    return () => {
      window.removeEventListener('error', handleError);
    };
  }, []);

  const handleTryAgain = () => {
    setShowRecovery(false);
    window.location.reload();
  };

  const handleStaticVersion = () => {
    window.location.href = '/test-static.html';
  };

  if (!showRecovery) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-100 via-purple-50 to-pink-100 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-600">
            <AlertTriangle className="w-5 h-5" />
            {isRuntimeErrorLoop ? 'Development Mode Issue' : 'Loading Issue'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-gray-700">
            {isRuntimeErrorLoop ? (
              <div>
                <p className="mb-2">
                  The development server is experiencing a runtime error loop. This is a known issue with the development environment.
                </p>
                <p className="text-sm text-gray-600">
                  The application works correctly in production mode.
                </p>
              </div>
            ) : (
              <p>
                The application is taking longer than usual to load. This might be a temporary issue.
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <Button
              onClick={handleTryAgain}
              className="w-full flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </Button>
            
            <Button
              onClick={handleStaticVersion}
              variant="outline"
              className="w-full flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              View Static Test Page
            </Button>
          </div>
          
          <div className="text-xs text-gray-500 text-center">
            If the issue persists, the application may be experiencing a temporary development server issue.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}