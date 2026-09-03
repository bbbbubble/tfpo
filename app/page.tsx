import { Download, ExternalLink, FileText, Play } from 'lucide-react';

import { CitationBox } from '@/components/citation-box';

const capabilityRows = [
  ['Qwen3-8B', '81.50', '79.2', '92.1', '78.4', '83.2', '79.5', '84.1', '88.5', '70.2', '83.7', '76.1'],
  ['DPO', '79.22', '78.4', '88.2', '78.0', '80.3', '75.2', '84.5', '87.1', '66.2', '81.5', '72.8'],
  ['MPO', '81.22', '79.4', '89.2', '84.1', '80.9', '75.0', '86.0', '88.0', '70.4', '83.0', '76.2'],
  ['SimPO', '83.08', '80.5', '92.4', '86.1', '82.1', '78.1', '88.0', '91.2', '70.6', '84.3', '77.5'],
  ['TDPO', '80.76', '79.8', '90.6', '82.0', '81.3', '76.0', '85.3', '89.0', '68.3', '82.1', '73.2'],
  ['ORPO', '79.26', '78.4', '88.0', '80.3', '79.6', '75.0', '84.0', '88.6', '66.0', '80.7', '72.0'],
  ['SimPO+NLL', '83.52', '80.5', '92.5', '86.5', '82.3', '79.0', '88.5', '91.0', '71.4', '85.3', '78.2'],
  ['TFPO', '88.00', '86.0', '96.1', '91.3', '88.1', '84.6', '91.0', '94.3', '76.0', '89.6', '83.0'],
];

const capabilityHeaders = ['Method', 'Avg.', 'BBH', 'GSM8K', 'HumanEval', 'IFEval', 'MMLU', 'RACE', 'C3', 'Gaokao', 'MATH', 'MBPP'];

const stabilityRows = [
  ['SimPO', '88.33', '80.69', '85.73', '59.01', '99.67'],
  ['SimPO+NLL', '89.01', '81.69', '86.10', '59.72', '99.70'],
  ['TFPO', '92.69', '86.32', '90.57', '62.33', '99.80'],
];

