import { memo, useMemo } from 'react'
import { cookieParts, responseCookies } from '@/features/response/lib/response-export'
import type { ResponseState } from '@/features/workspace'
import { cn } from '@/lib/utils'
import { StateMessage } from '@/shared/components/state-message'
import { ScrollArea } from '@/shared/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'

export const ResponseInspector = memo(function ResponseInspector({
  response,
  responseView,
  onResponseViewChange,
}: {
  response: ResponseState
  responseView: 'body' | 'headers' | 'cookies'
  onResponseViewChange: (view: 'body' | 'headers' | 'cookies') => void
}) {
  const formattedBody = useMemo(() => {
    if (response.kind !== 'success') return ''
    try {
      return JSON.stringify(JSON.parse(response.data.body), null, 2)
    } catch {
      return response.data.body
    }
  }, [response])
  const responseCookieRows = useMemo(() => (response.kind === 'success' ? responseCookies(response.data).map(cookieParts) : []), [response])
  return (
    <section className="response-card" aria-live="polite" aria-busy={response.kind === 'loading'}>
      <div className="response-heading">
        <div>
          <p className="section-kicker">Inspector</p>
          <h2>Response</h2>
        </div>
        {response.kind === 'success' && (
          <div className="response-meta">
            <span className={cn('status-code', response.data.status >= 400 && 'status-code-error')}>
              {response.data.status} {response.data.statusText}
            </span>
            <span>{response.data.duration} ms</span>
          </div>
        )}
      </div>
      {response.kind === 'empty' && (
        <StateMessage title="No response yet" description="Send the request to inspect status, headers, timing, and body." />
      )}
      {response.kind === 'loading' && <StateMessage title="Sending request" description="Waiting for the server response." />}
      {response.kind === 'error' && <StateMessage error title="Request failed" description={response.message} />}
      {response.kind === 'success' && (
        <Tabs value={responseView} onValueChange={(value) => onResponseViewChange(value as typeof responseView)} className="response-tabs">
          <TabsList aria-label="Response details" className="response-tab-list">
            <TabsTrigger value="body">Body</TabsTrigger>
            <TabsTrigger value="headers">
              Headers <span className="response-tab-count">{Object.keys(response.data.headers).length}</span>
            </TabsTrigger>
            <TabsTrigger value="cookies">
              Cookies <span className="response-tab-count">{responseCookieRows.length}</span>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="body" className="response-tab-pane">
            <ScrollArea className="response-scroll">
              <pre>{formattedBody || 'Response body is empty.'}</pre>
            </ScrollArea>
          </TabsContent>
          <TabsContent value="headers" className="response-tab-pane">
            <ScrollArea className="response-data-scroll">
              {Object.entries(response.data.headers).length ? (
                <dl className="response-key-values">
                  {Object.entries(response.data.headers).map(([name, value]) => (
                    <div className="response-key-value" key={name}>
                      <dt>{name}</dt>
                      <dd>{value}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <div className="response-empty-detail">The server did not return any headers.</div>
              )}
            </ScrollArea>
          </TabsContent>
          <TabsContent value="cookies" className="response-tab-pane">
            <ScrollArea className="response-data-scroll">
              {responseCookieRows.length ? (
                <dl className="response-cookie-list">
                  {responseCookieRows.map((cookie, index) => (
                    <div className="response-cookie" key={`${cookie.name}-${index}`}>
                      <dt>{cookie.name || `Cookie ${index + 1}`}</dt>
                      <dd>
                        <code>{cookie.value}</code>
                        {cookie.attributes.length > 0 && <small>{cookie.attributes.join(' · ')}</small>}
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <div className="response-empty-detail">No Set-Cookie headers were returned.</div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      )}
    </section>
  )
})
