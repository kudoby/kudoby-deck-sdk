# Kudoby Deck Developer SDK

[![CI Build](https://github.com/kudoby/kudoby-deck-sdk/actions/workflows/ci.yml/badge.svg)](https://github.com/kudoby/kudoby-deck-sdk/actions)
[![npm version](https://img.shields.io/badge/npm-v2.4.0-blue.svg)](https://www.npmjs.com/package/@kudoby/deck-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-3178C6.svg)](https://www.typescriptlang.org/)
[![Documentation](https://img.shields.io/badge/Docs-kudobydeck.com%2Fsdk-8930fd.svg)](https://kudobydeck.com/sdk/)

Official TypeScript & JavaScript SDK for building custom plugins, virtual rotary dials, broadcast automation, and hardware integrations for **Kudoby Deck**.

Developed and maintained by **Kudoby Technologies Pvt. Ltd.**

---

## ⚡ Architecture Overview

The Kudoby Deck SDK communicates directly with the Kudoby Desktop host engine over ultra-low-latency WebSocket (`ws://127.0.0.1:9173`).

```
┌─────────────────────────────────┐        WebSocket (<1ms)        ┌───────────────────────────────────┐
│       Developer Plugin          │ ◄────────────────────────────► │        Kudoby Deck Host           │
│  (OBS, DaVinci, IoT, Discord)   │   Taps, Dials, State, Haptics  │    (Windows / macOS / Linux)      │
└─────────────────────────────────┘                                └─────────────────┬─────────────────┘
                                                                                     │ WebRTC (<10ms)
                                                                   ┌─────────────────▼─────────────────┐
                                                                   │    Virtual Deck Controller        │
                                                                   │ (Android Phone, Tablet, Browser)  │
                                                                   └───────────────────────────────────┘
```

---

## 📦 Installation

```bash
npm install @kudoby/deck-sdk
```

Or using yarn / pnpm:

```bash
yarn add @kudoby/deck-sdk
pnpm add @kudoby/deck-sdk
```

---

## 🚀 Quickstart

```typescript
import { KudobyDeckClient } from '@kudoby/deck-sdk';

const client = new KudobyDeckClient({
  host: '127.0.0.1',
  port: 9173,
});

async function main() {
  await client.connect();
  console.log('Connected to Kudoby Deck Studio!');

  // 1. Listen to key taps & presses
  client.on('button', (evt) => {
    console.log(`Button ${evt.buttonId} action: ${evt.state}`);

    if (evt.state === 'down') {
      // Dynamic LCD display update (<1ms)
      client.setButton({
        buttonId: evt.buttonId,
        label: 'ACTIVE',
        bgColor: '#8930fd',
        tally: 'live', // 'off' | 'preview' | 'live'
      });

      // Send tactile haptic feedback to phone/tablet
      client.triggerHaptic(20);
    }
  });

  // 2. Listen to virtual rotary dials
  client.on('dial', (evt) => {
    console.log(`Dial ${evt.dialId} turned. Delta: ${evt.delta}, Value: ${evt.value}`);
  });
}

main().catch(console.error);
```

---

## 💡 What You Can Build

1. **OBS Studio & Video Editing Controllers:**
   - Map rotary dials to timeline scrubbing, color grading, and microphone gain.
   - Live tally indicators on buttons (`live`, `preview`, `off`).
2. **Esports & Gaming Telemetry HUDs:**
   - Real-time in-game health, ammo, and cooldown status rendered dynamically on LCD keys.
3. **Smart Studio IoT Automation:**
   - Control Philips Hue, Nanoleaf, and Elgato Key Lights via virtual dials.
   - Home Assistant macro sequences triggered with a single key tap.
4. **Developer & DevOps Live Dashboards:**
   - CI/CD build indicators (GitHub Actions, GitLab, Jenkins) with live red/green tally states.
   - Real-time Bitcoin, Ethereum, and stock market price tickers.

---

## 📂 Ready-to-Run Examples

Explore the [`examples/`](./examples/) directory for complete, copy-pasteable implementations:

- [**`examples/obs-volume-dial.ts`**](./examples/obs-volume-dial.ts): Audio volume knob with tactile haptics and mute state toggle.
- [**`examples/crypto-live-ticker.ts`**](./examples/crypto-live-ticker.ts): Real-time crypto price monitor with auto-refresh and dynamic green/red background switching.
- [**`examples/discord-tally-controller.ts`**](./examples/discord-tally-controller.ts): Discord voice mute/deafen status with real-time tally states.
- [**`examples/twitch-channel-points-alert.ts`**](./examples/twitch-channel-points-alert.ts): Live streamer alert trigger with LCD animations and haptic pulses.

---

## 🖥️ Local Browser Simulator

Test plugins and hardware interactions directly in your browser without needing a physical phone or tablet:

```bash
# Start the local browser simulator on port 9173
npm run simulate
```
Open **`http://localhost:9173`** to test 15 interactive LCD keys, rotate 4 rotary knobs with your scroll wheel, and inspect live WebSocket event dispatches.

---

## 🧩 Plugin Manifest Template

Third-party plugins packaged for the **Kudoby Deck Marketplace** use a standardized manifest:

- Explore the complete boilerplate in [**`templates/sample-plugin/`**](./templates/sample-plugin/)
- View the [**`manifest.json`**](./templates/sample-plugin/manifest.json) specification for registering custom actions, icons, and rotary dials.

---

## 📖 API Reference

### `new KudobyDeckClient(config?: DeckConfig)`
Initializes the client.
- `host?: string` (Default: `'127.0.0.1'`)
- `port?: number` (Default: `9173`)
- `token?: string` (Optional authentication token)

### `client.connect(): Promise<void>`
Establishes the WebSocket connection with the Kudoby Deck host.

### `client.on(event, callback)`
Listens to incoming events from the deck:
- `'button'`: Emits `{ buttonId, state: 'down' | 'up' | 'tap', timestamp }`
- `'dial'`: Emits `{ dialId, delta, value, timestamp }`
- `'connect'` / `'disconnect'` / `'error'`

### `client.setButton(update: LCDUpdate): void`
Pushes real-time visual updates to a virtual button:
- `buttonId`: Identifier string of the target key
- `label?`: Display title or dynamic text
- `bgColor?`: Hex color string (e.g. `'#10b981'`)
- `tally?`: Broadcast tally border (`'off' | 'preview' | 'live'`)

### `client.triggerHaptic(durationMs?: number): void`
Triggers device-level vibration on the connected mobile / tablet screen (Default: `18ms`).

---

## 🌐 Community & Ecosystem

- **Developer Documentation:** [https://kudobydeck.com/sdk/](https://kudobydeck.com/sdk/)
- **Plugin Marketplace:** [https://kudobydeck.com/ecosystem/](https://kudobydeck.com/ecosystem/)
- **Support & Inquiries:** [support@kudobydeck.com](mailto:support@kudobydeck.com)

---

## 📄 License

MIT License. Copyright (c) 2026 Kudoby Technologies Pvt. Ltd.
