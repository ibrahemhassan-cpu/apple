/* The potato: no seed at all — you plant a piece of potato with a sprouting "eye".
   The plant above is small; the whole harvest hides in the soil. Read by games/plant/engine.js. */

// the piece with a sprouting eye — used as the seed and, underground, as the shrinking mother piece
const PIECE = `<path d="M-44,-10 C-40,-40 30,-46 44,-18 C54,4 44,38 10,44 C-26,50 -48,24 -44,-10 Z" fill="#9C6A38"/><path d="M-36,-8 C-32,-32 24,-36 36,-14 C44,4 36,30 8,34 C-20,38 -38,18 -36,-8 Z" fill="#F4E2B0"/><circle cx="4" cy="0" r="7" fill="#C9955A"/><path d="M4,-6 C2,-20 8,-30 16,-36" fill="none" stroke="#6FB85A" stroke-width="5" stroke-linecap="round"/><path d="M14,-34 C22,-44 32,-42 34,-36 C26,-30 20,-30 14,-34 Z" fill="#8CCB6A"/>`;

export default {
  id: 'potato',
  kind: 'ground',

  /* <defs>: skin + flesh gradients, the tuber (#fruit) and one cut half (#cut-left) */
  defs: `
    <radialGradient id="g-skin" gradientUnits="userSpaceOnUse" cx="-30" cy="-40" r="180">
      <stop offset="0" stop-color="#F2D39A"/>
      <stop offset=".5" stop-color="#D6A466"/>
      <stop offset="1" stop-color="#9C6A38"/>
    </radialGradient>
    <radialGradient id="g-flesh" gradientUnits="userSpaceOnUse" cx="-30" cy="0" r="120">
      <stop offset="0" stop-color="#FFF8E0"/>
      <stop offset=".7" stop-color="#F8E8B8"/>
      <stop offset="1" stop-color="#EDD394"/>
    </radialGradient>
    <symbol id="fruit" viewBox="-120 -140 240 260">
      <path d="M-92,-44 C-70,-94 10,-104 62,-80 C108,-58 116,6 96,50 C76,94 18,108 -36,98 C-94,86 -118,40 -110,-4 C-106,-24 -100,-32 -92,-44 Z" fill="url(#g-skin)"/>
      <g fill="#7A4E26" opacity=".7">
        <ellipse cx="-50" cy="-48" rx="8" ry="4.5"/><ellipse cx="34" cy="-40" rx="7" ry="4"/>
        <ellipse cx="-12" cy="22" rx="8" ry="4.5"/><ellipse cx="62" cy="30" rx="6" ry="3.5"/><ellipse cx="-72" cy="26" rx="6" ry="3.5"/>
      </g>
      <ellipse cx="-44" cy="-26" rx="28" ry="15" fill="url(#g-shine)" transform="rotate(-18 -44 -26)"/>
    </symbol>
    <g id="cut-left">
      <path d="M0,-96 C-56,-94 -102,-58 -104,-2 C-106,58 -64,102 0,104 Z" fill="#A87545"/>
      <path d="M-3,-84 C-50,-82 -90,-50 -92,-2 C-94,52 -56,90 -3,92 Z" fill="url(#g-flesh)"/>
      <path d="M-3,-62 C-36,-60 -66,-36 -68,-2 C-70,38 -42,66 -3,68" fill="none" stroke="#EAD39A" stroke-width="3" opacity=".7"/>
      <g fill="#E4C98C" opacity=".8"><circle cx="-40" cy="-30" r="2.5"/><circle cx="-58" cy="14" r="2"/><circle cx="-26" cy="40" r="2.5"/><circle cx="-18" cy="-8" r="2"/></g>
    </g>
  `,

  /* the big potato on the title screen: two halves + the crack line */
  intro: `
    <svg class="half half-l" viewBox="-120 -140 240 260">
      <path class="seam" d="M0,-96 C58,-98 104,-56 104,0 C104,58 64,102 0,104 C-64,102 -106,58 -104,-2 C-102,-58 -56,-94 0,-96 Z" fill="url(#g-skin)"/>
      <g class="skin">
        <path d="M0,-96 C-56,-94 -102,-58 -104,-2 C-106,58 -64,102 0,104 Z" fill="url(#g-skin)"/>
        <g fill="#7A4E26" opacity=".7"><ellipse cx="-56" cy="-44" rx="8" ry="4.5"/><ellipse cx="-30" cy="30" rx="8" ry="4.5"/><ellipse cx="-78" cy="18" rx="6" ry="3.5"/></g>
        <ellipse cx="-50" cy="-24" rx="26" ry="14" fill="url(#g-shine)" transform="rotate(-18 -50 -24)"/>
      </g>
      <use class="cut" href="#cut-left" opacity="0"/>
    </svg>
    <svg class="half half-r" viewBox="-120 -140 240 260">
      <g class="skin">
        <path d="M0,-96 C58,-98 104,-56 104,0 C104,58 64,102 0,104 Z" fill="url(#g-skin)"/>
        <g fill="#7A4E26" opacity=".7"><ellipse cx="40" cy="-50" rx="7" ry="4"/><ellipse cx="64" cy="22" rx="6" ry="3.5"/><ellipse cx="20" cy="64" rx="7" ry="4"/></g>
        <!-- an eye already sprouting: the hint that a piece of this can grow -->
        <path d="M38,-52 C40,-70 50,-82 62,-88" fill="none" stroke="#6FB85A" stroke-width="6" stroke-linecap="round"/>
        <path d="M58,-86 C68,-100 84,-98 88,-90 C78,-82 68,-82 58,-86 Z" fill="#8CCB6A"/>
      </g>
      <g class="cut" opacity="0"><use href="#cut-left" transform="scale(-1 1)"/></g>
    </svg>
    <svg class="crack" viewBox="-120 -140 240 260">
      <path d="M0,-96 L6,-60 L-5,-24 L6,12 L-4,50 L3,80 L0,104" fill="none" stroke="#FFF1B8" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `,

  /* no seed — a piece of potato with a sprouting eye */
  seed: `<svg viewBox="-60 -60 120 120">${PIECE}</svg>`,
  seedSize: [58, 58],

  /* the camera goes this far below the lawn so you can see into the soil */
  world: { below: 600, down: 440 },

  /* above the soil, the real potato plant: soft green stems, compound leaves (pairs of oval leaflets with tiny
     ones between them and one at the tip), and five-pointed pale flowers with a yellow cone. Grown in 3D by
     games/plant/flora3d.js; the soil cross-section below stays a drawing. */
  flora: {
    type: 'potato', seed: 4,
    base: [400, 1764], stem: '#4E8636', petal: '#EEE4FF', leafScale: 1.2,
    stems: [
      { lean: -58, yaw: 30, len: 180 },
      { lean: -34, yaw: -40, len: 225, flowers: 4 },
      { lean: -12, yaw: 60, len: 250, flowers: 5 },
      { lean: 10, yaw: -70, len: 240, flowers: 4 },
      { lean: 32, yaw: 20, len: 215 },
      { lean: 56, yaw: -20, len: 175 },
    ],
    light: [400, 1640, 340],
  },

  /* below the soil */
  underground: {
    strata: [[1786, '#7A5234'], [1905, '#6B4629'], [2045, '#5C3B22'], [2190, '#4E311C']],
    pebbles: 46,
    worm: 'M640,2178 c12,-14 24,14 36,0 c12,-14 24,14 36,0 c12,-14 24,14 36,0',
    mother: PIECE,
    shallow: 4,                                                   // the first four come up with the plant
    surface: [[290, 1744], [345, 1750], [560, 1752], [615, 1744]], // where those four land on the lawn
    kidX: 520,
  },

  // four shallow ones near the plant, six deeper — kept clear of the basket's corner on small screens
  positions: [
    [340, 1850], [460, 1858], [385, 1902], [520, 1912],
    [240, 1900], [300, 1950], [580, 1975], [470, 2030], [620, 2070], [530, 2115],
  ],
  fruitSize: 64,
};
