import { Check, Copy } from 'lucide-react';
import { useState } from 'react';

const bibtex = `@article{chen2026tfpo,
  title  = {TFPO: Token-Level Objective Fusion for Stable Preference Alignment},
  author = {Chen, Pei},
  year   = {2026}
}`;

export function CitationBox() {
  const [copied, setCopied] = useState(false);

  async function copyCitation() {
    await navigator.clipboard.writeText(bibtex);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="citation-box">
      <div className="citation-topline">
        <span>BibTeX</span>
        <button type="button" onClick={copyCitation} aria-label="Copy BibTeX citation">
          {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre><code>{bibtex}</code></pre>
    </div>
  );
}
