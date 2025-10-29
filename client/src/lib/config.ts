// API Configuration for different environments
export const API_CONFIG = {
  // Use relative URLs for Render deployment (single domain)
  // Only use Replit backend during development in Replit
  baseURL: (typeof window !== 'undefined' && window.location.hostname.includes('replit.dev')) 
    ? 'https://f0feebb6-5db0-4265-92fd-0ed04d7aec9a-00-tpbqabot0m1.spock.replit.dev' // Your Replit app URL
    : '', // Use relative URLs for Render and localhost
  
  // Enable credentials for requests
  credentials: 'include' as RequestCredentials,
};

// Helper function to get full API URL
export function getApiUrl(path: string): string {
  const baseURL = API_CONFIG.baseURL;
  return baseURL ? `${baseURL}${path}` : path;
}