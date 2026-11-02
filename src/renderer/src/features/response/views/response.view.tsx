import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { RESPONSE_TEST_IDS } from '@/features/response/constants/response-test-ids.constants'
import { RESPONSE_TEXT } from '@/features/response/constants/response-text.constants'
import type { useResponseViewModel } from '@/features/response/viewmodels/use-response.viewmodel'
import { StateMessage } from '@/shared/components/state-message'
import { Badge } from '@/shared/components/ui/badge'
import { ScrollArea } from '@/shared/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'

export type ResponseViewProps = ReturnType<typeof useResponseViewModel>

// The workspace grid places this card through its class name, so the name stays until the request card moves too.
export function ResponseView({
  kind,
  isBusy,
  errorMessage,
  meta,
  tab,
  onTabChange,
  bodyText,
  headerRows,
  cookieRows,
}: ResponseViewProps): ReactElement {
  const { t } = useTranslation('response')

  return (
    <section
      className="response-card flex min-h-0 min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-card"
      aria-live="polite"
      aria-busy={isBusy}
      data-testid={RESPONSE_TEST_IDS.container}
    >
      <div className="flex min-h-16 flex-none items-center justify-between gap-4 border-b border-border px-4 py-3">
        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground">{t(RESPONSE_TEXT.heading.kicker)}</p>
          <h2 className="text-base font-bold tracking-tight">{t(RESPONSE_TEXT.heading.title)}</h2>
        </div>
        {meta && (
          <div className="flex items-center gap-3.5 font-mono text-xs text-muted-foreground" data-testid={RESPONSE_TEST_IDS.status}>
            <Badge variant={meta.isErrorStatus ? 'destructive' : 'secondary'}>{meta.statusText}</Badge>
            <span>{meta.durationText}</span>
          </div>
        )}
      </div>
      {kind === 'empty' && (
        <StateMessage
          testId={RESPONSE_TEST_IDS.empty}
          title={t(RESPONSE_TEXT.empty.title)}
          description={t(RESPONSE_TEXT.empty.description)}
        />
      )}
      {kind === 'loading' && (
        <StateMessage
          testId={RESPONSE_TEST_IDS.loading}
          title={t(RESPONSE_TEXT.loading.title)}
          description={t(RESPONSE_TEXT.loading.description)}
        />
      )}
      {kind === 'error' && (
        <StateMessage error testId={RESPONSE_TEST_IDS.error} title={t(RESPONSE_TEXT.error.title)} description={errorMessage} />
      )}
      {kind === 'success' && (
        <Tabs value={tab} onValueChange={onTabChange} className="flex min-h-0 flex-1 flex-col px-4 pb-4">
          <TabsList aria-label={t(RESPONSE_TEXT.tabs.label)} className="my-2.5 flex-none self-start">
            <TabsTrigger value="body" data-testid={RESPONSE_TEST_IDS.bodyTab}>
              {t(RESPONSE_TEXT.tabs.body)}
            </TabsTrigger>
            <TabsTrigger value="headers" data-testid={RESPONSE_TEST_IDS.headersTab}>
              {t(RESPONSE_TEXT.tabs.headers)}
              <Badge variant="outline" className="ml-1.5 px-1.5 font-mono text-[10px]">
                {headerRows.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="cookies" data-testid={RESPONSE_TEST_IDS.cookiesTab}>
              {t(RESPONSE_TEXT.tabs.cookies)}
              <Badge variant="outline" className="ml-1.5 px-1.5 font-mono text-[10px]">
                {cookieRows.length}
              </Badge>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="body" className="flex min-h-0 flex-1">
            <ScrollArea type="auto" className="min-h-0 flex-1 rounded-md border border-border bg-foreground text-background">
              <pre className="m-0 min-h-full p-5 font-mono text-xs leading-relaxed" data-testid={RESPONSE_TEST_IDS.body}>
                {bodyText}
              </pre>
            </ScrollArea>
          </TabsContent>
          <TabsContent value="headers" className="flex min-h-0 flex-1">
            <ScrollArea type="auto" className="min-h-0 flex-1 rounded-md border border-border bg-card">
              {headerRows.length > 0 ? (
                <dl className="m-0 px-3.5 py-1">
                  {headerRows.map((row) => (
                    <div
                      className="grid grid-cols-[minmax(130px,0.7fr)_minmax(0,1.3fr)] gap-3.5 border-b border-border py-2.5 last:border-b-0"
                      key={row.name}
                      data-testid={RESPONSE_TEST_IDS.headerRow(row.name)}
                    >
                      <dt className="text-xs font-semibold text-muted-foreground [overflow-wrap:anywhere]">{row.name}</dt>
                      <dd className="m-0 min-w-0 font-mono text-xs [overflow-wrap:anywhere]">{row.value}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <div className="m-auto p-6 text-center text-xs text-muted-foreground" data-testid={RESPONSE_TEST_IDS.headersEmpty}>
                  {t(RESPONSE_TEXT.headers.empty)}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
          <TabsContent value="cookies" className="flex min-h-0 flex-1">
            <ScrollArea type="auto" className="min-h-0 flex-1 rounded-md border border-border bg-card">
              {cookieRows.length > 0 ? (
                <dl className="m-0 px-3.5 py-1">
                  {cookieRows.map((cookie) => (
                    <div
                      className="grid grid-cols-[minmax(130px,0.7fr)_minmax(0,1.3fr)] gap-3.5 border-b border-border py-2.5 last:border-b-0"
                      key={cookie.position}
                      data-testid={RESPONSE_TEST_IDS.cookieRow(cookie.position)}
                    >
                      <dt className="text-xs font-semibold text-muted-foreground [overflow-wrap:anywhere]">{cookie.name}</dt>
                      <dd className="m-0 grid min-w-0 gap-1 font-mono text-xs">
                        <code className="[overflow-wrap:anywhere]">{cookie.value}</code>
                        {cookie.hasAttributes && <small className="font-sans text-[11px] text-muted-foreground">{cookie.attributes}</small>}
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <div className="m-auto p-6 text-center text-xs text-muted-foreground" data-testid={RESPONSE_TEST_IDS.cookiesEmpty}>
                  {t(RESPONSE_TEXT.cookies.empty)}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      )}
    </section>
  )
}
