import { interpolate, useCurrentFrame } from 'remotion';

import { SceneShell } from '../components/SceneShell';
import { colors, fonts } from '../theme';

const metrics = [
  ['Agreement@4', 92.69],
  ['MajorityAcc@4', 86.32],
  ['AvgAcc@4', 90.57],
  ['Explanation diversity', 62.33],
];

export const StabilityScene: React.FC = () => {
  const frame = useCurrentFrame();
  return <SceneShell id="stability" label="Repeated sampling" title="Stable answers, diverse explanations.">
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, alignItems: 'center', height: '100%' }}>
      {metrics.map(([label, raw], index) => {
        const value = Number(raw);
        const progress = interpolate(frame, [26 + index * 18, 72 + index * 18], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
        return <div key={String(label)} style={{ minHeight: 365, padding: '38px 30px', borderRadius: 24, background: index === 3 ? colors.tealSoft : colors.white }}>
          <p style={{ minHeight: 62, margin: 0, color: index === 3 ? colors.teal : colors.muted, fontFamily: fonts.mono, fontSize: 17, lineHeight: 1.45, textTransform: 'uppercase' }}>{String(label)}</p>
          <strong style={{ display: 'block', marginTop: 34, color: index === 3 ? colors.teal : colors.rust, fontFamily: fonts.serif, fontSize: 69, fontWeight: 620 }}>{(value * progress).toFixed(2)}</strong>
          <div style={{ height: 9, marginTop: 38, borderRadius: 99, background: colors.line, overflow: 'hidden' }}><div style={{ width: `${value * progress}%`, height: '100%', borderRadius: 99, background: index === 3 ? colors.teal : colors.rust }} /></div>
          <p style={{ margin: '26px 0 0', color: colors.muted, fontSize: 19 }}>{index === 3 ? 'increases, not sacrificed' : 'higher under matched sampling'}</p>
        </div>;
      })}
    </div>
  </SceneShell>;
};
