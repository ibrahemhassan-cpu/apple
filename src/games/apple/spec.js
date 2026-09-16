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

  tree: {
    trunk: 'M330,1768 C360,1745 372,1700 374,1620 L378,1080 C376,1030 356,985 318,945 L340,928 C372,958 392,990 400,1020 C410,985 434,950 468,922 L488,940 C452,975 426,1030 424,1080 L428,1620 C430,1700 440,1745 474,1768 Z',
    branches: [["M336,948 C300,900 250,860 190,835",16],["M474,934 C520,890 580,860 640,850",16],["M400,1030 C396,930 376,820 350,720",18],["M350,720 C330,640 300,590 250,540",12],["M350,720 C380,640 430,560 470,440",12],["M474,934 C500,840 540,740 590,640",13],["M590,640 C620,600 650,580 690,570",8],["M190,835 C160,800 140,760 130,720",8]],
    canopy: {
      cx: 400, cy: 610, rx: 300, ry: 310,
      layers: [
        { n: 40, r0: 58, r1: 92, fill: '#1C5A3A', k: 1, dx: 0, dy: 22, back: true },
        { n: 38, r0: 50, r1: 82, fill: '#267045', k: .92, dx: 0, dy: 4 },
        { n: 32, r0: 42, r1: 70, fill: '#34884D', k: .8, dx: -10, dy: -18 },
        { n: 24, r0: 30, r1: 54, fill: '#52A956', k: .66, dx: -36, dy: -52 },
        { n: 14, r0: 16, r1: 32, fill: '#8CCB6A', k: .5, dx: -70, dy: -96 },
      ],
    },
    leaves: { n: 64, cx: 370, cy: 560, rx: 250, ry: 270, w: 7, h: 11, colors: ['#B9E38C', '#6FBF5F'] },
    growFrom: [400, 980],
  },

  positions: [[262, 556], [345, 436], [488, 414], [596, 520], [660, 690], [520, 650], [395, 590], [292, 735], [172, 700], [604, 855]],
  fruitSize: 66,
  reach: 560,
  pole: false,
};
