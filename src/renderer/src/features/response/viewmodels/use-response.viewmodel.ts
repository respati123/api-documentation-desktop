import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { RESPONSE_TEXT } from '@/features/response/constants/response-text.constants'
import { cookieParts, formatResponseBody, responseCookies } from '@/features/response/lib/response-export'
import { type ResponseState, type ResponseTab, responseTabSchema } from '@/features/response/models/response.model'

// Owns the response panel: the selected tab and every list and label the view shows.
export function useResponseViewModel({ response }: { response: ResponseState }) {
  const { t } = useTranslation('response')
  // A choice only counts for the response it was made on, so every new response starts on the body tab.
  const [choice, setChoice] = useState<{ tab: ResponseTab; response: ResponseState } | null>(null)
  const tab = choice?.response === response ? choice.tab : 'body'

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

  return {
    kind: response.kind,
    isBusy: response.kind === 'loading',
    errorMessage: response.kind === 'error' ? response.message : '',
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
  }
}
