// Keyboard navigation utilities and components
import React, { useEffect, useRef, ReactElement, cloneElement } from 'react';

interface KeyboardNavigationProps {
  children: ReactElement[];
  orientation?: 'horizontal' | 'vertical' | 'both';
  wrap?: boolean;
  autoFocus?: boolean;
  disabled?: boolean;
  onNavigate?: (index: number, element: HTMLElement) => void;
}

export const KeyboardNavigation: React.FC<KeyboardNavigationProps> = ({
  children,
  orientation = 'vertical',
  wrap = true,
  autoFocus = false,
  disabled = false,
  onNavigate,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const currentIndexRef = useRef(0);

  useEffect(() => {
    if (disabled || !containerRef.current) return;

    const container = containerRef.current;
    const items = Array.from(container.children) as HTMLElement[];

    if (items.length === 0) return;

    // Set up initial tabindex
    items.forEach((item, index) => {
      item.setAttribute('tabindex', index === 0 ? '0' : '-1');
    });

    // Auto focus first item if requested
    if (autoFocus) {
      items[0].focus();
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      const { key } = event;
      let handled = false;
      let newIndex = currentIndexRef.current;

      // Determine navigation direction
      switch (key) {
        case 'ArrowDown':
          if (orientation === 'vertical' || orientation === 'both') {
            newIndex = currentIndexRef.current + 1;
            handled = true;
          }
          break;
        case 'ArrowUp':
          if (orientation === 'vertical' || orientation === 'both') {
            newIndex = currentIndexRef.current - 1;
            handled = true;
          }
          break;
        case 'ArrowRight':
          if (orientation === 'horizontal' || orientation === 'both') {
            newIndex = currentIndexRef.current + 1;
            handled = true;
          }
          break;
        case 'ArrowLeft':
          if (orientation === 'horizontal' || orientation === 'both') {
            newIndex = currentIndexRef.current - 1;
            handled = true;
          }
          break;
        case 'Home':
          newIndex = 0;
          handled = true;
          break;
        case 'End':
          newIndex = items.length - 1;
          handled = true;
          break;
      }

      if (handled) {
        event.preventDefault();

        // Handle wrapping
        if (wrap) {
          if (newIndex >= items.length) {
            newIndex = 0;
          } else if (newIndex < 0) {
            newIndex = items.length - 1;
          }
        } else {
          newIndex = Math.max(0, Math.min(newIndex, items.length - 1));
        }

        // Update focus and tabindex
        if (newIndex !== currentIndexRef.current) {
          items[currentIndexRef.current].setAttribute('tabindex', '-1');
          items[newIndex].setAttribute('tabindex', '0');
          items[newIndex].focus();
          currentIndexRef.current = newIndex;

          onNavigate?.(newIndex, items[newIndex]);
        }
      }
    };

    // Handle focus events to track current index
    const handleFocus = (event: FocusEvent) => {
      const focusedElement = event.target as HTMLElement;
      const index = items.indexOf(focusedElement);
      if (index !== -1) {
        currentIndexRef.current = index;
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    container.addEventListener('focus', handleFocus, true);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
      container.removeEventListener('focus', handleFocus, true);
    };
  }, [children, orientation, wrap, autoFocus, disabled, onNavigate]);

  // Clone children and add necessary props
  const enhancedChildren = children.map((child, index) => {
    return cloneElement(child, {
      key: child.key || index,
      role: child.props.role || 'option',
      'aria-setsize': children.length,
      'aria-posinset': index + 1,
      ...child.props,
    });
  });

  return (
    <div
      ref={containerRef}
      role="listbox"
      aria-orientation={orientation === 'both' ? 'vertical' : orientation}
      style={{ outline: 'none' }}
    >
      {enhancedChildren}
    </div>
  );
};

// Hook for keyboard shortcuts
export const useKeyboardShortcuts = (shortcuts: Record<string, () => void>) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = getKeyboardShortcutString(event);
      const handler = shortcuts[key];
      
      if (handler) {
        event.preventDefault();
        handler();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [shortcuts]);
};

// Roving tabindex hook for lists
export const useRovingTabIndex = (
  containerRef: React.RefObject<HTMLElement>,
  itemSelector: string = '[role="option"], [role="tab"], [role="menuitem"]'
) => {
  const currentIndexRef = useRef(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateTabIndex = () => {
      const items = container.querySelectorAll(itemSelector) as NodeListOf<HTMLElement>;
      items.forEach((item, index) => {
        item.setAttribute('tabindex', index === currentIndexRef.current ? '0' : '-1');
      });
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const items = container.querySelectorAll(itemSelector) as NodeListOf<HTMLElement>;
      if (items.length === 0) return;

      let newIndex = currentIndexRef.current;
      let handled = false;

      switch (event.key) {
        case 'ArrowDown':
        case 'ArrowRight':
          newIndex = (currentIndexRef.current + 1) % items.length;
          handled = true;
          break;
        case 'ArrowUp':
        case 'ArrowLeft':
          newIndex = (currentIndexRef.current - 1 + items.length) % items.length;
          handled = true;
          break;
        case 'Home':
          newIndex = 0;
          handled = true;
          break;
        case 'End':
          newIndex = items.length - 1;
          handled = true;
          break;
      }

      if (handled) {
        event.preventDefault();
        currentIndexRef.current = newIndex;
        updateTabIndex();
        items[newIndex].focus();
      }
    };

    const handleFocus = (event: FocusEvent) => {
      const items = Array.from(container.querySelectorAll(itemSelector)) as HTMLElement[];
      const focusedElement = event.target as HTMLElement;
      const index = items.indexOf(focusedElement);
      
      if (index !== -1) {
        currentIndexRef.current = index;
        updateTabIndex();
      }
    };

    // Initialize tabindex
    updateTabIndex();

    container.addEventListener('keydown', handleKeyDown);
    container.addEventListener('focus', handleFocus, true);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
      container.removeEventListener('focus', handleFocus, true);
    };
  }, [itemSelector]);

  return {
    getCurrentIndex: () => currentIndexRef.current,
    setCurrentIndex: (index: number) => {
      currentIndexRef.current = index;
      const container = containerRef.current;
      if (container) {
        const items = container.querySelectorAll(itemSelector) as NodeListOf<HTMLElement>;
        items.forEach((item, i) => {
          item.setAttribute('tabindex', i === index ? '0' : '-1');
        });
      }
    },
  };
};

// Utility function to get keyboard shortcut string
function getKeyboardShortcutString(event: KeyboardEvent): string {
  const parts: string[] = [];
  
  if (event.ctrlKey) parts.push('ctrl');
  if (event.altKey) parts.push('alt');
  if (event.shiftKey) parts.push('shift');
  if (event.metaKey) parts.push('meta');
  
  // Add the actual key
  parts.push(event.key.toLowerCase());
  
  return parts.join('+');
}

// Custom hook for managing escape key behavior
export const useEscapeKey = (callback: () => void, enabled = true) => {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        callback();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [callback, enabled]);
};

// Hook for managing enter/space key activation
export const useActivationKeys = (
  callback: () => void,
  elementRef: React.RefObject<HTMLElement>,
  enabled = true
) => {
  useEffect(() => {
    if (!enabled || !elementRef.current) return;

    const element = elementRef.current;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        callback();
      }
    };

    element.addEventListener('keydown', handleKeyDown);
    
    return () => {
      element.removeEventListener('keydown', handleKeyDown);
    };
  }, [callback, enabled]);
};