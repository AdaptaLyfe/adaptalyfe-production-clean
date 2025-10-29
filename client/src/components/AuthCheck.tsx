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
  const [hasCheckedToken, setHasCheckedToken] = useState(false);
  
  // CRITICAL: Check for session token BEFORE making any API calls
  useEffect(() => {
    const sessionToken = getSessionToken();
    const currentPath = window.location.pathname;
    
    if (!sessionToken && !['/login', '/register', '/', '/demo', '/landing'].includes(currentPath)) {
      console.log('🚫 AuthCheck: No session token found, redirecting to login from', currentPath);
      setLocation(redirectTo);
      return;
    }
    
    if (sessionToken) {
      console.log('✅ AuthCheck: Session token found, proceeding with authentication');
    }
    
    setHasCheckedToken(true);
  }, [setLocation, redirectTo]);
  
  const { data: user, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/user'],
    retry: 2,
    retryDelay: 1000,
    enabled: hasCheckedToken // Only run query after token check
  });

  useEffect(() => {
    if (hasCheckedToken && !isLoading && !user && error) {
      // Only redirect if we're not already on an auth page
      const currentPath = window.location.pathname;
      if (!['/login', '/register', '/', '/demo', '/landing'].includes(currentPath)) {
        console.log('AuthCheck: API authentication failed, redirecting to', redirectTo, 'from', currentPath);
        console.log('AuthCheck: Error details:', error);
        
        // Add a small delay before redirect to handle potential session propagation
        setTimeout(() => {
          setLocation(redirectTo);
        }, 100);
      }
    }
  }, [hasCheckedToken, isLoading, user, error, setLocation, redirectTo]);

  useEffect(() => {
    // Force a refetch when component mounts to ensure fresh auth state
    const timer = setTimeout(() => {
      refetch();
    }, 200);
    
    return () => clearTimeout(timer);
  }, [refetch]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-100 via-teal-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user && error) {
    // Don't render anything while redirecting
    return null;
  }

  return <>{children}</>;
}