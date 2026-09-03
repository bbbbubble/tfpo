import { Easing, interpolate, useCurrentFrame } from 'remotion';

import { SceneShell } from '../components/SceneShell';
import { colors, fonts } from '../theme';

const items = [
  ['Ratio target', 'Prevents branch collapse', colors.teal, '35 / 65'],
  ['Total variation', 'Discourages noisy switching', colors.rust, 'smooth'],
  ['Entropy', 'Avoids early saturation', colors.navy, 'open'],
] as const;

export const RegularizationScene: React.FC = () => {
  const frame = useCurrentFrame();
  return <SceneShell id="regularization" label="Learning the route" title="No token labels are required.">
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32, alignItems: 'center', height: '100%' }}>
      {items.map(([name, detail, color, tag], index) => {
        const progress = interpolate(frame, [25 + index * 24, 65 + index * 24], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.16, 1, 0.3, 1) });
        return <div key={name} style={{ minHeight: 365, padding: '42px 42px 34px', borderRadius: 24, background: colors.white, opacity: progress, translate: `0 ${(1 - progress) * 22}px` }}>
          <span style={{ color, fontFamily: fonts.mono, fontSize: 18, letterSpacing: '.08em' }}>0{index + 1}</span>
          <h2 style={{ margin: '22px 0 14px', fontFamily: fonts.serif, fontSize: 40, fontWeight: 600 }}>{name}</h2>
          <p style={{ margin: 0, color: colors.muted, fontSize: 25, lineHeight: 1.42 }}>{detail}</p>
          <div style={{ marginTop: 46, height: 74, display: 'flex', alignItems: 'end', gap: 9 }}>
            {[.35, .64, .47, .78, .58, .71, .66].map((value, bar) => <span key={bar} style={{ flex: 1, height: `${Math.max(8, value * progress * 100)}%`, borderRadius: 5, background: color, opacity: .25 + bar * .08 }} />)}
          </div>
          <span style={{ display: 'inline-block', marginTop: 22, color, fontFamily: fonts.mono, fontSize: 17 }}>{tag}</span>
        </div>;
      })}
    </div>
  </SceneShell>;
};
