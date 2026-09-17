import { useEffect, useState } from 'react';

/* "Install the app": the browser offers it once (beforeinstallprompt, Android / desktop Chrome and Edge).
   Caught as early as possible, since it can fire before React has drawn anything. iPhone has no such event —
   there it's Share → Add to Home Screen. */
let offer = null;
const listeners = new Set();
const tell = () => listeners.forEach(fn => fn(!!offer));

window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  offer = e;
  tell();
});
window.addEventListener('appinstalled', () => {
  offer = null;
  tell();
});

export function useInstall() {
  const [canInstall, setCanInstall] = useState(!!offer);
  useEffect(() => {
    listeners.add(setCanInstall);
    setCanInstall(!!offer);
    return () => listeners.delete(setCanInstall);
  }, []);
  const install = async () => {
    if (!offer) return;
    const e = offer;
    offer = null;
    tell();
    await e.prompt();
  };
  return { canInstall, install };
}
