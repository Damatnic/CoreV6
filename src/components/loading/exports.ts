/**
 * Loading Components - Consolidated Exports
 * Master export file for all loading-related components and utilities
 */

// Main loading spinner components
export {
  LoadingSpinner,
  PulseLoader,
  DotsLoader,
  ProgressLoader,
  CircularProgress,
  LoadingButton,
  CrisisLoader,
  WellnessLoader,
  type SpinnerSize,
  type SpinnerVariant
} from './LoadingSpinner';

// Skeleton loading components
export {
  Skeleton,
  DashboardSkeleton,
  CrisisSkeleton,
  MoodTrackerSkeleton,
  ListSkeleton,
  CardGridSkeleton,
  TableSkeleton,
  ChatSkeleton,
  ProfileSkeleton,
  SettingsSkeleton,
  ContentSkeleton
} from './SkeletonLoaders';

// Progressive loading components
export {
  ProgressiveLoader,
  ProgressiveContainer,
  LargeComponentLoader,
  LoadingPresets,
  DEFAULT_STAGES,
  type LoadingStage
} from './ProgressiveLoader';

// Performance-aware loader
export {
  PerformanceLoader
} from './PerformanceLoader';

// Suspense and error boundaries
export {
  SuspenseBoundary,
  withSuspenseBoundary,
  CriticalBoundary,
  LazyBoundary,
  RouteBoundary,
  DevBoundary,
  useLoadingBoundary,
  type ErrorFallbackProps as SuspenseErrorFallbackProps
} from './SuspenseBoundary';

// Error boundary components
export {
  ErrorBoundary,
  CriticalErrorBoundary,
  ChunkErrorBoundary,
  DevErrorBoundary,
  withErrorBoundary,
  useErrorBoundary,
  type ErrorFallbackProps,
  type ErrorType
} from './ErrorBoundary';

// Lazy component boundary
export {
  LazyComponentBoundary,
  withLazyBoundary,
  type LazyBoundaryProps
} from './LazyComponentBoundary';

// Re-export from main index files
export * from './index';
export * from './index.tsx';

// Configuration and presets
export const LoadingComponentsConfig = {
  // Default timeouts in milliseconds
  DEFAULT_TIMEOUT: 10000,
  CRISIS_TIMEOUT: 5000,
  SLOW_NETWORK_TIMEOUT: 15000,
  
  // Default retry counts
  DEFAULT_RETRIES: 3,
  CRISIS_RETRIES: 5,
  
  // Animation durations
  FADE_DURATION: 200,
  SPINNER_DURATION: 1000,
  
  // Performance thresholds
  LOW_END_DEVICE_THRESHOLD: 2, // CPU cores
  SLOW_NETWORK_THRESHOLD: 1.5, // Mbps
  MEMORY_LIMIT_THRESHOLD: 1024 // MB
} as const;

export type LoadingComponentsConfigType = typeof LoadingComponentsConfig;

// Utility functions
export const loadingUtils = {
  /**
   * Determine appropriate loading component based on context
   */
  getLoadingComponent: (context: 'crisis' | 'wellness' | 'dashboard' | 'default') => {
    switch (context) {
      case 'crisis':
        return CrisisLoader;
      case 'wellness':
        return WellnessLoader;
      case 'dashboard':
        return LoadingPresets.Dashboard;
      default:
        return LoadingSpinner;
    }
  },

  /**
   * Get skeleton component for page type
   */
  getSkeletonComponent: (pageType: string) => {
    const skeletonMap: Record<string, any> = {
      dashboard: DashboardSkeleton,
      crisis: CrisisSkeleton,
      mood: MoodTrackerSkeleton,
      profile: ProfileSkeleton,
      settings: SettingsSkeleton,
      chat: ChatSkeleton,
      table: TableSkeleton,
      cards: CardGridSkeleton,
      list: ListSkeleton
    };
    
    return skeletonMap[pageType] || ContentSkeleton;
  },

  /**
   * Calculate appropriate timeout based on network conditions
   */
  calculateTimeout: (baseTimeout: number, isSlowNetwork: boolean, isLowEnd: boolean) => {
    let timeout = baseTimeout;
    
    if (isSlowNetwork) timeout *= 1.5;
    if (isLowEnd) timeout *= 1.2;
    
    return Math.min(timeout, 30000); // Cap at 30 seconds
  }
};

// Default export for convenience
export default {
  LoadingSpinner,
  ProgressiveLoader,
  PerformanceLoader,
  ErrorBoundary,
  SuspenseBoundary,
  LoadingPresets,
  DEFAULT_STAGES,
  loadingUtils,
  LoadingComponentsConfig
};