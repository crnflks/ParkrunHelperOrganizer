// Live region component for screen reader announcements
import React, { useEffect, useRef } from 'react';

interface LiveRegionProps {
  message: string;
  priority?: 'polite' | 'assertive' | 'off';
  clearOnUnmount?: boolean;
  id?: string;
}

export const LiveRegion: React.FC<LiveRegionProps> = ({
  message,
  priority = 'polite',
  clearOnUnmount = true,
  id,
}) => {
  const regionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (regionRef.current && message) {
      // Clear previous message briefly to ensure new message is announced
      regionRef.current.textContent = '';
      
      // Set new message after a brief delay
      const timeoutId = setTimeout(() => {
        if (regionRef.current) {
          regionRef.current.textContent = message;
        }
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [message]);

  useEffect(() => {
    return () => {
      if (clearOnUnmount && regionRef.current) {
        regionRef.current.textContent = '';
      }
    };
  }, [clearOnUnmount]);

  return (
    <div
      ref={regionRef}
      aria-live={priority}
      aria-atomic="true"
      id={id}
      style={styles.liveRegion}
    />
  );
};

// Hook for managing live announcements
export const useLiveAnnouncer = () => {
  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    // Create or use existing live region
    let liveRegion = document.getElementById(`live-region-${priority}`);
    
    if (!liveRegion) {
      liveRegion = document.createElement('div');
      liveRegion.id = `live-region-${priority}`;
      liveRegion.setAttribute('aria-live', priority);
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.style.position = 'absolute';
      liveRegion.style.left = '-10000px';
      liveRegion.style.width = '1px';
      liveRegion.style.height = '1px';
      liveRegion.style.overflow = 'hidden';
      document.body.appendChild(liveRegion);
    }

    // Clear and set message
    liveRegion.textContent = '';
    setTimeout(() => {
      if (liveRegion) {
        liveRegion.textContent = message;
      }
    }, 100);
  };

  return { announce };
};

const styles = {
  liveRegion: {
    position: 'absolute' as const,
    left: '-10000px',
    width: '1px',
    height: '1px',
    overflow: 'hidden',
  },
};