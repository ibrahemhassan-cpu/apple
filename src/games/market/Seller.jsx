/* عم البياع — the man behind the cart, drawn in the same hand as the boy in the orchard: flat colours, round
   shapes, arms as thick rounded strokes, ink for the face. A white skullcap, a big moustache, a striped
   galabeya and a clean white apron. Only his top half shows over the counter.
   seller2d.js brings him to life (blinks, talks, waves, nods, points). Units: 260 × 274, the counter at y≈206. */
export default function Seller({ svgRef }) {
  return (
    <svg ref={svgRef} className="m-seller" viewBox="0 0 260 274" aria-hidden="true">
      <defs>
        <pattern id="s-stripes" width="18" height="10" patternUnits="userSpaceOnUse">
          <rect width="18" height="10" fill="#6FA8D8" /><rect width="7" height="10" fill="#EAF3FB" />
        </pattern>
      </defs>
      <g className="s-body">
        {/* the galabeya */}
        <path d="M84,134 C98,124 162,124 176,134 C192,160 198,220 200,274 L60,274 C62,220 68,160 84,134 Z" fill="url(#s-stripes)" />
        <path d="M84,134 C98,124 162,124 176,134 C192,160 198,220 200,274 L60,274 C62,220 68,160 84,134 Z" fill="none" stroke="#3E6E9C" strokeWidth="3" opacity=".5" />
        {/* the neck and the V of the collar */}
        <path d="M116,122 L144,122 L142,138 L130,150 L118,138 Z" fill="#D99A74" />
        <path d="M112,130 L130,152 L148,130" fill="none" stroke="#3E6E9C" strokeWidth="4" strokeLinejoin="round" />
        {/* the apron */}
        <path d="M104,160 C104,152 156,152 156,160 L160,274 L100,274 Z" fill="#FFFDF6" />
        <path d="M104,160 L96,132 M156,160 L164,132" stroke="#FFFDF6" strokeWidth="5" strokeLinecap="round" />
        <rect x="116" y="188" width="28" height="20" rx="5" fill="#EFE6D2" />
        <circle className="s-apple-badge" cx="130" cy="176" r="7" fill="#D7263D" />
        <path d="M130,169 q2,-5 6,-6" stroke="#2C7A47" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </g>

      {/* his arms: thick strokes from the shoulders to the hands (moved by seller2d.js) */}
      <line className="s-arm s-arm-l" x1="92" y1="140" x2="70" y2="198" />
      <line className="s-arm s-arm-r" x1="168" y1="140" x2="190" y2="198" />
      <circle className="s-hand s-hand-l" cx="70" cy="198" r="12" />
      <circle className="s-hand s-hand-r" cx="190" cy="198" r="12" />

      <g className="s-head">
        {/* ears, face */}
        <ellipse cx="84" cy="90" rx="9" ry="11" fill="#E0A27C" />
        <ellipse cx="176" cy="90" rx="9" ry="11" fill="#E0A27C" />
        <circle cx="130" cy="86" r="46" fill="#EDB48C" />
        {/* grey hair at the sides */}
        <path d="M86,78 C84,94 88,104 92,108 M174,78 C176,94 172,104 168,108" stroke="#8C8378" strokeWidth="9" strokeLinecap="round" fill="none" />
        {/* the white skullcap (طاقية) */}
        <path d="M86,70 C86,30 174,30 174,70 C152,62 108,62 86,70 Z" fill="#FFFDF6" />
        <path d="M92,60 C112,54 148,54 168,60 M98,48 C116,42 144,42 162,48" stroke="#E4DAC6" strokeWidth="3" fill="none" strokeDasharray="4 4" />
        {/* eyebrows, eyes */}
        <path className="s-brow s-brow-l" d="M100,72 Q110,66 120,71" stroke="#4A3A30" strokeWidth="5" strokeLinecap="round" fill="none" />
        <path className="s-brow s-brow-r" d="M140,71 Q150,66 160,72" stroke="#4A3A30" strokeWidth="5" strokeLinecap="round" fill="none" />
        <g className="s-eyes">
          <ellipse cx="111" cy="84" rx="6.5" ry="8" fill="#FFFFFF" />
          <ellipse cx="149" cy="84" rx="6.5" ry="8" fill="#FFFFFF" />
          <g className="s-pupils">
            <circle cx="111" cy="85" r="4.2" fill="#1B1F3B" />
            <circle cx="149" cy="85" r="4.2" fill="#1B1F3B" />
            <circle cx="112.5" cy="83" r="1.5" fill="#FFFFFF" />
            <circle cx="150.5" cy="83" r="1.5" fill="#FFFFFF" />
          </g>
        </g>
        {/* cheeks and nose */}
        <circle cx="100" cy="102" r="8" fill="#FF8F8F" opacity=".45" />
        <circle cx="160" cy="102" r="8" fill="#FF8F8F" opacity=".45" />
        <path d="M130,86 C124,98 122,104 130,106 C138,104 136,98 130,86 Z" fill="#DE9A70" />
        {/* the mouth under a big moustache */}
        <ellipse className="s-mouth" cx="130" cy="120" rx="10" ry="4" fill="#8E2331" />
        <path d="M130,108 C120,104 104,106 98,116 C108,114 116,118 130,114 C144,118 152,114 162,116 C156,106 140,104 130,108 Z" fill="#4A3A30" />
      </g>
    </svg>
  );
}
