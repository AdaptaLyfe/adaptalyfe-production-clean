import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Inline API configuration to avoid build path issues
const API_CONFIG = {
  // Use relative URLs - backend and frontend on same domain (Railway)
  baseURL: '',
  
  // Enable credentials for same-origin requests
  credentials: 'include' as RequestCredentials,
};

// Helper function to get full API URL
function getApiUrl(path: string): string {
  const baseURL = API_CONFIG.baseURL;
  return baseURL ? `${baseURL}${path}` : path;
}

// Session token management for mobile auth
const SESSION_TOKEN_KEY = 'adaptalyfe_session_token';

export function isNativeClient(): boolean {
  if (typeof window === "undefined") return false;

  try {
    return Boolean((window as any).Capacitor?.isNativePlatform?.());
  } catch {
    return false;
  }
}

// Helper to ensure localStorage is available and working
function safeLocalStorageGet(key: string): string | null {
  try {
    const value = localStorage.getItem(key);
    if (value) {
      console.log(`✅ Retrieved ${key} from localStorage`);
    }
    return value;
  } catch (error) {
    console.error('localStorage.getItem error:', error);
    return null;
  }
}

function safeLocalStorageSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
    console.log(`✅ Saved ${key} to localStorage`);
    
    // Verify it was saved
    const verify = localStorage.getItem(key);
    if (verify === value) {
      console.log(`✅ Verified ${key} persisted correctly`);
    } else {
      console.error(`❌ Failed to verify ${key} persistence`);
    }
  } catch (error) {
    console.error('localStorage.setItem error:', error);
  }
}

function safeLocalStorageRemove(key: string): void {
  try {
    localStorage.removeItem(key);
    console.log(`✅ Removed ${key} from localStorage`);
  } catch (error) {
    console.error('localStorage.removeItem error:', error);
  }
}

export function setSessionToken(token: string): void {
  if (!isNativeClient()) return;
  safeLocalStorageSet(SESSION_TOKEN_KEY, token);
}

export function getSessionToken(): string | null {
  if (!isNativeClient()) return null;
  return safeLocalStorageGet(SESSION_TOKEN_KEY);
}

export function clearSessionToken(): void {
  safeLocalStorageRemove(SESSION_TOKEN_KEY);
}

// Initialize session on app startup (check if token exists)
export function initializeSession(): boolean {
  const token = getSessionToken();
  if (token) {
    console.log('🔄 Session token found on app startup, user should stay logged in');
    return true;
  } else {
    console.log('🚫 No session token found on app startup');
    return false;
  }
}

// Logout helper that clears both server session and client token
export async function logout(): Promise<void> {
  console.log('🚪 Logout initiated');
  try {
    // Call backend logout to destroy server session
    await apiRequest("POST", "/api/logout", {});
    console.log('✅ Backend logout successful');
  } catch (error) {
    console.error("❌ Logout API call failed:", error);
    // Continue to clear local token even if API fails
  } finally {
    // Always clear the session token from localStorage
    clearSessionToken();
    console.log('✅ Session token cleared from localStorage');
  }
}

// Helper to get auth headers (includes session token if available)
function getAuthHeaders(): HeadersInit {
  const sessionToken = getSessionToken();
  const headers: HeadersInit = {};
  
  if (isNativeClient()) {
    headers['X-Adaptalyfe-Client'] = 'native';
  }

  if (sessionToken) {
    headers['Authorization'] = `Bearer ${sessionToken}`;
  }
  
  return headers;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly type?: string;

  constructor(
    status: number,
    message: string,
    details?: { code?: string; type?: string },
  ) {
    super(`${status}: ${message}`);
    this.name = "ApiError";
    this.status = status;
    this.code = details?.code;
    this.type = details?.type;
  }
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    let payload: { error?: unknown; code?: unknown; type?: unknown } | undefined;
    try {
      payload = JSON.parse(text);
    } catch {
      // Preserve the existing text fallback for non-JSON error responses.
    }

    const message =
      typeof payload?.error === "string" ? payload.error : text;
    throw new ApiError(
      res.status,
      message,
      {
        code: typeof payload?.code === "string" ? payload.code : undefined,
        type: typeof payload?.type === "string" ? payload.type : undefined,
      },
    );
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
    credentials: isNativeClient() ? 'omit' : API_CONFIG.credentials,
  });

  await throwIfResNotOk(res);
  return res;
}

export async function demoLogin(username: string, password: string) {
  const response = await apiRequest("POST", "/api/demo-login", {
    username,
    password,
  });
  const data = await response.json();

  if (data.sessionToken) {
    setSessionToken(data.sessionToken);
  }

  return data;
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
        credentials: isNativeClient() ? 'omit' : API_CONFIG.credentials,
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
