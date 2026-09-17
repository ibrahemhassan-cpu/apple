import { useCallback, useState } from 'react';
import { useSettings } from '../settings/SettingsContext.jsx';
import { sfx } from '../settings/sfx.js';
import { useInstall } from '../settings/install.js';
import InstallHelp from './InstallHelp.jsx';

/* install + sound + language, the same sticker buttons the game uses */
export default function TopBar() {
  const { lang, setLang, sound, setSound, t } = useSettings();
  const { mode, install } = useInstall();
  const [help, setHelp] = useState(null);
  const closeHelp = useCallback(() => setHelp(null), []);
  const onInstall = async () => {
    sfx.open(sound);
    if (mode === 'prompt') await install();
    else setHelp(mode);                    // iPhone / browsers without a prompt: show the steps
  };
  return (
    <div className="topbar">
      {help && <InstallHelp mode={help} onClose={closeHelp} />}
      {mode && (
        <button type="button" className="install-btn" onClick={onInstall}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 4v11M7 10.5l5 5 5-5M5 19.5h14" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {t('installApp')}
        </button>
      )}
      <button
        type="button"
        className="round-btn"
        aria-pressed={sound}
        aria-label={t('soundAria')}
        onClick={() => { setSound(!sound); sfx.pop(!sound); }}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor" />
          {sound
            ? <path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            : <path d="M16 9l5 6M21 9l-5 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />}
        </svg>
      </button>
      <button
        type="button"
        className="round-btn lang-btn"
        aria-label={t('langAria')}
        onClick={() => { setLang(lang === 'ar' ? 'en' : 'ar'); sfx.pop(sound); }}
      >
        {lang === 'ar' ? 'EN' : 'ع'}
      </button>
    </div>
  );
}
