import { lazy, Suspense, useMemo, useState } from 'react';
import { FRUITS, GAMES } from './fruits/registry.js';
import { LEVELS, levelIndex } from './levels/levels.js';
import { finishLevel } from './levels/progress.js';
import Path from './screens/Path.jsx';
import SeedCard from './screens/SeedCard.jsx';

const FRUIT = Object.fromEntries(FRUITS.map(f => [f.id, f]));

/* which game plays a level: a grow level is its fruit's game, a market level is the market */
const loadMarket = () => import('./games/market/MarketGame.jsx');
const gameFor = level => (level.kind === 'market' ? loadMarket : GAMES[level.fruit]);

/* dev only: ?level=mango-2 or ?play=mango opens one straight away */
function fromAddress() {
  if (!import.meta.env.DEV) return null;
  const q = new URLSearchParams(location.search);
  const byId = levelIndex(q.get('level'));
  if (byId >= 0) return byId;
  const fruit = q.get('play');
  const byFruit = LEVELS.findIndex(l => l.fruit === fruit || (fruit === 'market' && l.kind === 'market'));
  return byFruit >= 0 ? byFruit : null;
}

export default function App() {
  const [screen, setScreen] = useState(() => {
    const i = fromAddress();
    return i === null ? { name: 'path' } : { name: 'game', i, run: 0 };
  });

  const level = LEVELS[screen.i];
  const toPath = () => setScreen({ name: 'path' });
  // a grow level opens with its seed card; the market needs none — the cart brings its own note
  const card = i => (LEVELS[i].kind === 'market' ? play(i) : setScreen({ name: 'card', i }));
  const play = i => setScreen({ name: 'game', i, run: Date.now() });
  const hasNext = screen.i < LEVELS.length - 1;

  const Game = useMemo(
    () => (screen.name === 'game' && level ? lazy(gameFor(level)) : null),
    [screen.name, level]
  );

  if (Game) {
    return (
      <Suspense fallback={<div className="loading" aria-busy="true" />}>
        <Game
          key={screen.run}
          level={level}
          onExit={toPath}
          onReplay={() => play(screen.i)}
          onDone={result => finishLevel(level.id, result.stars)}
          onNext={hasNext ? () => card(screen.i + 1) : null}
        />
      </Suspense>
    );
  }
  if (screen.name === 'card' && level) {
    return (
      <>
        <Path onPick={card} />
        <SeedCard level={level} fruit={FRUIT[level.fruit]} onClose={toPath} onPlay={() => play(screen.i)} />
      </>
    );
  }
  return <Path onPick={card} />;
}
