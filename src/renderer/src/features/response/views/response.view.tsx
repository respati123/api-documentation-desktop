import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { RESPONSE_TEST_IDS } from '@/features/response/constants/response-test-ids.constants'
import { RESPONSE_TEXT } from '@/features/response/constants/response-text.constants'
import type { useResponseViewModel } from '@/features/response/viewmodels/use-response.viewmodel'
import { StateMessage } from '@/shared/components/state-message'
import { ScrollArea } from '@/shared/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { cn } from '@/shared/utils/cn'

export type ResponseViewProps = ReturnType<typeof useResponseViewModel>

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
    <section className="response-card" aria-live="polite" aria-busy={isBusy} data-testid={RESPONSE_TEST_IDS.container}>
      <div className="response-heading">
        <div>
          <p className="section-kicker">{t(RESPONSE_TEXT.heading.kicker)}</p>
          <h2>{t(RESPONSE_TEXT.heading.title)}</h2>
        </div>
        {meta && (
          <div className="response-meta" data-testid={RESPONSE_TEST_IDS.status}>
            <span className={cn('status-code', meta.isErrorStatus && 'status-code-error')}>{meta.statusText}</span>
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
        <Tabs value={tab} onValueChange={onTabChange} className="response-tabs">
          <TabsList aria-label={t(RESPONSE_TEXT.tabs.label)} className="response-tab-list">
            <TabsTrigger value="body" data-testid={RESPONSE_TEST_IDS.bodyTab}>
              {t(RESPONSE_TEXT.tabs.body)}
            </TabsTrigger>
            <TabsTrigger value="headers" data-testid={RESPONSE_TEST_IDS.headersTab}>
              {t(RESPONSE_TEXT.tabs.headers)} <span className="response-tab-count">{headerRows.length}</span>
            </TabsTrigger>
            <TabsTrigger value="cookies" data-testid={RESPONSE_TEST_IDS.cookiesTab}>
              {t(RESPONSE_TEXT.tabs.cookies)} <span className="response-tab-count">{cookieRows.length}</span>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="body" className="response-tab-pane">
            <ScrollArea className="response-scroll">
              <pre data-testid={RESPONSE_TEST_IDS.body}>{bodyText}</pre>
            </ScrollArea>
          </TabsContent>
          <TabsContent value="headers" className="response-tab-pane">
            <ScrollArea className="response-data-scroll">
              {headerRows.length > 0 ? (
                <dl className="response-key-values">
                  {headerRows.map((row) => (
                    <div className="response-key-value" key={row.name} data-testid={RESPONSE_TEST_IDS.headerRow(row.name)}>
                      <dt>{row.name}</dt>
                      <dd>{row.value}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <div className="response-empty-detail" data-testid={RESPONSE_TEST_IDS.headersEmpty}>
                  {t(RESPONSE_TEXT.headers.empty)}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
          <TabsContent value="cookies" className="response-tab-pane">
            <ScrollArea className="response-data-scroll">
              {cookieRows.length > 0 ? (
                <dl className="response-cookie-list">
                  {cookieRows.map((cookie) => (
                    <div className="response-cookie" key={cookie.position} data-testid={RESPONSE_TEST_IDS.cookieRow(cookie.position)}>
                      <dt>{cookie.name}</dt>
                      <dd>
                        <code>{cookie.value}</code>
                        {cookie.hasAttributes && <small>{cookie.attributes}</small>}
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <div className="response-empty-detail" data-testid={RESPONSE_TEST_IDS.cookiesEmpty}>
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
