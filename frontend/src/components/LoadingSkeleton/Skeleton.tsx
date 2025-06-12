// Base skeleton component for loading states
import React from 'react';

export interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  animation?: 'pulse' | 'wave' | 'none';
  className?: string;
  style?: React.CSSProperties;
  'aria-label'?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '1em',
  borderRadius,
  variant = 'text',
  animation = 'pulse',
  className = '',
  style = {},
  'aria-label': ariaLabel = 'Loading...',
  ...props
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'text':
        return {
          height: '1em',
          borderRadius: '4px',
          transform: 'scale(1, 0.6)',
          transformOrigin: '0 60%',
        };
      case 'circular':
        return {
          borderRadius: '50%',
        };
      case 'rounded':
        return {
          borderRadius: '8px',
        };
      case 'rectangular':
      default:
        return {
          borderRadius: borderRadius || '4px',
        };
    }
  };

  const getAnimationStyles = () => {
    switch (animation) {
      case 'wave':
        return {
          background: `linear-gradient(90deg, 
            transparent 0%, 
            rgba(255, 255, 255, 0.4) 50%, 
            transparent 100%)`,
          backgroundSize: '200% 100%',
          animation: 'skeletonWave 1.6s ease-in-out infinite',
        };
      case 'pulse':
        return {
          animation: 'skeletonPulse 1.5s ease-in-out infinite',
        };
      case 'none':
      default:
        return {};
    }
  };

  const skeletonStyles: React.CSSProperties = {
    display: 'block',
    backgroundColor: '#e2e5e7',
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    ...getVariantStyles(),
    ...getAnimationStyles(),
    ...style,
  };

  return (
    <span
      className={`skeleton ${className}`}
      style={skeletonStyles}
      aria-label={ariaLabel}
      role="progressbar"
      aria-busy="true"
      {...props}
    />
  );
};

// Typography skeletons
export const SkeletonText: React.FC<Omit<SkeletonProps, 'variant'> & { lines?: number }> = ({
  lines = 1,
  ...props
}) => {
  if (lines === 1) {
    return <Skeleton variant="text" {...props} />;
  }

  return (
    <div>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          variant="text"
          style={{
            marginBottom: index === lines - 1 ? 0 : '0.5em',
            width: index === lines - 1 ? '60%' : '100%',
          }}
          {...props}
        />
      ))}
    </div>
  );
};

// Avatar skeleton
export const SkeletonAvatar: React.FC<Omit<SkeletonProps, 'variant'> & { size?: number }> = ({
  size = 40,
  ...props
}) => (
  <Skeleton
    variant="circular"
    width={size}
    height={size}
    {...props}
  />
);

// Button skeleton
export const SkeletonButton: React.FC<Omit<SkeletonProps, 'variant'>> = ({
  width = 100,
  height = 36,
  ...props
}) => (
  <Skeleton
    variant="rounded"
    width={width}
    height={height}
    {...props}
  />
);

// Card skeleton
export const SkeletonCard: React.FC<Omit<SkeletonProps, 'variant'>> = ({
  height = 200,
  ...props
}) => (
  <Skeleton
    variant="rounded"
    height={height}
    {...props}
  />
);

// Image skeleton
export const SkeletonImage: React.FC<Omit<SkeletonProps, 'variant'>> = ({
  width = '100%',
  height = 200,
  ...props
}) => (
  <Skeleton
    variant="rectangular"
    width={width}
    height={height}
    {...props}
  />
);

// Add CSS animations
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    @keyframes skeletonPulse {
      0% {
        opacity: 1;
      }
      50% {
        opacity: 0.4;
      }
      100% {
        opacity: 1;
      }
    }

    @keyframes skeletonWave {
      0% {
        transform: translateX(-100%);
      }
      50% {
        transform: translateX(100%);
      }
      100% {
        transform: translateX(100%);
      }
    }

    .skeleton {
      position: relative;
      overflow: hidden;
    }

    .skeleton::after {
      content: '';
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
      transform: translateX(-100%);
      background: linear-gradient(
        90deg,
        transparent,
        rgba(255, 255, 255, 0.2),
        transparent
      );
      animation: skeletonWave 1.6s ease-in-out infinite;
    }

    /* Accessibility improvements */
    @media (prefers-reduced-motion: reduce) {
      .skeleton,
      .skeleton::after {
        animation: none !important;
      }
    }
  `;
  
  if (!document.head.querySelector('[data-skeleton-styles]')) {
    styleSheet.setAttribute('data-skeleton-styles', 'true');
    document.head.appendChild(styleSheet);
  }
}