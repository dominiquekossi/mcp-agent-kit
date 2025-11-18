/**
 * MCP Transport Layer - WebSocket support with heartbeat and reconnection
 */

import WebSocket from 'ws';
import { Logger } from '../core/logger';

export interface TransportConfig {
  port: number;
  heartbeatInterval?: number; // milliseconds
  reconnectDelay?: number; // milliseconds
  maxReconnectAttempts?: number;
}

export class WebSocketTransport {
  private wss: WebSocket.Server | null = null;
  private clients: Set<WebSocket> = new Set();
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private config: Required<TransportConfig>;
  private logger: Logger;
  private isRunning: boolean = false;

  constructor(config: TransportConfig, logger: Logger) {
    this.config = {
      port: config.port,
      heartbeatInterval: config.heartbeatInterval || 30000, // 30 seconds
      reconnectDelay: config.reconnectDelay || 1000, // 1 second
      maxReconnectAttempts: config.maxReconnectAttempts || 5,
    };
    this.logger = logger;
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('WebSocket transport already running');
      return;
    }

    return new Promise((resolve, reject) => {
      try {
        this.wss = new WebSocket.Server({ port: this.config.port });

        this.wss.on('listening', () => {
          this.isRunning = true;
          this.logger.info(`WebSocket server listening on port ${this.config.port}`);
          this.startHeartbeat();
          resolve();
        });

        this.wss.on('connection', (ws: WebSocket) => {
          this.handleConnection(ws);
        });

        this.wss.on('error', (error) => {
          this.logger.error('WebSocket server error:', error.message);
          reject(error);
        });

      } catch (error: any) {
        this.logger.error('Failed to start WebSocket server:', error.message);
        reject(error);
      }
    });
  }

  private handleConnection(ws: WebSocket): void {
    this.clients.add(ws);
    this.logger.info(`Client connected. Total clients: ${this.clients.size}`);

    // Set up ping/pong for connection health
    (ws as any).isAlive = true;
    ws.on('pong', () => {
      (ws as any).isAlive = true;
    });

    ws.on('message', (data: WebSocket.Data) => {
      try {
        const message = JSON.parse(data.toString());
        this.logger.debug('Received message:', message);
        // Message handling will be done by MCP Server
        this.emit('message', { ws, message });
      } catch (error: any) {
        this.logger.error('Failed to parse message:', error.message);
      }
    });

    ws.on('close', () => {
      this.clients.delete(ws);
      this.logger.info(`Client disconnected. Total clients: ${this.clients.size}`);
    });

    ws.on('error', (error) => {
      this.logger.error('WebSocket client error:', error.message);
      this.clients.delete(ws);
    });
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      this.clients.forEach((ws) => {
        if ((ws as any).isAlive === false) {
          this.logger.warn('Client failed heartbeat, terminating connection');
          ws.terminate();
          this.clients.delete(ws);
          return;
        }

        (ws as any).isAlive = false;
        ws.ping();
      });

      this.logger.debug(`Heartbeat sent to ${this.clients.size} clients`);
    }, this.config.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  broadcast(message: any): void {
    const data = JSON.stringify(message);
    this.clients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    });
    this.logger.debug(`Broadcast message to ${this.clients.size} clients`);
  }

  send(ws: WebSocket, message: any): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
      this.logger.debug('Sent message to client');
    } else {
      this.logger.warn('Cannot send message, client not connected');
    }
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      this.logger.warn('WebSocket transport not running');
      return;
    }

    this.stopHeartbeat();

    // Close all client connections
    this.clients.forEach((ws) => {
      ws.close();
    });
    this.clients.clear();

    // Close server
    return new Promise((resolve) => {
      if (this.wss) {
        this.wss.close(() => {
          this.isRunning = false;
          this.logger.info('WebSocket server stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  getStatus(): { running: boolean; clients: number } {
    return {
      running: this.isRunning,
      clients: this.clients.size,
    };
  }

  // Simple event emitter for message handling
  private listeners: Map<string, Function[]> = new Map();

  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  private emit(event: string, data: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(cb => cb(data));
    }
  }
}
