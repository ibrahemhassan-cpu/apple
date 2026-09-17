import { lazy, Suspense, useMemo, useState } from 'react';
import { GAMES } from './fruits/registry.js';
import Orchard from './screens/Orchard.jsx';

export default function App() {
  const [screen, setScreen] = useState(() => {
    // dev only: ?play=mango opens a game straight away
    const id = import.meta.env.DEV && new URLSearchParams(location.search).get('play');
    return GAMES[id] ? { name: 'game', id, run: 0 } : { name: 'orchard' };
  });

  const play = id => setScreen({ name: 'game', id, run: Date.now() });
  const toOrchard = () => setScreen({ name: 'orchard' });

  const Game = useMemo(
    () => (screen.name === 'game' && GAMES[screen.id] ? lazy(GAMES[screen.id]) : null),
    [screen.name, screen.id]
  );

  if (Game) {
    return (
      <Suspense fallback={<div className="loading" aria-busy="true" />}>
        <Game key={screen.run} onExit={toOrchard} onReplay={() => play(screen.id)} />
      </Suspense>
    );
  }
  return <Orchard onPlay={play} />;
}
