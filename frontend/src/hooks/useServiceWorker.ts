// React hook for Service Worker management
import { useState, useEffect } from 'react';
import { serviceWorkerManager, ServiceWorkerConfig } from '../utils/serviceWorker';

export interface UseServiceWorkerReturn {
  isRegistered: boolean;
  isOnline: boolean;
  updateAvailable: boolean;
  isStandalone: boolean;
  update: () => Promise<void>;
  skipWaiting: () => void;
  getCacheStatus: () => Promise<any>;
  clearCaches: () => Promise<void>;
  storeOfflineAction: (action: {
    url: string;
    method: string;
    headers: Record<string, string>;
    body?: string;
  }) => void;
}

export const useServiceWorker = (config: ServiceWorkerConfig = {}): UseServiceWorkerReturn => {
  const [isRegistered, setIsRegistered] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
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

    registerSW();

    // Listen for background sync events
    const handleBackgroundSync = (event: CustomEvent) => {
      console.log('Background sync completed:', event.detail);
      // You can dispatch Redux actions here if needed
    };

    const handleCacheUpdate = (event: CustomEvent) => {
      console.log('Cache updated:', event.detail);
    };

    window.addEventListener('sw-background-sync', handleBackgroundSync as EventListener);
    window.addEventListener('sw-cache-updated', handleCacheUpdate as EventListener);

    return () => {
      window.removeEventListener('sw-background-sync', handleBackgroundSync as EventListener);
      window.removeEventListener('sw-cache-updated', handleCacheUpdate as EventListener);
    };
  }, []);

  return {
    isRegistered,
    isOnline,
    updateAvailable,
    isStandalone: serviceWorkerManager.isStandalone(),
    update: serviceWorkerManager.update.bind(serviceWorkerManager),
    skipWaiting: serviceWorkerManager.skipWaiting.bind(serviceWorkerManager),
    getCacheStatus: serviceWorkerManager.getCacheStatus.bind(serviceWorkerManager),
    clearCaches: serviceWorkerManager.clearCaches.bind(serviceWorkerManager),
    storeOfflineAction: serviceWorkerManager.storeOfflineAction.bind(serviceWorkerManager),
  };
};