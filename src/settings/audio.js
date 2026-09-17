/* One AudioContext for the whole app (the orchard's taps and every game share it).

   iPhone is strict about web sound, and each of these is needed there:
   - sound can only be switched on inside a real tap (touchend / click), so every tap re-checks and resumes,
     and plays one silent sample, which is what finally wakes Safari up;
   - Web Audio follows the ring/silent switch unless the page asks for "playback" audio. Newer iOS lets us ask
     (navigator.audioSession); older iOS needs a silent <audio> element playing alongside;
   - after the app has been in the background the context comes back 'interrupted' and must be resumed again.
   Creating the context outside a tap is fine: it just waits, suspended, until the next one. */
let ctx = null;
let silentEl = null;

const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

export function audioContext() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  return ctx;
}

function askForPlayback() {
  try {
    if (navigator.audioSession) navigator.audioSession.type = 'playback';
  } catch (e) { /* not allowed here */ }
}

/* half a second of silence as a WAV, for iPhones without navigator.audioSession */
function silentWav() {
  const rate = 8000, n = rate / 2, bytes = new Uint8Array(44 + n);
  const view = new DataView(bytes.buffer);
  const text = (o, s) => [...s].forEach((ch, i) => view.setUint8(o + i, ch.charCodeAt(0)));
  text(0, 'RIFF'); view.setUint32(4, 36 + n, true); text(8, 'WAVE'); text(12, 'fmt ');
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, rate, true); view.setUint32(28, rate, true); view.setUint16(32, 1, true); view.setUint16(34, 8, true);
  text(36, 'data'); view.setUint32(40, n, true);
  bytes.fill(128, 44);
  let bin = '';
  bytes.forEach(b => (bin += String.fromCharCode(b)));
  return `data:audio/wav;base64,${btoa(bin)}`;
}

function unlock() {
  const c = audioContext();
  if (!c) return;
  askForPlayback();
  if (c.state === 'running') return;
  c.resume().catch(() => {});
  const src = c.createBufferSource();
  src.buffer = c.createBuffer(1, 1, 22050);
  src.connect(c.destination);
  src.start(0);
  if (isIOS && !navigator.audioSession) {
    if (!silentEl) {
      silentEl = new Audio(silentWav());
      silentEl.loop = true;
      silentEl.setAttribute('playsinline', '');
    }
    silentEl.play().catch(() => {});
  }
}

askForPlayback();
['touchend', 'click', 'pointerup', 'keydown'].forEach(type =>
  document.addEventListener(type, unlock, { capture: true, passive: true }));
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { silentEl?.pause(); return; }
  if (ctx && ctx.state !== 'running') ctx.resume().catch(() => {});   // works on Android; iPhone waits for the next tap
});
