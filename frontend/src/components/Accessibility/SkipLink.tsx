// Skip link component for keyboard navigation
import React from 'react';

interface SkipLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export const SkipLink: React.FC<SkipLinkProps> = ({ 
  href, 
  children, 
  className = '' 
}) => {
  return (
    <a
      href={href}
      className={`skip-link ${className}`}
      style={styles.skipLink}
      onFocus={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.opacity = '1';
      }}
      onBlur={(e) => {
        e.currentTarget.style.transform = 'translateY(-100%)';
        e.currentTarget.style.opacity = '0';
      }}
    >
      {children}
    </a>
  );
};

const styles = {
  skipLink: {
    position: 'absolute' as const,
    top: '16px',
    left: '16px',
    zIndex: 9999,
    padding: '8px 16px',
    backgroundColor: '#003D71',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: '600',
    transform: 'translateY(-100%)',
    opacity: '0',
    transition: 'transform 0.3s ease, opacity 0.3s ease',
    border: '2px solid transparent',
  },
};

// Add CSS for better skip link styling
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    .skip-link:focus {
      outline: 2px solid #FF6900 !important;
      outline-offset: 2px;
    }
  `;
  
  if (!document.head.querySelector('[data-skip-link-styles]')) {
    styleSheet.setAttribute('data-skip-link-styles', 'true');
    document.head.appendChild(styleSheet);
  }
}