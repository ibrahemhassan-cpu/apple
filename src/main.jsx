import { createRoot } from 'react-dom/client';
import { gsap } from 'gsap';
import { SettingsProvider } from './settings/SettingsContext.jsx';
import App from './App.jsx';
import './settings/install.js';
import './settings/audio.js';
// fonts ship with the app (Arabic + Latin only), so the game looks right with no internet
import '@fontsource/lalezar/arabic-400.css';
import '@fontsource/lalezar/latin-400.css';
import '@fontsource/baloo-bhaijaan-2/arabic-500.css';
import '@fontsource/baloo-bhaijaan-2/latin-500.css';
import '@fontsource/baloo-bhaijaan-2/arabic-600.css';
import '@fontsource/baloo-bhaijaan-2/latin-600.css';
import '@fontsource/baloo-bhaijaan-2/arabic-700.css';
import '@fontsource/baloo-bhaijaan-2/latin-700.css';
import '@fontsource/baloo-bhaijaan-2/arabic-800.css';
import '@fontsource/baloo-bhaijaan-2/latin-800.css';
import './app.css';

// dev only: lets you poke at timelines from the browser console (gsap.globalTimeline.timeScale(4) etc.)
if (import.meta.env.DEV) window.gsap = gsap;

// No <StrictMode>: each game engine takes over the DOM inside its host exactly once per mount,
// and StrictMode's double-mount would boot it twice.
createRoot(document.getElementById('root')).render(
  <SettingsProvider>
    <App />
  </SettingsProvider>
);
