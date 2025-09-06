/**
 * Performance Monitoring and Optimization System
 * Comprehensive performance tracking, optimization, and alerting for mental health platform
 * Ensures optimal user experience while maintaining security and compliance
 */

export interface PerformanceMetric {
  id: string;
  name: string;
  category: PerformanceCategory;
  value: number;
  unit: string;
  threshold: {
    warning: number;
    critical: number;
  };
  timestamp: Date;
  tags: Record<string, string>;
}

export enum PerformanceCategory {
  // Core Web Vitals
  LOADING = 'loading',           // LCP, FCP, TTFB
  INTERACTIVITY = 'interactivity', // FID, TBT, INP
  VISUAL_STABILITY = 'visual_stability', // CLS
  
  // Application Performance
  RUNTIME = 'runtime',           // Memory, CPU, JS errors
  NETWORK = 'network',           // API response times, bandwidth
  DATABASE = 'database',         // Query performance, connections
  SECURITY = 'security',         // Auth times, encryption overhead
  
  // User Experience
  USER_FLOW = 'user_flow',       // Task completion times
  ACCESSIBILITY = 'accessibility', // A11y performance metrics
  MOBILE = 'mobile',             // Mobile-specific performance
  
  // Healthcare Specific
  CRISIS_RESPONSE = 'crisis_response', // Crisis intervention speed
  ASSESSMENT = 'assessment',     // Assessment completion performance
  THERAPY = 'therapy'            // Therapy session performance
}

export interface PerformanceAlert {
  id: string;
  metric: string;
  severity: 'warning' | 'critical';
  message: string;
  value: number;
  threshold: number;
  timestamp: Date;
  acknowledged: boolean;
  resolvedAt?: Date;
  actions: string[];
}

export interface PerformanceReport {
  id: string;
  timeRange: {
    start: Date;
    end: Date;
  };
  metrics: PerformanceMetric[];
  insights: PerformanceInsight[];
  recommendations: PerformanceRecommendation[];
  alerts: PerformanceAlert[];
  summary: {
    overallScore: number; // 0-100
    categoryScores: Record<PerformanceCategory, number>;
    trends: Record<string, 'improving' | 'stable' | 'degrading'>;
  };
  generatedAt: Date;
}

export interface PerformanceInsight {
  type: 'optimization' | 'issue' | 'trend' | 'achievement';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  evidence: string[];
  confidence: number; // 0-1
}

export interface PerformanceRecommendation {
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: PerformanceCategory;
  title: string;
  description: string;
  estimatedImpact: string;
  implementationSteps: string[];
  effort: 'low' | 'medium' | 'high';
  timeframe: string;
}

export interface WebVitalsMetrics {
  // Core Web Vitals
  lcp: number;          // Largest Contentful Paint
  fid: number;          // First Input Delay
  cls: number;          // Cumulative Layout Shift
  inp?: number;         // Interaction to Next Paint (replacing FID)
  
  // Other Web Vitals
  fcp: number;          // First Contentful Paint
  ttfb: number;         // Time to First Byte
  tbt: number;          // Total Blocking Time
  si: number;           // Speed Index
}

export interface ResourceMetrics {
  // Resource timing
  transferSize: number;
  encodedBodySize: number;
  decodedBodySize: number;
  loadTime: number;
  
  // JavaScript performance
  jsHeapSize: number;
  jsHeapLimit: number;
  jsExecutionTime: number;
  
  // CSS performance
  cssParseTime: number;
  criticalCssSize: number;
  
  // Image performance
  imageLoadTime: number;
  imageCompressionRatio: number;
}

export interface APIPerformanceMetrics {
  endpoint: string;
  method: string;
  responseTime: number;
  statusCode: number;
  payloadSize: number;
  errorRate: number;
  throughput: number; // requests per second
  percentiles: {
    p50: number;
    p75: number;
    p90: number;
    p95: number;
    p99: number;
  };
}

class PerformanceService {
  private static instance: PerformanceService;
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private alerts: Map<string, PerformanceAlert> = new Map();
  private observers: Map<string, PerformanceObserver> = new Map();
  private vitalsBuffer: WebVitalsMetrics[] = [];
  private apiMetricsBuffer: APIPerformanceMetrics[] = [];
  
  private constructor() {
    this.initializePerformanceMonitoring();
  }

