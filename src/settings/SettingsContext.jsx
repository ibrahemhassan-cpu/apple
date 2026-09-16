import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { LANGS, LEVELS, translate, formatNumber } from '../i18n/strings.js';

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

/* language, play level and sound — shared by the shell and every game, remembered between visits */
export function SettingsProvider({ children }) {
  const [lang, setLang] = useState(() => read('orchard-lang', LANGS, 'ar'));
  const [level, setLevel] = useState(() => read('orchard-level', LEVELS, 'easy'));
  const [sound, setSound] = useState(() => read('orchard-sound', ['on', 'off'], 'on') === 'on');

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    save('orchard-lang', lang);
  }, [lang]);
  useEffect(() => save('orchard-level', level), [level]);
  useEffect(() => save('orchard-sound', sound ? 'on' : 'off'), [sound]);

  const t = useCallback(key => translate(lang, key), [lang]);
  const n = useCallback(value => formatNumber(lang, value), [lang]);

  const value = useMemo(
    () => ({ lang, setLang, level, setLevel, sound, setSound, t, n }),
    [lang, level, sound, t, n]
  );
  return <Settings.Provider value={value}>{children}</Settings.Provider>;
}

export const useSettings = () => useContext(Settings);
