import { interpolate, useCurrentFrame } from 'remotion';

import { SceneShell } from '../components/SceneShell';
import { colors, fonts } from '../theme';

const rows = [
  ['reasoning', 0.14], ['steps', 0.22], ['because', 0.18], ['final', 0.82], ['answer', 0.91],
];

export const RoutingScene: React.FC = () => {
  const frame = useCurrentFrame();
  const active = Math.min(rows.length - 1, Math.floor(interpolate(frame, [45, 430], [0, rows.length], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })));
  return <SceneShell id="routing" label="Method" title="Learn where each objective should act.">
    <div style={{ display: 'grid', gridTemplateColumns: '330px 1fr 420px', gap: 48, alignItems: 'center', height: '100%' }}>
      <div style={{ display: 'grid', gap: 16 }}>
        {rows.map(([token], index) => <div key={String(token)} style={{ padding: '15px 20px', borderRadius: 12, background: index === active ? colors.white : 'transparent', border: `1px solid ${index === active ? colors.line : 'transparent'}`, fontFamily: fonts.mono, fontSize: 26 }}>{String(token)}</div>)}
      </div>
      <div style={{ display: 'grid', gap: 23 }}>
        {rows.map(([, gate], index) => {
          const shown = interpolate(frame, [28 + index * 16, 60 + index * 16], [0, Number(gate)], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          return <div key={index} style={{ display: 'grid', gridTemplateColumns: '1fr 88px', gap: 18, alignItems: 'center' }}>
            <div style={{ height: 22, borderRadius: 999, background: colors.tealSoft, overflow: 'hidden' }}><div style={{ width: `${shown * 100}%`, height: '100%', borderRadius: 999, background: `linear-gradient(90deg, ${colors.teal}, ${colors.rust})` }} /></div>
            <span style={{ color: shown > .5 ? colors.rust : colors.teal, fontFamily: fonts.mono, fontSize: 22 }}>g={shown.toFixed(2)}</span>
          </div>;
        })}
      </div>
      <div style={{ display: 'grid', gap: 28 }}>
        <div style={{ padding: '30px 34px', borderRadius: 20, background: colors.tealSoft }}><span style={{ color: colors.teal, fontFamily: fonts.mono, fontSize: 17 }}>LOW gₜ</span><strong style={{ display: 'block', marginTop: 10, fontFamily: fonts.serif, fontSize: 34 }}>Preference objective</strong></div>
        <div style={{ padding: '30px 34px', borderRadius: 20, background: colors.rustSoft }}><span style={{ color: colors.rust, fontFamily: fonts.mono, fontSize: 17 }}>HIGH gₜ</span><strong style={{ display: 'block', marginTop: 10, fontFamily: fonts.serif, fontSize: 34 }}>Likelihood anchor</strong></div>
      </div>
    </div>
  </SceneShell>;
};
