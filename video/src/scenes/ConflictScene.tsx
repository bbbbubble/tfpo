import { Easing, interpolate, useCurrentFrame } from 'remotion';

import { Reveal } from '../components/Motion';
import { SceneShell } from '../components/SceneShell';
import { colors, fonts } from '../theme';

export const ConflictScene: React.FC = () => {
  const frame = useCurrentFrame();
  const width = interpolate(frame, [60, 150], [0, 100], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.16, 1, 0.3, 1) });
  return <SceneShell id="conflict" label="The conflict" title="Uniform pressure creates interference.">
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 38, height: '100%', alignItems: 'center' }}>
      <Reveal from={18}><div style={{ minHeight: 330, padding: '48px 52px', borderRadius: 26, background: colors.tealSoft }}>
        <p style={{ margin: 0, color: colors.teal, fontFamily: fonts.mono, fontSize: 18, letterSpacing: '.1em', textTransform: 'uppercase' }}>Preference shaping</p>
        <p style={{ margin: '28px 0 0', fontFamily: fonts.serif, fontSize: 42, lineHeight: 1.3 }}>Helpful reasoning<br />Clear justification<br />Better alignment</p>
      </div></Reveal>
      <Reveal from={40}><div style={{ minHeight: 330, padding: '48px 52px', borderRadius: 26, background: colors.rustSoft }}>
        <p style={{ margin: 0, color: colors.rust, fontFamily: fonts.mono, fontSize: 18, letterSpacing: '.1em', textTransform: 'uppercase' }}>Likelihood anchoring</p>
        <p style={{ margin: '28px 0 0', fontFamily: fonts.serif, fontSize: 42, lineHeight: 1.3 }}>Stable answers<br />Valid formats<br />Executable code</p>
      </div></Reveal>
      <div style={{ gridColumn: '1 / -1', marginTop: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: colors.muted, fontSize: 22 }}><span>One sequence-level signal</span><span>applied to every token</span></div>
        <div style={{ marginTop: 16, height: 10, borderRadius: 999, background: colors.line, overflow: 'hidden' }}><div style={{ width: `${width}%`, height: '100%', background: `linear-gradient(90deg, ${colors.teal}, ${colors.rust})` }} /></div>
      </div>
    </div>
  </SceneShell>;
};
