import { DisplayMath, InlineMath } from '@/components/math';

const responseTokens = ['Reasoning', 'steps', '…', 'Final', 'answer'];

function TokenRow() {
  return (
    <div className="diagram-tokens" aria-hidden="true">
      {responseTokens.map((token, index) => (
        <span className={index >= 3 ? 'answer-token' : 'reasoning-token'} key={token}>{token}</span>
      ))}
    </div>
  );
}

export function MethodDiagram() {
  return (
    <div
      className="method-diagram"
      aria-label="TFPO learns a token-level gate that sends reasoning-sensitive tokens toward preference optimization and conclusion-sensitive tokens toward likelihood anchoring."
    >
      <section className="diagram-panel conflict-panel">
        <header><b>1</b><span>Sequence-level mixing</span></header>
        <p>Two objectives compete across the entire response.</p>
        <TokenRow />
        <div className="crossed-objectives" aria-hidden="true">
          <span className="preference-flow">Preference</span>
          <span className="anchor-flow">NLL anchor</span>
        </div>
        <small>Global gradients entangle reasoning and answer-bearing tokens.</small>
      </section>

      <span className="diagram-arrow" aria-hidden="true">→</span>

      <section className="diagram-panel routing-panel">
        <header><b>2</b><span>Token-level objective routing</span></header>
        <p>A lightweight gate learns where each objective should act.</p>
        <TokenRow />
        <div className="gate-row">
          <span>0</span>
          <div className="gate-gradient" />
          <span>1</span>
        </div>
        <div className="route-cards">
          <div><strong>Low <InlineMath>{'g_t'}</InlineMath></strong><span>DPO preference</span><small>reasoning-sensitive</small></div>
          <div><strong>High <InlineMath>{'g_t'}</InlineMath></strong><span>NLL anchoring</span><small>conclusion-sensitive</small></div>
        </div>
        <DisplayMath className="objective-equation">
          {'\\mathcal{L}_{\\mathrm{TFPO}}=\\mathcal{L}_{\\mathrm{pref}}(S_\\theta^R,S_{\\mathrm{ref}}^R)+\\lambda\\sum_{t\\in y^+}g_t\\ell_{\\mathrm{nll},t}+\\mathcal{R}(g)'}
        </DisplayMath>
      </section>

      <span className="diagram-arrow" aria-hidden="true">→</span>

      <section className="diagram-panel outcome-panel">
        <header><b>3</b><span>Stable alignment</span></header>
        <p>The learned route separates two complementary roles.</p>
        <div className="outcome-cards">
          <div className="reasoning-outcome"><i aria-hidden="true">◌</i><strong>Better reasoning preference</strong><span>Stronger alignment on reasoning steps</span></div>
          <div className="answer-outcome"><i aria-hidden="true">◎</i><strong>Stable final answer</strong><span>Reliable, accurate conclusions</span></div>
        </div>
        <small>No token labels are required.</small>
      </section>
    </div>
  );
}
