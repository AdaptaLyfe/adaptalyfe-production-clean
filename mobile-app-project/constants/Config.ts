import Constants from 'expo-constants';

interface Config {
  apiUrl: string;
  webUrl: string;
  isDevelopment: boolean;
}

const createConfig = (): Config => {
  const extra = Constants.expoConfig?.extra as any;
  
  return {
    apiUrl: extra?.apiUrl || 'https://app.adaptalyfeapp.com',
    webUrl: extra?.webUrl || 'https://app.adaptalyfeapp.com',
    isDevelopment: process.env.NODE_ENV === 'development',
  };
};

export const Config = createConfig();

// API endpoints
export const API_ENDPOINTS = {
  auth: {
    login: `${Config.apiUrl}/api/login`,
    register: `${Config.apiUrl}/api/register`,
    logout: `${Config.apiUrl}/api/logout`,
    user: `${Config.apiUrl}/api/user`,
  },
  tasks: {
    list: `${Config.apiUrl}/api/daily-tasks`,
    create: `${Config.apiUrl}/api/daily-tasks`,
    update: (id: number) => `${Config.apiUrl}/api/daily-tasks/${id}`,
    delete: (id: number) => `${Config.apiUrl}/api/daily-tasks/${id}`,
  },
  mood: {
    today: `${Config.apiUrl}/api/mood-entries/today`,
    create: `${Config.apiUrl}/api/mood-entries`,
    list: `${Config.apiUrl}/api/mood-entries`,
  },
  financial: {
    bills: `${Config.apiUrl}/api/bills`,
    accounts: `${Config.apiUrl}/api/bank-accounts`,
  },
  caregiver: {
    invitations: `${Config.apiUrl}/api/caregiver-invitations`,
    dashboard: `${Config.apiUrl}/api/caregiver-dashboard`,
  }
};