/* <Icon name="next" /> — the same pictures as icons.js, for the React screens */
import { ICON_SVG } from './icons.js';

export function Icon({ name }) {
  return (
    <svg className={`ic ic-${name}`} viewBox="0 0 24 24" aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: ICON_SVG[name] }} />
  );
}
