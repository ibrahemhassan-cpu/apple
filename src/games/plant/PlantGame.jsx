import { useLayoutEffect, useRef } from 'react';
import sceneHtml from './scene.html?raw';
import './scene.css';
import { createPlantGame } from './engine.js';
import { useSettings } from '../../settings/SettingsContext.jsx';
import { STARS } from '../../levels/levels.js';

/* the scene with this fruit's own art dropped into its slots */
function buildScene(spec) {
  return sceneHtml
    .replace('<!--FRUIT_DEFS-->', spec.defs)
    .replace('<!--FRUIT_INTRO-->', spec.intro)
    .replace('<!--FRUIT_SEED-->', spec.seed);
}

/* One engine for every fruit that grows on a tree. React only provides the host; the engine owns
   everything inside it for the life of this mount. A replay remounts (new key) for a clean scene. */
export default function PlantGame({ spec, level, onExit, onReplay, onDone, onNext }) {
  const host = useRef(null);
  const settings = useSettings();
  const latest = useRef({ settings, onExit, onReplay, onDone, onNext });
  latest.current = { settings, onExit, onReplay, onDone, onNext };

  useLayoutEffect(() => {
    host.current.innerHTML = buildScene(spec);
    const { settings: s } = latest.current;
    const game = createPlantGame({
      spec,
      lang: s.lang,
      sound: s.sound,
      care: level?.care,
      order: level?.order,
      stars: STARS.grow,
      onDone: result => latest.current.onDone && latest.current.onDone(result),
      onNext: onNext ? () => latest.current.onNext() : null,
      onLang: lang => latest.current.settings.setLang(lang),
      onSound: on => latest.current.settings.setSound(on),
      onReplay: () => latest.current.onReplay(),
      onExit: () => latest.current.onExit(),
    });
    return () => {
      game.destroy();
      if (host.current) host.current.innerHTML = '';
    };
  }, [spec]);

  return <div ref={host} className={`game-host game-${spec.id}`} />;
}
