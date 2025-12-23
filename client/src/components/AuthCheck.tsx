import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { getSessionToken } from "@/lib/queryClient";

interface AuthCheckProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export default function AuthCheck({ children, redirectTo = "/login" }: AuthCheckProps) {
  const [, setLocation] = useLocation();
  const [authState, setAuthState] = useState<'checking' | 'authenticated' | 'unauthenticated'>('checking');
  
  // CRITICAL: Check for session token FIRST - block all rendering until verified
  const sessionToken = getSessionToken();
  
  // Immediate redirect if no token - don't even start the query
  useEffect(() => {
    if (!sessionToken) {
      const currentPath = window.location.pathname;
      if (!['/login', '/register', '/', '/demo', '/landing'].includes(currentPath)) {
        console.log('🚫 AuthCheck: No session token, redirecting to login');
        setAuthState('unauthenticated');
        setLocation(redirectTo);
      }
    }
  }, [sessionToken, setLocation, redirectTo]);
  
  // Only run the API check if we have a session token
  const { data: user, isLoading, error } = useQuery({
    queryKey: ['/api/user'],
    retry: 2,
    retryDelay: 1000,
    enabled: !!sessionToken // Only query if token exists
  });

  // Handle API response
  useEffect(() => {
    if (!sessionToken) {
      // Already handled above
      return;
    }
    
    if (isLoading) {
      setAuthState('checking');
      return;
    }
    
    if (user) {
      setAuthState('authenticated');
      return;
    }
    
    if (error) {
      console.log('AuthCheck: API authentication failed, redirecting to login');
      setAuthState('unauthenticated');
      const currentPath = window.location.pathname;
      if (!['/login', '/register', '/', '/demo', '/landing'].includes(currentPath)) {
        setLocation(redirectTo);
      }
    }
  }, [sessionToken, isLoading, user, error, setLocation, redirectTo]);

  // CRITICAL: Block ALL rendering until we know auth state
  // This prevents dashboard from trying to render before we redirect
  
  // No token = don't render anything, redirect is happening
  if (!sessionToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-100 via-teal-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }
  
  // Still checking = show loading
  if (authState === 'checking' || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-100 via-teal-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Unauthenticated = show loading while redirecting
  if (authState === 'unauthenticated' || (!user && error)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-100 via-teal-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // Only render children when fully authenticated
  if (authState === 'authenticated' && user) {
    return <>{children}</>;
  }
  
  // Fallback - should never reach here, but show loading just in case
  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-100 via-teal-50 to-blue-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}
