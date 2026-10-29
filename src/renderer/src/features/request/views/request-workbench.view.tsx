import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { REQUEST_TEST_IDS } from '@/features/request/constants/request-test-ids.constants'
import { REQUEST_TEXT } from '@/features/request/constants/request-text.constants'
import type { useRequestWorkbenchViewModel } from '@/features/request/viewmodels/use-request-workbench.viewmodel'
import { AuthEditorView } from '@/features/request/views/auth-editor.view'
import { BodyEditorView } from '@/features/request/views/body-editor.view'
import { HeadersEditorView } from '@/features/request/views/headers-editor.view'
import { ParamsEditorView } from '@/features/request/views/params-editor.view'
import { ClientCodeDialogView, DelayDialogView, RepeatDialogView } from '@/features/request/views/request-dialogs.view'
import { ResponseContractView } from '@/features/request/views/response-contract.view'
import { SendControlView } from '@/features/request/views/send-control.view'
import { ResponseView } from '@/features/response'
import { DebouncedInput, DebouncedTextarea } from '@/shared/components/debounced-field'
import { Button } from '@/shared/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { VariableUrlField } from '@/shared/components/variable-field'

export type RequestWorkbenchViewProps = ReturnType<typeof useRequestWorkbenchViewModel>

export function RequestWorkbenchView({
  readOnly,
  kicker,
  statusText,
  name,
  method,
  methods,
  url,
  suggestions,
  onVariableClick,
  onNameChange,
  onMethodChange,
  onUrlChange,
  onOpenDocs,
  send,
  tabs,
  docs,
  params,
  body,
  auth,
  headers,
  contract,
  delayDialog,
  repeatDialog,
  clientCode,
  response,
}: RequestWorkbenchViewProps): ReactElement {
  const { t } = useTranslation('request')

  return (
    <>
      <form className="request-card" data-testid={REQUEST_TEST_IDS.workbench} onSubmit={send.onSubmit}>
        <div className="request-card-heading">
          <div>
            <p className="section-kicker">{kicker}</p>
            <DebouncedInput
              data-testid={REQUEST_TEST_IDS.name}
              aria-label={t(REQUEST_TEXT.workbench.nameLabel)}
              className="request-name-input"
              value={name}
              readOnly={readOnly}
              onValueChange={onNameChange}
            />
          </div>
          <div className="request-heading-actions">
            <span className="request-status">{statusText}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="request-view-docs"
              data-testid={REQUEST_TEST_IDS.openDocs}
              onClick={onOpenDocs}
            >
              {t(REQUEST_TEXT.workbench.viewDocs)}
            </Button>
          </div>
        </div>
        <div className="request-line">
          <Select value={method} onValueChange={onMethodChange} disabled={readOnly}>
            <SelectTrigger
              data-testid={REQUEST_TEST_IDS.method}
              aria-label={t(REQUEST_TEXT.workbench.methodLabel)}
              className="method-select"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {methods.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <VariableUrlField
            data-testid={REQUEST_TEST_IDS.url}
            aria-label={t(REQUEST_TEXT.workbench.urlLabel)}
            className="url-input"
            value={url}
            suggestions={suggestions}
            onVariableClick={onVariableClick}
            readOnly={readOnly}
            onValueChange={onUrlChange}
            spellCheck={false}
            placeholder={t(REQUEST_TEXT.workbench.urlPlaceholder)}
          />
          <SendControlView {...send} />
        </div>
        {send.notice && (
          <div className="send-schedule-notice" role="status" data-testid={REQUEST_TEST_IDS.send.notice}>
            <span>{send.notice.text}</span>
            <Button type="button" variant="ghost" size="sm" data-testid={REQUEST_TEST_IDS.send.noticeAction} onClick={send.notice.onAction}>
              {send.notice.actionLabel}
            </Button>
          </div>
        )}
        <Tabs defaultValue="params" className="request-tabs">
          <TabsList aria-label={t(REQUEST_TEXT.tabs.label)}>
            <TabsTrigger value="params" data-testid={REQUEST_TEST_IDS.tab('params')}>
              {t(REQUEST_TEXT.tabs.params)}
              {tabs.activeParams > 0 && (
                <>
                  <span className="request-tab-count" aria-hidden="true">
                    {tabs.activeParams}
                  </span>
                  <span className="sr-only">{tabs.activeParamsText}</span>
                </>
              )}
            </TabsTrigger>
            <TabsTrigger value="body" data-testid={REQUEST_TEST_IDS.tab('body')}>
              {t(REQUEST_TEXT.tabs.body)}
              {tabs.hasBody && (
                <>
                  <span className="request-tab-dot" aria-hidden="true" />
                  <span className="sr-only">{t(REQUEST_TEXT.tabs.bodyConfigured)}</span>
                </>
              )}
            </TabsTrigger>
            <TabsTrigger value="auth" data-testid={REQUEST_TEST_IDS.tab('auth')}>
              {t(REQUEST_TEXT.tabs.auth)}
              {tabs.hasAuth && (
                <>
                  <span className="request-tab-dot" aria-hidden="true" />
                  <span className="sr-only">{t(REQUEST_TEXT.tabs.authConfigured)}</span>
                </>
              )}
            </TabsTrigger>
            <TabsTrigger value="headers" data-testid={REQUEST_TEST_IDS.tab('headers')}>
              {t(REQUEST_TEXT.tabs.headers)}
              {tabs.headers > 0 && (
                <>
                  <span className="request-tab-count" aria-hidden="true">
                    {tabs.headers}
                  </span>
                  <span className="sr-only">{tabs.headersText}</span>
                </>
              )}
            </TabsTrigger>
            <TabsTrigger value="responses" data-testid={REQUEST_TEST_IDS.tab('responses')}>
              {t(REQUEST_TEXT.tabs.responses)}
              {tabs.responses > 0 && <span className="request-tab-count">{tabs.responses}</span>}
            </TabsTrigger>
            <TabsTrigger value="docs" data-testid={REQUEST_TEST_IDS.tab('docs')}>
              {t(REQUEST_TEXT.tabs.docs)}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="params" className="editor-pane">
            <ParamsEditorView {...params} />
          </TabsContent>
          <TabsContent value="body" className="editor-pane">
            <BodyEditorView {...body} />
          </TabsContent>
          <TabsContent value="auth" className="editor-pane">
            <AuthEditorView {...auth} />
          </TabsContent>
          <TabsContent value="headers" className="editor-pane">
            <HeadersEditorView {...headers} />
          </TabsContent>
          <TabsContent value="responses" className="editor-pane">
            <ResponseContractView {...contract} />
          </TabsContent>
          <TabsContent value="docs" className="editor-pane">
            <DebouncedTextarea
              data-testid={REQUEST_TEST_IDS.docsField}
              aria-label={t(REQUEST_TEXT.workbench.docsLabel)}
              className="request-docs-field"
              maxLength={100000}
              placeholder={t(REQUEST_TEXT.workbench.docsPlaceholder)}
              value={docs.value}
              readOnly={readOnly}
              onValueChange={docs.onChange}
            />
          </TabsContent>
        </Tabs>
      </form>
      <DelayDialogView {...delayDialog} />
      <RepeatDialogView {...repeatDialog} />
      <ClientCodeDialogView {...clientCode} />
      <ResponseView {...response} />
    </>
  )
}
