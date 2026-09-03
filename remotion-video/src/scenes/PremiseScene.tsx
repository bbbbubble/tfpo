import { interpolate, useCurrentFrame } from 'remotion';

import { SceneShell } from '../components/SceneShell';
import { Token } from '../components/Motion';
import { colors, fonts } from '../theme';

const tokens = [
  ['First,', 'reasoning'], ['we', 'reasoning'], ['compare', 'reasoning'], ['the', 'reasoning'], ['routes.', 'reasoning'],
  ['Therefore,', 'answer'], ['the', 'answer'], ['answer', 'answer'], ['is', 'answer'], ['C.', 'answer'],
] as const;

export const PremiseScene: React.FC = () => {
  const frame = useCurrentFrame();
  const active = Math.min(tokens.length - 1, Math.floor(interpolate(frame, [35, 300], [0, tokens.length], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })));
  return <SceneShell id="premise" label="Premise" title="One response. Different token roles.">
    <div style={{ display: 'grid', gridTemplateColumns: '1.25fr .75fr', gap: 84, alignItems: 'center', height: '100%' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignContent: 'center' }}>
        {tokens.map(([text, role], index) => <Token key={`${text}-${index}`} text={text} role={role} active={index === active} />)}
      </div>
      <div style={{ paddingLeft: 56, borderLeft: `1px solid ${colors.line}` }}>
        <p style={{ margin: 0, color: colors.teal, fontFamily: fonts.mono, fontSize: 18, letterSpacing: '.09em', textTransform: 'uppercase' }}>Reasoning</p>
        <p style={{ margin: '12px 0 48px', fontFamily: fonts.serif, fontSize: 34, lineHeight: 1.35 }}>Shape the quality of the explanation.</p>
        <p style={{ margin: 0, color: colors.rust, fontFamily: fonts.mono, fontSize: 18, letterSpacing: '.09em', textTransform: 'uppercase' }}>Conclusion</p>
        <p style={{ margin: '12px 0 0', fontFamily: fonts.serif, fontSize: 34, lineHeight: 1.35 }}>Preserve a stable, parseable answer.</p>
      </div>
    </div>
  </SceneShell>;
};
