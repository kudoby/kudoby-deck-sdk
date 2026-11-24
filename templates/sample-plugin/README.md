# Kudoby Deck Sample Plugin

This template provides the standard boilerplate for creating third-party plugins for **Kudoby Deck**.

---

## Structure

```
├── manifest.json       # Plugin metadata and action definitions
├── package.json        # Dependencies
├── tsconfig.json       # TypeScript configuration
├── src/
│   └── index.ts        # Plugin runtime code
└── README.md
```

---

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Compile TypeScript:
   ```bash
   npm run build
   ```

3. Run plugin locally:
   ```bash
   node dist/index.js
   ```

---

## Manifest Specification

The `manifest.json` file registers your plugin with Kudoby Deck:
- `id`: Unique identifier (reverse domain notation, e.g. `com.example.myplugin`)
- `name`: Display name in the plugin library
- `version`: Semantic version (e.g. `1.0.0`)
- `entryPoint`: Relative path to compiled script
- `actions`: Array of buttons and rotary dial controls provided by your plugin
