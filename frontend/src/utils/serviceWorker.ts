// Service Worker registration and management
export interface ServiceWorkerConfig {
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onOffline?: () => void;
  onOnline?: () => void;
}

class ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null;
  private config: ServiceWorkerConfig = {};
  private isOnline = navigator.onLine;

  constructor() {
    this.setupOnlineOfflineListeners();
  }

  // Register service worker
  public async register(config: ServiceWorkerConfig = {}): Promise<void> {
    this.config = config;

    if (!('serviceWorker' in navigator)) {
      console.warn('Service Worker not supported');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      this.registration = registration;

      console.log('Service Worker registered successfully:', registration);

      // Handle updates
      registration.addEventListener('updatefound', () => {
        this.handleUpdateFound(registration);
      });

      // Check for existing waiting service worker
      if (registration.waiting) {
        this.config.onUpdate?.(registration);
      }

      // Check for controlling service worker
      if (registration.active) {
        this.config.onSuccess?.(registration);
      }

      // Listen for messages from service worker
      this.setupMessageListener();

      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      throw error;
    }
  }

  // Unregister service worker
  public async unregister(): Promise<boolean> {
    if (!('serviceWorker' in navigator)) {
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        const result = await registration.unregister();
        console.log('Service Worker unregistered:', result);
        return result;
      }
      return false;
    } catch (error) {
      console.error('Service Worker unregistration failed:', error);
      return false;
    }
  }

  // Update service worker
  public async update(): Promise<void> {
    if (this.registration) {
      try {
        await this.registration.update();
        console.log('Service Worker update check completed');
      } catch (error) {
        console.error('Service Worker update failed:', error);
        throw error;
      }
    }
  }

  // Skip waiting and activate new service worker
  public skipWaiting(): void {
    if (this.registration?.waiting) {
      this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  }

  // Get cache status
  public async getCacheStatus(): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.registration?.active) {
        reject(new Error('No active service worker'));
        return;
      }

      const messageChannel = new MessageChannel();
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data);
      };

      this.registration.active.postMessage(
        { type: 'GET_CACHE_STATUS' },
        [messageChannel.port2]
      );

      // Timeout after 5 seconds
      setTimeout(() => {
        reject(new Error('Cache status request timed out'));
      }, 5000);
    });
  }

  // Store offline action
  public storeOfflineAction(action: {
    url: string;
    method: string;
    headers: Record<string, string>;
    body?: string;
  }): void {
    if (this.registration?.active) {
      this.registration.active.postMessage({
        type: 'STORE_OFFLINE_ACTION',
        payload: action,
      });
    }
  }

  // Clear all caches
  public async clearCaches(): Promise<void> {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
      console.log('All caches cleared');
    }
  }

  // Check if app is running in standalone mode (PWA)
  public isStandalone(): boolean {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone ||
      document.referrer.includes('android-app://')
    );
  }

  // Get online status
  public getOnlineStatus(): boolean {
    return this.isOnline;
  }

  // Setup online/offline event listeners
  private setupOnlineOfflineListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.config.onOnline?.();
      console.log('App is online');
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.config.onOffline?.();
      console.log('App is offline');
    });
  }

  // Handle service worker update
  private handleUpdateFound(registration: ServiceWorkerRegistration): void {
    const newWorker = registration.installing;

    if (!newWorker) return;

    newWorker.addEventListener('statechange', () => {
      if (newWorker.state === 'installed') {
        if (navigator.serviceWorker.controller) {
          // New service worker available
          console.log('New service worker available');
          this.config.onUpdate?.(registration);
        } else {
          // Service worker installed for the first time
          console.log('Service worker installed for the first time');
          this.config.onSuccess?.(registration);
        }
      }
    });
  }

  // Setup message listener for service worker messages
  private setupMessageListener(): void {
    navigator.serviceWorker.addEventListener('message', (event) => {
      const { type, payload } = event.data;

      switch (type) {
        case 'BACKGROUND_SYNC_COMPLETE':
          console.log('Background sync completed:', payload);
          // Dispatch custom event for components to listen to
          window.dispatchEvent(
            new CustomEvent('sw-background-sync', { detail: payload })
          );
          break;

        case 'CACHE_UPDATED':
          console.log('Cache updated:', payload);
          window.dispatchEvent(
            new CustomEvent('sw-cache-updated', { detail: payload })
          );
          break;

        default:
          console.log('Unknown message from service worker:', type, payload);
      }
    });
  }
}

// Create singleton instance
export const serviceWorkerManager = new ServiceWorkerManager();

// Utility functions
export const isServiceWorkerSupported = (): boolean => {
  return 'serviceWorker' in navigator;
};

export const isCacheStorageSupported = (): boolean => {
  return 'caches' in window;
};

export const isBackgroundSyncSupported = (): boolean => {
  return 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype;
};

export const isPushNotificationSupported = (): boolean => {
  return 'serviceWorker' in navigator && 'PushManager' in window;
};

// Default configuration for common use cases
export const defaultServiceWorkerConfig: ServiceWorkerConfig = {
  onUpdate: (registration) => {
    // Show update notification to user
    if (window.confirm('A new version is available. Refresh to update?')) {
      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        window.location.reload();
      }
    }
  },
  onSuccess: () => {
    console.log('Service Worker is ready for offline use');
  },
  onOffline: () => {
    // Show offline notification
    console.log('App is now offline. Some features may be limited.');
  },
  onOnline: () => {
    // Show online notification
    console.log('App is back online.');
  },
};

// React hook for service worker (if using React)
export const useServiceWorker = (config: ServiceWorkerConfig = {}) => {
  const [isRegistered, setIsRegistered] = React.useState(false);
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);
  const [updateAvailable, setUpdateAvailable] = React.useState(false);

  React.useEffect(() => {
    const registerSW = async () => {
      try {
        await serviceWorkerManager.register({
          ...config,
          onSuccess: (registration) => {
            setIsRegistered(true);
            config.onSuccess?.(registration);
          },
          onUpdate: (registration) => {
            setUpdateAvailable(true);
            config.onUpdate?.(registration);
          },
          onOnline: () => {
            setIsOnline(true);
            config.onOnline?.();
          },
          onOffline: () => {
            setIsOnline(false);
            config.onOffline?.();
          },
        });
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    };

    if (isServiceWorkerSupported()) {
      registerSW();
    }

    return () => {
      // Cleanup if needed
    };
  }, []);

  return {
    isRegistered,
    isOnline,
    updateAvailable,
    update: serviceWorkerManager.update.bind(serviceWorkerManager),
    skipWaiting: serviceWorkerManager.skipWaiting.bind(serviceWorkerManager),
    getCacheStatus: serviceWorkerManager.getCacheStatus.bind(serviceWorkerManager),
    clearCaches: serviceWorkerManager.clearCaches.bind(serviceWorkerManager),
    isStandalone: serviceWorkerManager.isStandalone(),
  };
};

// Re-export React if available
let React: any;
try {
  React = require('react');
} catch {
  // React not available, useServiceWorker hook won't work
}