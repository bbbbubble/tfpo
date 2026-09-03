import katex from 'katex';

type MathProps = {
  children: string;
  className?: string;
};

function renderMath(expression: string, displayMode: boolean) {
  return katex.renderToString(expression, {
    displayMode,
    output: 'htmlAndMathml',
    strict: false,
    throwOnError: false,
  });
}

export function InlineMath({ children, className = '' }: MathProps) {
  return (
    <span
      className={`math-inline ${className}`.trim()}
      dangerouslySetInnerHTML={{ __html: renderMath(children, false) }}
    />
  );
}

export function DisplayMath({ children, className = '' }: MathProps) {
  return (
    <div
      className={`math-display ${className}`.trim()}
      dangerouslySetInnerHTML={{ __html: renderMath(children, true) }}
    />
  );
}
