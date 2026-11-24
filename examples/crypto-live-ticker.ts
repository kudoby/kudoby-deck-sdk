/**
 * Example 2: Live Price Ticker & Stock Monitor Plugin
 * Demonstrates periodic LCD updates, dynamic color shifts (green/red), and tap refresh.
 */
import { KudobyDeckClient, ButtonEvent } from '../src/index';

const client = new KudobyDeckClient({
  host: '127.0.0.1',
  port: 9173,
});

let btcPrice = 96450;

async function startTicker() {
  await client.connect();
  console.log('[Crypto Ticker] Connected to Kudoby Deck!');

  function updateTicker() {
    // Simulate real-time price fluctuation
    const delta = (Math.random() - 0.48) * 120;
    btcPrice = Math.round(btcPrice + delta);
    const isUp = delta >= 0;

    // Render price directly to virtual deck button
    client.setButton({
      buttonId: 'btn_btc_ticker',
      label: `BTC $${btcPrice.toLocaleString()}`,
      bgColor: isUp ? '#064e3b' : '#7f1d1d', // Emerald dark / Crimson dark
      tally: isUp ? 'live' : 'preview',
    });
  }

  // Update every 3 seconds
  setInterval(updateTicker, 3000);
  updateTicker();

  // Tap button to force immediate reload
  client.on('button', (evt: ButtonEvent) => {
    if (evt.buttonId === 'btn_btc_ticker' && evt.state === 'down') {
      client.triggerHaptic(15);
      console.log('[Ticker] Force refreshed by user tap!');
      updateTicker();
    }
  });
}

startTicker().catch(console.error);
