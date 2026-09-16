import PlantGame from '../plant/PlantGame.jsx';
import spec from './spec.js';

export default function AppleGame(props) {
  return <PlantGame spec={spec} {...props} />;
}
