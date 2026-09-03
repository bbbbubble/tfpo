import { MetricBar } from '../components/Motion';
import { SceneShell } from '../components/SceneShell';
import { colors, fonts } from '../theme';

const tasks = ['BBH', 'GSM8K', 'HumanEval', 'IFEval', 'MMLU', 'RACE', 'C3', 'Gaokao', 'MATH', 'MBPP'];

export const CapabilityScene: React.FC = () => <SceneShell id="capability" label="Main evaluation" title="A consistent capability gain.">
  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr .8fr', gap: 80, alignItems: 'center', height: '100%' }}>
    <div style={{ display: 'grid', gap: 32 }}>
      <MetricBar label="TFPO" value={88} max={90} color={colors.rust} delay={18} />
      <MetricBar label="SimPO + NLL" value={83.52} max={90} color={colors.muted} delay={34} />
      <MetricBar label="SimPO" value={83.08} max={90} color={colors.muted} delay={50} />
      <p style={{ margin: '12px 0 0', color: colors.muted, fontSize: 22 }}>Three-seed means · one frozen evaluation protocol</p>
    </div>
    <div>
      <p style={{ margin: '0 0 25px', color: colors.rust, fontFamily: fonts.mono, fontSize: 18, letterSpacing: '.08em', textTransform: 'uppercase' }}>Strongest on all ten</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {tasks.map((task) => <span key={task} style={{ padding: '14px 18px', borderRadius: 10, background: colors.rustSoft, color: colors.rust, fontFamily: fonts.mono, fontSize: 19 }}>{task} <b style={{ float: 'right' }}>↑</b></span>)}
      </div>
    </div>
  </div>
</SceneShell>;