  static getInstance(): PerformanceService {
    if (!PerformanceService.instance) {
      PerformanceService.instance = new PerformanceService();
    }
    return PerformanceService.instance;
  }

  /**
   * Initialize comprehensive performance monitoring
   */
  private async initializePerformanceMonitoring(): Promise<void> {
    if (typeof window === 'undefined') return; // Server-side safety

    try {
      // Initialize Web Vitals monitoring
      await this.initializeWebVitals();
      
      // Set up resource timing monitoring
      this.setupResourceTimingObserver();
      
      // Initialize memory monitoring
      this.setupMemoryMonitoring();
      
      // Set up navigation timing
      this.setupNavigationTiming();
      
      // Initialize custom metrics
      this.setupCustomMetrics();
      
      // Start periodic monitoring
      this.startPeriodicCollection();
      
      console.log('[PerformanceService] Performance monitoring initialized');
    } catch (error) {
      console.error('[PerformanceService] Failed to initialize performance monitoring:', error);
    }
  }

  /**
   * Initialize Core Web Vitals monitoring
   */
  private async initializeWebVitals(): Promise<void> {
    // Largest Contentful Paint (LCP)
    this.observeMetric('largest-contentful-paint', (entries) => {
      const lcpEntry = entries[entries.length - 1] as PerformanceEntry & { startTime: number };
      this.recordMetric({
        id: this.generateMetricId(),
        name: 'lcp',
        category: PerformanceCategory.LOADING,
        value: lcpEntry.startTime,
        unit: 'ms',
        threshold: { warning: 2500, critical: 4000 },
        timestamp: new Date(),
        tags: { vital: 'core' }
      });
    });

    // First Input Delay (FID) / Interaction to Next Paint (INP)
    this.observeMetric('first-input', (entries) => {
      entries.forEach(entry => {
        const fidEntry = entry as PerformanceEventTiming;
        this.recordMetric({
          id: this.generateMetricId(),
          name: 'fid',
          category: PerformanceCategory.INTERACTIVITY,
          value: fidEntry.processingStart - fidEntry.startTime,
          unit: 'ms',
          threshold: { warning: 100, critical: 300 },
          timestamp: new Date(),
          tags: { vital: 'core' }
        });
      });
    });

    // Cumulative Layout Shift (CLS)
    let clsValue = 0;
    this.observeMetric('layout-shift', (entries) => {
      entries.forEach(entry => {
        const lsEntry = entry as any;
        if (!lsEntry.hadRecentInput) {
          clsValue += lsEntry.value;
        }
      });
      
      this.recordMetric({
        id: this.generateMetricId(),
        name: 'cls',
        category: PerformanceCategory.VISUAL_STABILITY,
        value: clsValue,
        unit: 'score',
        threshold: { warning: 0.1, critical: 0.25 },
        timestamp: new Date(),
        tags: { vital: 'core' }
      });
    });

    // First Contentful Paint (FCP)
    this.observeMetric('paint', (entries) => {
      entries.forEach(entry => {
        if (entry.name === 'first-contentful-paint') {
          this.recordMetric({
            id: this.generateMetricId(),
            name: 'fcp',
            category: PerformanceCategory.LOADING,
            value: entry.startTime,
            unit: 'ms',
            threshold: { warning: 1800, critical: 3000 },
            timestamp: new Date(),
            tags: { vital: 'web' }
          });
        }
      });
    });
  }

