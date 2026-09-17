/* The apple: its art, its tree and where its fruit hangs. Read by games/plant/engine.js. */
export default {
  id: 'apple',
  kind: 'tree',

  /* <defs>: fruit gradients, the hanging fruit (#fruit) and one cut half (#cut-left) */
  defs: `
    <radialGradient id="g-skin" gradientUnits="userSpaceOnUse" cx="-34" cy="-40" r="170" fx="-48" fy="-56">
    <stop offset="0" stop-color="#FF9A86"/>
    <stop offset=".3" stop-color="#EE3B4E"/>
    <stop offset=".72" stop-color="#B0142D"/>
    <stop offset="1" stop-color="#6E0B1D"/>
    </radialGradient>
    <radialGradient id="g-flesh" gradientUnits="userSpaceOnUse" cx="-30" cy="0" r="120">
    <stop offset="0" stop-color="#FFFCEB"/>
    <stop offset=".7" stop-color="#FCEFC7"/>
    <stop offset="1" stop-color="#F1D591"/>
    </radialGradient>
    <linearGradient id="g-leaf" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#9BDB6A"/>
    <stop offset="1" stop-color="#2E8B45"/>
    </linearGradient>
    <symbol id="fruit" viewBox="-120 -140 240 260">
    <path d="M2,-70 C4,-92 10,-110 20,-124" fill="none" stroke="#5B3A1E" stroke-width="9" stroke-linecap="round"/>
    <path d="M0,-72 C22,-96 78,-98 102,-40 C124,12 98,86 58,104 C40,112 20,104 0,100 C-20,104 -40,112 -58,104 C-98,86 -124,12 -102,-40 C-78,-98 -22,-96 0,-72 Z" fill="url(#g-skin)"/>
    <ellipse cx="-52" cy="-30" rx="17" ry="32" fill="url(#g-shine)" transform="rotate(22 -52 -30)"/>
    <circle cx="-34" cy="-62" r="6" fill="#fff" opacity=".55"/>
    <path d="M16,-104 C34,-136 76,-138 96,-120 C80,-96 40,-88 16,-104 Z" fill="url(#g-leaf)"/>
    <path d="M20,-106 C44,-116 70,-121 92,-120" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="3"/>
    </symbol>
    <g id="cut-left">
    <path d="M0,-72 C-22,-96 -78,-98 -102,-40 C-124,12 -98,86 -58,104 C-40,112 -20,104 0,100 Z" fill="#C21E36"/>
    <path d="M-3,-60 C-24,-82 -72,-84 -92,-38 C-112,10 -88,80 -54,94 C-38,101 -20,94 -3,90 Z" fill="url(#g-flesh)"/>
    <path d="M-3,-44 C-26,-20 -26,44 -3,66" fill="none" stroke="#E3C07A" stroke-width="5" stroke-linecap="round"/>
    <ellipse cx="-15" cy="-4" rx="6" ry="12" fill="#4B2A17" transform="rotate(-14 -15 -4)"/>
    <ellipse cx="-15" cy="28" rx="6" ry="12" fill="#4B2A17" transform="rotate(14 -15 28)"/>
    </g>
  `,

  /* the big fruit on the title screen: two halves (.half-l / .half-r) + the crack line */
  intro: `
    <svg class="half half-l" viewBox="-120 -140 240 260">
    <path class="seam" d="M0,-72 C22,-96 78,-98 102,-40 C124,12 98,86 58,104 C40,112 20,104 0,100 C-20,104 -40,112 -58,104 C-98,86 -124,12 -102,-40 C-78,-98 -22,-96 0,-72 Z" fill="url(#g-skin)"/>
    <g class="skin">
    <path d="M0,-72 C-22,-96 -78,-98 -102,-40 C-124,12 -98,86 -58,104 C-40,112 -20,104 0,100 Z" fill="url(#g-skin)"/>
    <ellipse cx="-52" cy="-30" rx="17" ry="32" fill="url(#g-shine)" transform="rotate(22 -52 -30)"/>
    <circle cx="-34" cy="-62" r="6" fill="#fff" opacity=".55"/>
    </g>
    <use class="cut" href="#cut-left" opacity="0"/>
    </svg>
    <svg class="half half-r" viewBox="-120 -140 240 260">
    <path d="M2,-70 C4,-92 10,-110 20,-124" fill="none" stroke="#5B3A1E" stroke-width="9" stroke-linecap="round"/>
    <path class="skin" d="M0,-72 C22,-96 78,-98 102,-40 C124,12 98,86 58,104 C40,112 20,104 0,100 Z" fill="url(#g-skin)"/>
    <g class="cut" opacity="0"><use href="#cut-left" transform="scale(-1 1)"/></g>
    <path d="M16,-104 C34,-136 76,-138 96,-120 C80,-96 40,-88 16,-104 Z" fill="url(#g-leaf)"/>
    </svg>
    <svg class="crack" viewBox="-120 -140 240 260">
    <path d="M0,-72 L5,-42 L-4,-14 L6,16 L-3,48 L0,100" fill="none" stroke="#FFE7A3" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `,

  /* the seed that comes out of it */
  seed: `<svg viewBox="-20 -30 40 60"><path d="M0,-26 C12,-12 16,6 12,16 C8,26 -8,26 -12,16 C-16,6 -12,-12 0,-26Z" fill="#5A3319"/><ellipse cx="-4" cy="-4" rx="3" ry="7" fill="#9A6A3F"/></svg>`,
  seedSize: [34, 50],

  /* the real apple tree: a short, slightly crooked grey-brown trunk that opens into wide spreading limbs,
     a rounded, fairly open crown, oval toothed leaves one by one along the shoots and in rosettes on the
     fruiting spurs, each apple on its own short stem. Grown by games/plant/flora3d.js. */
  flora: {
    type: 'tree', seed: 21,
    base: [400, 1768], trunkTop: 1080, trunkBend: [16, 1.1], trunkR: 30, flare: .7, flareH: 110,
    seg: 24, influence: 140, kill: 36, tropism: [0, .04, 0], persist: .7, twig: 1.3,
    crown: { cx: 405, cy: 640, rx: 335, ry: 300, rz: 220, bottom: 960, points: 800, shell: .45, core: .35 },
    arrangement: 'alternate',
    leaf: {
      size: 31, sizeVar: .35, aspect: .58, curl: .2, fold: .12, roughness: .72, back: [1.15, 1.18, 1.1],
      shoot: 3, perNode: 4, spur: 12, spurShare: .5,
    },
    bark: { base: '#8A7B6E', light: '#ABA094', dark: '#5A4C41', crack: '#3A2F27', cracks: 30, crackW: 2.4, plate: 50, lichen: true, grain: 18, bump: 1 },
    light: [400, 760, 620],
  },

  positions: [[262, 556], [345, 436], [488, 414], [596, 520], [660, 690], [520, 650], [395, 590], [292, 735], [172, 700], [604, 855]],
  fruitSize: 66,
  reach: 560,
  pole: false,
};
