/* The orchard's catalogue. Adding a fruit starts here — see FRUITS.md.
   Text lives in i18n/strings.js; these are the keys. */
export const FRUITS = [
  {
    id: 'apple',
    playable: true,
    plantType: 'tree',
    harvest: 'climb-pick',
    text: { name: 'appleName', seed: 'appleSeed', fact: 'appleFact' },
    glow: '#FF8FA3',
  },
  {
    id: 'mango',
    playable: true,
    plantType: 'tree',
    harvest: 'pole-catch',
    text: { name: 'mangoName', seed: 'mangoSeed', fact: 'mangoFact' },
    glow: '#FFC15A',
  },
  {
    id: 'potato',
    playable: true,
    plantType: 'underground',
    harvest: 'dig-pull',
    text: { name: 'potatoName', seed: 'potatoSeed', fact: 'potatoFact' },
    glow: '#E8C27A',
  },
];

/* each playable fruit's game, loaded only when someone plays it */
export const GAMES = {
  apple: () => import('../games/apple/AppleGame.jsx'),
  mango: () => import('../games/mango/MangoGame.jsx'),
  potato: () => import('../games/potato/PotatoGame.jsx'),
};
