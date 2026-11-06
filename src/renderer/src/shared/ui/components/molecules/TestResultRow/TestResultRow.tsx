import './TestResultRow.css'

export interface TestResultRowProps {
  name: string
  passed: boolean
  /** Shown under a failed test, such as "Expected a success status, got 401." */
  reason?: string
}

export function TestResultRow({ name, passed, reason }: TestResultRowProps) {
  return (
    <div className="test-result">
      <span className={['test-result__status', passed ? 'test-result__status--pass' : 'test-result__status--fail'].join(' ')}>
        {passed ? 'PASS' : 'FAIL'}
      </span>
      <div className="test-result__body">
        <span>{name}</span>
        {!passed && reason && <small className="test-result__reason">{reason}</small>}
      </div>
    </div>
  )
}
