// Data backup and sync functionality for Adaptalyfe
import { useState, useEffect } from 'react';
import { queryClient } from './queryClient';
import { apiRequest } from './queryClient';

interface BackupData {
  user: any;
  dailyTasks: any[];
  bills: any[];
  moodEntries: any[];
  appointments: any[];
  medications: any[];
  emergencyContacts: any[];
  preferences: any;
  timestamp: string;
  version: string;
}

class BackupService {
  private backupKey = 'skillbridge_backup_data';
  private lastSyncKey = 'skillbridge_last_sync';
  
  // Create full backup of user data
  async createBackup(): Promise<BackupData | null> {
    try {
      const backup: BackupData = {
        user: queryClient.getQueryData(['/api/user']) || {},
        dailyTasks: queryClient.getQueryData(['/api/daily-tasks']) || [],
        bills: queryClient.getQueryData(['/api/bills']) || [],
        moodEntries: queryClient.getQueryData(['/api/mood-entries']) || [],
        appointments: queryClient.getQueryData(['/api/appointments']) || [],
        medications: queryClient.getQueryData(['/api/medications']) || [],
        emergencyContacts: queryClient.getQueryData(['/api/emergency-contacts']) || [],
        preferences: queryClient.getQueryData(['/api/user-preferences']) || {},
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      };
      
      // Store locally
      localStorage.setItem(this.backupKey, JSON.stringify(backup));
      localStorage.setItem(this.lastSyncKey, backup.timestamp);
      
      return backup;
    } catch (error) {
      console.error('Failed to create backup:', error);
      return null;
    }
  }
  
  // Get stored backup data
  getLocalBackup(): BackupData | null {
    try {
      const stored = localStorage.getItem(this.backupKey);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Failed to get backup:', error);
      return null;
    }
  }
  
  // Export backup as downloadable file
  async exportBackup(): Promise<string | null> {
    const backup = await this.createBackup();
    if (!backup) return null;
    
    try {
      const dataStr = JSON.stringify(backup, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = `skillbridge-backup-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      
      // Cleanup
      URL.revokeObjectURL(url);
      
      return url;
    } catch (error) {
      console.error('Failed to export backup:', error);
      return null;
    }
  }
  
  // Import backup from file
  async importBackup(file: File): Promise<boolean> {
    try {
      const text = await file.text();
      const backup: BackupData = JSON.parse(text);
      
      // Validate backup structure
      if (!backup.version || !backup.timestamp) {
        throw new Error('Invalid backup file format');
      }
      
      // Store imported data
      localStorage.setItem(this.backupKey, JSON.stringify(backup));
      
      // Optionally restore to current session
      // This would require API calls to sync data back to server
      
      return true;
    } catch (error) {
      console.error('Failed to import backup:', error);
      return false;
    }
  }
  
  // Sync backup to cloud storage (implementation depends on chosen service)
  async syncToCloud(): Promise<boolean> {
    const backup = await this.createBackup();
    if (!backup) return false;
    
    try {
      // This would integrate with cloud storage service
      // For now, we'll use local storage as fallback
      const response = await apiRequest('POST', '/api/backup/sync', backup);
      
      if (response.ok) {
        localStorage.setItem(this.lastSyncKey, new Date().toISOString());
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Cloud sync failed:', error);
      return false;
    }
  }
  
  // Get last sync timestamp
  getLastSyncTime(): string | null {
    return localStorage.getItem(this.lastSyncKey);
  }
  
  // Check if backup is needed (daily backup recommendation)
  needsBackup(): boolean {
    const lastSync = this.getLastSyncTime();
    if (!lastSync) return true;
    
    const lastSyncDate = new Date(lastSync);
    const now = new Date();
    const diffHours = (now.getTime() - lastSyncDate.getTime()) / (1000 * 60 * 60);
    
    return diffHours >= 24; // Backup every 24 hours
  }
  
  // Generate shareable backup for caregivers
  async createCaregiverShare(): Promise<any> {
    try {
      const shareData = {
        emergencyContacts: queryClient.getQueryData(['/api/emergency-contacts']) || [],
        medications: queryClient.getQueryData(['/api/medications']) || [],
        recentMoodEntries: (queryClient.getQueryData(['/api/mood-entries']) || []).slice(-7), // Last 7 days
        upcomingAppointments: queryClient.getQueryData(['/api/appointments/upcoming']) || [],
        timestamp: new Date().toISOString(),
        note: 'Generated for caregiver access - sensitive data excluded'
      };
      
      return shareData;
    } catch (error) {
      console.error('Failed to create caregiver share:', error);
      return null;
    }
  }
  
  // Auto-backup when app becomes inactive
  scheduleAutoBackup() {
    // Backup when page becomes hidden
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.needsBackup()) {
        this.createBackup();
      }
    });
    
    // Backup before page unload
    window.addEventListener('beforeunload', () => {
      this.createBackup();
    });
  }
}

export const backupService = new BackupService();

// Hook for backup functionality
export function useBackup() {
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [lastBackup, setLastBackup] = useState<string | null>(
    backupService.getLastSyncTime()
  );
  
  const createBackup = async () => {
    setIsBackingUp(true);
    const backup = await backupService.createBackup();
    if (backup) {
      setLastBackup(backup.timestamp);
    }
    setIsBackingUp(false);
    return backup;
  };
  
  const exportBackup = async () => {
    setIsBackingUp(true);
    const url = await backupService.exportBackup();
    setIsBackingUp(false);
    return url;
  };
  
  const syncToCloud = async () => {
    setIsBackingUp(true);
    const success = await backupService.syncToCloud();
    if (success) {
      setLastBackup(new Date().toISOString());
    }
    setIsBackingUp(false);
    return success;
  };
  
  useEffect(() => {
    // Schedule auto-backup
    backupService.scheduleAutoBackup();
  }, []);
  
  return {
    isBackingUp,
    lastBackup,
    createBackup,
    exportBackup,
    syncToCloud,
    needsBackup: backupService.needsBackup(),
    getLocalBackup: backupService.getLocalBackup.bind(backupService),
    importBackup: backupService.importBackup.bind(backupService),
    createCaregiverShare: backupService.createCaregiverShare.bind(backupService)
  };
}