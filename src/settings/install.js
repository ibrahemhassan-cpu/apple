import { useEffect, useState } from 'react';

/* "Install the app".
   - Android Chrome / desktop Chrome and Edge offer it with beforeinstallprompt, sometimes a little after loading.
   - iPhone and iPad never offer it: there it's Share → Add to Home Screen, so we show those steps instead.
   - Android browsers that don't send the event: the browser menu → Install app, shown as steps too.
   Already running as an installed app → no button at all. */
let offer = null;
const listeners = new Set();
const tell = () => listeners.forEach(fn => fn());

window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  offer = e;
  tell();
});
window.addEventListener('appinstalled', () => {
  offer = null;
  installed = true;
  tell();
});

let installed = false;
const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isStandalone = () =>
  installed || navigator.standalone === true || matchMedia('(display-mode: standalone), (display-mode: fullscreen)').matches;
const isTouch = () => matchMedia('(pointer: coarse)').matches;

/* 'prompt' the browser can install it · 'ios' show the Share steps · 'menu' show the browser-menu steps · null nothing */
function currentMode() {
  if (isStandalone()) return null;
  if (offer) return 'prompt';
  if (isIOS) return 'ios';
  if (isTouch()) return 'menu';
  return null;
}

export function useInstall() {
  const [mode, setMode] = useState(currentMode);
  useEffect(() => {
    const update = () => setMode(currentMode());
    listeners.add(update);
    update();
    return () => listeners.delete(update);
  }, []);
  const install = async () => {
    if (!offer) return false;
    const e = offer;
    offer = null;
    tell();
    await e.prompt();
    return true;
  };
  return { mode, install };
}
