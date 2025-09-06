/**
 * Offline Manager
 * Handles offline functionality, data synchronization, and service worker integration
 * Provides seamless experience even when network connectivity is poor or unavailable
 */

export interface OfflineData {
  id: string;
  type: 'assessment' | 'therapy-note' | 'crisis-report' | 'mood-tracking';
  data: any;
  timestamp: Date;
  userId: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface SyncStatus {
  isOnline: boolean;
  lastSync: Date | null;
  pendingItems: number;
  syncInProgress: boolean;
  failedSyncs: number;
}

class OfflineManager {
  private static instance: OfflineManager;
  private isOnline: boolean = navigator.onLine;
  private syncStatus: SyncStatus = {
    isOnline: navigator.onLine,
    lastSync: null,
    pendingItems: 0,
    syncInProgress: false,
    failedSyncs: 0
  };
  private listeners: Array<(status: SyncStatus) => void> = [];
  private db: IDBDatabase | null = null;

  private constructor() {
    this.initializeOfflineSupport();
  }

  static getInstance(): OfflineManager {
    if (!OfflineManager.instance) {
      OfflineManager.instance = new OfflineManager();
    }
    return OfflineManager.instance;
  }

  /**
   * Initialize offline support and service worker
   */
  async initializeOfflineSupport(): Promise<void> {
    try {
      // Register service worker
      await this.registerServiceWorker();
      
      // Initialize IndexedDB for offline data storage
      await this.initializeDatabase();
      
      // Set up network event listeners
      this.setupNetworkListeners();
      
      // Set up periodic sync checks
      this.setupPeriodicSync();
      
      // Initial sync status check
      await this.updateSyncStatus();
      
      console.log('[OfflineManager] Offline support initialized');
    } catch (error) {
      console.error('[OfflineManager] Failed to initialize offline support:', error);
    }
  }

