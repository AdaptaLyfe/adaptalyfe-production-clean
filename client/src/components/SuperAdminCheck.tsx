import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useEffect } from "react";
import type { User } from "@shared/schema";

interface SuperAdminCheckProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export default function SuperAdminCheck({ children, redirectTo = "/dashboard" }: SuperAdminCheckProps) {
  const [, setLocation] = useLocation();
  
  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ['/api/user'],
    retry: false
  });

  useEffect(() => {
    if (!isLoading) {
      const isSuperAdmin = user?.username === 'admin';
      
      if (!user || !isSuperAdmin) {
        console.log('SuperAdminCheck: Access denied. Redirecting non-super-admin user to', redirectTo);
        setLocation(redirectTo);
      }
    }
  }, [isLoading, user, setLocation, redirectTo]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-100 via-teal-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying super admin access...</p>
        </div>
      </div>
    );
  }

  const isSuperAdmin = user?.username === 'admin';
  
  if (!user || !isSuperAdmin) {
    return null;
  }

  return <>{children}</>;
}
