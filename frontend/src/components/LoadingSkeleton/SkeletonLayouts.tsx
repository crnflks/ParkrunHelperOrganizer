// Pre-built skeleton layouts for common UI patterns
import React from 'react';
import { Skeleton, SkeletonText, SkeletonAvatar, SkeletonButton, SkeletonCard } from './Skeleton';

export interface SkeletonLayoutProps {
  className?: string;
  style?: React.CSSProperties;
}

// Dashboard skeleton
export const DashboardSkeleton: React.FC<SkeletonLayoutProps> = ({ className, style }) => (
  <div className={className} style={style}>
    {/* Header skeleton */}
    <div style={styles.header}>
      <div style={styles.headerContent}>
        <Skeleton width={250} height={32} />
        <div style={styles.headerRight}>
          <SkeletonText width={120} />
          <SkeletonButton width={80} height={32} />
        </div>
      </div>
    </div>

    {/* Content skeleton */}
    <div style={styles.content}>
      {/* Stats cards */}
      <div style={styles.statsGrid}>
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} style={styles.statCard}>
            <Skeleton width={60} height={40} />
            <SkeletonText width="80%" />
          </div>
        ))}
      </div>

      {/* Main content cards */}
      <div style={styles.cardsGrid}>
        <SkeletonCard height={300} />
        <SkeletonCard height={400} />
      </div>
    </div>
  </div>
);

// Helper list skeleton
export const HelperListSkeleton: React.FC<SkeletonLayoutProps & { count?: number }> = ({ 
  count = 5, 
  className, 
  style 
}) => (
  <div className={className} style={style}>
    {Array.from({ length: count }).map((_, index) => (
      <HelperItemSkeleton key={index} />
    ))}
  </div>
);

// Helper item skeleton
export const HelperItemSkeleton: React.FC<SkeletonLayoutProps> = ({ className, style }) => (
  <div className={className} style={{ ...styles.helperItem, ...style }}>
    <div style={styles.helperInfo}>
      <SkeletonAvatar size={48} />
      <div style={styles.helperDetails}>
        <SkeletonText width="60%" height="18px" />
        <SkeletonText width="40%" height="14px" />
        <SkeletonText width="80%" height="14px" />
      </div>
    </div>
    <div style={styles.helperActions}>
      <SkeletonButton width={60} height={28} />
      <SkeletonButton width={60} height={28} />
    </div>
  </div>
);

// Table skeleton
export const TableSkeleton: React.FC<SkeletonLayoutProps & { 
  rows?: number; 
  columns?: number; 
  showHeader?: boolean;
}> = ({ 
  rows = 5, 
  columns = 4, 
  showHeader = true, 
  className, 
  style 
}) => (
  <div className={className} style={{ ...styles.table, ...style }}>
    {showHeader && (
      <div style={styles.tableHeader}>
        {Array.from({ length: columns }).map((_, index) => (
          <SkeletonText key={index} width="80%" height="16px" />
        ))}
      </div>
    )}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} style={styles.tableRow}>
        {Array.from({ length: columns }).map((_, colIndex) => (
          <SkeletonText key={colIndex} width="90%" height="14px" />
        ))}
      </div>
    ))}
  </div>
);

// Form skeleton
export const FormSkeleton: React.FC<SkeletonLayoutProps & { fields?: number }> = ({ 
  fields = 4, 
  className, 
  style 
}) => (
  <div className={className} style={{ ...styles.form, ...style }}>
    <SkeletonText width="40%" height="24px" style={{ marginBottom: '20px' }} />
    {Array.from({ length: fields }).map((_, index) => (
      <div key={index} style={styles.formField}>
        <SkeletonText width="30%" height="16px" />
        <Skeleton height={40} borderRadius="4px" />
      </div>
    ))}
    <div style={styles.formActions}>
      <SkeletonButton width={100} height={40} />
      <SkeletonButton width={80} height={40} />
    </div>
  </div>
);

