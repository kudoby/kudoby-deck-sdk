/**
 * Example 1: OBS Audio Volume & Rotary Dial Controller
 * Demonstrates rotary dial delta handling, volume clamping, and LCD tally feedback.
 */
import { KudobyDeckClient, DialEvent, ButtonEvent } from '../src/index';

const client = new KudobyDeckClient({
  host: '127.0.0.1',
  port: 9173,
});

let masterVolume = 75; // percentage (0 - 100)
let isMuted = false;

async function startVolumePlugin() {
  console.log('[OBS Plugin] Connecting to Kudoby Deck Studio...');
  await client.connect();
  console.log('[OBS Plugin] Connected successfully!');

  // Initialize Master Audio Button UI
  client.setButton({
    buttonId: 'btn_audio_master',
    label: `VOL: ${masterVolume}%`,
    bgColor: '#10b981',
    tally: 'live',
  });

  // Listen to rotary dial rotations
  client.on('dial', (event: DialEvent) => {
    if (event.dialId === 'dial_master') {
      masterVolume = Math.min(100, Math.max(0, masterVolume + event.delta * 2));
      console.log(`[Dial] Rotated. New Volume: ${masterVolume}%`);

      // Give tactile haptic click to user's phone/tablet
      client.triggerHaptic(12);

      // Update button LCD in real time (<1ms)
      client.setButton({
        buttonId: 'btn_audio_master',
        label: isMuted ? 'MUTED' : `VOL: ${masterVolume}%`,
        bgColor: isMuted ? '#ef4444' : masterVolume > 85 ? '#f59e0b' : '#10b981',
        tally: isMuted ? 'off' : 'live',
      });
    }
  });

  // Tap button to mute/unmute
  client.on('button', (event: ButtonEvent) => {
    if (event.buttonId === 'btn_audio_master' && event.state === 'down') {
      isMuted = !isMuted;
      client.triggerHaptic(25);
      console.log(`[Audio] Mute toggled: ${isMuted}`);

      client.setButton({
        buttonId: 'btn_audio_master',
        label: isMuted ? 'MUTED' : `VOL: ${masterVolume}%`,
        bgColor: isMuted ? '#ef4444' : '#10b981',
        tally: isMuted ? 'off' : 'live',
      });
    }
  });
}

startVolumePlugin().catch(console.error);
