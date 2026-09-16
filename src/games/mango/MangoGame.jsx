import PlantGame from '../plant/PlantGame.jsx';
import spec from './spec.js';

export default function MangoGame(props) {
  return <PlantGame spec={spec} {...props} />;
}
