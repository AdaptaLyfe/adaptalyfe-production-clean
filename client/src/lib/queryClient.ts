import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Inline API configuration to avoid build path issues
const API_CONFIG = {
  // Use current Replit backend
  baseURL: 'https://workspace.barrettrchl.repl.co',
  
  // Enable credentials for cross-origin requests
  credentials: 'include' as RequestCredentials,
};

// Helper function to get full API URL
function getApiUrl(path: string): string {
  const baseURL = API_CONFIG.baseURL;
  return baseURL ? `${baseURL}${path}` : path;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const fullUrl = getApiUrl(url);
  const res = await fetch(fullUrl, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: API_CONFIG.credentials,
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    console.log("Making query to:", queryKey[0]);
    try {
      const fullUrl = getApiUrl(queryKey[0] as string);
      const res = await fetch(fullUrl, {
        credentials: API_CONFIG.credentials,
      });

      console.log("Query response status:", res.status);
      console.log("Query response headers:", Object.fromEntries(res.headers.entries()));
      
      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        console.log("Returning null due to 401");
        return null;
      }

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Query failed:", res.status, errorText);
        throw new Error(`${res.status}: ${errorText}`);
      }

      // Check if response has content before parsing JSON
      const text = await res.text();
      console.log("Raw response text length:", text.length);
      
      if (!text || text.trim() === '') {
        console.log("Empty response, returning empty array for safe fallback");
        return [];
      }
      
      // Check if text starts with HTML (error page)
      if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
        console.error("Received HTML instead of JSON:", text.substring(0, 200));
        throw new Error(`Server returned HTML error page instead of JSON`);
      }
      
      try {
        const data = JSON.parse(text);
        console.log("Query response data:", data);
        return data;
      } catch (parseError) {
        console.error("JSON parse error. Raw text (first 200 chars):", text.substring(0, 200));
        console.error("Parse error details:", parseError);
        // Return empty array instead of throwing to prevent crashes
        return [];
      }
    } catch (error) {
      console.error("Query error:", error);
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "returnNull" }), // Changed to return null instead of throwing
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 0,
      gcTime: 0, // No garbage collection cache 
      retry: 1, // Allow one retry for mobile sessions
      refetchOnMount: "always", // Always refetch on mount
      retryDelay: 500, // Short delay before retry
    },
    mutations: {
      retry: false,
    },
  },
});
