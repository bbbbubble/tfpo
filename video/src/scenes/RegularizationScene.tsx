import { Easing, interpolate, useCurrentFrame } from 'remotion';

import { SceneShell } from '../components/SceneShell';
import { colors, fonts } from '../theme';

const items = [
  { name: 'Ratio penalty', detail: 'Budget violations', color: colors.teal, baseline: 1.6, removed: 36.1, unit: '%', note: 'Same one-token-per-branch safeguard' },
  { name: 'Total variation', detail: 'Transitions / 100 tokens', color: colors.rust, baseline: 3.1, removed: 15.8, unit: '', note: 'Intra-span TV: 0.022 → 0.126' },
  { name: 'Entropy', detail: 'Early saturation', color: colors.navy, baseline: 6.4, removed: 52.1, unit: '%', note: 'Measured at 10% training progress' },
] as const;

export const RegularizationScene: React.FC = () => {
  const frame = useCurrentFrame();
  return <SceneShell id="regularization" label="Learning the route" title="No token labels are required.">
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32, alignItems: 'center', height: '100%' }}>
      {items.map(({ name, detail, color, baseline, removed, unit, note }, index) => {
        const progress = interpolate(frame, [25 + index * 24, 65 + index * 24], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.16, 1, 0.3, 1) });
        return <div key={name} style={{ minHeight: 385, padding: '28px 32px', borderRadius: 24, background: colors.white, opacity: progress, translate: `0 ${(1 - progress) * 22}px` }}>
          <span style={{ color, fontFamily: fonts.mono, fontSize: 18, letterSpacing: '.08em' }}>0{index + 1}</span>
          <h2 style={{ margin: '18px 0 12px', fontFamily: fonts.serif, fontSize: 39, fontWeight: 600 }}>{name}</h2>
          <p style={{ margin: 0, color: colors.muted, fontSize: 23, lineHeight: 1.42 }}>{detail} ↓</p>
          <div style={{ marginTop: 28, display: 'grid', gap: 22 }}>
            {[[baseline, 'Default'], [removed, 'Without this term']].map(([value, label]) => <div key={label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: 19 }}><span>{label}</span><strong style={{ fontFamily: fonts.serif, fontSize: 32, color }}>{(Number(value) * progress).toFixed(1)}{unit}</strong></div>
              <div style={{ height: 8, marginTop: 8, borderRadius: 5, background: colors.line }}><div style={{ width: `${Number(value) / removed * progress * 100}%`, height: '100%', borderRadius: 5, background: color }} /></div>
            </div>)}
          </div>
          <p style={{ margin: '22px 0 0', color: colors.muted, fontSize: 17, lineHeight: 1.4 }}>{note}</p>
        </div>;
      })}
    </div>
  </SceneShell>;
};
