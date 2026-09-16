/* Hand-drawn fruit + seed illustrations for the orchard and the seed card.
   Fruits share one coordinate box (-120 -140 240 260) with the in-game apple. */

function Apple() {
  return (
    <svg viewBox="-120 -140 240 260" aria-hidden="true">
      <defs>
        <radialGradient id="art-apple" gradientUnits="userSpaceOnUse" cx="-34" cy="-40" r="170" fx="-48" fy="-56">
          <stop offset="0" stopColor="#FF9A86" />
          <stop offset=".3" stopColor="#EE3B4E" />
          <stop offset=".72" stopColor="#B0142D" />
          <stop offset="1" stopColor="#6E0B1D" />
        </radialGradient>
      </defs>
      <path d="M2,-70 C4,-92 10,-110 20,-124" fill="none" stroke="#5B3A1E" strokeWidth="9" strokeLinecap="round" />
      <path d="M0,-72 C22,-96 78,-98 102,-40 C124,12 98,86 58,104 C40,112 20,104 0,100 C-20,104 -40,112 -58,104 C-98,86 -124,12 -102,-40 C-78,-98 -22,-96 0,-72 Z" fill="url(#art-apple)" />
      <ellipse cx="-52" cy="-30" rx="17" ry="32" fill="#fff" opacity=".28" transform="rotate(22 -52 -30)" />
      <path d="M16,-104 C34,-136 76,-138 96,-120 C80,-96 40,-88 16,-104 Z" fill="#5DB85A" />
    </svg>
  );
}

function Mango() {
  return (
    <svg viewBox="-120 -140 240 260" aria-hidden="true">
      <defs>
        {/* green at the stalk shoulder, ripening to yellow, orange and a red blush */}
        <linearGradient id="art-mango" gradientUnits="userSpaceOnUse" x1="-80" y1="-110" x2="90" y2="112">
          <stop offset="0" stopColor="#A7CF52" />
          <stop offset=".28" stopColor="#F4D04A" />
          <stop offset=".62" stopColor="#F79A36" />
          <stop offset="1" stopColor="#D9412E" />
        </linearGradient>
      </defs>
      <path d="M-14,-102 C-12,-116 -6,-126 2,-134" fill="none" stroke="#5B3A1E" strokeWidth="8" strokeLinecap="round" />
      <path d="M-20,-104 C44,-116 96,-60 94,16 C92,86 48,122 -6,116 C-44,112 -64,92 -78,64 C-86,48 -104,40 -100,6 C-96,-52 -70,-92 -20,-104 Z" fill="url(#art-mango)" />
      <ellipse cx="34" cy="-40" rx="16" ry="40" fill="#fff" opacity=".3" transform="rotate(-22 34 -40)" />
      <path d="M-10,-122 C-40,-152 -96,-146 -116,-118 C-86,-102 -40,-104 -10,-122 Z" fill="#2F8F4E" />
      <path d="M-14,-122 C-46,-130 -76,-128 -110,-120" fill="none" stroke="#fff" strokeOpacity=".3" strokeWidth="3" />
    </svg>
  );
}

function Potato() {
  return (
    <svg viewBox="-120 -140 240 260" aria-hidden="true">
      <defs>
        <radialGradient id="art-potato" gradientUnits="userSpaceOnUse" cx="-30" cy="-30" r="170">
          <stop offset="0" stopColor="#F0CF95" />
          <stop offset=".55" stopColor="#C9955A" />
          <stop offset="1" stopColor="#8A5A2E" />
        </radialGradient>
      </defs>
      <path d="M-86,-54 C-60,-98 20,-100 66,-74 C112,-48 118,10 98,52 C78,96 20,112 -34,100 C-92,88 -118,40 -110,-6 C-106,-28 -98,-38 -86,-54 Z" fill="url(#art-potato)" />
      <g fill="#7A4E26" opacity=".75">
        <ellipse cx="-46" cy="-44" rx="7" ry="4" />
        <ellipse cx="36" cy="-30" rx="6" ry="3.5" />
        <ellipse cx="-12" cy="30" rx="7" ry="4" />
        <ellipse cx="62" cy="40" rx="5" ry="3" />
        <ellipse cx="-70" cy="30" rx="5" ry="3" />
      </g>
      <ellipse cx="-44" cy="-20" rx="26" ry="14" fill="#fff" opacity=".18" transform="rotate(-18 -44 -20)" />
    </svg>
  );
}

function AppleSeed() {
  return (
    <svg viewBox="-60 -60 120 120" aria-hidden="true">
      <path d="M-14,-40 C-2,-26 4,-6 0,8 C-4,22 -24,22 -28,8 C-32,-6 -26,-26 -14,-40 Z" fill="#5A3319" />
      <path d="M22,-26 C32,-14 36,2 32,14 C28,26 12,26 8,14 C4,2 10,-14 22,-26 Z" fill="#4B2A17" />
      <ellipse cx="-18" cy="-8" rx="3" ry="8" fill="#9A6A3F" />
      <ellipse cx="18" cy="2" rx="2.5" ry="7" fill="#8A5A34" />
    </svg>
  );
}

function MangoStone() {
  return (
    <svg viewBox="-60 -60 120 120" aria-hidden="true">
      <ellipse cx="0" cy="0" rx="36" ry="52" fill="#E9D3A4" transform="rotate(-18)" />
      <g stroke="#C9A96E" strokeWidth="2.5" fill="none" strokeLinecap="round" transform="rotate(-18)">
        <path d="M-26,-30 C-10,-24 10,-24 26,-30" />
        <path d="M-32,-8 C-12,-2 12,-2 32,-8" />
        <path d="M-32,14 C-12,20 12,20 32,14" />
        <path d="M-24,36 C-8,42 8,42 24,36" />
      </g>
      <ellipse cx="-12" cy="-18" rx="8" ry="16" fill="#fff" opacity=".35" transform="rotate(-18)" />
    </svg>
  );
}

function PotatoPiece() {
  return (
    <svg viewBox="-60 -60 120 120" aria-hidden="true">
      <path d="M-44,-10 C-40,-40 30,-46 44,-18 C54,4 44,38 10,44 C-26,50 -48,24 -44,-10 Z" fill="#9C6A38" />
      <path d="M-36,-8 C-32,-32 24,-36 36,-14 C44,4 36,30 8,34 C-20,38 -38,18 -36,-8 Z" fill="#F4E2B0" />
      <circle cx="4" cy="0" r="7" fill="#C9955A" />
      <path d="M4,-6 C2,-20 8,-30 16,-36" fill="none" stroke="#6FB85A" strokeWidth="5" strokeLinecap="round" />
      <path d="M14,-34 C22,-44 32,-42 34,-36 C26,-30 20,-30 14,-34 Z" fill="#8CCB6A" />
    </svg>
  );
}

const FRUIT_ART = { apple: Apple, mango: Mango, potato: Potato };
const SEED_ART = { apple: AppleSeed, mango: MangoStone, potato: PotatoPiece };

export function FruitArt({ id }) {
  const Art = FRUIT_ART[id];
  return Art ? <Art /> : null;
}
export function SeedArt({ id }) {
  const Art = SEED_ART[id];
  return Art ? <Art /> : null;
}
