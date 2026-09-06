import { Easing, interpolate, useCurrentFrame } from 'remotion';

import { SceneShell } from '../components/SceneShell';
import { colors, fonts } from '../theme';

export const ClosingScene: React.FC = () => {
  const frame = useCurrentFrame();
  const route = interpolate(frame, [35, 130], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.16, 1, 0.3, 1) });
  return <SceneShell id="closing" label="Takeaway" title="Preference alignment is token-level credit assignment.">
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 70, alignItems: 'center', height: '100%' }}>
      <p style={{ margin: 0, maxWidth: 720, fontFamily: fonts.serif, fontSize: 45, lineHeight: 1.38 }}>The central design question is <span style={{ color: colors.rust, textDecoration: 'underline', textDecorationColor: colors.teal, textUnderlineOffset: 10, textDecorationSkipInk: 'none' }}>where each objective should act within a response</span>.</p>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: colors.muted, fontFamily: fonts.mono, fontSize: 19 }}><span>preference</span><span>likelihood</span></div>
        <div style={{ position: 'relative', height: 20, marginTop: 22, borderRadius: 99, background: `linear-gradient(90deg, ${colors.teal}, ${colors.rust})` }}><span style={{ position: 'absolute', left: `${route * 92}%`, top: -15, width: 50, height: 50, borderRadius: 99, background: colors.white, border: `5px solid ${colors.ink}` }} /></div>
        <p style={{ margin: '48px 0 0', color: colors.muted, fontSize: 24 }}>A learned route · per token · without token labels</p>
      </div>
    </div>
  </SceneShell>;
};
