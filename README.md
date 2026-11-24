# Kudoby Deck Developer SDK

Official TypeScript & JavaScript SDK for building custom plugins, virtual dials, and broadcast automation integrations for **Kudoby Deck**.

Developed and maintained by **Kudoby Technologies Pvt. Ltd.**

---

## Installation

```bash
npm install @kudoby/deck-sdk
```

Or using yarn / pnpm:

```bash
yarn add @kudoby/deck-sdk
pnpm add @kudoby/deck-sdk
```

---

## Quickstart

```typescript
import { KudobyDeckClient } from '@kudoby/deck-sdk';

const client = new KudobyDeckClient({
  host: '127.0.0.1',
  port: 9173,
});

async function main() {
  await client.connect();
  console.log('Connected to Kudoby Deck Desktop Studio!');

  // Listen to virtual key taps
  client.on('button', (evt) => {
    console.log(`Button ${evt.buttonId} action: ${evt.state}`);

    // Update button display on press
    if (evt.state === 'down') {
      client.setButton({
        buttonId: evt.buttonId,
        label: 'ACTIVE',
        bgColor: '#8930fd',
        tally: 'live',
      });
      client.triggerHaptic(20);
    }
  });

  // Listen to virtual rotary dials
  client.on('dial', (evt) => {
    console.log(`Dial ${evt.dialId} turned: value = ${evt.value}`);
  });
}

main().catch(console.error);
```

---

## License

MIT License. Copyright (c) 2026 Kudoby Technologies Pvt. Ltd.
