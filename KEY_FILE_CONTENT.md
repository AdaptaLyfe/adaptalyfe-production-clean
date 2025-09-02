# Key File Content for Manual GitHub Edit

## File to Edit: client/src/lib/config.ts

**GitHub URL**: https://github.com/AdaptaLyfe/adaptalyfe-production-clean/blob/main/client/src/lib/config.ts

## Complete File Content (Copy and Paste)

```typescript
// API Configuration for different environments
export const API_CONFIG = {
  // Smart backend detection
  baseURL: typeof window !== 'undefined' && window.location.hostname === 'app.adaptalyfeapp.com' 
    ? '' // Use same domain for Railway
    : 'https://f0feebb6-5db0-4265-92fd-0ed04d7aec9a-00-tpbqabot0m1.spock.replit.dev',
  
  // Enable credentials for cross-origin requests
  credentials: 'include' as RequestCredentials,
};

// Helper function to get full API URL
export function getApiUrl(path: string): string {
  const baseURL = API_CONFIG.baseURL;
  const fullUrl = `${baseURL}${path}`;
  console.log(`🌐 API Call: ${path} → ${fullUrl}`);
  console.log(`🏠 Window hostname: ${typeof window !== 'undefined' ? window.location.hostname : 'server'}`);
  return fullUrl;
}
```

## Steps:
1. Click the file link above
2. Click "Edit" (pencil icon)
3. Replace ALL content with the code above
4. Commit with message: "Fix Railway custom domain backend detection"

## Result:
Railway will detect the change and automatically rebuild, fixing app.adaptalyfeapp.com blank page issue.

This single file change is the core fix needed for the Railway custom domain.