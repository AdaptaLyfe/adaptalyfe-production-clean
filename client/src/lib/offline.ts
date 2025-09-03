// Offline functionality for Adaptalyfe mobile app
import { useState, useEffect } from 'react';
import { queryClient } from './queryClient';

interface OfflineData {
  tasks: any[];
  emergencyContacts: any[];
  medications: any[];
  lastSync: string;
}

class OfflineManager {
  private storageKey = 'skillbridge_offline_data';
  
  // Store critical data for offline access
  async syncOfflineData() {
    try {
      const data: OfflineData = {
        tasks: queryClient.getQueryData(['/api/daily-tasks']) || [],
        emergencyContacts: queryClient.getQueryData(['/api/emergency-contacts']) || [],
        medications: queryClient.getQueryData(['/api/medications']) || [],
        lastSync: new Date().toISOString()
      };
      
      localStorage.setItem(this.storageKey, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Failed to sync offline data:', error);
      return false;
    }
  }
  
  // Get offline data when network is unavailable
  getOfflineData(): OfflineData | null {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Failed to get offline data:', error);
      return null;
    }
  }
  
  // Store completed tasks offline for later sync
  storeOfflineTaskCompletion(taskId: number, completed: boolean) {
    const key = 'skillbridge_offline_tasks';
    const stored = localStorage.getItem(key);
    const offlineTasks = stored ? JSON.parse(stored) : {};
    
    offlineTasks[taskId] = {
      completed,
      timestamp: new Date().toISOString()
    };
    
    localStorage.setItem(key, JSON.stringify(offlineTasks));
  }
  
  // Get offline task completions for sync
  getOfflineTaskCompletions() {
    const key = 'skillbridge_offline_tasks';
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : {};
  }
  
  // Clear offline task completions after sync
  clearOfflineTaskCompletions() {
    localStorage.removeItem('skillbridge_offline_tasks');
  }
  
  // Check if app is online
  isOnline(): boolean {
    return navigator.onLine;
  }
  
  // Store offline notes
  storeOfflineNote(note: string) {
    const key = 'skillbridge_offline_notes';
    const stored = localStorage.getItem(key);
    const notes = stored ? JSON.parse(stored) : [];
    
    notes.push({
      content: note,
      timestamp: new Date().toISOString(),
      id: Date.now()
    });
    
    localStorage.setItem(key, JSON.stringify(notes));
  }
  
  // Get offline notes
  getOfflineNotes() {
    const key = 'skillbridge_offline_notes';
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  }
  
  // Clear offline notes after sync
  clearOfflineNotes() {
    localStorage.removeItem('skillbridge_offline_notes');
  }
}

export const offlineManager = new OfflineManager();

// Hook for offline functionality
export function useOffline() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  return { isOnline };
}