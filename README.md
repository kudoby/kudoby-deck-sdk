# Kudoby Deck Developer SDK

[![CI Build](https://github.com/kudoby/kudoby-deck-sdk/actions/workflows/ci.yml/badge.svg)](https://github.com/kudoby/kudoby-deck-sdk/actions)
[![npm version](https://img.shields.io/npm/v/kudoby-deck-sdk.svg?color=blue)](https://www.npmjs.com/package/kudoby-deck-sdk)
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
npm install kudoby-deck-sdk
```

Or using yarn / pnpm:

```bash
yarn add kudoby-deck-sdk
pnpm add kudoby-deck-sdk
```

---

## 🛠️ Developer CLI Tools

The SDK comes with built-in command-line tools to bootstrap and test plugins instantly:

```bash
# 1. Scaffold a brand-new plugin with full TypeScript & manifest setup
npx kudoby-deck-sdk create my-obs-plugin

# 2. Validate your manifest.json schema before publishing
npx kudoby-deck-sdk validate

# 3. Launch the in-browser 15-key & rotary dial hardware simulator
npx kudoby-deck-sdk simulate
```

---

## 🚀 Quickstart

```typescript
import { KudobyDeckClient } from 'kudoby-deck-sdk';

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
        title: 'RECORDING',
        backgroundColor: '#ef4444',
        feedback: 'haptic-tick',
      });
    }
  });

  // 2. Control rotary dials (volume, zooms, scrubbing)
  client.on('dial', (evt) => {
    console.log(`Dial ${evt.dialId} turned ${evt.delta > 0 ? 'Clockwise' : 'Counter-Clockwise'}`);
  });
}

main().catch(console.error);
```

---

## 🎨 Interactive Hardware Simulator

Don't have a mobile device handy? Test your plugin live in your browser using the included zero-latency hardware simulator:

```bash
npm run simulate
```

Open `http://localhost:9173` to see a virtual 15-key LCD deck and interactive rotary dials that communicate with your plugin in real-time.

---

## 🧩 Plugin Structure

Plugins are modular bundles distributed as `.kudobyplugin` archives or standard npm packages:

```
my-plugin/
├── manifest.json       # Metadata, permissions, custom dial/button definitions
├── package.json        # Dependencies
├── tsconfig.json       # TypeScript configuration
└── src/
    └── index.ts        # Plugin logic interacting with KudobyDeckClient
```

### Sample `manifest.json`

```json
{
  "$schema": "https://kudobydeck.com/schemas/plugin.v1.json",
  "id": "com.example.obs-controller",
  "name": "OBS Studio Smart Dial",
  "version": "1.0.0",
  "author": "Creator",
  "description": "Control OBS scene volume, transition effects, and record tally lights.",
  "category": "Broadcasting",
  "entry": "dist/index.js",
  "permissions": ["local-network", "storage"],
  "actions": [
    {
      "uuid": "toggle-stream",
      "name": "Stream Toggle",
      "states": [
        { "title": "LIVE", "backgroundColor": "#ef4444" },
        { "title": "STANDBY", "backgroundColor": "#1e293b" }
      ]
    }
  ],
  "dials": [
    {
      "uuid": "master-volume",
      "name": "Master Audio Dial",
      "feedback": "haptic-continuous"
    }
  ]
}
```

---

## 🌟 Real-World Examples

Check out the [`examples/`](examples/) directory for production-ready implementations:
- [**OBS Studio Volume Dial**](examples/obs-volume-dial.ts) - Fine-grained mixer audio with rotary dials and LCD volume meters.
- [**Discord Tally Light & Mute Controller**](examples/discord-tally-controller.ts) - Dynamic microphone mute state and voice channel activity indicators.
- [**Twitch Channel Points Alert**](examples/twitch-channel-points-alert.ts) - Real-time stream interaction flashes with animated deck backgrounds.
- [**Crypto / Stock Live Ticker**](examples/crypto-live-ticker.ts) - Real-time asset price ticks rendered across keys.

---

## 🔒 Security & Sandboxing

Kudoby plugins adhere to our strict Zero-Trust local execution policy:
- Local-only execution (`127.0.0.1`) with zero telemetry tracking.
- Cryptographically signed manifests for production distribution.
- For complete security specifications, visit our [Security Architecture](https://kudobydeck.com/security/).

---

## 🤝 Contributing

We welcome contributions! Please review [CONTRIBUTING.md](CONTRIBUTING.md) and our [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

For vulnerability reports, please see our [Security Policy](SECURITY.md).

---

## 📄 License

Distributed under the MIT License. See [LICENSE](LICENSE) for details.

© Kudoby Technologies Pvt. Ltd. All rights reserved.
