import { KudobyDeckClient, ButtonEvent, DialEvent, TelemetryEvent } from '@kudobydeck/deck-sdk';

/**
 * Kudoby Deck Sample Plugin
 * Implements toggle-mic action and master-volume-dial defined in manifest.json
 */
const client = new KudobyDeckClient({
  host: '127.0.0.1',
  port: 9173,
});

let isMuted = false;
let currentVolume = 80;

async function run() {
  console.log('[Sample Plugin] Initializing connection to Kudoby Deck...');
  await client.connect();
  console.log('[Sample Plugin] Connected successfully.');

  // Initialize UI
  client.setButton({
    buttonId: 'btn_sample_mic',
    label: 'MIC LIVE',
    bgColor: '#10b981',
    tally: 'live',
  });

  // Handle action button events
  client.on('button', (evt: ButtonEvent) => {
    if (evt.buttonId === 'btn_sample_mic' && evt.state === 'down') {
      isMuted = !isMuted;
      client.triggerHaptic(20);
      client.setButton({
        buttonId: 'btn_sample_mic',
        label: isMuted ? 'MIC MUTED' : 'MIC LIVE',
        bgColor: isMuted ? '#ef4444' : '#10b981',
        tally: isMuted ? 'off' : 'live',
      });
      console.log(`[Sample Plugin] Microphone toggled: ${isMuted ? 'MUTED' : 'LIVE'}`);
    }
  });

  // Handle rotary dial events
  client.on('dial', (evt: DialEvent) => {
    if (evt.dialId === 'dial_volume') {
      currentVolume = Math.min(100, Math.max(0, currentVolume + evt.delta * 2));
      client.triggerHaptic(12);
      console.log(`[Sample Plugin] Volume adjusted: ${currentVolume}%`);
    }
  });
}

run().catch(console.error);
