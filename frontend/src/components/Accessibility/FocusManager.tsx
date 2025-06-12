// Focus management utilities for accessibility
import React, { useEffect, useRef, ReactNode } from 'react';

interface FocusTrapProps {
  children: ReactNode;
  active?: boolean;
  restoreFocus?: boolean;
  initialFocus?: string; // CSS selector for initial focus element
}

export const FocusTrap: React.FC<FocusTrapProps> = ({
  children,
  active = true,
  restoreFocus = true,
  initialFocus,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<Element | null>(null);

  useEffect(() => {
    if (!active || !containerRef.current) return;

    // Store currently focused element
    previousActiveElement.current = document.activeElement;

    // Get all focusable elements
    const focusableElements = getFocusableElements(containerRef.current);
    
    if (focusableElements.length === 0) return;

    // Set initial focus
    if (initialFocus) {
      const initialElement = containerRef.current.querySelector(initialFocus);
      if (initialElement && isFocusable(initialElement)) {
        (initialElement as HTMLElement).focus();
      } else {
        focusableElements[0].focus();
      }
    } else {
      focusableElements[0].focus();
    }

    // Handle tab key navigation
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      const currentFocusableElements = getFocusableElements(containerRef.current!);
      const firstElement = currentFocusableElements[0];
      const lastElement = currentFocusableElements[currentFocusableElements.length - 1];

      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      
      // Restore focus to previous element
      if (restoreFocus && previousActiveElement.current) {
        (previousActiveElement.current as HTMLElement).focus();
      }
    };
  }, [active, initialFocus, restoreFocus]);

  return (
    <div ref={containerRef} style={{ outline: 'none' }} tabIndex={-1}>
      {children}
    </div>
  );
};

// Focus management hook
export const useFocusManagement = () => {
  const moveFocusToElement = (selector: string | HTMLElement) => {
    const element = typeof selector === 'string' 
      ? document.querySelector(selector) 
      : selector;
      
    if (element && isFocusable(element)) {
      (element as HTMLElement).focus();
      return true;
    }
    return false;
  };

  const moveFocusToFirstError = () => {
    const errorElements = document.querySelectorAll('[aria-invalid="true"], .error, [data-error="true"]');
    for (const element of errorElements) {
      if (isFocusable(element)) {
        (element as HTMLElement).focus();
        return true;
      }
    }
    return false;
  };

  const announceFocusChange = (message: string) => {
    // Create temporary announcement element
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.style.position = 'absolute';
    announcement.style.left = '-10000px';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  };

  return {
    moveFocusToElement,
    moveFocusToFirstError,
    announceFocusChange,
  };
};

// Utility functions
function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const focusableSelectors = [
    'button:not([disabled])',
    '[href]',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]',
  ].join(', ');

  const elements = Array.from(container.querySelectorAll(focusableSelectors)) as HTMLElement[];
  
  return elements.filter(element => {
    return isFocusable(element) && isVisible(element);
  });
}

function isFocusable(element: Element): boolean {
  if (element.hasAttribute('disabled')) return false;
  if (element.hasAttribute('tabindex') && element.getAttribute('tabindex') === '-1') return false;
  
  const tagName = element.tagName.toLowerCase();
  
  // Special cases for form elements
  if (['input', 'textarea', 'select'].includes(tagName)) {
    return !(element as HTMLInputElement).disabled;
  }
  
  // Links must have href
  if (tagName === 'a') {
    return element.hasAttribute('href');
  }
  
  // Buttons
  if (tagName === 'button') {
    return !(element as HTMLButtonElement).disabled;
  }
  
  // Elements with tabindex
  if (element.hasAttribute('tabindex')) {
    const tabindex = parseInt(element.getAttribute('tabindex') || '0');
    return tabindex >= 0;
  }
  
  // Contenteditable elements
  if (element.getAttribute('contenteditable') === 'true') {
    return true;
  }
  
  return false;
}

function isVisible(element: Element): boolean {
  const style = window.getComputedStyle(element);
  return (
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    style.opacity !== '0' &&
    element.offsetWidth > 0 &&
    element.offsetHeight > 0
  );
}

// Higher-order component for automatic focus management
interface WithFocusManagementProps {
  autoFocus?: boolean;
  focusSelector?: string;
  restoreFocus?: boolean;
}

export function withFocusManagement<P extends object>(
  Component: React.ComponentType<P>
) {
  return React.forwardRef<any, P & WithFocusManagementProps>((props, ref) => {
    const { autoFocus, focusSelector, restoreFocus, ...componentProps } = props;
    const containerRef = useRef<HTMLDivElement>(null);
    const { moveFocusToElement } = useFocusManagement();

    useEffect(() => {
      if (autoFocus && containerRef.current) {
        if (focusSelector) {
          const success = moveFocusToElement(focusSelector);
          if (!success) {
            // Fallback to first focusable element
            const focusableElements = getFocusableElements(containerRef.current);
            if (focusableElements.length > 0) {
              focusableElements[0].focus();
            }
          }
        } else {
          const focusableElements = getFocusableElements(containerRef.current);
          if (focusableElements.length > 0) {
            focusableElements[0].focus();
          }
        }
      }
    }, [autoFocus, focusSelector]);

    return (
      <div ref={containerRef}>
        <Component {...(componentProps as P)} ref={ref} />
      </div>
    );
  });
}