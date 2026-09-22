import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { LANGS, translate, formatNumber } from '../i18n/strings.js';

const Settings = createContext(null);

function read(key, allowed, fallback) {
  try {
    const value = localStorage.getItem(key);
    return allowed.includes(value) ? value : fallback;
  } catch (e) {
    return fallback;                       // private mode / blocked storage
  }
}
function save(key, value) {
  try { localStorage.setItem(key, value); } catch (e) { /* private mode */ }
}

/* language and sound — shared by the shell and every game, remembered between visits.
   (What the player has to do is the level's business now: see levels/levels.js) */
export function SettingsProvider({ children }) {
  const [lang, setLang] = useState(() => read('orchard-lang', LANGS, 'ar'));
  const [sound, setSound] = useState(() => read('orchard-sound', ['on', 'off'], 'on') === 'on');

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    save('orchard-lang', lang);
  }, [lang]);
  useEffect(() => save('orchard-sound', sound ? 'on' : 'off'), [sound]);

  const t = useCallback(key => translate(lang, key), [lang]);
  const n = useCallback(value => formatNumber(lang, value), [lang]);

  const value = useMemo(
    () => ({ lang, setLang, sound, setSound, t, n }),
    [lang, sound, t, n]
  );
  return <Settings.Provider value={value}>{children}</Settings.Provider>;
}

export const useSettings = () => useContext(Settings);