export default function Home() {
  return (
    <main id="top">
      <header className="topbar">
        <a className="site-name" href="#top">TFPO</a>
        <nav aria-label="Primary navigation">
          <a href="#method">Method</a><a href="#results">Results</a><a href="#video">Video</a>
          <a href="./paper.pdf" target="_blank" rel="noreferrer">Paper</a>
        </nav>
      </header>

      <article className="paper-page">
        <header className="paper-header">
          <p className="paper-kicker">Research project page</p>
          <h1>TFPO: Token-Level Objective Fusion for Stable Preference Alignment</h1>
          <p className="authors">Pei Chen</p>
          <div className="paper-links" aria-label="Project links">
            <a href="./paper.pdf" target="_blank" rel="noreferrer"><FileText aria-hidden="true" /> Paper</a>
            <a href="#video"><Play aria-hidden="true" /> Video</a>
            <a href="https://github.com/bbbbubble/tfpo" target="_blank" rel="noreferrer"><ExternalLink aria-hidden="true" /> Code</a>
          </div>
        </header>

        <section className="abstract-section text-column" aria-labelledby="abstract-title">
          <h2 id="abstract-title">Abstract</h2>
          <p>
            Preference optimization is usually applied uniformly to entire responses, although explanatory text,
            final answers, formatting fields, and code need not benefit from the same training signal. We propose
            TFPO (Token-Fused Preference Optimization), which learns a lightweight gate that routes each response
            token between a DPO-style preference objective and a chosen-response likelihood anchor. The route is
            learned without token-level supervision and is stabilized by ratio, smoothness, and entropy
            regularization. Under a matched ten-benchmark evaluation, TFPO averages 88.00, compared with 83.08 for
            SimPO and 83.52 for the NLL-anchored SimPO+NLL control (three-seed means). It also improves external
            alignment across Qwen, Llama, and Mistral backbones and is effective in multimodal preference tuning.
            Under repeated sampling, TFPO raises answer agreement and majority-answer accuracy while preserving
            explanation diversity. On 1,000 gate- and model-blind annotated responses from five extractable-answer
            tasks, its content gate recovers answer-bearing spans with 0.85 AUPRC, versus 0.55 for the strongest
            strict position-only control. These results support token-level objective routing as a practical way to
            improve both preference alignment and answer stability.
          </p>
        </section>

        <figure className="wide-figure overview-figure">
          <img src="./assets/overview.png" alt="Summary of TFPO results across text capability, cross-family alignment, and multimodal preference tuning" />
          <figcaption><strong>Figure 1.</strong> Summary of the main empirical picture. TFPO improves the main ten-benchmark average, judge-based alignment across three model families, and multimodal preference tuning.</figcaption>
        </figure>

        <section className="section-block" aria-labelledby="motivation-title">
          <div className="section-label">01</div>
          <div className="section-body text-column">
            <h2 id="motivation-title">Motivation</h2>
            <p className="lead-paragraph">LLM responses are not homogeneous token strings. Their spans range from explanatory prose and answer-bearing fields to formatting delimiters, schema keys, and executable code.</p>
            <p>Reasoning tokens can benefit from preference shaping: they determine whether an explanation is helpful, concise, and well justified. In contrast, final answer fields, option letters, short numeric answers, JSON keys, or code fragments often need likelihood anchoring to remain parseable and stable. When all tokens inherit the same sequence-level preference pressure, these roles can interfere.</p>
            <blockquote>The core claim is not merely that mixing preference and likelihood is helpful. Our claim is sharper:<em> where</em> each objective is applied matters.</blockquote>
          </div>
        </section>

        <section id="method" className="section-block" aria-labelledby="method-title">
          <div className="section-label">02</div>
          <div className="section-body">
            <div className="text-column">
              <h2 id="method-title">Method</h2>
              <p>TFPO learns a small gate over response tokens and uses it to route tokens between a preference objective for reasoning-sensitive regions and a chosen-response likelihood anchor for answer-bearing regions. It does not require explicit labels for reasoning or conclusion spans.</p>
            </div>
            <figure className="wide-figure method-figure">
              <img src="./assets/method.png" alt="TFPO method overview showing token-wise routing between preference gradients and likelihood anchoring" />
              <figcaption><strong>Figure 2.</strong> TFPO learns token-wise routing: preference gradients primarily shape reasoning-sensitive tokens, while likelihood anchoring stabilizes answer-bearing and conclusion-sensitive tokens.</figcaption>
            </figure>
            <div className="method-note text-column">
              <p>For each token, a single linear head reads the decoder hidden state through a stop-gradient path:</p>
              <div className="equation"><i>g</i><sub>t</sub> = σ(sg(<b>h</b><sub>t</sub>) <b>W</b><sub>g</sub> + <i>b</i><sub>g</sub>)</div>
              <p>A large <i>g</i><sub>t</sub> routes the token toward the conclusion/likelihood objective; a small value routes it toward the reasoning/preference objective. Ratio, total-variation, and entropy regularization prevent route collapse, noisy switching, and premature saturation.</p>
            </div>
          </div>
        </section>

        <section id="results" className="section-block" aria-labelledby="results-title">
          <div className="section-label">03</div>
          <div className="section-body">
            <div className="text-column">
              <h2 id="results-title">Main results</h2>
              <p>Under one frozen, method-independent benchmark protocol, TFPO is strongest on the ten-benchmark average and on every constituent benchmark. The comparison with SimPO+NLL separates token-level routing from the simpler effect of adding a full-response likelihood anchor.</p>
            </div>
            <figure className="table-figure">
              <div className="table-scroll" aria-label="Scrollable main capability results">
                <table className="paper-table capability-table">
                  <thead><tr>{capabilityHeaders.map((header) => <th key={header}>{header}</th>)}</tr></thead>
                  <tbody>{capabilityRows.map((row) => <tr key={row[0]} className={row[0] === 'TFPO' ? 'highlight-row' : undefined}>{row.map((cell, index) => index === 0 ? <th key={cell} scope="row">{cell}</th> : <td key={`${row[0]}-${index}`}>{cell}</td>)}</tr>)}</tbody>
                </table>
              </div>
              <figcaption><strong>Table 1.</strong> Matched capability evaluation on post-trained Qwen3-8B. Fine-tuned rows are three-seed means under one frozen, method-independent benchmark protocol.</figcaption>
            </figure>
          </div>
        </section>

        <section className="section-block" aria-labelledby="evidence-title">
          <div className="section-label">04</div>
          <div className="section-body">
            <div className="text-column">
              <h2 id="evidence-title">Does the gate follow content?</h2>
              <p>The routing claim is tested against strict position-only controls, blind answer-span annotations, answer-position counterfactuals, and method-independent token-removal interventions. The final gold-span evaluation contains 1,000 responses from five extractable-answer tasks.</p>
            </div>
            <figure className="wide-figure evidence-figure">
              <img src="./assets/routing-evidence.png" alt="Held-out TFPO token-routing examples, including a counterfactual with the answer placed first" />
              <figcaption><strong>Figure 3.</strong> Held-out token-routing examples. Case B places the answer label first; semantic evaluation uses independently annotated gold spans rather than the descriptive sensitivity row.</figcaption>
            </figure>
            <figure className="table-figure evidence-table-figure">
              <div className="table-scroll" aria-label="Scrollable core routing evidence">
                <table className="paper-table">
                  <thead><tr className="panel-row"><th colSpan={5}>A. Equal-removal-budget intervention (mean over 10–40% budgets)</th></tr><tr><th>Router</th><th>RR-Preserve ↑</th><th>CR-Failure ↑</th><th>ΔRR vs. MLP</th><th>ΔCR vs. MLP</th></tr></thead>
                  <tbody>
                    <tr><th scope="row">Pure-position linear</th><td>68.9</td><td>41.2</td><td>—</td><td>—</td></tr>
                    <tr><th scope="row">Pure-position MLP</th><td>72.6</td><td>46.0</td><td>0.0</td><td>0.0</td></tr>
                    <tr className="highlight-row"><th scope="row">TFPO content gate</th><td>84.9</td><td>67.5</td><td>+12.3</td><td>+21.5</td></tr>
                    <tr className="panel-row"><th colSpan={5}>B. Method-independent gold-span intervention</th></tr>
                    <tr className="subhead-row"><th>TFPO variant</th><th>Reasoning preserve ↑</th><th>Answer failure ↑</th><th>Joint geom. ↑</th><th>ΔJoint vs. MLP</th></tr>
                    <tr><th scope="row">Pure-position linear route</th><td>73.1</td><td>59.1</td><td>65.7</td><td>—</td></tr>
                    <tr><th scope="row">Pure-position MLP route</th><td>76.5</td><td>63.8</td><td>69.9</td><td>0.0</td></tr>
                    <tr className="highlight-row"><th scope="row">Content-gated route</th><td>88.6</td><td>80.4</td><td>84.4</td><td>+14.5</td></tr>
                    <tr className="panel-row"><th colSpan={5}>C. Gold answer-span recovery (1,000 responses)</th></tr>
                    <tr className="subhead-row"><th>Router</th><th>AUPRC ↑</th><th>Precision ↑</th><th>Recall ↑</th><th>F1 ↑</th></tr>
                    <tr><th scope="row">Pure-position linear</th><td>0.50</td><td>0.58</td><td>0.52</td><td>0.55</td></tr>
                    <tr><th scope="row">Pure-position MLP</th><td>0.55</td><td>0.63</td><td>0.57</td><td>0.60</td></tr>
                    <tr className="highlight-row"><th scope="row">TFPO content gate</th><td>0.85</td><td>0.84</td><td>0.80</td><td>0.82</td></tr>
                  </tbody>
                </table>
              </div>
              <figcaption><strong>Table 2.</strong> Core routing evidence against strict position-only controls. Panels A and B use controlled removal tests; Panel C evaluates blind gold-span recovery.</figcaption>
            </figure>
          </div>
        </section>

        <section className="section-block" aria-labelledby="stability-title">
          <div className="section-label">05</div>
          <div className="section-body">
            <div className="text-column">
              <h2 id="stability-title">Answer stability without uniformity</h2>
              <p>On BBH, GSM8K, and MATH, four matched samples are drawn per prompt for each of three training seeds. Relative to SimPO+NLL, TFPO improves answer agreement, majority accuracy, and average accuracy while increasing rather than sacrificing explanation diversity.</p>
            </div>
            <figure className="table-figure compact-table-figure">
              <div className="table-scroll" aria-label="Scrollable repeated-sampling stability results">
                <table className="paper-table"><thead><tr><th>Method</th><th>Agreement@4 ↑</th><th>MajorityAcc@4 ↑</th><th>AvgAcc@4 ↑</th><th>Div.@4 ↑</th><th>Valid ↑</th></tr></thead><tbody>{stabilityRows.map((row) => <tr key={row[0]} className={row[0] === 'TFPO' ? 'highlight-row' : undefined}>{row.map((cell, index) => index === 0 ? <th key={cell} scope="row">{cell}</th> : <td key={`${row[0]}-${index}`}>{cell}</td>)}</tr>)}</tbody></table>
              </div>
              <figcaption><strong>Table 3.</strong> Repeated-sampling stability, macro-averaged over BBH, GSM8K, and MATH and then over three training seeds.</figcaption>
            </figure>
          </div>
        </section>

        <section id="video" className="section-block" aria-labelledby="video-title">
          <div className="section-label">06</div>
          <div className="section-body">
            <div className="text-column"><h2 id="video-title">Video overview</h2><p>A concise English walkthrough of the problem, method, and main evidence.</p></div>
            <div className="video-wrap">
              <video controls preload="metadata" poster="./assets/video-poster.jpg"><source src="./tfpo-explainer.mp4" type="video/mp4" /><track default kind="captions" src="./tfpo-explainer.vtt" srcLang="en" label="English" />Your browser does not support embedded video.</video>
              <a className="download-link" href="./tfpo-explainer.mp4" download><Download aria-hidden="true" /> Download MP4</a>
            </div>
          </div>
        </section>

        <section className="section-block closing-section" aria-labelledby="limitations-title">
          <div className="section-label">07</div>
          <div className="section-body text-column">
            <h2 id="limitations-title">Limitations and conclusion</h2>
            <p>Gold-span semantics are evaluated only on five tasks with extractable answer fields and should not be read as a unique partition for arbitrary open-ended text. The learned route is latent and not necessarily identifiable, and the model-scale evidence is limited to 7–8B LoRA settings. Judge-based evaluations remain judge-dependent. TFPO can improve parseability and answer stability, but it does not remove risks such as hallucination, bias, or misuse.</p>
            <p>TFPO reframes preference optimization as token-level credit assignment: choosing which response parts should receive preference pressure and which should retain likelihood anchoring. The capability gains, routing controls, blind gold-span recovery, answer-position counterfactuals, and repeated-sampling stability support the importance of <em>where</em> objectives act inside a response.</p>
          </div>
        </section>

        <section className="citation-section" aria-labelledby="citation-title">
          <div className="text-column"><h2 id="citation-title">Citation</h2><p>If you find TFPO useful, please cite the paper.</p></div>
          <CitationBox />
        </section>
      </article>

      <footer><span>TFPO · Pei Chen · 2026</span><span><a href="./paper.pdf" target="_blank" rel="noreferrer">Paper</a> · <a href="https://github.com/bbbbubble/tfpo">GitHub</a></span></footer>
    </main>
  );
}
