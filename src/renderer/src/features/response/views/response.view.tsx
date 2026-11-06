import type { ReactElement, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { RESPONSE_TEST_IDS } from '@/features/response/constants/response-test-ids.constants'
import { RESPONSE_TEXT } from '@/features/response/constants/response-text.constants'
import type { useResponseViewModel } from '@/features/response/viewmodels/use-response.viewmodel'
import { StateMessage } from '@/shared/components/state-message'
import { Badge, Button, CodeView, Pane, PaneBar, PaneBody, PaneHead, Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui'

export type ResponseViewProps = ReturnType<typeof useResponseViewModel>

// One name and value line, as in the Headers and Cookies tabs.
function DetailRow({ name, testId, children }: { name: string; testId: string; children: ReactNode }): ReactElement {
  return (
    <div className="grid grid-cols-[minmax(120px,.7fr)_minmax(0,1.3fr)] gap-4 border-b border-border px-4 py-2" data-testid={testId}>
      <dt className="text-[12px] font-medium text-muted-foreground [overflow-wrap:anywhere]">{name}</dt>
      <dd className="m-0 min-w-0 font-mono text-[12px] [overflow-wrap:anywhere]">{children}</dd>
    </div>
  )
}

function EmptyLine({ testId, children }: { testId: string; children: string }): ReactElement {
  return (
    <div className="grid min-h-[200px] flex-1 place-content-center p-6 text-center text-muted-foreground" data-testid={testId}>
      {children}
    </div>
  )
}

export function ResponseView({
  kind,
  isBusy,
  errorMessage,
  hasScripts,
  meta,
  sizeText,
  tab,
  onTabChange,
  bodyText,
  bodyLanguage,
  bodyLanguageLabel,
  copy,
  saveExample,
  headerRows,
  cookieRows,
  tests,
  console: consoleOutput,
}: ResponseViewProps): ReactElement {
  const { t } = useTranslation('response')
  // A send that stopped before a response still shows the tests and console of its scripts, so the user can see why.
  const showTabs = kind === 'success' || (kind === 'error' && hasScripts)

  if (!showTabs) {
    return (
      <Pane aria-live="polite" aria-busy={isBusy} data-testid={RESPONSE_TEST_IDS.container}>
        <PaneHead>
          <h2 className="text-[13px] font-bold">{t(RESPONSE_TEXT.heading.title)}</h2>
        </PaneHead>
        <PaneBody>
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
        </PaneBody>
      </Pane>
    )
  }

  return (
    <Tabs
      value={tab}
      onValueChange={onTabChange}
      className="pane"
      aria-live="polite"
      aria-busy={isBusy}
      data-testid={RESPONSE_TEST_IDS.container}
    >
      <PaneHead>
        <TabsList aria-label={t(RESPONSE_TEXT.tabs.label)}>
          {kind === 'success' && (
            <>
              <TabsTrigger value="body" data-testid={RESPONSE_TEST_IDS.bodyTab}>
                {t(RESPONSE_TEXT.tabs.body)}
              </TabsTrigger>
              <TabsTrigger value="headers" data-testid={RESPONSE_TEST_IDS.headersTab}>
                {t(RESPONSE_TEXT.tabs.headers)}
                <Badge variant="count">{headerRows.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="cookies" data-testid={RESPONSE_TEST_IDS.cookiesTab}>
                {t(RESPONSE_TEXT.tabs.cookies)}
                <Badge variant="count">{cookieRows.length}</Badge>
              </TabsTrigger>
            </>
          )}
          <TabsTrigger value="tests" data-testid={RESPONSE_TEST_IDS.testsTab}>
            {t(RESPONSE_TEXT.tabs.tests)}
            <Badge variant="count" className={tests.failedCount > 0 ? 'text-destructive' : 'text-ok'}>
              {tests.summary}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="console" data-testid={RESPONSE_TEST_IDS.consoleTab}>
            {t(RESPONSE_TEXT.tabs.console)}
          </TabsTrigger>
        </TabsList>
        {meta && (
          <div
            className="ml-auto flex items-center gap-3 whitespace-nowrap pl-3 font-mono text-[12px] text-secondary-foreground"
            data-testid={RESPONSE_TEST_IDS.status}
          >
            <Badge shape="chip" variant={meta.isErrorStatus ? 'destructive' : 'success'}>
              {meta.statusText}
            </Badge>
            <span>{meta.durationText}</span>
            <span>{sizeText}</span>
          </div>
        )}
      </PaneHead>
      {kind === 'error' && (
        <div className="flex-none border-b border-border px-4 py-3" data-testid={RESPONSE_TEST_IDS.error}>
          <p className="text-[13px] font-semibold text-destructive">{t(RESPONSE_TEXT.error.title)}</p>
          <p className="text-[12px] text-muted-foreground [overflow-wrap:anywhere]">{errorMessage}</p>
        </div>
      )}
      {kind === 'success' && (
        <>
          <TabsContent asChild value="body">
            <PaneBody>
              <CodeView text={bodyText} language={bodyLanguage} testId={RESPONSE_TEST_IDS.body} />
              <PaneBar>
                <span className="min-w-0 flex-1">{bodyLanguageLabel}</span>
                <Button
                  variant="link"
                  data-testid={RESPONSE_TEST_IDS.saveExample}
                  disabled={saveExample.disabled}
                  onClick={saveExample.onClick}
                >
                  {saveExample.label}
                </Button>
                <Button variant="link" data-testid={RESPONSE_TEST_IDS.copy} onClick={copy.onClick}>
                  {copy.label}
                </Button>
              </PaneBar>
            </PaneBody>
          </TabsContent>
          <TabsContent asChild value="headers">
            <PaneBody>
              {headerRows.length > 0 ? (
                <dl className="m-0 grid">
                  {headerRows.map((row) => (
                    <DetailRow key={row.name} name={row.name} testId={RESPONSE_TEST_IDS.headerRow(row.name)}>
                      {row.value}
                    </DetailRow>
                  ))}
                </dl>
              ) : (
                <EmptyLine testId={RESPONSE_TEST_IDS.headersEmpty}>{t(RESPONSE_TEXT.headers.empty)}</EmptyLine>
              )}
            </PaneBody>
          </TabsContent>
          <TabsContent asChild value="cookies">
            <PaneBody>
              {cookieRows.length > 0 ? (
                <dl className="m-0 grid">
                  {cookieRows.map((cookie) => (
                    <DetailRow key={cookie.position} name={cookie.name} testId={RESPONSE_TEST_IDS.cookieRow(cookie.position)}>
                      {cookie.value}
                      {cookie.hasAttributes && <div className="text-muted-foreground">{cookie.attributes}</div>}
                    </DetailRow>
                  ))}
                </dl>
              ) : (
                <EmptyLine testId={RESPONSE_TEST_IDS.cookiesEmpty}>{t(RESPONSE_TEXT.cookies.empty)}</EmptyLine>
              )}
            </PaneBody>
          </TabsContent>
        </>
      )}
      <TabsContent asChild value="tests">
        <PaneBody>
          {tests.rows.length > 0 ? (
            tests.rows.map((row) => (
              <div
                className="flex items-baseline gap-2.5 border-b border-border px-4 py-2"
                key={row.key}
                data-testid={RESPONSE_TEST_IDS.testRow(row.key)}
              >
                <b className={`w-[34px] flex-none font-mono text-[11px] font-medium ${row.passed ? 'text-ok' : 'text-destructive'}`}>
                  {row.passed ? tests.passedText : tests.failedText}
                </b>
                <div className="min-w-0 [overflow-wrap:anywhere]">
                  {row.name}
                  <span className="ml-2 text-[12px] text-muted-foreground">{row.phase}</span>
                  {row.message && <small className="block font-mono text-[11px] text-destructive">{row.message}</small>}
                </div>
              </div>
            ))
          ) : (
            <EmptyLine testId={RESPONSE_TEST_IDS.testsEmpty}>{tests.emptyText}</EmptyLine>
          )}
        </PaneBody>
      </TabsContent>
      <TabsContent asChild value="console">
        <PaneBody>
          {consoleOutput.groups.length > 0 || consoleOutput.notes.length > 0 ? (
            <div className="grid gap-4 px-4 py-3 font-mono text-[12px] leading-5" data-testid={RESPONSE_TEST_IDS.consoleOutput}>
              {consoleOutput.groups.map((group) => (
                <section className="grid gap-1.5" key={group.key}>
                  <h3 className="text-muted-foreground">{group.label}</h3>
                  {group.lines.length > 0 && (
                    <pre className="m-0 whitespace-pre-wrap [overflow-wrap:anywhere]">{group.lines.join('\n')}</pre>
                  )}
                  {group.truncated && <p className="m-0 text-muted-foreground">{consoleOutput.truncatedText}</p>}
                  {group.error && <p className="m-0 text-destructive [overflow-wrap:anywhere]">{group.error}</p>}
                </section>
              ))}
              {consoleOutput.notes.map((note) => (
                <p className="m-0 text-muted-foreground" key={note}>
                  {note}
                </p>
              ))}
            </div>
          ) : (
            <EmptyLine testId={RESPONSE_TEST_IDS.consoleEmpty}>{consoleOutput.emptyText}</EmptyLine>
          )}
        </PaneBody>
      </TabsContent>
    </Tabs>
  )
}
