export interface DeckConfig {
  host?: string;
  port?: number;
  token?: string;
  autoReconnect?: boolean;
}

export interface ButtonEvent {
  buttonId: string;
  state: 'down' | 'up' | 'tap';
  timestamp: number;
}

export interface DialEvent {
  dialId: string;
  delta: number;
  value: number;
  timestamp: number;
}

export interface LCDUpdate {
  buttonId: string;
  label?: string;
  iconSvg?: string;
  bgColor?: string;
  tally?: 'off' | 'preview' | 'live';
}

export type EventCallback<T> = (data: T) => void;

export class KudobyDeckClient {
  private config: DeckConfig;
  private ws: any = null;
  private listeners: Map<string, Function[]> = new Map();

  constructor(config: DeckConfig = {}) {
    this.config = {
      host: config.host || '127.0.0.1',
      port: config.port || 9173,
      token: config.token || '',
      autoReconnect: config.autoReconnect !== false,
    };
  }

  public connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const url = `ws://${this.config.host}:${this.config.port}/ws?token=${encodeURIComponent(this.config.token || '')}`;
      try {
        const WebSocketImpl = (globalThis as any).WebSocket;
        if (!WebSocketImpl) {
          throw new Error('WebSocket is not supported in this runtime.');
        }
        this.ws = new WebSocketImpl(url);
        this.ws.onopen = () => {
          this.emit('connect', { connected: true });
          resolve();
        };
        this.ws.onmessage = (event: any) => {
          try {
            const msg = JSON.parse(event.data);
            if (msg.event) {
              this.emit(msg.event, msg.payload);
            }
          } catch (e) {}
        };
        this.ws.onerror = (err: any) => {
          this.emit('error', err);
          reject(err);
        };
        this.ws.onclose = () => {
          this.emit('disconnect', {});
        };
      } catch (err) {
        reject(err);
      }
    });
  }

  public on(event: 'button', cb: EventCallback<ButtonEvent>): void;
  public on(event: 'dial', cb: EventCallback<DialEvent>): void;
  public on(event: 'connect' | 'disconnect', cb: EventCallback<any>): void;
  public on(event: string, cb: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(cb);
  }

  public setButton(update: LCDUpdate): void {
    this.send('lcd_update', update);
  }

  public triggerHaptic(durationMs: number = 18): void {
    this.send('haptic', { durationMs });
  }

  private send(event: string, payload: any): void {
    if (this.ws && this.ws.readyState === 1) {
      this.ws.send(JSON.stringify({ event, payload }));
    }
  }

  private emit(event: string, data: any): void {
    const handlers = this.listeners.get(event) || [];
    for (const h of handlers) {
      try {
        h(data);
      } catch (e) {}
    }
  }
}
