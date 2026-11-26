import { KudobyDeckClient, ButtonEvent, DialEvent, SettingsEvent } from '@kudobydeck/deck-sdk';

/**
 * Kudoby Deck Sample Plugin
 * Implements toggle-mic (with Property Inspector settings & SVG LCD) and master-volume-dial
 */
const client = new KudobyDeckClient({
  host: '127.0.0.1',
  port: 9173,
});

let isMuted = false;
let currentVolume = 80;
let liveLabel = 'MIC LIVE';
let targetChannel = 'mic';

const micSvg = (muted: boolean) =>
  muted
    ? `<svg viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2"><line x1="2" y1="2" x2="22" y2="22"/><path d="M12 2a3 3 0 0 0-3 3v4"/><path d="M15 9V5a3 3 0 0 0-3-3"/><path d="M19 10v2a7 7 0 0 1-11.5 5.4"/><line x1="12" y1="19" x2="12" y2="22"/></svg>`
    : `<svg viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2"><rect x="9" y="2" width="6" height="11" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>`;

async function run() {
  console.log('[Sample Plugin] Initializing connection to Kudoby Deck...');
  await client.connect();
  console.log('[Sample Plugin] Connected successfully.');

  // Initialize UI
  client.setButton({
    buttonId: 'btn_sample_mic',
    label: liveLabel,
    bgColor: '#10b981',
    iconSvg: micSvg(false),
    tally: 'live',
  });

  // Live Property Inspector updates from Desktop Studio
  client.on('settings', (evt: SettingsEvent) => {
    if (evt.settings?.liveLabel) liveLabel = String(evt.settings.liveLabel);
    if (evt.settings?.channelName) targetChannel = String(evt.settings.channelName);
    client.setButton({
      buttonId: evt.buttonId,
      label: isMuted ? 'MIC MUTED' : liveLabel,
      bgColor: isMuted ? '#ef4444' : '#10b981',
      iconSvg: micSvg(isMuted),
      tally: isMuted ? 'off' : 'live',
    });
  });

  // Handle action button events
  client.on('button', (evt: ButtonEvent) => {
    if (evt.state === 'down' && (evt.actionUuid === 'toggle-mic' || evt.buttonId === 'btn_sample_mic')) {
      isMuted = !isMuted;
      if (evt.settings?.liveLabel) liveLabel = String(evt.settings.liveLabel);
      if (evt.settings?.channelName) targetChannel = String(evt.settings.channelName);
      if (evt.settings?.hapticFeedback !== false) {
        client.triggerHaptic(20);
      }
      client.toggleAppMute(targetChannel);
      client.setButton({
        buttonId: evt.buttonId,
        slotIndex: evt.slotIndex,
        pageIndex: evt.pageIndex,
        label: isMuted ? 'MIC MUTED' : liveLabel,
        bgColor: isMuted ? '#ef4444' : '#10b981',
        iconSvg: micSvg(isMuted),
        tally: isMuted ? 'off' : 'live',
      });
      console.log(`[Sample Plugin] ${targetChannel} toggled: ${isMuted ? 'MUTED' : 'LIVE'}`);
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
