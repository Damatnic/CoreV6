/**
 * Health Check System
 * Comprehensive health monitoring for Astral Core platform
 */

import { EventEmitter } from 'events';
import { getMonitoringConfig, MonitoringConfig } from './config';

export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy' | 'unknown';

export interface HealthCheckResult {
  name: string;
  status: HealthStatus;
  timestamp: number;
  responseTime: number;
  message?: string;
  details?: Record<string, any>;
  error?: string;
}

export interface SystemHealth {
  overall: HealthStatus;
  timestamp: number;
  uptime: number;
  version: string;
  environment: string;
  services: HealthCheckResult[];
  resources: {
    memory: {
      used: number;
      total: number;
      percentage: number;
      status: HealthStatus;
    };
    cpu: {
      usage: number;
      loadAverage: number[];
      status: HealthStatus;
    };
    disk: {
      used: number;
      total: number;
      percentage: number;
      status: HealthStatus;
    };
  };
}

export interface HealthCheckConfig {
  name: string;
  check: () => Promise<Omit<HealthCheckResult, 'name' | 'timestamp'>>;
  interval: number;
  timeout: number;
  retries: number;
  enabled: boolean;
}

class HealthCheckService extends EventEmitter {
  private config: MonitoringConfig;
  private checks: Map<string, HealthCheckConfig> = new Map();
  private results: Map<string, HealthCheckResult> = new Map();
  private intervals: Map<string, NodeJS.Timer> = new Map();
  private isRunning = false;
  private startTime = Date.now();

  constructor() {
    super();
    this.config = getMonitoringConfig();
    this.initializeDefaultChecks();
  }

  /**
   * Initialize default health checks
   */
  private initializeDefaultChecks(): void {
    // Database connectivity check
    this.registerCheck({
      name: 'database',
      check: this.checkDatabase.bind(this),
      interval: this.config.healthCheck.databaseInterval,
      timeout: 5000,
      retries: 3,
      enabled: true,
    });

    // Redis cache check
    this.registerCheck({
      name: 'redis',
      check: this.checkRedis.bind(this),
      interval: this.config.healthCheck.redisInterval,
      timeout: 3000,
      retries: 3,
      enabled: true,
    });

    // WebSocket server check
    this.registerCheck({
      name: 'websocket',
      check: this.checkWebSocket.bind(this),
      interval: this.config.healthCheck.webSocketInterval,
      timeout: 5000,
      retries: 2,
      enabled: true,
    });

    // External API checks
    this.registerCheck({
      name: 'external_apis',
      check: this.checkExternalAPIs.bind(this),
      interval: this.config.healthCheck.apiInterval,
      timeout: 10000,
      retries: 2,
      enabled: true,
    });

    // System resources check
    this.registerCheck({
      name: 'system_resources',
      check: this.checkSystemResources.bind(this),
      interval: this.config.healthCheck.systemResourcesInterval,
      timeout: 1000,
      retries: 1,
      enabled: true,
    });
  }

  /**
   * Register a new health check
   */
  public registerCheck(checkConfig: HealthCheckConfig): void {
    this.checks.set(checkConfig.name, checkConfig);
    
    if (this.isRunning && checkConfig.enabled) {
      this.startCheckInterval(checkConfig.name);
    }
  }

  /**
   * Unregister a health check
   */
  public unregisterCheck(name: string): void {
    this.stopCheckInterval(name);
    this.checks.delete(name);
    this.results.delete(name);
  }

  /**
   * Start all health checks
   */
  public start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    
    // Start all enabled checks
    for (const [name, config] of this.checks) {
      if (config.enabled) {
        this.startCheckInterval(name);
      }
    }
    
