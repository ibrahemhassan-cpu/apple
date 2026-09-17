/* tiny synthesised taps for the shell (the games bring their own sound, on the same shared context) */
import { audioContext } from './audio.js';

function tone(freq, dur, { type = 'triangle', vol = .1, to = null, delay = 0 } = {}) {
  const ctx = audioContext();
  if (!ctx) return;
  if (ctx.state !== 'running') ctx.resume().catch(() => {});
  const t = ctx.currentTime + delay, o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
  g.gain.setValueAtTime(.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + .01);
  g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  o.connect(g).connect(ctx.destination);
  o.start(t);
  o.stop(t + dur + .05);
}

export const sfx = {
  pop: on => on && tone(520 + Math.random() * 180, .14, { to: 1100 }),
  soft: on => on && tone(300, .12, { type: 'sine', vol: .08, to: 200 }),
  open: on => on && [523, 659, 784].forEach((f, i) => tone(f, .35, { type: 'sine', vol: .07, delay: i * .07 })),
};
