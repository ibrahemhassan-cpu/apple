/* How hard the 3D may push this device. Chosen from what the device says about itself when a game opens,
   then stepped down on the fly if frames start to drag (see the frame watch in engine.js).
   ?quality=low|mid|high in the address forces one, and turns the automatic step-down off.

   dpr        sharpness of the tree canvas (screen pixels per CSS pixel)
   fruitDpr   the same for the fruit canvas (few pixels, so it can stay sharper)
   fxDpr      the 2D sky and particle canvases
   shadows    shadow map size, 0 = no shadows
   leaves     share of the leaves drawn (they're shuffled, so fewer means sparser everywhere, not a bald patch)
   coverage   smooth leaf edges (alpha-to-coverage)
   calmFps    how often the leaves' breeze and the fruit's sway are redrawn when nothing else is moving */
export const QUALITY = {
  high: { name: 'high', dpr: 1.75, fruitDpr: 2, fxDpr: 2, shadows: 2048, leaves: 1, coverage: true, calmFps: 60 },
  mid: { name: 'mid', dpr: 1.2, fruitDpr: 1.5, fxDpr: 1.25, shadows: 1024, leaves: .75, coverage: true, calmFps: 30 },
  low: { name: 'low', dpr: 1, fruitDpr: 1.25, fxDpr: 1, shadows: 0, leaves: .55, coverage: false, calmFps: 20 },
};
const ORDER = ['high', 'mid', 'low'];

export function pickQuality() {
  const forced = new URLSearchParams(location.search).get('quality');
  if (QUALITY[forced]) return { ...QUALITY[forced], forced: true };
  const touch = matchMedia('(pointer: coarse)').matches;
  if (!touch) return { ...QUALITY.high };
  // phones and tablets start at mid; small-memory or few-core ones at low
  const memory = navigator.deviceMemory ?? 8, cores = navigator.hardwareConcurrency ?? 8;
  return { ...QUALITY[memory <= 4 || cores <= 4 ? 'low' : 'mid'] };
}

/* the next level down, or null at the bottom */
export function lowerQuality(q) {
  const next = ORDER[ORDER.indexOf(q.name) + 1];
  return next ? { ...QUALITY[next] } : null;
}
