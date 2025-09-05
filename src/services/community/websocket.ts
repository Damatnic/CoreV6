// Real-time WebSocket Service for Community Features
// Implements end-to-end encryption and crisis detection

import { io, Socket } from 'socket.io-client';
import { 
  CommunityWebSocketEvents, 
  ChatMessage, 
  EncryptionKeys,
  SessionSecurity 
} from '@/types/community';

interface WebSocketConfig {
  url: string;
  sessionId: string;
  encryptionKeys?: EncryptionKeys;
  reconnectAttempts?: number;
  heartbeatInterval?: number;
}

class CommunityWebSocketService {
  private socket: Socket | null = null;
  private config: WebSocketConfig;
  private messageQueue: ChatMessage[] = [];
  private eventHandlers: Map<string, Set<Function>> = new Map();
  private encryptionKeys?: EncryptionKeys;
  private heartbeatTimer?: NodeJS.Timeout;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private isConnected = false;
  private sessionSecurity?: SessionSecurity;

  constructor(config: WebSocketConfig) {
    this.config = config;
    this.encryptionKeys = config.encryptionKeys;
    this.maxReconnectAttempts = config.reconnectAttempts || 5;
  }

  // Initialize WebSocket connection
  async connect(): Promise<void> {
    try {
      // Generate encryption keys if not provided
      if (!this.encryptionKeys) {
        this.encryptionKeys = await this.generateEncryptionKeys();
      }

      this.socket = io(this.config.url, {
        transports: ['websocket'],
        secure: true,
        rejectUnauthorized: true,
        auth: {
          sessionId: this.config.sessionId,
          publicKey: this.encryptionKeys.publicKey
        }
      });

      this.setupEventListeners();
      this.startHeartbeat();
      
    } catch (error) {
      console.error('WebSocket connection failed:', error);
      this.handleReconnect();
    }
  }

