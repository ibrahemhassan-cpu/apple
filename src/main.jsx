import { createRoot } from 'react-dom/client';
import { gsap } from 'gsap';
import { SettingsProvider } from './settings/SettingsContext.jsx';
import App from './App.jsx';
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
