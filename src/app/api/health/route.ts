// Health Check API Route
// Provides system health information and triggers auto-initialization

import { NextRequest, NextResponse } from 'next/server';
import { ensureInitialized, checkSystemHealth } from '@/lib/auto-init';

export const dynamic = 'force-dynamic';

/**
 * Health check endpoint
 * GET /api/health
 */
export async function GET(request: NextRequest) {
  try {
    // Ensure system is initialized
    await ensureInitialized();
    
    // Get system health status
    const health = await checkSystemHealth();
    
    // Additional health checks
    const detailedHealth = {
      ...health,
      checks: {
        database: {
          connected: true, // Replace with actual database check
          responseTime: Date.now(), // Replace with actual response time
        },
        memory: {
          used: process.memoryUsage().heapUsed,
          total: process.memoryUsage().heapTotal,
        },
        uptime: process.uptime(),
      },
      deployment: {
        platform: 'vercel',
        region: process.env.VERCEL_REGION || 'unknown',
        environment: process.env.VERCEL_ENV || process.env.NODE_ENV,
      }
    };
    
    // Return health data with appropriate caching
    return NextResponse.json(detailedHealth, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json',
      },
    });
    
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

/**
 * Health check with query parameters
 * Supports ?detailed=true for more information
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { detailed = false } = body;
    
    // Ensure system is initialized
    await ensureInitialized();
    
    const health = await checkSystemHealth();
    
    if (detailed) {
      // Return detailed health information
      return NextResponse.json({
        ...health,
        system: {
          platform: process.platform,
          nodeVersion: process.version,
          memory: process.memoryUsage(),
          uptime: process.uptime(),
        },
        environment: {
          NODE_ENV: process.env.NODE_ENV,
          VERCEL_ENV: process.env.VERCEL_ENV,
          VERCEL_REGION: process.env.VERCEL_REGION,
          VERCEL_URL: process.env.VERCEL_URL,
        },
      });
    }
    
    return NextResponse.json(health);
    
  } catch (error) {
    console.error('Detailed health check failed:', error);
    
    return NextResponse.json(
      {
        status: 'error',
        message: 'Health check failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}