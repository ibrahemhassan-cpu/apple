/* بيت الطفل — a little cottage, drawn as an SVG group 140 × 130 with its door at (70, 118). Used on the map
   (beside the start of the road: tap it to go home) and in the garden itself. */
export function HouseArt() {
  return (
    <g className="house-art">
      <ellipse cx="70" cy="122" rx="62" ry="8" fill="#2E6B34" opacity=".22" />
      {/* the chimney and its smoke */}
      <rect x="92" y="18" width="14" height="30" rx="2" fill="#B5553B" /><rect x="90" y="15" width="18" height="6" rx="2" fill="#8E3F2B" />
      <g className="house-smoke">{[0, 1, 2].map(k => <circle key={k} cx="99" cy="8" r="6" fill="#FFFFFF" opacity="0" />)}</g>
      {/* the walls, a stone base */}
      <path d="M26,58 H114 V118 H26 Z" fill="#FCE9C8" />
      <path d="M26,58 H114 V66 H26 Z" fill="#EFD3A6" />
      <path d="M26,108 H114 V118 H26 Z" fill="#C9B79C" />
      <path d="M34,108 v10 M50,108 v10 M66,108 v10 M82,108 v10 M98,108 v10" stroke="#AE9C80" strokeWidth="1.5" />
      {/* the roof: red tiles, a good overhang */}
      <path d="M14,62 L70,16 L126,62 Z" fill="#D9483A" />
      <path d="M14,62 L70,16 L126,62" fill="none" stroke="#9E2F24" strokeWidth="5" strokeLinejoin="round" strokeLinecap="round" />
      <g stroke="#B63A2E" strokeWidth="2" opacity=".75">
        <path d="M30,50 H110 M42,40 H98 M54,30 H86" />
        <path d="M40,62 L44,50 M56,62 L58,50 M72,62 L72,50 M88,62 L86,50 M104,62 L100,50" />
      </g>
      {/* a round window up in the gable */}
      <circle cx="70" cy="42" r="8" fill="#9AD3F5" stroke="#FFF4DF" strokeWidth="3" /><path d="M70,34 V50 M62,42 H78" stroke="#FFF4DF" strokeWidth="2" />
      {/* the windows with green shutters and flower boxes */}
      {[40, 100].map(cx => (
        <g key={cx}>
          <rect x={cx - 9} y="72" width="18" height="18" rx="2" fill="#9AD3F5" stroke="#FFF4DF" strokeWidth="2.5" />
          <path d={`M${cx},72 V90 M${cx - 9},81 H${cx + 9}`} stroke="#FFF4DF" strokeWidth="2" />
          <rect x={cx - 16} y="71" width="6" height="20" rx="1.5" fill="#3E8E47" /><rect x={cx + 10} y="71" width="6" height="20" rx="1.5" fill="#3E8E47" />
          <rect x={cx - 12} y="92" width="24" height="6" rx="2" fill="#9C5B2E" />
          {[-8, -3, 2, 7].map((d, k) => <circle key={k} cx={cx + d} cy="91" r="2.6" fill={k % 2 ? '#F7A1C4' : '#E23A4B'} />)}
        </g>
      ))}
      {/* the door */}
      <path d="M60,118 V92 C60,82 80,82 80,92 V118 Z" fill="#9C5B2E" />
      <path d="M64,118 V93 C64,87 76,87 76,93 V118" fill="none" stroke="#7A4420" strokeWidth="2" />
      <circle cx="75" cy="104" r="2" fill="#FFD36E" />
      <rect x="56" y="117" width="28" height="4" rx="2" fill="#AE9C80" />
    </g>
  );
}
