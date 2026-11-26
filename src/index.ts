export interface DeckConfig {
  host?: string;
  port?: number;
  token?: string;
  pluginId?: string;
  autoReconnect?: boolean;
  reconnectIntervalMs?: number;
}

export interface ButtonEvent {
  buttonId: string;
  pluginId?: string;
  actionUuid?: string;
  settings?: Record<string, any>;
  slotIndex?: number;
  pageIndex?: number;
  state: 'down' | 'up' | 'tap';
  timestamp: number;
}

export interface DialEvent {
  dialId: string;
  target?: string;
  delta: number;
  value: number;
  timestamp: number;
}

export interface SettingsEvent {
  buttonId: string;
  pluginId?: string;
  actionUuid?: string;
  slotIndex?: number;
  pageIndex?: number;
  settings: Record<string, any>;
  timestamp: number;
}

export interface TelemetryEvent {
  cpu: number;
  ram: number;
  gpu?: number;
  netDown?: number;
  netUp?: number;
  [key: string]: any;
}

export interface LCDUpdate {
  buttonId?: string;
  slotIndex?: number;
  pageIndex?: number;
  label?: string;
  title?: string;
  iconSvg?: string;
  bgColor?: string;
  backgroundColor?: string;
  tally?: 'off' | 'preview' | 'live';
  feedback?: 'haptic-tick' | 'none';
}

export interface TriggerActionPayload {
  actionType: string;
  target?: string;
  slotIndex?: number;
  pageIndex?: number;
}

export type EventCallback<T> = (data: T) => void;

function readEnv(name: string): string {
  try {
    const proc = (globalThis as any).process;
    if (proc && proc.env && typeof proc.env[name] === 'string') {
      return proc.env[name];
    }
  } catch (_) {}
  return '';
}

export class KudobyDeckClient {
  private config: Required<DeckConfig>;
  private ws: any = null;
  private listeners: Map<string, Function[]> = new Map();
  private reconnectTimer: any = null;
  private manualDisconnect = false;

  constructor(config: DeckConfig = {}) {
    const envPort = parseInt(readEnv('KUDOBY_SDK_PORT'), 10);
    const envToken = readEnv('KUDOBY_SDK_TOKEN');
    const envPluginId = readEnv('KUDOBY_PLUGIN_ID');

    this.config = {
      host: config.host || readEnv('KUDOBY_SDK_HOST') || '127.0.0.1',
      port: config.port || (Number.isFinite(envPort) && envPort > 0 ? envPort : 9173),
      token: config.token ?? envToken,
      pluginId: config.pluginId ?? envPluginId,
      autoReconnect: config.autoReconnect !== false,
      reconnectIntervalMs: config.reconnectIntervalMs || 2500,
    };
  }

  public connect(): Promise<void> {
    this.manualDisconnect = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    return new Promise((resolve, reject) => {
      const qs = new URLSearchParams();
      if (this.config.token) qs.set('token', this.config.token);
      if (this.config.pluginId) qs.set('pluginId', this.config.pluginId);
      const query = qs.toString();
      const url = `ws://${this.config.host}:${this.config.port}/ws${query ? `?${query}` : ''}`;
      let settled = false;

      try {
        const WebSocketImpl = (globalThis as any).WebSocket;
        if (!WebSocketImpl) {
          throw new Error('WebSocket is not supported in this runtime (Node 22+ or browser WebSocket required).');
        }
        this.ws = new WebSocketImpl(url);

        this.ws.onopen = () => {
          if (!settled) {
            settled = true;
            resolve();
          }
          if (this.config.pluginId || this.config.token) {
            this.send('register_plugin', {
              pluginId: this.config.pluginId,
              token: this.config.token,
            });
          }
          this.emit('connect', {
            connected: true,
            host: this.config.host,
            port: this.config.port,
            pluginId: this.config.pluginId,
          });
        };

        this.ws.onmessage = (event: any) => {
          try {
            const msg = JSON.parse(event.data);
            if (msg.event) {
              if (msg.event === 'connect') return;
              this.emit(msg.event, msg.payload);
            } else if (msg.type === 'telemetry_update' && msg.telemetry) {
              this.emit('telemetry', msg.telemetry);
            }
          } catch (_) {}
        };

        this.ws.onerror = (err: any) => {
          this.emit('error', err);
          if (!settled) {
            settled = true;
            reject(err);
          }
        };

        this.ws.onclose = () => {
          this.emit('disconnect', {});
          if (this.config.autoReconnect && !this.manualDisconnect) {
            this.reconnectTimer = setTimeout(() => {
              this.connect().catch(() => {});
            }, this.config.reconnectIntervalMs);
          }
        };
      } catch (err) {
        if (!settled) {
          settled = true;
          reject(err);
        }
      }
    });
  }

  public disconnect(): void {
    this.manualDisconnect = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      try {
        this.ws.close();
      } catch (_) {}
      this.ws = null;
    }
  }

  public on(event: 'button', cb: EventCallback<ButtonEvent>): void;
  public on(event: 'dial', cb: EventCallback<DialEvent>): void;
  public on(event: 'settings', cb: EventCallback<SettingsEvent>): void;
  public on(event: 'telemetry', cb: EventCallback<TelemetryEvent>): void;
  public on(event: 'connect' | 'disconnect' | 'error', cb: EventCallback<any>): void;
  public on(event: string, cb: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(cb);
  }

  public off(event: string, cb: Function): void {
    const handlers = this.listeners.get(event);
    if (!handlers) return;
    this.listeners.set(event, handlers.filter((h) => h !== cb));
  }

  public setButton(update: LCDUpdate): void {
    const normalized: LCDUpdate = {
      ...update,
      label: update.label ?? update.title,
      bgColor: update.bgColor ?? update.backgroundColor,
    };
    this.send('lcd_update', normalized);
    if (update.feedback === 'haptic-tick') {
      this.triggerHaptic(18);
    }
  }

  public triggerHaptic(durationMs: number = 18): void {
    this.send('haptic', { durationMs });
  }

  public switchPage(pageIndex: number): void {
    this.send('switch_page', { pageIndex });
  }

  public setKeyLayout(titleAboveIcon: boolean): void {
    this.send('key_layout_mode', { titleAboveIcon });
  }

  public triggerAction(payload: TriggerActionPayload): void {
    this.send('trigger_action', payload);
  }

  public setAppVolume(target: string, volume: number): void {
    this.sendRaw({ type: 'set_app_volume', target, volume });
  }

  public toggleAppMute(target: string): void {
    this.sendRaw({ type: 'toggle_app_mute', target });
  }

  private send(event: string, payload: any): void {
    this.sendRaw({ event, payload });
  }

  private sendRaw(packet: any): void {
    if (this.ws && this.ws.readyState === 1) {
      this.ws.send(JSON.stringify(packet));
    }
  }

  private emit(event: string, data: any): void {
    const handlers = this.listeners.get(event) || [];
    for (const h of handlers) {
      try {
        h(data);
      } catch (_) {}
    }
  }
}
