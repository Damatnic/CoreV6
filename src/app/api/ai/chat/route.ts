// AI Chat API Endpoint
// Provides AI therapy assistance using OpenAI and Gemini

import { NextRequest } from 'next/server';
import { aiService, AIMessage } from '@/lib/ai-service';
import { createCachedResponse, CacheDurations } from '@/lib/cache';
import { createApiErrorHandler } from '@/lib/api-error-handler';

interface ChatRequest {
  message: string;
  conversationHistory?: AIMessage[];
  provider?: 'openai' | 'gemini';
  sessionId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { message, conversationHistory = [], provider = 'openai', sessionId } = body;

    // Validate input
    if (!message || typeof message !== 'string') {
      return createApiErrorHandler('INVALID_INPUT', 'Message is required', 400);
    }

    if (message.length > 2000) {
      return createApiErrorHandler('MESSAGE_TOO_LONG', 'Message must be under 2000 characters', 400);
    }

    // Check if AI services are configured
    const aiConfig = aiService.isConfigured();
    if (!aiConfig.openai && !aiConfig.gemini) {
      return createApiErrorHandler(
        'AI_NOT_CONFIGURED', 
        'AI services are not configured. Please add API keys.', 
        503
      );
    }

    if (provider === 'openai' && !aiConfig.openai) {
      return createApiErrorHandler(
        'OPENAI_NOT_CONFIGURED', 
        'OpenAI API key not configured', 
        503
      );
    }

    if (provider === 'gemini' && !aiConfig.gemini) {
      return createApiErrorHandler(
        'GEMINI_NOT_CONFIGURED', 
        'Gemini API key not configured', 
        503
      );
    }

    console.log(`AI Chat request: provider=${provider}, message length=${message.length}`);

    // Generate AI response
    const aiResponse = await aiService.getTherapyResponse(
      message,
      conversationHistory,
      provider
    );

    // Log for monitoring (without sensitive content)
    console.log(`AI Response: model=${aiResponse.model}, risk=${aiResponse.riskLevel}, confidence=${aiResponse.confidence}`);

    // Check for crisis situations
    if (aiResponse.riskLevel === 'critical') {
      console.warn(`CRISIS DETECTED: Session ${sessionId || 'unknown'} - Risk Level: ${aiResponse.riskLevel}`);
      
      // Add crisis resources to response
      aiResponse.content += `\n\n🚨 **Immediate Support Available**\n\nIf you're having thoughts of self-harm, please reach out for immediate help:\n• Crisis Text Line: Text HOME to 741741\n• National Suicide Prevention Lifeline: 988\n• Emergency Services: 911\n\nYou don't have to go through this alone. Professional help is available 24/7.`;
    }

    // Prepare response data
    const responseData = {
      success: true,
      data: {
        response: aiResponse.content,
        model: aiResponse.model,
        provider,
        confidence: aiResponse.confidence,
        riskLevel: aiResponse.riskLevel,
        tokens: aiResponse.tokens,
        timestamp: new Date().toISOString(),
        sessionId,
      },
      metadata: {
        aiConfigured: aiConfig,
        responseTime: Date.now(),
      }
    };

    // Cache response briefly for identical requests
    const cacheKey = `ai_chat_${Buffer.from(message).toString('base64').slice(0, 32)}`;
    
    return createCachedResponse(responseData, CacheDurations.SHORT / 2, { // 30 seconds cache
      tags: ['ai', 'chat'],
      vary: 'Authorization'
    });

  } catch (error: any) {
    console.error('AI Chat API error:', error);
    
    if (error.message?.includes('API key')) {
      return createApiErrorHandler(
        'API_KEY_ERROR',
        'AI service authentication failed',
        401
      );
    }
    
    if (error.message?.includes('rate limit')) {
      return createApiErrorHandler(
        'RATE_LIMITED',
        'AI service rate limit exceeded. Please try again later.',
        429
      );
    }
    
    return createApiErrorHandler(
      'AI_SERVICE_ERROR',
      'AI service temporarily unavailable',
      503
    );
  }
}

// GET endpoint for checking AI service status
export async function GET() {
  try {
    const aiConfig = aiService.isConfigured();
    
    return createCachedResponse({
      success: true,
      data: {
        services: {
          openai: {
            configured: aiConfig.openai,
            status: aiConfig.openai ? 'available' : 'not configured'
          },
          gemini: {
            configured: aiConfig.gemini,
            status: aiConfig.gemini ? 'available' : 'not configured'
          }
        },
        defaultProvider: aiConfig.openai ? 'openai' : aiConfig.gemini ? 'gemini' : 'none',
        lastChecked: new Date().toISOString()
      }
    }, CacheDurations.SHORT, {
      tags: ['ai', 'status']
    });
    
  } catch (error) {
    console.error('AI status check error:', error);
    return createApiErrorHandler('STATUS_CHECK_ERROR', 'Failed to check AI service status', 500);
  }
}