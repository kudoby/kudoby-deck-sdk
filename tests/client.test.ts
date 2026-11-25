import { KudobyDeckClient } from '../src/index';

describe('KudobyDeckClient', () => {
  it('should initialize with default config', () => {
    const client = new KudobyDeckClient();
    expect(client).toBeDefined();
  });

  it('should accept custom host and port', () => {
    const client = new KudobyDeckClient({
      host: '192.168.1.100',
      port: 8080,
    });
    expect(client).toBeDefined();
  });
});
