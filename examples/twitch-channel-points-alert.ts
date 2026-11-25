/**
 * Example 4: Twitch Channel Points Alert Trigger
 * Demonstrates simulated automated LCD flashing and soundboard trigger.
 */
import { KudobyDeckClient } from '../src/index';

const client = new KudobyDeckClient({
  host: '127.0.0.1',
  port: 9173,
});

async function startTwitchAlertPlugin() {
  await client.connect();
  console.log('[Twitch Plugin] Connected to Kudoby Deck!');

  // Set default button appearance
  client.setButton({
    buttonId: 'btn_twitch_alert',
    label: 'REDEEM: HYDRATE',
    bgColor: '#9333ea',
    tally: 'preview',
  });

  // Function called when a Twitch channel point reward is redeemed
  function onRewardRedeemed(rewardName: string, userName: string) {
    console.log(`[Twitch Alert] ${userName} redeemed ${rewardName}!`);

    // Flash button red/yellow to catch streamer attention
    client.triggerHaptic(40);
    client.setButton({
      buttonId: 'btn_twitch_alert',
      label: `ALERT: ${userName}`,
      bgColor: '#dc2626',
      tally: 'live',
    });

    // Reset back after 5 seconds
    setTimeout(() => {
      client.setButton({
        buttonId: 'btn_twitch_alert',
        label: 'REDEEM: HYDRATE',
        bgColor: '#9333ea',
        tally: 'preview',
      });
    }, 5000);
  }

  // Simulate an event arriving after 4 seconds
  setTimeout(() => {
    onRewardRedeemed('Hydrate', 'StreamerPro99');
  }, 4000);
}

startTwitchAlertPlugin().catch(console.error);