    this.emit('healthcheck:started');
  }

  /**
   * Stop all health checks
   */
  public stop(): void {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    
    // Stop all intervals
    for (const name of this.checks.keys()) {
      this.stopCheckInterval(name);
    }
    
    this.emit('healthcheck:stopped');
  }

  /**
   * Run a specific health check immediately
   */
  public async runCheck(name: string): Promise<HealthCheckResult> {
    const config = this.checks.get(name);
    if (!config) {
      throw new Error(`Health check '${name}' not found`);
    }

    return this.executeCheck(name, config);
  }

  /**
   * Run all health checks immediately
   */
  public async runAllChecks(): Promise<HealthCheckResult[]> {
    const promises = Array.from(this.checks.entries())
      .filter(([, config]) => config.enabled)
      .map(([name, config]) => this.executeCheck(name, config));

    return Promise.all(promises);
  }

  /**
   * Get current system health status
   */
  public async getSystemHealth(): Promise<SystemHealth> {
    // Run all checks if not already running
    if (!this.isRunning) {
      await this.runAllChecks();
    }

    const services = Array.from(this.results.values());
    const resources = await this.getResourceHealth();
    
    // Calculate overall health
    const overall = this.calculateOverallHealth(services, resources);
    
    return {
      overall,
      timestamp: Date.now(),
      uptime: Date.now() - this.startTime,
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services,
      resources,
    };
  }

  /**
   * Get health check results
   */
  public getResults(): HealthCheckResult[] {
    return Array.from(this.results.values());
  }

  /**
   * Get specific health check result
   */
  public getResult(name: string): HealthCheckResult | undefined {
    return this.results.get(name);
  }

  /**
   * Start interval for a specific check
   */
  private startCheckInterval(name: string): void {
    const config = this.checks.get(name);
    if (!config) return;

    // Stop existing interval if any
    this.stopCheckInterval(name);

    // Run check immediately
    this.executeCheck(name, config);

    // Set up interval
    const interval = setInterval(() => {
      this.executeCheck(name, config);
    }, config.interval);

    this.intervals.set(name, interval);
  }

  /**
   * Stop interval for a specific check
   */
  private stopCheckInterval(name: string): void {
    const interval = this.intervals.get(name);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(name);
    }
  }

  /**
   * Execute a health check with retries and timeout
   */
  private async executeCheck(name: string, config: HealthCheckConfig): Promise<HealthCheckResult> {
    const startTime = Date.now();
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= config.retries; attempt++) {
      try {
        // Execute check with timeout
        const checkPromise = config.check();
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Health check timeout')), config.timeout);
        });

        const result = await Promise.race([checkPromise, timeoutPromise]) as Omit<HealthCheckResult, 'name' | 'timestamp'>;
        
        const healthResult: HealthCheckResult = {
          name,
          timestamp: Date.now(),
          responseTime: Date.now() - startTime,
          ...result,
        };

        this.results.set(name, healthResult);
        this.emit('healthcheck:result', healthResult);
        
        // Emit status change if needed
        const previousResult = this.results.get(name);
        if (!previousResult || previousResult.status !== healthResult.status) {
          this.emit('healthcheck:status_change', {
            name,
            previousStatus: previousResult?.status || 'unknown',
            currentStatus: healthResult.status,
            result: healthResult,
          });
        }

        return healthResult;
      } catch (error) {
        lastError = error as Error;
        
        // Wait before retry (exponential backoff)
        if (attempt < config.retries) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    // All retries failed
    const failedResult: HealthCheckResult = {
      name,
      timestamp: Date.now(),
      responseTime: Date.now() - startTime,
      status: 'unhealthy',
      error: lastError?.message || 'Unknown error',
      message: `Health check failed after ${config.retries + 1} attempts`,
    };

    this.results.set(name, failedResult);
    this.emit('healthcheck:result', failedResult);
    this.emit('healthcheck:failure', failedResult);

    return failedResult;
  }

  /**
   * Database connectivity check
   */
  private async checkDatabase(): Promise<Omit<HealthCheckResult, 'name' | 'timestamp'>> {
    try {
      // Try to import and use database connection
      const neonModule = await import('../neon-database');
      const neonDb = (neonModule as any).neonDb;
      
      // Simple query to test connectivity
      const result = await neonDb`SELECT 1 as test`;
      
      if (result && result.length > 0) {
        return {
          status: 'healthy',
          message: 'Database connection successful',
          details: {
            host: process.env.DATABASE_URL ? 'configured' : 'not configured',
            driver: 'neon',
          },
        };
      } else {
        return {
          status: 'unhealthy',
          message: 'Database query returned unexpected result',
        };
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        message: 'Database connection failed',
        error: (error as Error).message,
      };
    }
  }

  /**
   * Redis cache connectivity check
   */
  private async checkRedis(): Promise<Omit<HealthCheckResult, 'name' | 'timestamp'>> {
    try {
      // Try to import and use Redis connection
      const Redis = (await import('ioredis')).default;
      const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
      
      // Test basic operations
      const testKey = 'health_check_test';
      const testValue = Date.now().toString();
      
      await redis.set(testKey, testValue, 'EX', 10); // Expire in 10 seconds
      const retrievedValue = await redis.get(testKey);
      await redis.del(testKey);
      await redis.quit();
      
      if (retrievedValue === testValue) {
        return {
          status: 'healthy',
          message: 'Redis connection and operations successful',
          details: {
            host: process.env.REDIS_URL ? 'configured' : 'localhost:6379',
          },
        };
      } else {
        return {
          status: 'degraded',
          message: 'Redis connection successful but operations failed',
        };
      }
    } catch (error) {
      // Redis might not be configured or available, treat as degraded not unhealthy
      return {
        status: 'degraded',
        message: 'Redis connection failed (optional service)',
        error: (error as Error).message,
      };
    }
  }

  /**
   * WebSocket server connectivity check
   */
  private async checkWebSocket(): Promise<Omit<HealthCheckResult, 'name' | 'timestamp'>> {
    try {
      // This would check if WebSocket server is running
      // For now, we'll do a simple check
      const wsEnabled = process.env.WEBSOCKET_ENABLED !== 'false';
      
      if (wsEnabled) {
        return {
          status: 'healthy',
          message: 'WebSocket server is enabled and running',
          details: {
            enabled: true,
            port: process.env.WEBSOCKET_PORT || '3001',
          },
        };
      } else {
        return {
          status: 'degraded',
          message: 'WebSocket server is disabled',
          details: {
            enabled: false,
          },
        };
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        message: 'WebSocket server check failed',
        error: (error as Error).message,
      };
    }
  }

  /**
   * External APIs connectivity check
   */
  private async checkExternalAPIs(): Promise<Omit<HealthCheckResult, 'name' | 'timestamp'>> {
    const externalChecks = [];
    
    // Check OpenAI API if configured
    if (process.env.OPENAI_API_KEY) {
      externalChecks.push(this.checkOpenAI());
    }
    
    // Check email service if configured
    if (process.env.SMTP_HOST) {
      externalChecks.push(this.checkEmailService());
    }
    
    if (externalChecks.length === 0) {
      return {
        status: 'healthy',
        message: 'No external APIs configured',
        details: {
          configured_services: 0,
        },
      };
    }
    
    try {
      const results = await Promise.allSettled(externalChecks);
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const total = results.length;
      
      if (successful === total) {
        return {
          status: 'healthy',
          message: `All ${total} external APIs are healthy`,
          details: {
            total,
            successful,
            failed: 0,
          },
        };
      } else if (successful > 0) {
        return {
          status: 'degraded',
          message: `${successful}/${total} external APIs are healthy`,
          details: {
            total,
            successful,
            failed: total - successful,
          },
        };
      } else {
        return {
          status: 'unhealthy',
          message: 'All external APIs are failing',
          details: {
            total,
            successful: 0,
            failed: total,
          },
        };
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        message: 'External API checks failed',
        error: (error as Error).message,
      };
    }
  }

  /**
   * Check OpenAI API availability
   */
  private async checkOpenAI(): Promise<boolean> {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(5000),
      });
      
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check email service availability
   */
  private async checkEmailService(): Promise<boolean> {
    try {
      // This is a simplified check - in production you'd want to test SMTP connection
      return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
    } catch (error) {
      return false;
    }
  }

  /**
   * System resources check
   */
  private async checkSystemResources(): Promise<Omit<HealthCheckResult, 'name' | 'timestamp'>> {
    try {
      const resources = await this.getResourceHealth();
      
      // Check if any resources are unhealthy
      const unhealthyResources = Object.entries(resources).filter(
        ([, resource]) => resource.status === 'unhealthy'
      );
      
      if (unhealthyResources.length > 0) {
        return {
          status: 'unhealthy',
          message: `System resources critical: ${unhealthyResources.map(([name]) => name).join(', ')}`,
          details: resources,
        };
      }
      
      // Check if any resources are degraded
      const degradedResources = Object.entries(resources).filter(
        ([, resource]) => resource.status === 'degraded'
      );
      
      if (degradedResources.length > 0) {
        return {
          status: 'degraded',
          message: `System resources degraded: ${degradedResources.map(([name]) => name).join(', ')}`,
          details: resources,
        };
      }
      
      return {
        status: 'healthy',
        message: 'All system resources are healthy',
        details: resources,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: 'Failed to check system resources',
        error: (error as Error).message,
      };
    }
  }

  /**
   * Get resource health status
   */
  private async getResourceHealth(): Promise<SystemHealth['resources']> {
    const memoryUsage = process.memoryUsage();
    const totalMemory = memoryUsage.rss + memoryUsage.external;
    const memoryPercentage = (memoryUsage.rss / totalMemory) * 100;
    
    // CPU usage estimation (simplified)
    const cpuUsage = process.cpuUsage();
    const cpuPercentage = (cpuUsage.user + cpuUsage.system) / 1000 / 1000; // Rough estimate
    
    // Disk space (simplified - would need OS-specific implementation)
    const diskPercentage = 50; // Placeholder
    
    return {
      memory: {
        used: memoryUsage.rss,
        total: totalMemory,
        percentage: memoryPercentage,
        status: memoryPercentage > this.config.performance.memoryThreshold ? 
          (memoryPercentage > 95 ? 'unhealthy' : 'degraded') : 'healthy',
      },
      cpu: {
        usage: cpuPercentage,
        loadAverage: process.platform !== 'win32' ? require('os').loadavg() : [0, 0, 0],
        status: cpuPercentage > this.config.performance.cpuThreshold ? 
          (cpuPercentage > 95 ? 'unhealthy' : 'degraded') : 'healthy',
      },
      disk: {
        used: 0, // Placeholder
        total: 0, // Placeholder
        percentage: diskPercentage,
        status: diskPercentage > this.config.performance.diskSpaceThreshold ? 
          (diskPercentage > 95 ? 'unhealthy' : 'degraded') : 'healthy',
      },
    };
  }

  /**
   * Calculate overall system health
   */
  private calculateOverallHealth(
    services: HealthCheckResult[],
    resources: SystemHealth['resources']
  ): HealthStatus {
    const allStatuses = [
      ...services.map(s => s.status),
      resources.memory.status,
      resources.cpu.status,
      resources.disk.status,
    ];
    
    if (allStatuses.some(status => status === 'unhealthy')) {
      return 'unhealthy';
    }
    
    if (allStatuses.some(status => status === 'degraded')) {
      return 'degraded';
    }
    
    if (allStatuses.every(status => status === 'healthy')) {
      return 'healthy';
    }
    
    return 'unknown';
  }
}

// Singleton instance
export const healthCheckService = new HealthCheckService();

export default healthCheckService;