/* الأيقونات — a picture on every button, because most of our players can't read yet: they press by what
   they see. One set, used by the React screens (icons.jsx) and by the game scene (as SVG strings).
   All are 24×24, drawn in currentColor so they take the button's colour. */
const S = 'fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"';
// the little round arrow of "again", up in the corner
const AGAIN = `<path d="M23 6.8A4.4 4.4 0 1 1 20.4 2.6" ${S} stroke-width="2"/><path d="M18.6 1.2l2.1 1.4-1.3 2.2" ${S} stroke-width="2"/>`;
const SPROUT = `<path d="M3 20h18" ${S} stroke-width="2.6"/><path d="M12 20v-7.5" ${S} stroke-width="2.6"/>
  <path d="M12 13C12 7.8 15.4 4.6 21 4.6 21 9.8 17.6 13 12 13ZM12 14.6C12 10.4 9.2 8 3.6 8 3.6 12.2 6.4 14.6 12 14.6Z" fill="currentColor"/>`;

export const ICON_SVG = {
  // ⏭ — "the next one", as on every video a child has watched
  next: `<path d="M5 5.5v13l9.5-6.5z" fill="currentColor"/><path d="M18 5.5v13" ${S} stroke-width="3"/>`,
  // a big sprout with the little "again" arrow in its corner: plant it again
  replant: `<g transform="translate(-1.5 3) scale(.84)">${SPROUT}</g>${AGAIN}`,
  // a big basket with the little "again" arrow: another order
  again: `<path d="M2.5 11.5h14.5l-2 8.5H4.5z" fill="currentColor"/><path d="M6 11.5c0-3.4 1.4-5 3.75-5s3.75 1.6 3.75 5" ${S} stroke-width="2.2"/>${AGAIN}`,
  // a folded map: back to the road of levels
  map: `<path d="M3 6.5l6-2.5 6 2.5 6-2.5v13.5l-6 2.5-6-2.5-6 2.5z" ${S} stroke-width="2.3"/><path d="M9 4v13.5M15 6.5V20" ${S} stroke-width="2.3"/>`,
  // the house: home, where the child's garden is
  home: `<path d="M3 11.5 12 4l9 7.5" ${S} stroke-width="2.4"/><path d="M5.5 10v9.5h4.5v-5.5h4v5.5h4.5V10" ${S} stroke-width="2.4"/>`,
  // a sprout coming out of the soil: plant it
  plant: SPROUT,
  // an arrow back the way you came (drawn for right-to-left; turned round in English by CSS)
  back: `<path d="M4 12h15M13 5.5l6.5 6.5-6.5 6.5" ${S} stroke-width="3"/>`,
  // ✓: that's enough, I'm done
  done: `<path d="M4.5 12.5l5 5 10-11" ${S} stroke-width="3.2"/>`,
};

export const iconSvg = name => `<svg class="ic ic-${name}" viewBox="0 0 24 24" aria-hidden="true">${ICON_SVG[name]}</svg>`;
