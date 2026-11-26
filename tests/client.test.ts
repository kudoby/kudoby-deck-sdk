import { KudobyDeckClient } from '../src/index';

describe('KudobyDeckClient', () => {
  it('should initialize with default config', () => {
    const client = new KudobyDeckClient();
    expect(client).toBeDefined();
  });

  it('should accept custom host, port, and expose v2.6 methods', () => {
    const client = new KudobyDeckClient({
      host: '192.168.1.100',
      port: 9173,
      autoReconnect: false,
    });
    expect(client).toBeDefined();
    expect(typeof client.switchPage).toBe('function');
    expect(typeof client.setKeyLayout).toBe('function');
    expect(typeof client.triggerAction).toBe('function');
    expect(typeof client.setAppVolume).toBe('function');
    expect(typeof client.toggleAppMute).toBe('function');
    expect(typeof client.disconnect).toBe('function');
  });
});
