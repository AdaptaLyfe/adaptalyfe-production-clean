import { useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export function useAutoDemo() {
  const demoLoginMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/demo-login", {
        username: "alex",
        password: "password"
      });
      return response;
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
      // Check if we're already logged in
      fetch("/api/user")
        .then(response => {
          if (response.status === 401) {
            // Not logged in, try demo login
            demoLoginMutation.mutate();
          }
        })
        .catch(() => {
          // Network error or not logged in, try demo login
          demoLoginMutation.mutate();
        });
    }
  }, []);

  return {
    isLoggingIn: demoLoginMutation.isPending
  };
}