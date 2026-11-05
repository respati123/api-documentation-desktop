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
  hasScripts,
  meta,
  tab,
  onTabChange,
  bodyText,
  headerRows,
  cookieRows,
  tests,
  console: consoleOutput,
}: ResponseViewProps): ReactElement {
  const { t } = useTranslation('response')
  // A send that stopped before a response still shows the tests and console of its scripts, so the user can see why.
  const showTabs = kind === 'success' || (kind === 'error' && hasScripts)

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
      {kind === 'error' && !hasScripts && (
        <StateMessage error testId={RESPONSE_TEST_IDS.error} title={t(RESPONSE_TEXT.error.title)} description={errorMessage} />
      )}
      {kind === 'error' && hasScripts && (
        <div className="flex-none px-4 pt-3" data-testid={RESPONSE_TEST_IDS.error}>
          <p className="text-sm font-semibold text-destructive">{t(RESPONSE_TEXT.error.title)}</p>
          <p className="text-xs text-muted-foreground [overflow-wrap:anywhere]">{errorMessage}</p>
        </div>
      )}
      {showTabs && (
        <Tabs value={tab} onValueChange={onTabChange} className="flex min-h-0 flex-1 flex-col px-4 pb-4">
          <TabsList aria-label={t(RESPONSE_TEXT.tabs.label)} className="my-2.5 flex-none self-start">
            {kind === 'success' && (
              <>
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
              </>
            )}
            <TabsTrigger value="tests" data-testid={RESPONSE_TEST_IDS.testsTab}>
              {t(RESPONSE_TEXT.tabs.tests)}
              <Badge variant="outline" className="ml-1.5 px-1.5 font-mono text-[10px]">
                {tests.rows.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="console" data-testid={RESPONSE_TEST_IDS.consoleTab}>
              {t(RESPONSE_TEXT.tabs.console)}
            </TabsTrigger>
          </TabsList>
          {kind === 'success' && (
            <>
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
                            {cookie.hasAttributes && (
                              <small className="font-sans text-[11px] text-muted-foreground">{cookie.attributes}</small>
                            )}
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
            </>
          )}
          <TabsContent value="tests" className="flex min-h-0 flex-1">
            <ScrollArea type="auto" className="min-h-0 flex-1 rounded-md border border-border bg-card">
              {tests.rows.length > 0 ? (
                <dl className="m-0 px-3.5 py-1">
                  {tests.rows.map((row) => (
                    <div
                      className="grid grid-cols-[minmax(0,1fr)_auto] gap-3.5 border-b border-border py-2.5 last:border-b-0"
                      key={row.key}
                      data-testid={RESPONSE_TEST_IDS.testRow(row.key)}
                    >
                      <dt className="min-w-0 text-xs font-semibold [overflow-wrap:anywhere]">
                        {row.name}
                        <span className="ml-2 font-normal text-muted-foreground">{row.phase}</span>
                      </dt>
                      <dd className="m-0 grid justify-items-end gap-1">
                        <Badge variant={row.passed ? 'secondary' : 'destructive'}>{row.passed ? tests.passedText : tests.failedText}</Badge>
                        {row.message && <small className="text-[11px] text-muted-foreground [overflow-wrap:anywhere]">{row.message}</small>}
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <div className="m-auto p-6 text-center text-xs text-muted-foreground" data-testid={RESPONSE_TEST_IDS.testsEmpty}>
                  {tests.emptyText}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
          <TabsContent value="console" className="flex min-h-0 flex-1">
            <ScrollArea type="auto" className="min-h-0 flex-1 rounded-md border border-border bg-foreground text-background">
              {consoleOutput.groups.length > 0 || consoleOutput.notes.length > 0 ? (
                <div className="grid gap-4 p-4" data-testid={RESPONSE_TEST_IDS.consoleOutput}>
                  {consoleOutput.groups.map((group) => (
                    <section className="grid gap-1.5" key={group.key}>
                      <h3 className="font-sans text-[11px] font-semibold uppercase tracking-wide opacity-70">{group.label}</h3>
                      {group.lines.length > 0 && (
                        <pre className="m-0 whitespace-pre-wrap font-mono text-xs leading-relaxed [overflow-wrap:anywhere]">
                          {group.lines.join('\n')}
                        </pre>
                      )}
                      {group.truncated && <p className="m-0 font-sans text-[11px] opacity-70">{consoleOutput.truncatedText}</p>}
                      {group.error && (
                        <p className="m-0 font-mono text-xs text-destructive-foreground [overflow-wrap:anywhere]">{group.error}</p>
                      )}
                    </section>
                  ))}
                  {consoleOutput.notes.map((note) => (
                    <p className="m-0 font-sans text-xs opacity-80" key={note}>
                      {note}
                    </p>
                  ))}
                </div>
              ) : (
                <div className="m-auto p-6 text-center font-sans text-xs opacity-70" data-testid={RESPONSE_TEST_IDS.consoleEmpty}>
                  {consoleOutput.emptyText}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      )}
    </section>
  )
}
