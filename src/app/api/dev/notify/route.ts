import { NextRequest } from 'next/server';
import { getSocketIO } from '@/lib/socket-server';
import { createApiErrorHandler } from '@/lib/api-error-handler';

export async function POST(req: NextRequest) {
  try {
    // Optional guard: require dev mode
    if (process.env.NODE_ENV === 'production') {
      return createApiErrorHandler('FORBIDDEN', 'Dev notify not available in production', 403);
    }
    const io = getSocketIO();
    if (!io) {
      return createApiErrorHandler('SOCKET_UNAVAILABLE', 'Socket server is not initialized', 503);
    }
    const body = await req.json();
    const { event = 'notification', payload = { title: 'Test', body: 'Hello!' } } = body || {};
    io.emit(event, payload);
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error('Dev notify error:', error);
    return createApiErrorHandler('DEV_NOTIFY_ERROR', 'Failed to emit notification', 500);
  }
}

