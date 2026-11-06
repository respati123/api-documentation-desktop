import { jsonTokens } from '../../../lib/json-tokens'
import './CodeView.css'

export interface CodeViewProps {
  text: string
  /** "json" colors keys, strings, numbers, and literals. */
  language?: 'json' | 'text'
  testId?: string
}

// The numbers beside code. Pass the same text as the code, so each line gets its number.
export function CodeGutter({ text }: { text: string }) {
  return (
    <div className="code-gutter" aria-hidden="true">
      {text
        .split('\n')
        .map((_, index) => index + 1)
        .join('\n')}
    </div>
  )
}

// Read-only code with line numbers. The whole view scrolls, and the numbers stay in place sideways.
export function CodeView({ text, language = 'text', testId }: CodeViewProps) {
  return (
    <div className="code-view">
      <CodeGutter text={text} />
      <pre className="code-view__text" data-testid={testId}>
        {language === 'json'
          ? jsonTokens(text).map((token, index) => (
              // Tokens are derived from the text and never reorder, so the position is a stable key.
              <span key={`${index}-${token.kind}`} className={`code-token--${token.kind}`}>
                {token.text}
              </span>
            ))
          : text}
      </pre>
    </div>
  )
}
