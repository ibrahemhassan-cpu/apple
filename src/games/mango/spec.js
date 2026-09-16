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

  tree: {
    // a thicker trunk that splits low into two big spreading limbs
    trunk: 'M318,1768 C352,1742 364,1690 366,1600 L370,1180 C368,1120 340,1080 290,1040 L316,1018 C360,1050 390,1090 400,1120 C412,1086 446,1046 500,1014 L524,1036 C470,1072 434,1120 432,1180 L436,1600 C438,1690 452,1742 488,1768 Z',
    branches: [
      ['M300,1036 C240,990 170,960 100,950', 18],
      ['M512,1026 C580,980 650,960 720,950', 18],
      ['M400,1120 C398,1020 390,900 380,780', 20],
      ['M300,1036 C280,940 250,860 210,780', 13],
      ['M512,1026 C540,940 570,860 600,780', 13],
      ['M380,780 C340,700 300,650 240,610', 11],
      ['M380,780 C420,700 470,650 540,610', 11],
      ['M100,950 C80,920 60,880 50,840', 8],
      ['M720,950 C740,920 760,880 770,840', 8],
    ],
    // a wide, low, dense dome in deep greens
    canopy: {
      cx: 400, cy: 700, rx: 400, ry: 300,
      layers: [
        { n: 50, r0: 60, r1: 96, fill: '#174A2E', k: 1, dx: 0, dy: 26, back: true },
        { n: 46, r0: 52, r1: 86, fill: '#1F5E39', k: .93, dx: 0, dy: 6 },
        { n: 38, r0: 44, r1: 72, fill: '#2A7143', k: .8, dx: -12, dy: -20 },
        { n: 26, r0: 30, r1: 56, fill: '#3C8A4F', k: .66, dx: -40, dy: -60 },
        { n: 14, r0: 16, r1: 32, fill: '#6BB25F', k: .48, dx: -80, dy: -110 },
      ],
    },
    // mango leaves are long and narrow
    leaves: { n: 90, cx: 390, cy: 660, rx: 350, ry: 250, w: 4, h: 19, colors: ['#8CCB6A', '#4E9E55'] },
    growFrom: [400, 1100],
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
