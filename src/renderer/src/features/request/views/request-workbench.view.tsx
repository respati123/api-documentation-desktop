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
import { VariableUrlField } from '@/shared/components/variable-field'
import {
  Badge,
  Button,
  Label,
  MethodSelect,
  PaneBody,
  PaneHead,
  PaneSection,
  SegmentedControl,
  Split,
  StatusDot,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/shared/ui'

export type RequestWorkbenchViewProps = ReturnType<typeof useRequestWorkbenchViewModel>

export function RequestWorkbenchView({
  readOnly,
  folderLabel,
  resolvedUrl,
  name,
  method,
  methods,
  url,
  suggestions,
  onVariableClick,
  onNameChange,
  onMethodChange,
  onUrlChange,
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
      <form className="flex min-h-0 flex-1 flex-col" data-testid={REQUEST_TEST_IDS.workbench} onSubmit={send.onSubmit}>
        <div className="grid flex-none gap-1.5 border-b border-border px-4 pt-2 pb-3">
          <div className="flex min-h-[26px] min-w-0 items-center gap-1.5">
            <span className="whitespace-nowrap text-muted-foreground">{folderLabel}</span>
            <DebouncedInput
              appearance="title"
              data-testid={REQUEST_TEST_IDS.name}
              aria-label={t(REQUEST_TEXT.workbench.nameLabel)}
              value={name}
              readOnly={readOnly}
              onValueChange={onNameChange}
            />
            <span
              className="ml-auto min-w-0 truncate font-mono text-[11px] leading-4 text-muted-foreground max-[760px]:hidden"
              title={resolvedUrl}
              data-testid={REQUEST_TEST_IDS.resolvedUrl}
            >
              {resolvedUrl}
            </span>
          </div>
          <div className="flex min-w-0 gap-2 max-[760px]:flex-wrap">
            <MethodSelect
              value={method}
              methods={methods}
              label={t(REQUEST_TEXT.workbench.methodLabel)}
              disabled={readOnly}
              testId={REQUEST_TEST_IDS.method}
              onChange={onMethodChange}
            />
            <div className="min-w-0 flex-1 max-[760px]:order-3 max-[760px]:basis-full">
              <VariableUrlField
                data-testid={REQUEST_TEST_IDS.url}
                aria-label={t(REQUEST_TEXT.workbench.urlLabel)}
                value={url}
                suggestions={suggestions}
                onVariableClick={onVariableClick}
                readOnly={readOnly}
                onValueChange={onUrlChange}
                spellCheck={false}
                placeholder={t(REQUEST_TEXT.workbench.urlPlaceholder)}
              />
            </div>
            <SendControlView {...send} />
          </div>
        </div>
        {send.notice && (
          <div
            className="mx-4 my-2 flex min-h-[36px] flex-none items-center justify-between gap-4 rounded-md border border-primary/30 bg-primary/10 py-0 pr-2 pl-4 text-[12px] text-foreground"
            role="status"
            data-testid={REQUEST_TEST_IDS.send.notice}
          >
            <span>{send.notice.text}</span>
            <Button variant="ghost" size="sm" data-testid={REQUEST_TEST_IDS.send.noticeAction} onClick={send.notice.onAction}>
              {send.notice.actionLabel}
            </Button>
          </div>
        )}
        <Split
          separatorLabel={t(REQUEST_TEXT.workbench.resizeSplit)}
          first={
            <Tabs value={tabs.value} onValueChange={tabs.onChange} className="pane">
              <PaneHead>
                <TabsList aria-label={t(REQUEST_TEXT.tabs.label)}>
                  <TabsTrigger value="params" data-testid={REQUEST_TEST_IDS.tab('params')}>
                    {t(REQUEST_TEXT.tabs.params)}
                    {tabs.activeParams > 0 && (
                      <>
                        <Badge variant="count">{tabs.activeParams}</Badge>
                        <span className="sr-only">{tabs.activeParamsText}</span>
                      </>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="body" data-testid={REQUEST_TEST_IDS.tab('body')}>
                    {t(REQUEST_TEXT.tabs.body)}
                    {tabs.hasBody && <StatusDot tone="accent" label={t(REQUEST_TEXT.tabs.bodyConfigured)} />}
                  </TabsTrigger>
                  <TabsTrigger value="auth" data-testid={REQUEST_TEST_IDS.tab('auth')}>
                    {t(REQUEST_TEXT.tabs.auth)}
                    {tabs.hasAuth && <StatusDot tone="accent" label={t(REQUEST_TEXT.tabs.authConfigured)} />}
                  </TabsTrigger>
                  <TabsTrigger value="headers" data-testid={REQUEST_TEST_IDS.tab('headers')}>
                    {t(REQUEST_TEXT.tabs.headers)}
                    {tabs.headers > 0 && (
                      <>
                        <Badge variant="count">{tabs.headers}</Badge>
                        <span className="sr-only">{tabs.headersText}</span>
                      </>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="responses" data-testid={REQUEST_TEST_IDS.tab('responses')}>
                    {t(REQUEST_TEXT.tabs.responses)}
                    {tabs.responses > 0 && <Badge variant="count">{tabs.responses}</Badge>}
                  </TabsTrigger>
                  <TabsTrigger value="docs" data-testid={REQUEST_TEST_IDS.tab('docs')}>
                    {t(REQUEST_TEXT.tabs.docs)}
                  </TabsTrigger>
                  <TabsTrigger value="scripts" data-testid={REQUEST_TEST_IDS.tab('scripts')}>
                    {t(REQUEST_TEXT.tabs.scripts)}
                    {tabs.hasScripts && <StatusDot tone="accent" label={t(REQUEST_TEXT.tabs.scriptsConfigured)} />}
                  </TabsTrigger>
                </TabsList>
              </PaneHead>
              <TabsContent asChild value="params">
                <PaneBody>
                  <PaneSection>
                    <ParamsEditorView {...params} />
                  </PaneSection>
                </PaneBody>
              </TabsContent>
              <TabsContent asChild value="body">
                <PaneBody>
                  <BodyEditorView {...body} />
                </PaneBody>
              </TabsContent>
              <TabsContent asChild value="auth">
                <PaneBody>
                  <PaneSection>
                    <AuthEditorView {...auth} />
                  </PaneSection>
                </PaneBody>
              </TabsContent>
              <TabsContent asChild value="headers">
                <PaneBody>
                  <PaneSection>
                    <HeadersEditorView {...headers} />
                  </PaneSection>
                </PaneBody>
              </TabsContent>
              <TabsContent asChild value="responses">
                <PaneBody>
                  <PaneSection>
                    <ResponseContractView {...contract} />
                  </PaneSection>
                </PaneBody>
              </TabsContent>
              <TabsContent asChild value="docs">
                <PaneBody>
                  <PaneSection className="flex-1 grid-rows-[auto_minmax(0,1fr)]">
                    <SegmentedControl
                      label={t(REQUEST_TEXT.workbench.docsModeLabel)}
                      options={docs.modeOptions}
                      value={docs.mode}
                      optionTestId={(mode) => (mode === 'markdown' ? REQUEST_TEST_IDS.docsModeMarkdown : REQUEST_TEST_IDS.docsModePreview)}
                      onChange={docs.onModeChange}
                    />
                    {docs.mode === 'markdown' ? (
                      <DebouncedTextarea
                        mono
                        className="min-h-[240px]"
                        data-testid={REQUEST_TEST_IDS.docsField}
                        aria-label={t(REQUEST_TEXT.workbench.docsLabel)}
                        maxLength={100000}
                        placeholder={t(REQUEST_TEXT.workbench.docsPlaceholder)}
                        value={docs.value}
                        readOnly={readOnly}
                        onValueChange={docs.onChange}
                      />
                    ) : docs.value.trim() === '' ? (
                      <p className="text-[12px] text-muted-foreground">{t(REQUEST_TEXT.workbench.previewEmpty)}</p>
                    ) : (
                      <section aria-label={t(REQUEST_TEXT.workbench.previewLabel)} className="max-w-[68ch]">
                        <MarkdownView source={docs.value} testId={REQUEST_TEST_IDS.docsPreview} />
                      </section>
                    )}
                  </PaneSection>
                </PaneBody>
              </TabsContent>
              <TabsContent asChild value="scripts">
                <PaneBody>
                  <PaneSection>
                    <p className="max-w-[62ch] text-[12px] leading-5 text-muted-foreground">{t(REQUEST_TEXT.workbench.scriptsNote)}</p>
                    <div className="grid min-w-0 gap-1.5">
                      <Label htmlFor="request-pre-script">{t(REQUEST_TEXT.workbench.preScriptLabel)}</Label>
                      <ScriptEditorView {...scripts.pre} id="request-pre-script" testId={REQUEST_TEST_IDS.preScriptField} />
                    </div>
                    <div className="grid min-w-0 gap-1.5">
                      <Label htmlFor="request-post-script">{t(REQUEST_TEXT.workbench.postScriptLabel)}</Label>
                      <ScriptEditorView {...scripts.post} id="request-post-script" testId={REQUEST_TEST_IDS.postScriptField} />
                    </div>
                    <section className="grid min-w-0 gap-4" data-testid={REQUEST_TEST_IDS.scriptReference}>
                      <h3 className="text-[13px] font-semibold text-foreground">{scripts.reference.title}</h3>
                      {scripts.reference.groups.map((group) => (
                        <div className="grid min-w-0 gap-1.5" key={group.key}>
                          <h4 className="text-[12px] font-medium text-muted-foreground">{group.title}</h4>
                          <dl className="m-0 grid gap-2">
                            {group.entries.map((entry) => (
                              <div className="grid min-w-0 gap-0.5" key={entry.signature}>
                                <dt className="flex min-w-0 flex-wrap items-baseline gap-2">
                                  <code className="font-mono text-[12px] [overflow-wrap:anywhere]">{entry.signature}</code>
                                  {entry.phase && <span className="text-[11px] text-muted-foreground">{entry.phase}</span>}
                                </dt>
                                <dd className="m-0 text-[12px] text-muted-foreground [overflow-wrap:anywhere]">{entry.description}</dd>
                              </div>
                            ))}
                          </dl>
                        </div>
                      ))}
                    </section>
                  </PaneSection>
                </PaneBody>
              </TabsContent>
            </Tabs>
          }
          second={<ResponseView {...response} />}
        />
      </form>
      <DelayDialogView {...delayDialog} />
      <RepeatDialogView {...repeatDialog} />
      <ClientCodeDialogView {...clientCode} />
    </>
  )
}
