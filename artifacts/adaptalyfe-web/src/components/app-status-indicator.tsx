import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';

export function AppStatusIndicator() {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [hasRuntimeError, setHasRuntimeError] = useState(false);

  useEffect(() => {
    // Check if the runtime error plugin is causing issues
    const checkRuntimeErrorPlugin = () => {
      const scripts = document.querySelectorAll('script[type="module"]');
      let hasRuntimeErrorScript = false;
      
      scripts.forEach(script => {
        if (script.textContent && script.textContent.includes('runtime-error-plugin')) {
          hasRuntimeErrorScript = true;
        }
      });
      
      setHasRuntimeError(hasRuntimeErrorScript);
    };

    // Check app status
    const checkStatus = () => {
      try {
        // If we can execute this code, React is working
        if (document.getElementById('root') && document.getElementById('root')?.children.length > 0) {
          setStatus('ready');
        } else {
          setStatus('loading');
        }
      } catch (error) {
        setStatus('error');
      }
    };

    checkRuntimeErrorPlugin();
    checkStatus();

    // Set up a timer to check status periodically
    const statusInterval = setInterval(checkStatus, 1000);

    return () => {
      clearInterval(statusInterval);
    };
  }, []);

  if (status === 'loading') {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Badge variant="secondary" className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading...
        </Badge>
      </div>
    );
  }

  if (status === 'error' || hasRuntimeError) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Badge variant="destructive" className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          Runtime Error Detected
        </Badge>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Badge variant="default" className="flex items-center gap-2 bg-green-600">
        <CheckCircle className="w-4 h-4" />
        App Ready
      </Badge>
    </div>
  );
}