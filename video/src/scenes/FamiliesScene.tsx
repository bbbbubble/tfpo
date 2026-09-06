import { Img, interpolate, staticFile, useCurrentFrame } from 'remotion';

import { SceneShell } from '../components/SceneShell';
import { colors, fonts } from '../theme';

const families = [
  { name: 'Qwen3-8B', image: 'qwen.png', simpo: [44.1, 49.7, 50.2], tfpo: [48.3, 56.1, 53.6] },
  { name: 'Llama-3.1-8B', image: 'meta.png', simpo: [38.6, 44.9, 41.6], tfpo: [41.3, 48.6, 46.8] },
  { name: 'Mistral-7B', image: 'mistral.png', simpo: [34.9, 39.1, 34.3], tfpo: [37.8, 41.0, 37.1] },
];

export const FamiliesScene: React.FC = () => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [35, 115], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return <SceneShell id="families" label="Cross-family alignment" title="The gains replicate across backbones.">
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 30, alignItems: 'center', height: '100%' }}>
      {families.map((family, familyIndex) => <div key={family.name} style={{ minHeight: 420, padding: '34px 34px 30px', borderRadius: 24, background: colors.white }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}><Img src={staticFile(`assets/${family.image}`)} style={{ width: 52, height: 52, objectFit: 'contain', borderRadius: 10 }} /><strong style={{ fontFamily: fonts.serif, fontSize: 29 }}>{family.name}</strong></div>
        <div style={{ display: 'grid', gap: 27, marginTop: 38 }}>
          {['AlpacaEval LC', 'AlpacaEval WR', 'Arena-Hard WR'].map((metric, metricIndex) => {
            const low = family.simpo[metricIndex];
            const high = family.tfpo[metricIndex];
            const value = low + (high - low) * progress;
            return <div key={metric}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}><span style={{ color: colors.muted, fontSize: 17 }}>{metric}</span><strong style={{ color: colors.teal, fontFamily: fonts.serif, fontSize: 30 }}>{value.toFixed(1)}</strong></div>
              <div style={{ position: 'relative', height: 8, marginTop: 9, borderRadius: 99, background: colors.line }}><span style={{ position: 'absolute', left: `${low / 60 * 100}%`, top: -4, width: 16, height: 16, borderRadius: 99, background: colors.muted }} /><span style={{ position: 'absolute', left: `${value / 60 * 100}%`, top: -5, width: 18, height: 18, borderRadius: 99, background: colors.teal }} /></div>
            </div>;
          })}
        </div>
        <p style={{ margin: '30px 0 0', color: colors.faint, fontFamily: fonts.mono, fontSize: 15 }}>SimPO → TFPO · independently trained · {familyIndex + 1}</p>
      </div>)}
    </div>
  </SceneShell>;
};
