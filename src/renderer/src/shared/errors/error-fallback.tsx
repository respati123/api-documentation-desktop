import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { COMMON_TEXT } from '@/shared/constants/common-text.constants'
import { Alert, AlertDescription, AlertTitle, Button } from '@/shared/ui'

export interface ErrorFallbackProps {
  onRetry: () => void
}

// Shown by the error boundary when a render fails. The retry button resets the boundary and failed queries.
export function ErrorFallback({ onRetry }: ErrorFallbackProps): ReactElement {
  const { t } = useTranslation()

  return (
    <Alert variant="destructive" role="alert" data-testid="shared-error-fallback-container">
      <AlertTitle>{t(COMMON_TEXT.errors.title)}</AlertTitle>
      <AlertDescription>{t(COMMON_TEXT.errors.description)}</AlertDescription>
      <Button type="button" variant="secondary" size="sm" data-testid="shared-error-fallback-retry-button" onClick={onRetry}>
        {t(COMMON_TEXT.actions.retry)}
      </Button>
    </Alert>
  )
}