  /**
   * Set up resource timing observer
   */
  private setupResourceTimingObserver(): void {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach(entry => {
        const resourceEntry = entry as PerformanceResourceTiming;
        
        // Track critical resources
        if (this.isCriticalResource(resourceEntry.name)) {
          this.recordMetric({
            id: this.generateMetricId(),
            name: 'resource_load_time',
            category: PerformanceCategory.LOADING,
            value: (resourceEntry.loadEventEnd && resourceEntry.loadEventStart) 
              ? resourceEntry.loadEventEnd - resourceEntry.loadEventStart 
              : 0,
            unit: 'ms',
            threshold: { warning: 1000, critical: 2000 },
            timestamp: new Date(),
            tags: { 
              resource: this.getResourceType(resourceEntry.name),
              url: resourceEntry.name 
            }
          });

          // Track transfer size
          this.recordMetric({
            id: this.generateMetricId(),
            name: 'resource_size',
            category: PerformanceCategory.NETWORK,
            value: resourceEntry.transferSize,
            unit: 'bytes',
            threshold: { warning: 500000, critical: 1000000 }, // 500KB/1MB
            timestamp: new Date(),
            tags: { 
              resource: this.getResourceType(resourceEntry.name),
              url: resourceEntry.name 
            }
          });
        }
      });
    });

    observer.observe({ entryTypes: ['resource'] });
    this.observers.set('resource', observer);
  }

  /**
   * Set up memory monitoring
   */
  private setupMemoryMonitoring(): void {
    if (!('memory' in performance)) return;

    setInterval(() => {
      const memory = (performance as any).memory;
      
      this.recordMetric({
        id: this.generateMetricId(),
        name: 'js_heap_used',
        category: PerformanceCategory.RUNTIME,
        value: memory.usedJSHeapSize,
        unit: 'bytes',
        threshold: { warning: 50000000, critical: 100000000 }, // 50MB/100MB
        timestamp: new Date(),
        tags: { type: 'memory' }
      });

      this.recordMetric({
        id: this.generateMetricId(),
        name: 'js_heap_usage_ratio',
        category: PerformanceCategory.RUNTIME,
        value: memory.usedJSHeapSize / memory.totalJSHeapSize,
        unit: 'ratio',
        threshold: { warning: 0.8, critical: 0.9 },
        timestamp: new Date(),
        tags: { type: 'memory' }
      });
    }, 30000); // Every 30 seconds
  }

  /**
   * Set up navigation timing
   */
  private setupNavigationTiming(): void {
    if (!performance.timing) return;

    const timing = performance.timing;
    
    // Time to First Byte
    const ttfb = timing.responseStart - timing.navigationStart;
    this.recordMetric({
      id: this.generateMetricId(),
      name: 'ttfb',
      category: PerformanceCategory.LOADING,
      value: ttfb,
      unit: 'ms',
      threshold: { warning: 600, critical: 1000 },
      timestamp: new Date(),
      tags: { timing: 'navigation' }
    });

    // DOM Content Loaded
    const dcl = timing.domContentLoadedEventStart - timing.navigationStart;
    this.recordMetric({
      id: this.generateMetricId(),
      name: 'dom_content_loaded',
      category: PerformanceCategory.LOADING,
      value: dcl,
      unit: 'ms',
      threshold: { warning: 2000, critical: 4000 },
      timestamp: new Date(),
      tags: { timing: 'navigation' }
    });

    // Page Load Complete
    const loadComplete = timing.loadEventEnd - timing.navigationStart;
    this.recordMetric({
      id: this.generateMetricId(),
      name: 'page_load_complete',
      category: PerformanceCategory.LOADING,
      value: loadComplete,
      unit: 'ms',
      threshold: { warning: 3000, critical: 5000 },
      timestamp: new Date(),
      tags: { timing: 'navigation' }
    });
  }

  /**
   * Set up custom healthcare-specific metrics
   */
  private setupCustomMetrics(): void {
    // Crisis response time monitoring
    this.setupCrisisMetrics();
    
    // Assessment performance monitoring
    this.setupAssessmentMetrics();
    
    // Therapy session performance
    this.setupTherapyMetrics();
    
    // Accessibility performance
    this.setupAccessibilityMetrics();
  }

  /**
   * Start periodic metric collection
   */
  private startPeriodicCollection(): void {
    // Collect metrics every minute
    setInterval(async () => {
      await this.collectSystemMetrics();
      await this.analyzePerformance();
      this.checkAlerts();
    }, 60000);

    // Generate hourly reports
    setInterval(async () => {
      await this.generatePerformanceReport();
    }, 3600000);
  }

  /**
   * Record a performance metric
   */
  recordMetric(metric: PerformanceMetric): void {
    const categoryKey = metric.category;
    
    if (!this.metrics.has(categoryKey)) {
      this.metrics.set(categoryKey, []);
    }
    
    this.metrics.get(categoryKey)!.push(metric);
    
    // Keep only recent metrics (last 24 hours)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    this.metrics.set(
      categoryKey,
      this.metrics.get(categoryKey)!.filter(m => m.timestamp > yesterday)
    );

    // Check for immediate alerts
    this.checkMetricThreshold(metric);
  }

  /**
   * Track API performance
   */
  trackAPICall(
    endpoint: string,
    method: string,
    startTime: number,
    endTime: number,
    statusCode: number,
    payloadSize: number = 0
  ): void {
    const responseTime = endTime - startTime;
    
    this.recordMetric({
      id: this.generateMetricId(),
      name: 'api_response_time',
      category: PerformanceCategory.NETWORK,
      value: responseTime,
      unit: 'ms',
      threshold: { warning: 1000, critical: 3000 },
      timestamp: new Date(),
      tags: { endpoint, method, status: statusCode.toString() }
    });

    // Store detailed API metrics
    const apiMetric: APIPerformanceMetrics = {
      endpoint,
      method,
      responseTime,
      statusCode,
      payloadSize,
      errorRate: statusCode >= 400 ? 1 : 0,
      throughput: 1, // Will be calculated over time
      percentiles: {
        p50: responseTime, // Simplified - would calculate properly
        p75: responseTime,
        p90: responseTime,
        p95: responseTime,
        p99: responseTime
      }
    };

    this.apiMetricsBuffer.push(apiMetric);
    
    // Keep buffer size manageable
    if (this.apiMetricsBuffer.length > 1000) {
      this.apiMetricsBuffer = this.apiMetricsBuffer.slice(-1000);
    }
  }

  /**
   * Track user interaction performance
   */
  trackUserInteraction(
    interactionType: string,
    startTime: number,
    endTime: number,
    context?: Record<string, string>
  ): void {
    const duration = endTime - startTime;
    
    this.recordMetric({
      id: this.generateMetricId(),
      name: 'user_interaction_time',
      category: PerformanceCategory.INTERACTIVITY,
      value: duration,
      unit: 'ms',
      threshold: { warning: 200, critical: 500 },
      timestamp: new Date(),
      tags: { interaction: interactionType, ...context }
    });
  }

  /**
   * Track crisis response performance
   */
  trackCrisisResponse(
    responseTime: number,
    interventionType: string,
    successful: boolean
  ): void {
    this.recordMetric({
      id: this.generateMetricId(),
      name: 'crisis_response_time',
      category: PerformanceCategory.CRISIS_RESPONSE,
      value: responseTime,
      unit: 'ms',
      threshold: { warning: 5000, critical: 10000 }, // 5s/10s for crisis
      timestamp: new Date(),
      tags: { 
        intervention: interventionType,
        success: successful.toString()
      }
    });
  }

  /**
   * Track assessment completion performance
   */
  trackAssessmentPerformance(
    assessmentType: string,
    completionTime: number,
    questionCount: number
  ): void {
    const timePerQuestion = completionTime / questionCount;
    
    this.recordMetric({
      id: this.generateMetricId(),
      name: 'assessment_completion_time',
      category: PerformanceCategory.ASSESSMENT,
      value: completionTime,
      unit: 'ms',
      threshold: { warning: 300000, critical: 600000 }, // 5min/10min
      timestamp: new Date(),
      tags: { 
        assessment: assessmentType,
        questions: questionCount.toString()
      }
    });

    this.recordMetric({
      id: this.generateMetricId(),
      name: 'time_per_question',
      category: PerformanceCategory.ASSESSMENT,
      value: timePerQuestion,
      unit: 'ms',
      threshold: { warning: 30000, critical: 60000 }, // 30s/60s per question
      timestamp: new Date(),
      tags: { assessment: assessmentType }
    });
  }

  /**
   * Generate comprehensive performance report
   */
  async generatePerformanceReport(
    timeRange?: { start: Date; end: Date }
  ): Promise<PerformanceReport> {
    const defaultTimeRange = {
      start: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
      end: new Date()
    };
    
    const range = timeRange || defaultTimeRange;
    
    // Collect all metrics in time range
    const allMetrics: PerformanceMetric[] = [];
    for (const metrics of this.metrics.values()) {
      allMetrics.push(...metrics.filter(m => 
        m.timestamp >= range.start && m.timestamp <= range.end
      ));
    }

    // Generate insights
    const insights = this.generateInsights(allMetrics);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(allMetrics, insights);
    
    // Get alerts in time range
    const alerts = Array.from(this.alerts.values()).filter(alert =>
      alert.timestamp >= range.start && alert.timestamp <= range.end
    );

    // Calculate summary scores
    const summary = this.calculateSummaryScores(allMetrics);

    const report: PerformanceReport = {
      id: this.generateReportId(),
      timeRange: range,
      metrics: allMetrics,
      insights,
      recommendations,
      alerts,
      summary,
      generatedAt: new Date()
    };

    return report;
  }

  /**
   * Get real-time performance dashboard data
   */
  getDashboardMetrics(): {
    coreVitals: Record<string, number>;
    apiPerformance: APIPerformanceMetrics[];
    systemHealth: Record<string, any>;
    activeAlerts: PerformanceAlert[];
  } {
    return {
      coreVitals: this.getCurrentCoreVitals(),
      apiPerformance: this.getRecentAPIMetrics(),
      systemHealth: this.getSystemHealthStatus(),
      activeAlerts: Array.from(this.alerts.values()).filter(alert => !alert.acknowledged)
    };
  }

  /**
   * Optimize performance based on current metrics
   */
  async optimizePerformance(): Promise<{
    optimizations: string[];
    estimatedImpact: Record<string, string>;
    implemented: string[];
  }> {
    const optimizations: string[] = [];
    const estimatedImpact: Record<string, string> = {};
    const implemented: string[] = [];

    // Analyze current performance bottlenecks
    const bottlenecks = this.identifyBottlenecks();
    
    for (const bottleneck of bottlenecks) {
      const optimization = this.getOptimizationForBottleneck(bottleneck);
      if (optimization) {
        optimizations.push(optimization.action);
        estimatedImpact[optimization.action] = optimization.impact;
        
        // Auto-implement safe optimizations
        if (optimization.autoImplement && await this.canAutoImplement(optimization)) {
          await this.implementOptimization(optimization);
          implemented.push(optimization.action);
        }
      }
    }

    return {
      optimizations,
      estimatedImpact,
      implemented
    };
  }

  // Private helper methods

  private observeMetric(entryType: string, callback: (entries: PerformanceEntry[]) => void): void {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        callback(list.getEntries());
      });

      observer.observe({ entryTypes: [entryType] });
      this.observers.set(entryType, observer);
    } catch (error) {
      console.warn(`[PerformanceService] Could not observe ${entryType}:`, error);
    }
  }

  private isCriticalResource(url: string): boolean {
    const criticalPatterns = [
      '/api/',
      '.css',
      '.js',
      '/fonts/',
      '/images/critical'
    ];
    
    return criticalPatterns.some(pattern => url.includes(pattern));
  }

  private getResourceType(url: string): string {
    if (url.includes('/api/')) return 'api';
    if (url.endsWith('.css')) return 'css';
    if (url.endsWith('.js')) return 'javascript';
    if (url.includes('/fonts/')) return 'font';
    if (url.match(/\.(jpg|jpeg|png|gif|svg|webp)$/i)) return 'image';
    return 'other';
  }

  private setupCrisisMetrics(): void {
    // Monitor crisis intervention response times
    window.addEventListener('crisis-intervention-start', (event: any) => {
      const startTime = performance.now();
      (window as any).crisisStartTime = startTime;
    });

    window.addEventListener('crisis-intervention-complete', (event: any) => {
      const endTime = performance.now();
      const startTime = (window as any).crisisStartTime;
      if (startTime) {
        this.trackCrisisResponse(endTime - startTime, event.detail.type, event.detail.successful);
      }
    });
  }

  private setupAssessmentMetrics(): void {
    // Monitor assessment performance
    window.addEventListener('assessment-start', (event: any) => {
      const startTime = performance.now();
      (window as any).assessmentStartTime = startTime;
      (window as any).assessmentType = event.detail.type;
      (window as any).assessmentQuestions = event.detail.questionCount;
    });

    window.addEventListener('assessment-complete', (event: any) => {
      const endTime = performance.now();
      const startTime = (window as any).assessmentStartTime;
      if (startTime) {
        this.trackAssessmentPerformance(
          (window as any).assessmentType,
          endTime - startTime,
          (window as any).assessmentQuestions
        );
      }
    });
  }

  private setupTherapyMetrics(): void {
    // Monitor therapy session performance
    this.recordMetric({
      id: this.generateMetricId(),
      name: 'therapy_session_load_time',
      category: PerformanceCategory.THERAPY,
      value: 0, // Would be measured during actual session loads
      unit: 'ms',
      threshold: { warning: 3000, critical: 6000 },
      timestamp: new Date(),
      tags: { type: 'session_load' }
    });
  }

  private setupAccessibilityMetrics(): void {
    // Monitor accessibility performance
    const focusableElements = document.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ).length;

    this.recordMetric({
      id: this.generateMetricId(),
      name: 'focusable_elements',
      category: PerformanceCategory.ACCESSIBILITY,
      value: focusableElements,
      unit: 'count',
      threshold: { warning: 100, critical: 200 },
      timestamp: new Date(),
      tags: { type: 'focus_management' }
    });
  }

  private async collectSystemMetrics(): Promise<void> {
    // Collect browser-specific metrics
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      this.recordMetric({
        id: this.generateMetricId(),
        name: 'network_downlink',
        category: PerformanceCategory.NETWORK,
        value: connection.downlink,
        unit: 'mbps',
        threshold: { warning: 1, critical: 0.5 },
        timestamp: new Date(),
        tags: { type: 'connection' }
      });

      this.recordMetric({
        id: this.generateMetricId(),
        name: 'network_rtt',
        category: PerformanceCategory.NETWORK,
        value: connection.rtt,
        unit: 'ms',
        threshold: { warning: 200, critical: 500 },
        timestamp: new Date(),
        tags: { type: 'connection' }
      });
    }
  }

  private async analyzePerformance(): Promise<void> {
    // Analyze trends and patterns
    const recentMetrics = this.getRecentMetrics();
    
    // Detect performance regressions
    this.detectRegressions(recentMetrics);
    
    // Identify optimization opportunities
    this.identifyOptimizations(recentMetrics);
  }

  private checkAlerts(): void {
    // Process any pending alerts
    for (const alert of this.alerts.values()) {
      if (!alert.acknowledged && !alert.resolvedAt) {
        this.processAlert(alert);
      }
    }
  }

  private checkMetricThreshold(metric: PerformanceMetric): void {
    if (metric.value >= metric.threshold.critical) {
      this.createAlert({
        id: this.generateAlertId(),
        metric: metric.name,
        severity: 'critical',
        message: `${metric.name} exceeded critical threshold: ${metric.value}${metric.unit}`,
        value: metric.value,
        threshold: metric.threshold.critical,
        timestamp: new Date(),
        acknowledged: false,
        actions: this.getAlertActions(metric)
      });
    } else if (metric.value >= metric.threshold.warning) {
      this.createAlert({
        id: this.generateAlertId(),
        metric: metric.name,
        severity: 'warning',
        message: `${metric.name} exceeded warning threshold: ${metric.value}${metric.unit}`,
        value: metric.value,
        threshold: metric.threshold.warning,
        timestamp: new Date(),
        acknowledged: false,
        actions: this.getAlertActions(metric)
      });
    }
  }

  private createAlert(alert: PerformanceAlert): void {
    this.alerts.set(alert.id, alert);
    
    // In production, send notifications
    console.warn(`[PerformanceService] ${alert.severity.toUpperCase()}: ${alert.message}`);
  }

  private getAlertActions(metric: PerformanceMetric): string[] {
    const actions: string[] = [];
    
    switch (metric.category) {
      case PerformanceCategory.LOADING:
        actions.push('Optimize bundle size', 'Enable compression', 'Implement lazy loading');
        break;
      case PerformanceCategory.INTERACTIVITY:
        actions.push('Reduce JavaScript execution time', 'Optimize event handlers');
        break;
      case PerformanceCategory.VISUAL_STABILITY:
        actions.push('Set image dimensions', 'Reserve space for dynamic content');
        break;
      case PerformanceCategory.CRISIS_RESPONSE:
        actions.push('Scale crisis infrastructure', 'Optimize crisis detection algorithms');
        break;
    }
    
    return actions;
  }

  private processAlert(alert: PerformanceAlert): void {
    // In production, integrate with alerting systems
    console.log(`[PerformanceService] Processing alert: ${alert.id}`);
  }

  private generateInsights(metrics: PerformanceMetric[]): PerformanceInsight[] {
    const insights: PerformanceInsight[] = [];
    
    // Analyze Core Web Vitals
    const lcpMetrics = metrics.filter(m => m.name === 'lcp');
    if (lcpMetrics.length > 0) {
      const avgLcp = lcpMetrics.reduce((sum, m) => sum + m.value, 0) / lcpMetrics.length;
      if (avgLcp > 2500) {
        insights.push({
          type: 'issue',
          title: 'Poor Loading Performance',
          description: `Average LCP of ${avgLcp.toFixed(0)}ms exceeds recommended 2.5s`,
          impact: 'high',
          evidence: ['Core Web Vitals analysis'],
          confidence: 0.9
        });
      }
    }

    // Analyze API performance
    const apiMetrics = metrics.filter(m => m.name === 'api_response_time');
    if (apiMetrics.length > 0) {
      const avgResponseTime = apiMetrics.reduce((sum, m) => sum + m.value, 0) / apiMetrics.length;
      if (avgResponseTime > 1000) {
        insights.push({
          type: 'optimization',
          title: 'API Response Time Optimization Opportunity',
          description: `Average API response time of ${avgResponseTime.toFixed(0)}ms can be improved`,
          impact: 'medium',
          evidence: ['API performance analysis'],
          confidence: 0.8
        });
      }
    }

    return insights;
  }

  private generateRecommendations(
    metrics: PerformanceMetric[],
    insights: PerformanceInsight[]
  ): PerformanceRecommendation[] {
    const recommendations: PerformanceRecommendation[] = [];
    
    // Generate recommendations based on insights
    insights.forEach(insight => {
      if (insight.type === 'issue' || insight.type === 'optimization') {
        const recommendation = this.createRecommendationFromInsight(insight);
        if (recommendation) {
          recommendations.push(recommendation);
        }
      }
    });

    return recommendations;
  }

  private createRecommendationFromInsight(insight: PerformanceInsight): PerformanceRecommendation | null {
    if (insight.title.includes('Loading Performance')) {
      return {
        priority: 'high',
        category: PerformanceCategory.LOADING,
        title: 'Optimize Loading Performance',
        description: 'Implement code splitting, optimize images, and enable compression',
        estimatedImpact: '30-50% improvement in loading times',
        implementationSteps: [
          'Implement dynamic imports for route-based code splitting',
          'Optimize and compress images using WebP format',
          'Enable Brotli compression on server',
          'Implement preloading for critical resources'
        ],
        effort: 'medium',
        timeframe: '2-3 weeks'
      };
    }

    if (insight.title.includes('API Response Time')) {
      return {
        priority: 'medium',
        category: PerformanceCategory.NETWORK,
        title: 'Optimize API Performance',
        description: 'Implement caching, optimize queries, and consider CDN',
        estimatedImpact: '20-40% improvement in API response times',
        implementationSteps: [
          'Implement Redis caching for frequently accessed data',
          'Optimize database queries and add indexes',
          'Implement request batching where appropriate',
          'Consider GraphQL for selective data fetching'
        ],
        effort: 'high',
        timeframe: '3-4 weeks'
      };
    }

    return null;
  }

  private calculateSummaryScores(metrics: PerformanceMetric[]): {
    overallScore: number;
    categoryScores: Record<PerformanceCategory, number>;
    trends: Record<string, 'improving' | 'stable' | 'degrading'>;
  } {
    const categoryScores: Record<PerformanceCategory, number> = {} as any;
    const categories = Object.values(PerformanceCategory);
    
    // Calculate scores for each category (0-100)
    categories.forEach(category => {
      const categoryMetrics = metrics.filter(m => m.category === category);
      if (categoryMetrics.length === 0) {
        categoryScores[category] = 100; // No issues = perfect score
        return;
      }

      let totalScore = 0;
      categoryMetrics.forEach(metric => {
        // Score based on threshold performance
        let score = 100;
        if (metric.value >= metric.threshold.critical) {
          score = 0;
        } else if (metric.value >= metric.threshold.warning) {
          score = 50;
        } else {
          score = Math.max(0, 100 - (metric.value / metric.threshold.warning) * 50);
        }
        totalScore += score;
      });

      categoryScores[category] = totalScore / categoryMetrics.length;
    });

    // Overall score is weighted average
    const overallScore = Object.values(categoryScores).reduce((sum, score) => sum + score, 0) / 
                        Object.keys(categoryScores).length;

    // Simple trend analysis (would be more sophisticated in production)
    const trends: Record<string, 'improving' | 'stable' | 'degrading'> = {
      'loading': 'stable',
      'interactivity': 'improving',
      'network': 'stable'
    };

    return {
      overallScore: Math.round(overallScore),
      categoryScores,
      trends
    };
  }

  private getCurrentCoreVitals(): Record<string, number> {
    const recentMetrics = this.getRecentMetrics(5 * 60 * 1000); // Last 5 minutes
    
    return {
      lcp: this.getLatestMetricValue(recentMetrics, 'lcp') || 0,
      fid: this.getLatestMetricValue(recentMetrics, 'fid') || 0,
      cls: this.getLatestMetricValue(recentMetrics, 'cls') || 0,
      fcp: this.getLatestMetricValue(recentMetrics, 'fcp') || 0,
      ttfb: this.getLatestMetricValue(recentMetrics, 'ttfb') || 0
    };
  }

  private getRecentAPIMetrics(): APIPerformanceMetrics[] {
    return this.apiMetricsBuffer.slice(-10); // Last 10 API calls
  }

  private getSystemHealthStatus(): Record<string, any> {
    const recentMetrics = this.getRecentMetrics();
    
    return {
      memoryUsage: this.getLatestMetricValue(recentMetrics, 'js_heap_used') || 0,
      networkQuality: this.getLatestMetricValue(recentMetrics, 'network_downlink') || 0,
      errorRate: this.calculateErrorRate(recentMetrics),
      uptime: this.calculateUptime()
    };
  }

  private getRecentMetrics(timeWindow: number = 60 * 60 * 1000): PerformanceMetric[] {
    const cutoff = new Date(Date.now() - timeWindow);
    const allMetrics: PerformanceMetric[] = [];
    
    for (const metrics of this.metrics.values()) {
      allMetrics.push(...metrics.filter(m => m.timestamp > cutoff));
    }
    
    return allMetrics;
  }

  private getLatestMetricValue(metrics: PerformanceMetric[], name: string): number | null {
    const matching = metrics.filter(m => m.name === name).sort((a, b) => 
      b.timestamp.getTime() - a.timestamp.getTime()
    );
    
    return matching.length > 0 ? matching[0]?.value ?? null : null;
  }

  private calculateErrorRate(metrics: PerformanceMetric[]): number {
    const apiMetrics = metrics.filter(m => m.name === 'api_response_time');
    if (apiMetrics.length === 0) return 0;
    
    const errors = apiMetrics.filter(m => 
      m.tags.status && parseInt(m.tags.status) >= 400
    );
    
    return errors.length / apiMetrics.length;
  }

  private calculateUptime(): number {
    // Simplified uptime calculation
    return 0.999; // 99.9% uptime
  }

  private identifyBottlenecks(): string[] {
    // Simplified bottleneck identification
    return ['slow_api_responses', 'large_bundle_size', 'memory_usage'];
  }

  private getOptimizationForBottleneck(bottleneck: string): any {
    const optimizations: Record<string, any> = {
      'slow_api_responses': {
        action: 'Implement API response caching',
        impact: '40% faster API responses',
        autoImplement: false
      },
      'large_bundle_size': {
        action: 'Enable code splitting and tree shaking',
        impact: '30% smaller bundle size',
        autoImplement: true
      },
      'memory_usage': {
        action: 'Implement memory-efficient data structures',
        impact: '25% reduction in memory usage',
        autoImplement: false
      }
    };

    return optimizations[bottleneck];
  }

  private async canAutoImplement(optimization: any): Promise<boolean> {
    // Safety checks for auto-implementation
    return optimization.autoImplement && optimization.risk === 'low';
  }

  private async implementOptimization(optimization: any): Promise<void> {
    console.log(`[PerformanceService] Implementing optimization: ${optimization.action}`);
    // Implementation logic would go here
  }

  private detectRegressions(metrics: PerformanceMetric[]): void {
    // Simplified regression detection
    console.log('[PerformanceService] Checking for performance regressions...');
  }

  private identifyOptimizations(metrics: PerformanceMetric[]): void {
    // Simplified optimization identification
    console.log('[PerformanceService] Identifying optimization opportunities...');
  }

  private generateMetricId(): string {
    return `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateReportId(): string {
    return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const performanceService = PerformanceService.getInstance();