  /**
   * Register and manage service worker
   */
  private async registerServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          updateViaCache: 'none'
        });

        console.log('[OfflineManager] Service worker registered:', registration.scope);

        // Handle service worker updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New service worker is available
                this.notifyServiceWorkerUpdate();
              }
            });
          }
        });

        // Listen for messages from service worker
        navigator.serviceWorker.addEventListener('message', (event) => {
          this.handleServiceWorkerMessage(event.data);
        });

        // Handle push notifications
        if ('Notification' in window && 'PushManager' in window) {
          await this.setupPushNotifications(registration);
        }

      } catch (error) {
        console.error('[OfflineManager] Service worker registration failed:', error);
      }
    }
  }

  /**
   * Initialize IndexedDB for offline data storage
   */
  private async initializeDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        console.warn('[OfflineManager] IndexedDB not supported');
        resolve();
        return;
      }

      const request = indexedDB.open('astralcore-offline', 2);

      request.onerror = () => reject(new Error('Failed to open IndexedDB'));

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores for different data types
        const stores = [
          'pending-assessments',
          'pending-therapy-notes',
          'pending-crisis-reports',
          'pending-mood-tracking',
          'offline-cache'
        ];

        stores.forEach(storeName => {
          if (!db.objectStoreNames.contains(storeName)) {
            const store = db.createObjectStore(storeName, { keyPath: 'id' });
            store.createIndex('timestamp', 'timestamp', { unique: false });
            store.createIndex('priority', 'priority', { unique: false });
            store.createIndex('userId', 'userId', { unique: false });
          }
        });
      };
    });
  }

  /**
   * Set up network connectivity listeners
   */
  private setupNetworkListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.handleOnlineStatus(true);
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.handleOnlineStatus(false);
    });

    // Monitor connection quality
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connection?.addEventListener('change', () => {
        this.handleConnectionChange(connection);
      });
    }
  }

  /**
   * Set up periodic sync for background updates
   */
  private setupPeriodicSync(): void {
    // Check sync status every 30 seconds when online
    setInterval(async () => {
      if (this.isOnline && !this.syncStatus.syncInProgress) {
        await this.performBackgroundSync();
      }
    }, 30000);
  }

  /**
   * Store data for offline sync
   */
  async storeOfflineData(
    type: OfflineData['type'],
    data: any,
    userId: string,
    priority: OfflineData['priority'] = 'medium'
  ): Promise<string> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const offlineData: OfflineData = {
      id: this.generateId(),
      type,
      data,
      timestamp: new Date(),
      userId,
      priority
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([`pending-${type}s`], 'readwrite');
      const store = transaction.objectStore(`pending-${type}s`);
      const request = store.add(offlineData);

      request.onsuccess = () => {
        this.updateSyncStatus();
        resolve(offlineData.id);
      };

      request.onerror = () => reject(new Error('Failed to store offline data'));
    });
  }

  /**
   * Retrieve offline data by type
   */
  async getOfflineData(type: OfflineData['type']): Promise<OfflineData[]> {
    if (!this.db) {
      return [];
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([`pending-${type}s`], 'readonly');
      const store = transaction.objectStore(`pending-${type}s`);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => resolve([]);
    });
  }

  /**
   * Remove offline data after successful sync
   */
  async removeOfflineData(type: OfflineData['type'], id: string): Promise<void> {
    if (!this.db) {
      return;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([`pending-${type}s`], 'readwrite');
      const store = transaction.objectStore(`pending-${type}s`);
      const request = store.delete(id);

      request.onsuccess = () => {
        this.updateSyncStatus();
        resolve();
      };

      request.onerror = () => resolve(); // Don't fail on delete errors
    });
  }

  /**
   * Force sync all pending data
   */
  async forceSyncAll(): Promise<void> {
    if (!this.isOnline) {
      throw new Error('Cannot sync while offline');
    }

    if (this.syncStatus.syncInProgress) {
      throw new Error('Sync already in progress');
    }

    this.syncStatus.syncInProgress = true;
    this.notifyListeners();

    try {
      await Promise.all([
        this.syncDataType('assessment'),
        this.syncDataType('therapy-note'),
        this.syncDataType('crisis-report'),
        this.syncDataType('mood-tracking')
      ]);

      this.syncStatus.lastSync = new Date();
      this.syncStatus.failedSyncs = 0;
    } catch (error) {
      this.syncStatus.failedSyncs++;
      throw error;
    } finally {
      this.syncStatus.syncInProgress = false;
      await this.updateSyncStatus();
    }
  }

  /**
   * Sync specific data type
   */
  private async syncDataType(type: OfflineData['type']): Promise<void> {
    const pendingData = await this.getOfflineData(type);
    
    for (const item of pendingData) {
      try {
        const response = await this.submitData(item);
        if (response.ok) {
          await this.removeOfflineData(type, item.id);
        }
      } catch (error) {
        console.error(`[OfflineManager] Failed to sync ${type}:`, error);
      }
    }
  }

  /**
   * Submit data to server
   */
  private async submitData(item: OfflineData): Promise<Response> {
    const endpoints = {
      'assessment': '/api/assessments',
      'therapy-note': '/api/therapy-sessions/notes',
      'crisis-report': '/api/crisis/reports',
      'mood-tracking': '/api/mood-tracking'
    };

    const endpoint = endpoints[item.type];
    if (!endpoint) {
      throw new Error(`No endpoint for data type: ${item.type}`);
    }

    return fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Offline-Sync': 'true'
      },
      body: JSON.stringify(item.data)
    });
  }

  /**
   * Request persistent storage
   */
  async requestPersistentStorage(): Promise<boolean> {
    if ('storage' in navigator && 'persist' in navigator.storage) {
      try {
        const persistent = await navigator.storage.persist();
        console.log('[OfflineManager] Persistent storage:', persistent);
        return persistent;
      } catch (error) {
        console.error('[OfflineManager] Failed to request persistent storage:', error);
      }
    }
    return false;
  }

  /**
   * Get storage usage
   */
  async getStorageUsage(): Promise<{ used: number; available: number }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        return {
          used: estimate.usage || 0,
          available: estimate.quota || 0
        };
      } catch (error) {
        console.error('[OfflineManager] Failed to get storage estimate:', error);
      }
    }
    
    return { used: 0, available: 0 };
  }

  /**
   * Subscribe to sync status updates
   */
  onSyncStatusChange(callback: (status: SyncStatus) => void): () => void {
    this.listeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Get current sync status
   */
  getSyncStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  /**
   * Clear all offline data (for privacy/security)
   */
  async clearOfflineData(): Promise<void> {
    if (!this.db) {
      return;
    }

    const stores = [
      'pending-assessments',
      'pending-therapy-notes', 
      'pending-crisis-reports',
      'pending-mood-tracking',
      'offline-cache'
    ];

    for (const storeName of stores) {
      try {
        const transaction = this.db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        await new Promise<void>((resolve, reject) => {
          const request = store.clear();
          request.onsuccess = () => resolve();
          request.onerror = () => reject();
        });
      } catch (error) {
        console.error(`[OfflineManager] Failed to clear ${storeName}:`, error);
      }
    }

    await this.updateSyncStatus();
  }

  // Private helper methods

  private async handleOnlineStatus(isOnline: boolean): Promise<void> {
    console.log('[OfflineManager] Network status changed:', isOnline ? 'online' : 'offline');
    
    this.syncStatus.isOnline = isOnline;
    
    if (isOnline) {
      // Attempt to sync when coming back online
      setTimeout(() => {
        this.performBackgroundSync();
      }, 1000); // Small delay to ensure connection is stable
    }
    
    this.notifyListeners();
  }

  private handleConnectionChange(connection: any): void {
    console.log('[OfflineManager] Connection changed:', {
      type: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt
    });
    
    // Adjust sync behavior based on connection quality
    if (connection.effectiveType === 'slow-2g') {
      // Defer non-critical syncs on slow connections
      console.log('[OfflineManager] Slow connection detected, reducing sync frequency');
    }
  }

  private async performBackgroundSync(): Promise<void> {
    if (this.syncStatus.syncInProgress) {
      return;
    }

    try {
      // Use background sync if available
      if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
        const registration = await navigator.serviceWorker.ready;
        
        // Register background sync for different data types
        await Promise.all([
          registration.sync.register('assessment-sync'),
          registration.sync.register('therapy-notes-sync'),
          registration.sync.register('crisis-report-sync'),
          registration.sync.register('mood-tracking-sync')
        ]);
      } else {
        // Fallback to immediate sync
        await this.forceSyncAll();
      }
    } catch (error) {
      console.error('[OfflineManager] Background sync failed:', error);
    }
  }

  private async updateSyncStatus(): Promise<void> {
    if (!this.db) {
      return;
    }

    try {
      const stores = ['pending-assessments', 'pending-therapy-notes', 'pending-crisis-reports', 'pending-mood-tracking'];
      let totalPending = 0;

      for (const storeName of stores) {
        try {
          const transaction = this.db.transaction([storeName], 'readonly');
          const store = transaction.objectStore(storeName);
          const count = await new Promise<number>((resolve) => {
            const request = store.count();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => resolve(0);
          });
          totalPending += count;
        } catch (error) {
          console.error(`[OfflineManager] Failed to count ${storeName}:`, error);
        }
      }

      this.syncStatus.pendingItems = totalPending;
      this.notifyListeners();
    } catch (error) {
      console.error('[OfflineManager] Failed to update sync status:', error);
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(callback => {
      try {
        callback(this.getSyncStatus());
      } catch (error) {
        console.error('[OfflineManager] Listener callback failed:', error);
      }
    });
  }

  private handleServiceWorkerMessage(message: any): void {
    switch (message.type) {
      case 'sync_complete':
        this.syncStatus.lastSync = new Date();
        this.updateSyncStatus();
        break;
      case 'sync_failed':
        this.syncStatus.failedSyncs++;
        this.notifyListeners();
        break;
    }
  }

  private notifyServiceWorkerUpdate(): void {
    // Notify user that a new version is available
    if (window.confirm('A new version is available. Reload to update?')) {
      window.location.reload();
    }
  }

  private async setupPushNotifications(registration: ServiceWorkerRegistration): Promise<void> {
    try {
      if (Notification.permission === 'default') {
        await Notification.requestPermission();
      }

      if (Notification.permission === 'granted') {
        // In production, subscribe to push notifications
        console.log('[OfflineManager] Push notifications enabled');
      }
    } catch (error) {
      console.error('[OfflineManager] Push notification setup failed:', error);
    }
  }

  private generateId(): string {
    return `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const offlineManager = OfflineManager.getInstance();