export function playNotificationSound(preset: 'chime' | 'alert' | 'success' | 'bubble' = 'chime') {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const dest = ctx.destination;
    const now = ctx.currentTime;

    const playTone = (freq: number, start: number, dur: number, type: OscillatorType = 'sine') => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, start);

      gainNode.gain.setValueAtTime(0.15, start); // Safe balanced volume
      gainNode.gain.exponentialRampToValueAtTime(0.0001, start + dur);

      osc.connect(gainNode);
      gainNode.connect(dest);

      osc.start(start);
      osc.stop(start + dur);
    };

    if (preset === 'chime') {
      playTone(587.33, now, 0.4); // D5
      playTone(880.00, now + 0.08, 0.3); // A5
      playTone(1174.66, now + 0.16, 0.5); // D6
    } else if (preset === 'alert') {
      playTone(440.00, now, 0.15, 'square');
      playTone(440.00, now + 0.2, 0.15, 'square');
    } else if (preset === 'success') {
      playTone(523.25, now, 0.12); // C5
      playTone(659.25, now + 0.08, 0.12); // E5
      playTone(783.99, now + 0.16, 0.25); // G5
    } else if (preset === 'bubble') {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.15);
      
      gainNode.gain.setValueAtTime(0.15, now);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
      
      osc.connect(gainNode);
      gainNode.connect(dest);
      osc.start(now);
      osc.stop(now + 0.15);
    }
  } catch (err) {
    console.warn('AudioContext playback failed:', err);
  }
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof Notification === 'undefined') {
    return 'default';
  }
  
  if (Notification.permission === 'default') {
    try {
      const perm = await Notification.requestPermission();
      return perm;
    } catch (err) {
      console.warn('Error requesting notification permission:', err);
    }
  }
  
  return Notification.permission;
}

export async function sendDesktopNotification(title: string, body: string, iconUrl?: string) {
  // 1. Play premium synthesized sound chime
  playNotificationSound('chime');

  // 2. Dispatch Desktop Notification
  if (typeof Notification === 'undefined') {
    console.log('Standard desktop notifications not supported:', { title, body });
    return;
  }

  if (Notification.permission === 'granted') {
    try {
      const icon = iconUrl || 'https://storage.googleapis.com/aistudio-v2-dev-usercontent/68a582f2-700c-4bde-bbe4-5b81aba52e10/images/p7w93d7c/shaw_stem_academy_logo.png';
      
      // If service worker is active and has showNotification, use it (recommended for full mobile and desktop support)
      if ('serviceWorker' in navigator) {
        try {
          const reg = await navigator.serviceWorker.ready;
          if (reg && 'showNotification' in reg) {
            await reg.showNotification(title, {
              body,
              icon,
              badge: icon,
              tag: 'shaw-stem-notification',
              renotify: true,
            } as any);
            return;
          }
        } catch (swErr) {
          console.debug('Service Worker not ready or does not support showNotification, falling back.', swErr);
        }
      }

      // Standard standard browser fallback
      const n = new Notification(title, {
        body,
        icon,
        tag: 'shaw-stem-notification',
      });
      n.onclick = () => {
        window.focus();
        n.close();
      };
    } catch (err) {
      console.warn('Failed to dispatch standard HTML5 notification, trying fallback:', err);
    }
  }
}
