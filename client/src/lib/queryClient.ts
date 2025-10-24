import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Inline API configuration to avoid build path issues
const API_CONFIG = {
  // Use Replit backend URL for Firebase deployment
  baseURL: 'https://f0feebb6-5db0-4265-92fd-0ed04d7aec9a-00-tpbqabot0m1.spock.replit.dev',
  
  // Enable credentials for cross-origin requests
  credentials: 'include' as RequestCredentials,
};

// Helper function to get full API URL
function getApiUrl(path: string): string {
  const baseURL = API_CONFIG.baseURL;
  return baseURL ? `${baseURL}${path}` : path;
}

// Session token management for mobile auth
const SESSION_TOKEN_KEY = 'adaptalyfe_session_token';

export function setSessionToken(token: string): void {
  localStorage.setItem(SESSION_TOKEN_KEY, token);
}

export function getSessionToken(): string | null {
  return localStorage.getItem(SESSION_TOKEN_KEY);
}

export function clearSessionToken(): void {
  localStorage.removeItem(SESSION_TOKEN_KEY);
}

// Logout helper that clears both server session and client token
export async function logout(): Promise<void> {
  try {
    // Call backend logout to destroy server session
    await apiRequest("POST", "/api/logout", {});
  } catch (error) {
    console.error("Logout API call failed:", error);
    // Continue to clear local token even if API fails
  } finally {
    // Always clear the session token from localStorage
    clearSessionToken();
  }
}

// Helper to get auth headers (includes session token if available)
function getAuthHeaders(): HeadersInit {
  const sessionToken = getSessionToken();
  const headers: HeadersInit = {};
  
  if (sessionToken) {
    headers['Authorization'] = `Bearer ${sessionToken}`;
  }
  
  return headers;
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
  const authHeaders = getAuthHeaders();
  
  const res = await fetch(fullUrl, {
    method,
    headers: {
      ...(data ? { "Content-Type": "application/json" } : {}),
      ...authHeaders, // Include Authorization header if session token exists
    },
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
      const authHeaders = getAuthHeaders();
      
      const res = await fetch(fullUrl, {
        headers: authHeaders, // Include Authorization header if session token exists
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
      // For mobile apps: Return null on network errors instead of crashing
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.log("Network error detected, returning null for graceful degradation");
        return null;
      }
      // Return null instead of throwing to prevent app crashes
      console.log("Returning null due to error, app will handle gracefully");
      return null;
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