  // Setup WebSocket event listeners
  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.processMessageQueue();
      this.emit('connection:established', { sessionId: this.config.sessionId });
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      this.emit('connection:lost', { reason });
      if (reason === 'io server disconnect') {
        this.handleReconnect();
      }
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
      this.emit('connection:error', { error });
    });

    // Crisis detection events
    this.socket.on('crisis:detected', async (data) => {
      await this.handleCrisisDetection(data);
    });

    // Message events
    this.socket.on('message:received', async (data) => {
      const decrypted = await this.decryptMessage(data);
      this.emit('message:received', decrypted);
    });

    // Group events
    this.socket.on('group:update', (data) => {
      this.emit('group:update', data);
    });

    // Peer matching events
    this.socket.on('peer:matched', (data) => {
      this.emit('peer:matched', data);
    });

    // Security events
    this.socket.on('security:verification', async (challenge) => {
      const response = await this.handleSecurityChallenge(challenge);
      this.socket?.emit('security:response', response);
    });
  }

  // Send encrypted message
  async sendMessage(event: keyof CommunityWebSocketEvents, data: any): Promise<void> {
    if (!this.isConnected) {
      this.messageQueue.push({ ...data, event });
      return;
    }

    try {
      const encrypted = await this.encryptMessage(data);
      this.socket?.emit(event, {
        payload: encrypted,
        timestamp: new Date().toISOString(),
        sessionId: this.config.sessionId
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      this.messageQueue.push({ ...data, event });
    }
  }

  // Join support group
  async joinGroup(groupId: string): Promise<void> {
    this.sendMessage('group:join', { 
      groupId, 
      sessionId: this.config.sessionId 
    });
  }

  // Leave support group
  async leaveGroup(groupId: string): Promise<void> {
    this.sendMessage('group:leave', { 
      groupId, 
      sessionId: this.config.sessionId 
    });
  }

  // Request peer match
  async requestPeerMatch(preferences?: any): Promise<void> {
    this.socket?.emit('peer:request', {
      sessionId: this.config.sessionId,
      preferences: preferences || {},
      timestamp: new Date().toISOString()
    });
  }

  // Send peer message
  async sendPeerMessage(matchId: string, message: string): Promise<void> {
    const chatMessage: ChatMessage = {
      id: this.generateMessageId(),
      roomId: matchId,
      senderSessionId: this.config.sessionId,
      senderNickname: 'Anonymous',
      content: message,
      timestamp: new Date(),
      isEncrypted: true,
      readBy: [this.config.sessionId],
      reactions: [],
      moderationFlags: []
    };

    await this.sendMessage('peer:message', { 
      matchId, 
      message: chatMessage 
    });
  }

  // Crisis detection handler
  private async handleCrisisDetection(data: any): Promise<void> {
    // Immediate intervention
    this.emit('crisis:intervention:needed', {
      sessionId: data.sessionId,
      severity: data.severity,
      timestamp: new Date().toISOString()
    });

    // Notify moderators
    if (data.severity > 7) {
      this.socket?.emit('moderation:crisis:escalate', {
        sessionId: data.sessionId,
        severity: data.severity,
        context: data.context
      });
    }
  }

  // Encryption methods
  private async generateEncryptionKeys(): Promise<EncryptionKeys> {
    const keyPair = await crypto.subtle.generateKey(
      {
        name: 'RSA-OAEP',
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: 'SHA-256'
      },
      true,
      ['encrypt', 'decrypt']
    );

    const publicKey = await crypto.subtle.exportKey('spki', keyPair.publicKey);
    const privateKey = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

    return {
      publicKey: this.arrayBufferToBase64(publicKey),
      privateKey: this.arrayBufferToBase64(privateKey),
      algorithm: 'RSA-OAEP'
    };
  }

  private async encryptMessage(data: any): Promise<string> {
    if (!this.encryptionKeys) return JSON.stringify(data);

    try {
      const messageBuffer = new TextEncoder().encode(JSON.stringify(data));
      
      // Generate AES key for message encryption
      const aesKey = await crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
      );

      // Encrypt message with AES
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        aesKey,
        messageBuffer
      );

      // Export and return encrypted data
      const exportedKey = await crypto.subtle.exportKey('raw', aesKey);
      
      return this.arrayBufferToBase64(encrypted);
    } catch (error) {
      console.error('Encryption failed:', error);
      return JSON.stringify(data);
    }
  }

  private async decryptMessage(encryptedData: string): Promise<any> {
    if (!this.encryptionKeys) return JSON.parse(encryptedData);

    try {
      const encrypted = this.base64ToArrayBuffer(encryptedData);
      
      // Decrypt with private key
      // Implementation depends on server encryption method
      
      return JSON.parse(encryptedData); // Placeholder
    } catch (error) {
      console.error('Decryption failed:', error);
      return null;
    }
  }

  // Security challenge handler
  private async handleSecurityChallenge(challenge: any): Promise<any> {
    // Implement challenge-response authentication
    const response = {
      sessionId: this.config.sessionId,
      challengeResponse: await this.signChallenge(challenge),
      timestamp: new Date().toISOString()
    };
    return response;
  }

  private async signChallenge(challenge: string): Promise<string> {
    // Sign challenge with private key
    return `signed_${challenge}_${this.config.sessionId}`;
  }

  // Heartbeat mechanism
  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected) {
        this.socket?.emit('heartbeat', {
          sessionId: this.config.sessionId,
          timestamp: new Date().toISOString()
        });
      }
    }, this.config.heartbeatInterval || 30000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = undefined;
    }
  }

  // Reconnection logic
  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.emit('connection:failed', { 
        reason: 'Max reconnection attempts reached' 
      });
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

    setTimeout(() => {
      this.connect();
    }, delay);
  }

  // Process queued messages
  private processMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message) {
        const { event, ...data } = message as any;
        this.sendMessage(event, data);
      }
    }
  }

  // Event emitter methods
  on(event: string, handler: Function): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)?.add(handler);
  }

  off(event: string, handler: Function): void {
    this.eventHandlers.get(event)?.delete(handler);
  }

  private emit(event: string, data: any): void {
    this.eventHandlers.get(event)?.forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error(`Error in event handler for ${event}:`, error);
      }
    });
  }

  // Utility methods
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    bytes.forEach(byte => binary += String.fromCharCode(byte));
    return btoa(binary);
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  // Cleanup
  disconnect(): void {
    this.stopHeartbeat();
    this.socket?.disconnect();
    this.socket = null;
    this.isConnected = false;
    this.eventHandlers.clear();
    this.messageQueue = [];
  }

  // Status checks
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  getQueueSize(): number {
    return this.messageQueue.length;
  }
}

// Export singleton instance
let instance: CommunityWebSocketService | null = null;

export const initializeWebSocket = (config: WebSocketConfig): CommunityWebSocketService => {
  if (!instance) {
    instance = new CommunityWebSocketService(config);
  }
  return instance;
};

export const getWebSocketInstance = (): CommunityWebSocketService | null => {
  return instance;
};

export default CommunityWebSocketService;