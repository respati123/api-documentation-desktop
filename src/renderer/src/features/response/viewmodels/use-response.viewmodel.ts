import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { RESPONSE_TEXT } from '@/features/response/constants/response-text.constants'
import { cookieParts, formatResponseBody, responseCookies } from '@/features/response/lib/response-export'
import { type ResponseState, type ResponseTab, responseTabSchema, type ScriptRuns } from '@/features/response/models/response.model'

// Owns the response panel: the selected tab and every list and label the view shows.
export function useResponseViewModel({ response, scripts = null }: { response: ResponseState; scripts?: ScriptRuns | null }) {
  const { t } = useTranslation('response')
  // A choice only counts for the response it was made on, so every new response starts on the body tab.
  // A send that stopped before the response has no body, so it starts on the console, which says why.
  const [choice, setChoice] = useState<{ tab: ResponseTab; response: ResponseState } | null>(null)
  const defaultTab: ResponseTab = response.kind === 'success' ? 'body' : 'console'
  const tab = choice?.response === response ? choice.tab : defaultTab

  const data = response.kind === 'success' ? response.data : null
  const headerRows = data ? Object.entries(data.headers).map(([name, value]) => ({ name, value })) : []
  const cookieRows = data
    ? responseCookies(data)
        .map(cookieParts)
        .map((cookie, index) => ({
          position: index,
          name: cookie.name || t(RESPONSE_TEXT.cookies.fallbackName, { position: index + 1 }),
          value: cookie.value,
          attributes: cookie.attributes.join(' · '),
          hasAttributes: cookie.attributes.length > 0,
        }))
    : []

  const phaseLabels = { pre: t(RESPONSE_TEXT.console.pre), post: t(RESPONSE_TEXT.console.post) }
  const runs = (['pre', 'post'] as const).flatMap((phase) => {
    const result = scripts?.[phase]
    return result ? [{ phase, label: phaseLabels[phase], result }] : []
  })
  const testRows = runs.flatMap(({ phase, label, result }) =>
    result.checks.map((check, index) => ({
      key: `${phase}-${index}`,
      phase: label,
      name: check.name,
      passed: check.passed,
      message: check.message ?? '',
    })),
  )
  const consoleGroups = runs.map(({ phase, label, result }) => ({
    key: phase,
    label,
    lines: result.logs,
    truncated: result.logsTruncated,
    error:
      result.error === null
        ? ''
        : result.errorLine === null
          ? result.error
          : t(RESPONSE_TEXT.console.errorAtLine, { line: result.errorLine, message: result.error }),
  }))
  const skippedNotes = (scripts?.skipped ?? []).map((item) =>
    t(item.reason === 'secret' ? RESPONSE_TEXT.console.skippedSecret : RESPONSE_TEXT.console.skippedNoEnvironment, { name: item.name }),
  )

  return {
    kind: response.kind,
    isBusy: response.kind === 'loading',
    errorMessage: response.kind === 'error' ? response.message : '',
    hasScripts: scripts !== null,
    meta: data
      ? {
          statusText: `${data.status} ${data.statusText}`,
          isErrorStatus: data.status >= 400,
          durationText: t(RESPONSE_TEXT.heading.duration, { ms: data.duration }),
        }
      : null,
    tab,
    onTabChange: (value: string) => {
      const parsed = responseTabSchema.safeParse(value)
      if (parsed.success) setChoice({ tab: parsed.data, response })
    },
    bodyText: data ? formatResponseBody(data.body) || t(RESPONSE_TEXT.body.empty) : '',
    headerRows,
    cookieRows,
    tests: {
      rows: testRows,
      emptyText: t(RESPONSE_TEXT.tests.empty),
      passedText: t(RESPONSE_TEXT.tests.passed),
      failedText: t(RESPONSE_TEXT.tests.failed),
    },
    console: {
      groups: consoleGroups,
      notes: skippedNotes,
      emptyText: t(RESPONSE_TEXT.console.empty),
      truncatedText: t(RESPONSE_TEXT.console.truncated),
    },
  }
}
