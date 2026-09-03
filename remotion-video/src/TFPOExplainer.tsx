import { TransitionSeries, linearTiming } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';

import timing from './timing.json';
import { CapabilityScene } from './scenes/CapabilityScene';
import { ClosingScene } from './scenes/ClosingScene';
import { ConflictScene } from './scenes/ConflictScene';
import { EvidenceScene } from './scenes/EvidenceScene';
import { FamiliesScene } from './scenes/FamiliesScene';
import { MultimodalScene } from './scenes/MultimodalScene';
import { PremiseScene } from './scenes/PremiseScene';
import { RegularizationScene } from './scenes/RegularizationScene';
import { RoutingScene } from './scenes/RoutingScene';
import { StabilityScene } from './scenes/StabilityScene';

const components = [
  PremiseScene,
  ConflictScene,
  RoutingScene,
  RegularizationScene,
  CapabilityScene,
  EvidenceScene,
  FamiliesScene,
  MultimodalScene,
  StabilityScene,
  ClosingScene,
];

export const TFPOExplainer: React.FC = () => (
  <TransitionSeries>
    {timing.scenes.flatMap((scene, index) => {
      const Scene = components[index];
      const sequence = (
        <TransitionSeries.Sequence key={scene.id} name={scene.id} durationInFrames={scene.durationInFrames}>
          <Scene />
        </TransitionSeries.Sequence>
      );
      if (index === timing.scenes.length - 1) return [sequence];
      return [
        sequence,
        <TransitionSeries.Transition
          key={`${scene.id}-transition`}
          presentation={fade()}
          timing={linearTiming({ durationInFrames: timing.transitionFrames })}
        />,
      ];
    })}
  </TransitionSeries>
);
