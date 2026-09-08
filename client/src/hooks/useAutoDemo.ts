import { useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, demoLogin } from "@/lib/queryClient";

export function useAutoDemo() {
  const demoLoginMutation = useMutation({
    mutationFn: async () => {
      return demoLogin("alex", "password");
    },
    onSuccess: () => {
      console.log("Auto demo login successful");
    },
    onError: (error) => {
      console.log("Auto demo login failed:", error);
    }
  });

  useEffect(() => {
    // Only auto-login on demo route, not on landing page
    const currentPath = window.location.pathname;
    if (currentPath === '/demo') {
      const checkExistingSession = async () => {
        try {
          await apiRequest("GET", "/api/user");
        } catch (error: any) {
          if (error.message?.startsWith("401:")) {
            demoLoginMutation.mutate();
          }
        }
      };

      checkExistingSession();
    }
  }, []);

  return {
    isLoggingIn: demoLoginMutation.isPending
  };
}