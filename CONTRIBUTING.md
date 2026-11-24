# Contributing to Kudoby Deck Developer SDK

Thank you for your interest in contributing to **Kudoby Deck**! We welcome contributions from developers, streamers, and automation enthusiasts.

---

## Code of Conduct

By participating in this project, you agree to abide by our respectful, inclusive, and professional community standards.

---

## Development Setup

1. **Fork & Clone:**
   ```bash
   git clone https://github.com/kudoby/kudoby-deck-sdk.git
   cd kudoby-deck-sdk
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Compile TypeScript:**
   ```bash
   npm run build
   ```

4. **Run Local Simulator:**
   ```bash
   npm run simulate
   ```
   Open `http://localhost:9173` in your browser to test key presses and dial adjustments.

---

## Pull Request Guidelines

1. Create a feature branch: `git checkout -b feature/my-new-feature`
2. Ensure TypeScript compiles without errors: `npm run build`
3. Commit with clear, descriptive messages:
   - `feat: add support for dynamic canvas image streams`
   - `fix: resolve reconnection delay on WebSocket drop`
4. Push your branch and open a Pull Request against `main`.

---

## Building Custom Plugins

To build plugins that integrate with Kudoby Deck:
- See the [Sample Plugin Template](./templates/sample-plugin/)
- Review the `manifest.json` specification
- Test actions locally using the simulator before submitting

For questions and support, reach out to **support@kudobydeck.com**.
