// Type definitions
export interface User {
  id: string;
  name: string;
  email: string;
}

export type Screen = 'home' | 'dashboard' | 'camera' | 'profile' | 'settings' | 'login';

export interface MetricCardProps {
  icon: string;
  number: string;
  label: string;
  change: string;
}