// Card list skeleton
export const CardListSkeleton: React.FC<SkeletonLayoutProps & { count?: number }> = ({ 
  count = 3, 
  className, 
  style 
}) => (
  <div className={className} style={{ ...styles.cardList, ...style }}>
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} style={styles.cardItem}>
        <div style={styles.cardHeader}>
          <SkeletonText width="60%" height="20px" />
          <SkeletonButton width={24} height={24} />
        </div>
        <div style={styles.cardBody}>
          <SkeletonText lines={3} />
        </div>
        <div style={styles.cardFooter}>
          <SkeletonText width="40%" height="14px" />
          <SkeletonButton width={80} height={32} />
        </div>
      </div>
    ))}
  </div>
);

// Navigation skeleton
export const NavigationSkeleton: React.FC<SkeletonLayoutProps & { 
  items?: number;
  orientation?: 'horizontal' | 'vertical';
}> = ({ 
  items = 5, 
  orientation = 'horizontal',
  className, 
  style 
}) => (
  <div 
    className={className} 
    style={{
      ...styles.navigation,
      flexDirection: orientation === 'vertical' ? 'column' : 'row',
      ...style
    }}
  >
    {Array.from({ length: items }).map((_, index) => (
      <SkeletonButton
        key={index}
        width={orientation === 'vertical' ? '100%' : 80}
        height={36}
        style={{ margin: orientation === 'vertical' ? '4px 0' : '0 8px' }}
      />
    ))}
  </div>
);

// Search skeleton
export const SearchSkeleton: React.FC<SkeletonLayoutProps> = ({ className, style }) => (
  <div className={className} style={{ ...styles.search, ...style }}>
    <Skeleton height={40} borderRadius="20px" />
    <SkeletonButton width={80} height={40} />
  </div>
);

// Profile skeleton
export const ProfileSkeleton: React.FC<SkeletonLayoutProps> = ({ className, style }) => (
  <div className={className} style={{ ...styles.profile, ...style }}>
    <div style={styles.profileHeader}>
      <SkeletonAvatar size={80} />
      <div style={styles.profileInfo}>
        <SkeletonText width="60%" height="24px" />
        <SkeletonText width="40%" height="16px" />
        <SkeletonText width="80%" height="16px" />
      </div>
    </div>
    <div style={styles.profileContent}>
      <SkeletonText lines={4} />
    </div>
  </div>
);

const styles = {
  header: {
    padding: '20px',
    borderBottom: '1px solid #e9ecef',
    backgroundColor: 'white',
  },
  headerContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  content: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '30px 20px',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '30px',
  },
  statCard: {
    padding: '20px',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    textAlign: 'center' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '12px',
  },
  cardsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '20px',
  },
  helperItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    backgroundColor: 'white',
    borderRadius: '8px',
    marginBottom: '12px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  helperInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flex: 1,
  },
  helperDetails: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
    flex: 1,
  },
  helperActions: {
    display: 'flex',
    gap: '8px',
  },
  table: {
    backgroundColor: 'white',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  tableHeader: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px',
    padding: '16px',
    backgroundColor: '#f8f9fa',
    borderBottom: '1px solid #e9ecef',
  },
  tableRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px',
    padding: '16px',
    borderBottom: '1px solid #f1f3f4',
  },
  form: {
    backgroundColor: 'white',
    padding: '24px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  formField: {
    marginBottom: '20px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  formActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    marginTop: '24px',
  },
  cardList: {
    display: 'grid',
    gap: '20px',
  },
  cardItem: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  cardBody: {
    marginBottom: '16px',
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navigation: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  search: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    padding: '16px',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  profile: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '24px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  profileHeader: {
    display: 'flex',
    gap: '20px',
    marginBottom: '24px',
    alignItems: 'center',
  },
  profileInfo: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
    flex: 1,
  },
  profileContent: {
    paddingTop: '20px',
    borderTop: '1px solid #e9ecef',
  },
};