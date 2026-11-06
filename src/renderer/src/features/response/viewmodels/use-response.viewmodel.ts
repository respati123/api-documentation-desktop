import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { RESPONSE_TEXT } from '@/features/response/constants/response-text.constants'
import { cookieParts, formatResponseBody, responseCookies } from '@/features/response/lib/response-export'
import { type ResponseState, type ResponseTab, responseTabSchema, type ScriptRuns } from '@/features/response/models/response.model'
import { formatBytes } from '@/shared/lib/format-bytes'

export type SavedExample = { statusCode: string; description: string; mediaType: string; body: string }

function isJsonText(text: string): boolean {
  try {
    JSON.parse(text)
    return true
  } catch {
    return false
  }
}

// Owns the response panel: the selected tab and every list and label the view shows.
export function useResponseViewModel({
  response,
  scripts = null,
  onSaveExample,
}: {
  response: ResponseState
  scripts?: ScriptRuns | null
  // Missing when the workspace is read only.
  onSaveExample?: (example: SavedExample) => void
}) {
  const { t } = useTranslation('response')
  // A choice only counts for the response it was made on, so every new response starts on the body tab.
  // A send that stopped before the response has no body, so it starts on the console, which says why.
  // The response object is rebuilt on each render, so a choice is tied to what the response holds.
  const responseKey = response.kind === 'success' ? response.data : response.kind === 'error' ? response.message : response.kind
  const [choice, setChoice] = useState<{ tab: ResponseTab; responseKey: unknown } | null>(null)
  const defaultTab: ResponseTab = response.kind === 'success' ? 'body' : 'console'
  const tab = choice?.responseKey === responseKey ? choice.tab : defaultTab

  const [copiedKey, setCopiedKey] = useState<unknown>(null)
  const data = response.kind === 'success' ? response.data : null
  const body = data ? formatResponseBody(data.body) : ''
  const isJson = body !== '' && isJsonText(body)
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
    sizeText: data ? formatBytes(new Blob([data.body]).size) : '',
    tab,
    onTabChange: (value: string) => {
      const parsed = responseTabSchema.safeParse(value)
      if (parsed.success) setChoice({ tab: parsed.data, responseKey })
    },
    bodyText: data ? body || t(RESPONSE_TEXT.body.empty) : '',
    bodyLanguage: isJson ? ('json' as const) : ('text' as const),
    bodyLanguageLabel: isJson ? t(RESPONSE_TEXT.body.languageJson) : t(RESPONSE_TEXT.body.languageText),
    copy: {
      label: copiedKey === responseKey ? t(RESPONSE_TEXT.body.copied) : t(RESPONSE_TEXT.body.copy),
      onClick: () => {
        void navigator.clipboard.writeText(body).then(() => setCopiedKey(responseKey))
      },
    },
    saveExample: {
      label: t(RESPONSE_TEXT.body.saveExample),
      disabled: !onSaveExample || body === '',
      onClick: () => {
        if (!data) return
        onSaveExample?.({
          statusCode: String(data.status),
          description: data.statusText,
          mediaType: isJson ? 'application/json' : 'text/plain',
          body,
        })
      },
    },
    headerRows,
    cookieRows,
    tests: {
      rows: testRows,
      failedCount: testRows.filter((row) => !row.passed).length,
      summary: `${testRows.filter((row) => row.passed).length}/${testRows.length}`,
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
