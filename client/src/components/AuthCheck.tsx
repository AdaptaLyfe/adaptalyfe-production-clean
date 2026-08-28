import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { getQueryFn, getSessionToken, clearSessionToken } from "@/lib/queryClient";

interface AuthCheckProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export default function AuthCheck({ children, redirectTo = "/login" }: AuthCheckProps) {
  const [, setLocation] = useLocation();
  const [authState, setAuthState] = useState<'checking' | 'authenticated' | 'unauthenticated'>('checking');
  
  // Native clients send a bearer token while browsers rely on their HttpOnly
  // cookie. Both session types are verified through the same endpoint.
  const sessionToken = getSessionToken();

  const { data: user, isLoading, error } = useQuery({
    queryKey: ['/api/user'],
    queryFn: getQueryFn({ on401: 'returnNull' }),
    retry: 1,
    retryDelay: 1000,
  });

  // Handle API response
  useEffect(() => {
    if (isLoading) {
      setAuthState('checking');
      return;
    }
    
    if (user) {
      setAuthState('authenticated');
      return;
    }
    
    // If not loading and user is null (401 returns null, not an error), treat as unauthenticated
    console.log('AuthCheck: No user returned (401 or session expired), redirecting to login');
    if (sessionToken) {
      clearSessionToken(); // Clear stale native token so next visit goes straight to login
    }
    setAuthState('unauthenticated');
    const currentPath = window.location.pathname;
    if (!['/login', '/register', '/', '/demo', '/landing'].includes(currentPath)) {
      setLocation(redirectTo);
    }
  }, [sessionToken, isLoading, user, error, setLocation, redirectTo]);

  // CRITICAL: Block ALL rendering until we know auth state
  // This prevents dashboard from trying to render before we redirect
  
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
