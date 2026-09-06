import { Img, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';

import captions from '../../public/captions/multimodal.json';

import { SceneShell } from '../components/SceneShell';
import { colors, fonts } from '../theme';

const cases = [
  { title: 'Answer formatting', image: 'mllm-case-1.png', detail: 'ORPO gives an ordinal description.', problem: 'Required option letter omitted', answer: 'TFPO returns A' },
  { title: 'Map reasoning', image: 'mllm-case-2.png', detail: 'TDPO selects unsupported option B.', problem: 'Unsupported Pacific route', answer: 'TFPO selects A' },
  { title: 'Numerical VQA', image: 'mllm-case-3a.png', detail: 'Both methods reach the correct answer.', problem: 'TFPO gives a more concise response', answer: '0.5010 / 0.5260 ha · C' },
];

export const MultimodalScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const now = frame / fps * 1000;
  const mapStart = captions.find((cue) => cue.text.startsWith('The map case'))?.startMs ?? Infinity;
  const numericalStart = captions.find((cue) => cue.text.startsWith('In the numerical case'))?.startMs ?? Infinity;
  const active = now >= numericalStart ? 2 : now >= mapStart ? 1 : 0;
  const item = cases[active];
  return <SceneShell id="multimodal" label="Multimodal extension" title="Visual reasoning has fragile conclusions too.">
    <div style={{ display: 'grid', gridTemplateColumns: '1.12fr .88fr', gap: 48, alignItems: 'center', height: '100%' }}>
      <div style={{ height: 410, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, borderRadius: 24, background: colors.white }}>
        <Img key={item.image} src={staticFile(`assets/${item.image}`)} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
      </div>
      <div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 22 }}><strong style={{ color: colors.rust, fontFamily: fonts.serif, fontSize: 76 }}>71.03</strong><span style={{ color: colors.muted, fontSize: 23 }}>best average<br />across 10 benchmarks</span></div>
        <div style={{ marginTop: 35, paddingTop: 26, borderTop: `1px solid ${colors.line}` }}>
          <p style={{ margin: 0, color: colors.teal, fontFamily: fonts.mono, fontSize: 17, textTransform: 'uppercase' }}>Case {active + 1} · {item.title}</p>
          <p style={{ margin: '16px 0 0', fontFamily: fonts.serif, fontSize: 34, lineHeight: 1.28 }}>{item.problem}</p>
          <p style={{ margin: '20px 0 0', color: colors.muted, fontSize: 21 }}>{item.detail} <strong style={{ color: colors.teal }}>{item.answer}.</strong></p>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 30 }}>{cases.map((entry, index) => <span key={entry.title} style={{ width: index === active ? 48 : 12, height: 8, borderRadius: 99, background: index === active ? colors.rust : colors.line }} />)}</div>
      </div>
    </div>
  </SceneShell>;
};
