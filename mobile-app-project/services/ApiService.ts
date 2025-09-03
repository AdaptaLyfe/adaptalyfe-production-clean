import { Config, API_ENDPOINTS } from '../constants/Config';

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = Config.apiUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // Important for session cookies
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Authentication
  async login(username: string, password: string) {
    return this.request(API_ENDPOINTS.auth.login, {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  }

  async logout() {
    return this.request(API_ENDPOINTS.auth.logout, {
      method: 'POST',
    });
  }

  async getCurrentUser() {
    return this.request(API_ENDPOINTS.auth.user);
  }

  // Daily Tasks
  async getTasks() {
    return this.request(API_ENDPOINTS.tasks.list);
  }

  async createTask(task: any) {
    return this.request(API_ENDPOINTS.tasks.create, {
      method: 'POST',
      body: JSON.stringify(task),
    });
  }

  async updateTask(id: number, updates: any) {
    return this.request(API_ENDPOINTS.tasks.update(id), {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteTask(id: number) {
    return this.request(API_ENDPOINTS.tasks.delete(id), {
      method: 'DELETE',
    });
  }

  // Mood Tracking
  async getTodayMood() {
    return this.request(API_ENDPOINTS.mood.today);
  }

  async createMoodEntry(mood: any) {
    return this.request(API_ENDPOINTS.mood.create, {
      method: 'POST',
      body: JSON.stringify(mood),
    });
  }

  // Financial
  async getBills() {
    return this.request(API_ENDPOINTS.financial.bills);
  }

  async getBankAccounts() {
    return this.request(API_ENDPOINTS.financial.accounts);
  }
}

export const apiService = new ApiService();