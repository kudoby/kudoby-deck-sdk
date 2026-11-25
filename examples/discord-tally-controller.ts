/**
 * Example 3: Discord Voice Status & Tally Indicator
 * Demonstrates mute/deafen states and dynamic color switching.
 */
import { KudobyDeckClient, ButtonEvent } from '../src/index';

const client = new KudobyDeckClient({
  host: '127.0.0.1',
  port: 9173,
});

let isMuted = false;
let isDeafened = false;

async function startDiscordPlugin() {
  await client.connect();
  console.log('[Discord Plugin] Connected to Kudoby Deck!');

  // Setup initial key displays
  updateKeys();

  client.on('button', (evt: ButtonEvent) => {
    if (evt.state !== 'down') return;

    if (evt.buttonId === 'btn_discord_mute') {
      isMuted = !isMuted;
      client.triggerHaptic(18);
      console.log(`[Discord] Mute toggled: ${isMuted}`);
      updateKeys();
    } else if (evt.buttonId === 'btn_discord_deafen') {
      isDeafened = !isDeafened;
      if (isDeafened) isMuted = true;
      client.triggerHaptic(25);
      console.log(`[Discord] Deafen toggled: ${isDeafened}`);
      updateKeys();
    }
  });
}

function updateKeys() {
  client.setButton({
    buttonId: 'btn_discord_mute',
    label: isMuted ? 'MIC MUTED' : 'MIC OPEN',
    bgColor: isMuted ? '#ef4444' : '#10b981',
    tally: isMuted ? 'off' : 'live',
  });

  client.setButton({
    buttonId: 'btn_discord_deafen',
    label: isDeafened ? 'DEAFENED' : 'AUDIO ON',
    bgColor: isDeafened ? '#7f1d1d' : '#3b82f6',
    tally: isDeafened ? 'off' : 'preview',
  });
}

startDiscordPlugin().catch(console.error);
