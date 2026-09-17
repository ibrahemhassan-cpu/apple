/* The mango: a big flat stone inside, a wide dark-green tree, fruit hanging on long stalks.
   The far fruit is out of arm's reach even from the top of the ladder — that's what the pole is for. */
export default {
  id: 'mango',
  kind: 'tree',

  /* <defs>: fruit gradients, the hanging fruit (#fruit) and one cut half (#cut-left) */
  defs: `
    <linearGradient id="g-skin" gradientUnits="userSpaceOnUse" x1="-80" y1="-110" x2="90" y2="116">
      <stop offset="0" stop-color="#A7CF52"/>
      <stop offset=".28" stop-color="#F4D04A"/>
      <stop offset=".62" stop-color="#F79A36"/>
      <stop offset="1" stop-color="#D9412E"/>
    </linearGradient>
    <radialGradient id="g-flesh" gradientUnits="userSpaceOnUse" cx="-30" cy="0" r="120">
      <stop offset="0" stop-color="#FFE38A"/>
      <stop offset=".6" stop-color="#FFC54A"/>
      <stop offset="1" stop-color="#F9A43A"/>
    </radialGradient>
    <linearGradient id="g-leaf" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#5DB36A"/>
      <stop offset="1" stop-color="#1F6B3E"/>
    </linearGradient>
    <symbol id="fruit" viewBox="-120 -140 240 260">
      <path d="M-14,-102 C-12,-116 -6,-128 0,-138" fill="none" stroke="#5B3A1E" stroke-width="7" stroke-linecap="round"/>
      <path d="M-20,-104 C44,-116 96,-60 94,16 C92,86 48,122 -6,116 C-44,112 -64,92 -78,64 C-86,48 -104,40 -100,6 C-96,-52 -70,-92 -20,-104 Z" fill="url(#g-skin)"/>
      <ellipse cx="34" cy="-40" rx="16" ry="40" fill="url(#g-shine)" transform="rotate(-22 34 -40)"/>
      <path d="M-10,-122 C-40,-152 -96,-146 -116,-118 C-86,-102 -40,-104 -10,-122 Z" fill="url(#g-leaf)"/>
      <path d="M-14,-122 C-46,-130 -76,-128 -110,-120" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width="3"/>
    </symbol>
    <g id="cut-left">
      <path d="M0,-110 C-54,-110 -90,-50 -90,14 C-90,82 -52,118 0,118 Z" fill="#E8742F"/>
      <path d="M-3,-98 C-46,-98 -78,-46 -78,14 C-78,74 -46,106 -3,106 Z" fill="url(#g-flesh)"/>
      <path d="M-3,-68 C-26,-66 -38,-28 -38,12 C-38,52 -26,80 -3,82 Z" fill="#F3E2B6"/>
      <g fill="none" stroke="#D8BD84" stroke-width="3" stroke-linecap="round">
        <path d="M-6,-40 C-18,-38 -26,-30 -30,-18"/>
        <path d="M-6,-10 C-20,-8 -30,0 -34,12"/>
        <path d="M-6,22 C-20,24 -30,32 -32,44"/>
        <path d="M-6,52 C-16,54 -24,60 -26,68"/>
      </g>
      <g fill="none" stroke="#FFE9A0" stroke-width="2.4" stroke-linecap="round" opacity=".55">
        <path d="M-52,-50 C-62,-30 -68,-10 -70,10"/>
        <path d="M-54,40 C-64,56 -66,70 -60,86"/>
      </g>
    </g>
  `,

  /* the big fruit on the title screen: two halves (.half-l / .half-r) + the crack line */
  intro: `
    <svg class="half half-l" viewBox="-120 -140 240 260">
      <path class="seam" d="M0,-110 C54,-110 90,-50 90,14 C90,82 52,118 0,118 C-52,118 -90,82 -90,14 C-90,-50 -54,-110 0,-110 Z" fill="url(#g-skin)"/>
      <g class="skin">
        <path d="M0,-110 C-54,-110 -90,-50 -90,14 C-90,82 -52,118 0,118 Z" fill="url(#g-skin)"/>
      </g>
      <use class="cut" href="#cut-left" opacity="0"/>
    </svg>
    <svg class="half half-r" viewBox="-120 -140 240 260">
      <path d="M2,-108 C4,-120 10,-130 18,-138" fill="none" stroke="#5B3A1E" stroke-width="8" stroke-linecap="round"/>
      <g class="skin">
        <path d="M0,-110 C54,-110 90,-50 90,14 C90,82 52,118 0,118 Z" fill="url(#g-skin)"/>
        <ellipse cx="42" cy="-40" rx="15" ry="36" fill="url(#g-shine)" transform="rotate(-20 42 -40)"/>
        <circle cx="30" cy="-68" r="6" fill="#fff" opacity=".5"/>
      </g>
      <g class="cut" opacity="0"><use href="#cut-left" transform="scale(-1 1)"/></g>
      <path d="M14,-130 C40,-158 98,-156 118,-132 C90,-112 46,-110 14,-130 Z" fill="url(#g-leaf)"/>
    </svg>
    <svg class="crack" viewBox="-120 -140 240 260">
      <path d="M0,-110 L6,-74 L-5,-36 L6,4 L-4,46 L3,84 L0,118" fill="none" stroke="#FFF1B8" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `,

  /* the stone that comes out of it — much bigger than an apple seed, and that's the lesson */
  seed: `<svg viewBox="-30 -42 60 84"><ellipse cx="0" cy="0" rx="22" ry="36" fill="#EAD7A8" transform="rotate(-14)"/><g fill="none" stroke="#C9A96E" stroke-width="2.4" stroke-linecap="round" transform="rotate(-14)"><path d="M-16,-20 C-6,-16 6,-16 16,-20"/><path d="M-20,-4 C-8,0 8,0 20,-4"/><path d="M-20,12 C-8,16 8,16 20,12"/><path d="M-14,27 C-4,30 4,30 14,27"/></g><ellipse cx="-7" cy="-12" rx="5" ry="11" fill="#fff" opacity=".35" transform="rotate(-14)"/></svg>`,
  seedSize: [46, 64],

  /* the real mango tree: a tall, straight, thick trunk with dark fissured bark, a broad dense dome of a crown,
     long narrow leathery leaves bunched in rosettes at the shoot tips (the new ones hang limp and copper-red),
     and every mango dangling on a long stalk at the edge of the crown. Grown by games/plant/flora3d.js. */
  flora: {
    type: 'tree', seed: 8,
    base: [400, 1768], trunkTop: 1150, trunkBend: [6, .7], trunkR: 44, flare: .55, flareH: 120,
    seg: 22, influence: 130, kill: 30, tropism: [0, .1, 0], persist: .45, twig: 1.6,
    crown: { cx: 400, cy: 705, rx: 390, ry: 320, rz: 290, bottom: 1010, points: 1400 },
    arrangement: 'whorl',
    leaf: {
      size: 50, sizeVar: .4, aspect: .27, curl: .34, fold: .16, roughness: .42, back: [.95, 1.08, .95],
      whorl: [11, 16], youngShare: .09, youngColor: '#A8403A',
    },
    bark: { base: '#75655A', light: '#968679', dark: '#4A3D34', crack: '#2B221C', cracks: 46, crackW: 3.4, plate: 120, lichen: false, grain: 22, bump: 1 },
    stalk: { len: 72, lean: 30, r: 1.9, color: '#6D6A3B' },
    light: [400, 780, 680],
  },

  // five near the ladder (by hand) and five out on the edges and the crown (by pole)
  positions: [
    [500, 760], [340, 700], [560, 880], [300, 880], [430, 590],
    [90, 760], [730, 700], [200, 560], [640, 520], [430, 420],
  ],
  fruitSize: 76,
  reach: 340,
  pole: true,
  poleReach: 760,
};
