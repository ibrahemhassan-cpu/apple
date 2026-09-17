import { useEffect, useRef } from 'react';
import { useSettings } from '../settings/SettingsContext.jsx';

const ShareIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 3v12M7.5 7.5 12 3l4.5 4.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M8 10H6.5A1.5 1.5 0 0 0 5 11.5v8A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5v-8a1.5 1.5 0 0 0-1.5-1.5H16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
  </svg>
);
const AddIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <rect x="4" y="4" width="16" height="16" rx="4" fill="none" stroke="currentColor" strokeWidth="2.2" />
    <path d="M12 8.5v7M8.5 12h7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
  </svg>
);
const MenuIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="5.5" r="2" fill="currentColor" /><circle cx="12" cy="12" r="2" fill="currentColor" /><circle cx="12" cy="18.5" r="2" fill="currentColor" />
  </svg>
);
const HomeIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <rect x="5" y="3" width="14" height="18" rx="3" fill="none" stroke="currentColor" strokeWidth="2.2" />
    <rect x="8.5" y="7" width="7" height="7" rx="2" fill="currentColor" />
  </svg>
);

/* the steps to put the game on the home screen, for phones whose browser can't do it from a button */
export default function InstallHelp({ mode, onClose }) {
  const { t } = useSettings();
  const closeBtn = useRef(null);
  useEffect(() => {
    closeBtn.current?.focus({ preventScroll: true });
    const key = e => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [onClose]);

  const steps = mode === 'ios'
    ? [[ShareIcon, 'installIos1'], [AddIcon, 'installIos2'], [HomeIcon, 'installIos3']]
    : [[MenuIcon, 'installMenu1'], [AddIcon, 'installMenu2'], [HomeIcon, 'installMenu3']];

  return (
    <div className="install-help" role="dialog" aria-modal="true" aria-labelledby="install-title">
      <div className="install-backdrop" onClick={onClose} />
      <div className="install-card">
        <button ref={closeBtn} type="button" className="round-btn install-close" aria-label={t('close')} onClick={onClose}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" /></svg>
        </button>
        <img className="install-icon" src="/pwa-192x192.png" alt="" width="72" height="72" />
        <h2 id="install-title">{t('installTitle')}</h2>
        <p className="install-sub">{t('installSub')}</p>
        <ol className="install-steps">
          {steps.map(([Icon, key], i) => (
            <li key={key}>
              <span className="install-num">{i + 1}</span>
              <span className="install-step-icon"><Icon /></span>
              <span>{t(key)}</span>
            </li>
          ))}
        </ol>
        {mode === 'ios' && <p className="install-note">{t('installIosNote')}</p>}
      </div>
    </div>
  );
}
