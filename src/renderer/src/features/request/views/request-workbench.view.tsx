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
import { ScriptEditorView } from '@/features/request/views/script-editor.view'
import { SendControlView } from '@/features/request/views/send-control.view'
import { ResponseView } from '@/features/response'
import { DebouncedInput, DebouncedTextarea } from '@/shared/components/debounced-field'
import { MarkdownView } from '@/shared/components/markdown-view'
import { Button } from '@/shared/components/ui/button'
import { Label } from '@/shared/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { VariableUrlField } from '@/shared/components/variable-field'

const TAB_COUNT =
  'ml-2 inline-flex h-[15px] min-w-[15px] shrink-0 items-center justify-center rounded-full border border-border px-2 text-center text-[9px] leading-none text-muted-foreground tabular-nums'
const TAB_DOT = 'ml-2 inline-block size-[6px] shrink-0 rounded-full bg-primary'

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
  scripts,
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
        <div className="flex min-h-[66px] items-center justify-between gap-4 border-b border-border px-4 py-4 max-[720px]:px-4">
          <div>
            <p className="section-kicker">{kicker}</p>
            <DebouncedInput
              data-testid={REQUEST_TEST_IDS.name}
              aria-label={t(REQUEST_TEXT.workbench.nameLabel)}
              className="mt-2 h-[32px] min-h-[32px] w-[min(360px,62vw)] border-transparent px-2 text-[16px] font-bold shadow-none hover:border-border focus-visible:border-primary md:text-[16px] focus-visible:ring-2 focus-visible:ring-primary/20"
              value={name}
              readOnly={readOnly}
              onValueChange={onNameChange}
            />
          </div>
          <div className="flex items-center gap-2 max-[720px]:flex-col max-[720px]:items-end max-[720px]:gap-2">
            <span className="text-[12px] font-medium text-muted-foreground">{statusText}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0 text-[11px] text-foreground"
              data-testid={REQUEST_TEST_IDS.openDocs}
              onClick={onOpenDocs}
            >
              {t(REQUEST_TEXT.workbench.viewDocs)}
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-[116px_minmax(0,1fr)_auto] gap-2 px-4 pt-4 pb-4 max-[1040px]:grid-cols-[104px_minmax(0,1fr)] max-[720px]:grid-cols-[92px_minmax(0,1fr)] max-[720px]:p-4">
          <Select value={method} onValueChange={onMethodChange} disabled={readOnly}>
            <SelectTrigger
              data-testid={REQUEST_TEST_IDS.method}
              aria-label={t(REQUEST_TEXT.workbench.methodLabel)}
              className="h-9 w-full px-2 font-bold"
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
          <div
            className="mx-4 mb-2 flex min-h-[36px] items-center justify-between gap-4 rounded-[6px] border border-primary/20 bg-primary/5 py-0 pr-2 pl-4 text-[12px] text-foreground"
            role="status"
            data-testid={REQUEST_TEST_IDS.send.notice}
          >
            <span>{send.notice.text}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-[28px] min-h-[28px] px-2"
              data-testid={REQUEST_TEST_IDS.send.noticeAction}
              onClick={send.notice.onAction}
            >
              {send.notice.actionLabel}
            </Button>
          </div>
        )}
        <Tabs
          defaultValue="params"
          className="flex min-h-0 flex-1 flex-col px-4 pb-4 max-[1040px]:px-4 max-[1040px]:pb-4 [&>[role=tablist]]:self-start max-[1040px]:[&>[role=tablist]]:w-full max-[1040px]:[&>[role=tablist]]:overflow-x-auto max-[1040px]:[&_[role=tab]]:flex-[1_0_auto] max-[1040px]:[&_[role=tab]]:px-4"
        >
          <TabsList aria-label={t(REQUEST_TEXT.tabs.label)}>
            <TabsTrigger value="params" data-testid={REQUEST_TEST_IDS.tab('params')}>
              {t(REQUEST_TEXT.tabs.params)}
              {tabs.activeParams > 0 && (
                <>
                  <span className={TAB_COUNT} aria-hidden="true">
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
                  <span className={TAB_DOT} aria-hidden="true" />
                  <span className="sr-only">{t(REQUEST_TEXT.tabs.bodyConfigured)}</span>
                </>
              )}
            </TabsTrigger>
            <TabsTrigger value="auth" data-testid={REQUEST_TEST_IDS.tab('auth')}>
              {t(REQUEST_TEXT.tabs.auth)}
              {tabs.hasAuth && (
                <>
                  <span className={TAB_DOT} aria-hidden="true" />
                  <span className="sr-only">{t(REQUEST_TEXT.tabs.authConfigured)}</span>
                </>
              )}
            </TabsTrigger>
            <TabsTrigger value="headers" data-testid={REQUEST_TEST_IDS.tab('headers')}>
              {t(REQUEST_TEXT.tabs.headers)}
              {tabs.headers > 0 && (
                <>
                  <span className={TAB_COUNT} aria-hidden="true">
                    {tabs.headers}
                  </span>
                  <span className="sr-only">{tabs.headersText}</span>
                </>
              )}
            </TabsTrigger>
            <TabsTrigger value="responses" data-testid={REQUEST_TEST_IDS.tab('responses')}>
              {t(REQUEST_TEXT.tabs.responses)}
              {tabs.responses > 0 && <span className={TAB_COUNT}>{tabs.responses}</span>}
            </TabsTrigger>
            <TabsTrigger value="docs" data-testid={REQUEST_TEST_IDS.tab('docs')}>
              {t(REQUEST_TEXT.tabs.docs)}
            </TabsTrigger>
            <TabsTrigger value="scripts" data-testid={REQUEST_TEST_IDS.tab('scripts')}>
              {t(REQUEST_TEXT.tabs.scripts)}
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
          <TabsContent value="scripts" className="editor-pane">
            <div className="grid min-w-0 content-start gap-6">
              <div className="grid gap-1">
                <h3 className="text-sm font-semibold text-foreground">{t(REQUEST_TEXT.workbench.scriptsLabel)}</h3>
                <p className="text-sm text-muted-foreground">{t(REQUEST_TEXT.workbench.scriptsNote)}</p>
              </div>
              <div className="grid min-w-0 gap-1.5">
                <Label htmlFor="request-pre-script">{t(REQUEST_TEXT.workbench.preScriptLabel)}</Label>
                <ScriptEditorView {...scripts.pre} id="request-pre-script" testId={REQUEST_TEST_IDS.preScriptField} />
              </div>
              <div className="grid min-w-0 gap-1.5">
                <Label htmlFor="request-post-script">{t(REQUEST_TEXT.workbench.postScriptLabel)}</Label>
                <ScriptEditorView {...scripts.post} id="request-post-script" testId={REQUEST_TEST_IDS.postScriptField} />
              </div>
            </div>
          </TabsContent>
          <TabsContent value="docs" className="editor-pane">
            <div className="grid min-w-0 content-start gap-4">
              {/* biome-ignore lint/a11y/useSemanticElements: a segmented control groups two toggle buttons, and a fieldset would add a form-style border */}
              <div
                role="group"
                aria-label={t(REQUEST_TEXT.workbench.docsModeLabel)}
                className="inline-flex w-fit items-center gap-1 rounded-md border border-border bg-muted/40 p-1"
              >
                <Button
                  type="button"
                  size="sm"
                  variant={docs.mode === 'markdown' ? 'secondary' : 'ghost'}
                  aria-pressed={docs.mode === 'markdown'}
                  data-testid={REQUEST_TEST_IDS.docsModeMarkdown}
                  onClick={() => docs.onModeChange('markdown')}
                >
                  {t(REQUEST_TEXT.workbench.modeMarkdown)}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={docs.mode === 'preview' ? 'secondary' : 'ghost'}
                  aria-pressed={docs.mode === 'preview'}
                  data-testid={REQUEST_TEST_IDS.docsModePreview}
                  onClick={() => docs.onModeChange('preview')}
                >
                  {t(REQUEST_TEXT.workbench.modePreview)}
                </Button>
              </div>

              {docs.mode === 'markdown' ? (
                <DebouncedTextarea
                  data-testid={REQUEST_TEST_IDS.docsField}
                  aria-label={t(REQUEST_TEXT.workbench.docsLabel)}
                  className="request-docs-field min-h-[60vh] font-mono text-xs"
                  maxLength={100000}
                  placeholder={t(REQUEST_TEXT.workbench.docsPlaceholder)}
                  value={docs.value}
                  readOnly={readOnly}
                  onValueChange={docs.onChange}
                />
              ) : docs.value.trim() === '' ? (
                <p className="text-sm text-muted-foreground">{t(REQUEST_TEXT.workbench.previewEmpty)}</p>
              ) : (
                <section aria-label={t(REQUEST_TEXT.workbench.previewLabel)} className="max-w-3xl">
                  <MarkdownView source={docs.value} testId={REQUEST_TEST_IDS.docsPreview} />
                </section>
              )}
            </div>
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
