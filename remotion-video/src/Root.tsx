import './index.css';
import { Composition } from 'remotion';

import timing from './timing.json';
import { TFPOExplainer } from './TFPOExplainer';

export const RemotionRoot: React.FC = () => (
  <Composition
    id="TFPOExplainer"
    component={TFPOExplainer}
    durationInFrames={timing.totalFrames}
    fps={timing.fps}
    width={1920}
    height={1080}
  />
);
