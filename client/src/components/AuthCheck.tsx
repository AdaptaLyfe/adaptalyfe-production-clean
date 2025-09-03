import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useEffect } from "react";

interface AuthCheckProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export default function AuthCheck({ children, redirectTo = "/login" }: AuthCheckProps) {
  const [, setLocation] = useLocation();
  
  const { data: user, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/user'],
    retry: 2, // Increase retries for cross-domain requests
    retryDelay: 1000 // Longer delay for session establishment
  });

  useEffect(() => {
    if (!isLoading && !user && error) {
      // Only redirect if we're not already on an auth page
      const currentPath = window.location.pathname;
      if (!['/login', '/register', '/', '/demo', '/landing'].includes(currentPath)) {
        console.log('AuthCheck: No authenticated user, redirecting to', redirectTo, 'from', currentPath);
        console.log('AuthCheck: Error details:', error);
        
        // Add a small delay before redirect to handle potential session propagation
        setTimeout(() => {
          setLocation(redirectTo);
        }, 100);
      }
    }
  }, [isLoading, user, error, setLocation, redirectTo]);

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