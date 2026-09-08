import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useEffect } from "react";
import type { User } from "@shared/schema";

interface AdminCheckProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export default function AdminCheck({ children, redirectTo = "/dashboard" }: AdminCheckProps) {
  const [, setLocation] = useLocation();
  
  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ['/api/user'],
    retry: false
  });

  useEffect(() => {
    if (!isLoading) {
      // Check if user exists and has admin privileges
      const isAdmin = user?.username === 'admin' || user?.accountType === 'admin';
      
      if (!user || !isAdmin) {
        console.log('AdminCheck: Access denied. Redirecting non-admin user to', redirectTo);
        setLocation(redirectTo);
      }
    }
  }, [isLoading, user, setLocation, redirectTo]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-100 via-teal-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  // Check admin privileges
  const isAdmin = user?.username === 'admin' || user?.accountType === 'admin';
  
  if (!user || !isAdmin) {
    // Don't render anything while redirecting
    return null;
  }

  return <>{children}</>;
}