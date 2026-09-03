import { interpolate, useCurrentFrame } from 'remotion';

import { Reveal } from '../components/Motion';
import { SceneShell } from '../components/SceneShell';
import { colors, fonts } from '../theme';

export const EvidenceScene: React.FC = () => {
  const frame = useCurrentFrame();
  const auprc = interpolate(frame, [35, 95], [0, .85], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return <SceneShell id="evidence" label="Routing evidence" title="The gate follows content, not position.">
    <div style={{ display: 'grid', gridTemplateColumns: '1.05fr .95fr', gap: 44, height: '100%', alignItems: 'center' }}>
      <Reveal from={12}><div style={{ padding: '38px 42px', borderRadius: 24, background: colors.white }}>
        <p style={{ margin: 0, color: colors.muted, fontFamily: fonts.mono, fontSize: 17, letterSpacing: '.08em', textTransform: 'uppercase' }}>Blind gold-span recovery · 1,000 responses</p>
        <div style={{ display: 'flex', alignItems: 'end', gap: 38, marginTop: 30 }}>
          <strong style={{ color: colors.rust, fontFamily: fonts.serif, fontSize: 112, fontWeight: 620, lineHeight: 1 }}>{auprc.toFixed(2)}</strong>
          <span style={{ paddingBottom: 13, color: colors.muted, fontSize: 25 }}>AUPRC<br /><b style={{ color: colors.ink }}>TFPO content gate</b></span>
        </div>
        <div style={{ marginTop: 28, display: 'flex', justifyContent: 'space-between', color: colors.muted, fontSize: 22 }}><span>Best strict position-only</span><strong style={{ color: colors.ink, fontFamily: fonts.serif, fontSize: 35 }}>.55</strong></div>
      </div></Reveal>
      <div style={{ display: 'grid', gap: 24 }}>
        <Reveal from={48}><div style={{ padding: '30px 34px', borderRadius: 22, background: colors.tealSoft }}>
          <p style={{ margin: 0, color: colors.teal, fontFamily: fonts.mono, fontSize: 16, textTransform: 'uppercase' }}>Answer-position counterfactual</p>
          <div style={{ display: 'flex', gap: 16, marginTop: 22 }}>{[['first', '.83'], ['middle', '.84'], ['last', '.85']].map(([label, value]) => <span key={label} style={{ flex: 1, textAlign: 'center' }}><b style={{ display: 'block', fontFamily: fonts.serif, fontSize: 35 }}>{value}</b><small style={{ color: colors.muted, fontSize: 16 }}>{label}</small></span>)}</div>
          <p style={{ margin: '22px 0 0', color: colors.teal, fontSize: 21 }}>Maximum gap: <strong>.02</strong></p>
        </div></Reveal>
        <Reveal from={72}><div style={{ padding: '30px 34px', borderRadius: 22, background: colors.rustSoft }}>
          <p style={{ margin: 0, color: colors.rust, fontFamily: fonts.mono, fontSize: 16, textTransform: 'uppercase' }}>Gold-span removal test</p>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 20 }}><span style={{ fontSize: 23 }}>Joint geometric score</span><strong style={{ color: colors.rust, fontFamily: fonts.serif, fontSize: 54 }}>84.4</strong></div>
          <p style={{ margin: 0, color: colors.muted, fontSize: 20 }}>+14.5 over the position-only MLP route</p>
        </div></Reveal>
      </div>
    </div>
  </SceneShell>;
};
