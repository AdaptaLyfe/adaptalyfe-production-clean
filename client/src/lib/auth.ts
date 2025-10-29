// Authentication utilities for the client
export class AuthUtils {
  static async logout() {
    try {
      const response = await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include',
      });
      
      if (response.ok) {
        // Redirect to login page after successful logout
        window.location.href = '/login';
      } else {
        console.error('Logout failed');
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  }
  
  static async checkAuth() {
    try {
      const response = await fetch('/api/user', {
        credentials: 'include',
      });
      
      return response.ok;
    } catch (error) {
      console.error('Auth check error:', error);
      return false;
    }
  }

  static isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  static async ensureSessionPersistence() {
    // Ensure session cookies are properly set
    try {
      const response = await fetch('/api/user', {
        credentials: 'include',
      });
      return response.ok;
    } catch (error) {
      console.error('Session persistence check failed:', error);
      return false;
    }
  }
}