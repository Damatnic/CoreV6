import { useState, useCallback } from 'react';

interface AIMetrics {
  responseTime: number;
  confidence: number;
  sentiment: number;
}

interface AITherapyHook {
  sendMessage: (content: string) => Promise<void>;
  isProcessing: boolean;
  sessionId: string;
  connectionStatus: 'connected' | 'connecting' | 'disconnected';
  aiMetrics: AIMetrics;
}

export function useAITherapy(): AITherapyHook {
  const [isProcessing, setIsProcessing] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}`);
  const [connectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connected');
  const [aiMetrics] = useState<AIMetrics>({
    responseTime: 0,
    confidence: 0.85,
    sentiment: 0
  });

  const sendMessage = useCallback(async (content: string) => {
    setIsProcessing(true);
    
    try {
      // Simulate AI processing
      const response = await fetch('/api/ai/therapy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content,
          sessionId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      // Process response if needed
      await response.json();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [sessionId]);

  return {
    sendMessage,
    isProcessing,
    sessionId,
    connectionStatus,
    aiMetrics
  };
}