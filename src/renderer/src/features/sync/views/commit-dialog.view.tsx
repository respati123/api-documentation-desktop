import type { ReactElement, ReactNode } from 'react'
import type { useCommitDialogViewModel } from '@/features/sync/viewmodels/use-commit-dialog.viewmodel'
import {
  Alert,
  Badge,
  Button,
  ChangeRow,
  Checkbox,
  CommitRow,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DiffView,
  Icon,
  Input,
  Label,
  MethodTag,
  ScrollArea,
  SegmentedControl,
  Tabs,
  TabsList,
  TabsTrigger,
  Textarea,
} from '@/shared/ui'
import { cn } from '@/shared/utils/cn'

export type CommitDialogViewProps = ReturnType<typeof useCommitDialogViewModel>
type DiffProps = CommitDialogViewProps['diffLayout']
type DiffHeaderProps = NonNullable<CommitDialogViewProps['changes']['diff']>['header']

const bodyClass = 'grid min-h-0 grid-cols-[300px_minmax(0,1fr)] min-[1101px]:grid-cols-[360px_minmax(0,1fr)]'
const statusClass = { added: 'text-ok', modified: 'text-warning', deleted: 'text-destructive' }

function DiffHeader({ header, layout, action }: { header: DiffHeaderProps; layout: DiffProps; action?: ReactNode }): ReactElement {
  return (
    <header className="flex min-h-14 flex-wrap items-center gap-x-3 gap-y-2 border-b border-border px-4 py-2">
      <div className="flex min-w-0 items-center gap-2">
        {header.method && <MethodTag method={header.method} />}
        <strong className="truncate font-semibold" title={header.name}>
          {header.name}
        </strong>
        {header.folder && <span className="truncate text-xs text-muted-foreground">{header.folder}</span>}
        <span className={cn('flex-none text-xs font-medium', statusClass[header.status])}>{header.statusLabel}</span>
      </div>
      <div className="flex flex-none gap-2 font-mono text-xs font-medium">
        <span className="text-ok">+{header.added}</span>
        <span className="text-destructive">-{header.removed}</span>
      </div>
      <div className="ml-auto flex items-center gap-2">
        {action}
        <SegmentedControl
          label={layout.label}
          options={layout.options}
          value={layout.value}
          onChange={layout.onChange}
          testId="commit-dialog-diff-layout"
          optionTestId={(value) => `commit-dialog-diff-${value}`}
        />
      </div>
    </header>
  )
}

function DiffEmpty({ text }: { text: string }): ReactElement {
  return <div className="grid h-full place-items-center p-6 text-center text-muted-foreground">{text}</div>
}

function PushBar({ push }: { push: CommitDialogViewProps['changes']['push'] }): ReactElement | null {
  if (!push.status && !push.pendingLabel) return null
  return (
    <div className="grid gap-1 border-t border-border px-4 py-2 text-secondary-foreground">
      {push.status && (
        <span className="text-xs text-muted-foreground" role="status">
          {push.status}
        </span>
      )}
      {push.pendingLabel && (
        <div className="flex items-center justify-between gap-2">
          <span>{push.pendingLabel}</span>
          <Button
            type="button"
            size="sm"
            data-testid="commit-dialog-push"
            loading={push.pushing}
            disabled={Boolean(push.disabledReason)}
            onClick={push.onPush}
          >
            {push.label}
          </Button>
        </div>
      )}
      {push.pendingLabel && push.disabledReason && <span className="text-xs text-muted-foreground">{push.disabledReason}</span>}
    </div>
  )
}

function ChangesEmpty({ changes, onOpenHistory }: { changes: CommitDialogViewProps['changes']; onOpenHistory: () => void }): ReactElement {
  return (
    <div className="grid min-h-0 grid-rows-[minmax(0,1fr)_auto]">
      <div className="grid place-content-center justify-items-center gap-2 p-6 text-center text-muted-foreground">
        <span className="grid size-10 place-items-center rounded-md bg-muted text-foreground">
          <Icon name="branch" size={20} />
        </span>
        <strong className="text-sm font-semibold text-foreground">{changes.empty.title}</strong>
        <span>{changes.empty.body}</span>
        <Button type="button" size="sm" data-testid="commit-dialog-open-history" onClick={onOpenHistory}>
          {changes.empty.action}
        </Button>
      </div>
      <PushBar push={changes.push} />
    </div>
  )
}

function ChangesPane({
  changes,
  layout,
  onOpenHistory,
}: {
  changes: CommitDialogViewProps['changes']
  layout: DiffProps
  onOpenHistory: () => void
}): ReactElement {
  if (changes.isEmpty) return <ChangesEmpty changes={changes} onOpenHistory={onOpenHistory} />
  const { selectAll } = changes
  return (
    <form className={bodyClass} onSubmit={changes.onSubmit}>
      <div className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] border-r border-border">
        <div className="grid gap-2 border-b border-border px-4 py-3">
          <Label className="flex min-h-6 cursor-pointer items-center gap-2 font-normal text-secondary-foreground">
            <Checkbox
              data-testid="commit-dialog-select-all"
              checked={selectAll.checked}
              indeterminate={selectAll.indeterminate}
              onChange={(event) => selectAll.onToggle(event.target.checked)}
            />
            <span>{selectAll.label}</span>
          </Label>
          {changes.filter.visible && (
            <Input
              data-testid="commit-dialog-filter"
              aria-label={changes.filter.label}
              placeholder={changes.filter.label}
              value={changes.filter.value}
              onChange={(event) => changes.filter.onChange(event.target.value)}
            />
          )}
        </div>
        <ScrollArea type="auto" className="min-h-0">
          <div className="grid gap-3 p-2">
            {changes.noMatch && <p className="m-0 p-4 text-center text-muted-foreground">{changes.noMatch}</p>}
            {changes.groups.map((group) => (
              <section key={group.key} aria-label={group.label}>
                <div className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-muted-foreground">
                  <Icon name="folder" size={14} />
                  <span className="truncate">{group.label}</span>
                </div>
                {group.rows.map((row) => (
                  <ChangeRow
                    key={row.key}
                    name={row.name}
                    status={row.status}
                    statusLabel={row.statusLabel}
                    method={row.method}
                    selected={row.selected}
                    onSelect={row.onSelect}
                    checked={row.checked}
                    indeterminate={row.indeterminate}
                    onCheckedChange={row.onCheckedChange}
                    checkLabel={row.checkLabel}
                    selectTestId="commit-dialog-change-select"
                    checkTestId="commit-dialog-change-check"
                  />
                ))}
              </section>
            ))}
          </div>
        </ScrollArea>
        <div className="grid min-w-0">
          <div className="grid gap-2 border-t border-border bg-sidebar px-4 pt-3 pb-4">
            <div className="flex items-baseline justify-between">
              <Label htmlFor="commit-message">{changes.messageLabel}</Label>
              <span className="text-xs text-muted-foreground">{changes.messageCount}</span>
            </div>
            <Textarea
              data-testid="sync-commit-message-input"
              id="commit-message"
              autoFocus
              required
              rows={3}
              maxLength={changes.messageMax}
              value={changes.message}
              onChange={(event) => changes.onMessageChange(event.target.value)}
              onKeyDown={changes.onMessageKeyDown}
              placeholder={changes.messagePlaceholder}
            />
            <Button
              data-testid="sync-commit-submit-button"
              type="submit"
              variant="primary"
              className="w-full"
              disabled={!changes.canSubmit}
            >
              {changes.submitLabel}
            </Button>
            <span className="text-xs text-muted-foreground">{changes.hint}</span>
          </div>
          <PushBar push={changes.push} />
        </div>
      </div>
      <section className="grid min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)] bg-background" aria-label={changes.diffLabel}>
        {changes.diff ? (
          <>
            <DiffHeader header={changes.diff.header} layout={layout} />
            <div className="grid min-h-0 grid-rows-[minmax(0,1fr)_auto]">
              <DiffView
                rows={changes.diff.rows}
                layout={layout.value}
                leftHeading={changes.diff.leftHeading}
                rightHeading={changes.diff.rightHeading}
                label={changes.diff.regionLabel}
                testId="commit-dialog-diff"
              />
              {changes.diff.noContentText && (
                <p className="m-0 border-t border-border p-3 text-muted-foreground">{changes.diff.noContentText}</p>
              )}
            </div>
          </>
        ) : (
          <div className="row-span-2">
            <DiffEmpty text={changes.diffEmpty} />
          </div>
        )}
      </section>
    </form>
  )
}

function HistoryPane({ history, layout }: { history: CommitDialogViewProps['history']; layout: DiffProps }): ReactElement {
  return (
    <div className={bodyClass}>
      <div className="grid min-h-0 grid-rows-[minmax(0,1fr)_auto] border-r border-border">
        <ScrollArea type="auto" className="min-h-0">
          <div className="grid gap-1 p-2">
            {history.loadingText && (
              <p className="m-0 p-2 text-muted-foreground" role="status">
                {history.loadingText}
              </p>
            )}
            {history.errorText && <Alert variant="destructive">{history.errorText}</Alert>}
            {history.emptyText && <p className="m-0 p-2 text-muted-foreground">{history.emptyText}</p>}
            {history.commits.map((commit) => (
              <CommitRow
                key={commit.id}
                message={commit.message}
                date={commit.date}
                stateLabel={commit.state}
                tone={commit.tone}
                selected={commit.selected}
                testId="commit-dialog-history-commit"
                onSelect={() => history.onSelectCommit(commit.id)}
              />
            ))}
          </div>
        </ScrollArea>
        {history.selectedCommit && (
          <ScrollArea type="auto" className="max-h-60 border-t border-border" aria-busy={history.selectedCommit.busy}>
            <div className="p-2">
              <div className="px-2 py-1 text-xs font-medium text-muted-foreground">{history.changedItemsHeading}</div>
              {history.changesEmpty ? (
                <p className="m-0 p-2 text-muted-foreground" role="status">
                  {history.changesEmpty}
                </p>
              ) : (
                history.changes.map((row) => (
                  <ChangeRow
                    key={row.key}
                    name={row.name}
                    status={row.status}
                    statusLabel={row.statusLabel}
                    method={row.method}
                    selected={row.selected}
                    onSelect={row.onSelect}
                    selectTestId="commit-dialog-history-change"
                  />
                ))
              )}
            </div>
          </ScrollArea>
        )}
      </div>
      <section className="grid min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)] bg-background" aria-label={history.diffRegionLabel}>
        {history.selectedCommit && history.diffHeader ? (
          <>
            <DiffHeader
              header={history.diffHeader}
              layout={layout}
              action={
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  data-testid="commit-dialog-history-revert-button"
                  disabled={history.revert.disabled}
                  onClick={history.revert.onRevert}
                >
                  {history.revert.label}
                </Button>
              }
            />
            <DiffView
              rows={history.diffRows}
              layout={layout.value}
              leftHeading={history.leftHeading}
              rightHeading={history.rightHeading}
              label={history.diffScrollLabel}
              testId="commit-dialog-history-diff"
            />
          </>
        ) : (
          <div className="row-span-2">
            <DiffEmpty text={history.diffEmpty} />
          </div>
        )}
      </section>
    </div>
  )
}

export function CommitDialogView(props: CommitDialogViewProps): ReactElement {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent data-testid="sync-commit-dialog" className="changes-dialog">
        <header className="flex items-center gap-6 border-b border-border py-3 pr-3 pl-6">
          <DialogTitle className="m-0 whitespace-nowrap">{props.title}</DialogTitle>
          <DialogDescription className="sr-only">{props.description}</DialogDescription>
          <Tabs value={props.tabs.view} onValueChange={props.tabs.onSelect}>
            <TabsList aria-label={props.tabs.label}>
              <TabsTrigger value="changes" data-testid="commit-dialog-tab-changes" disabled={props.tabs.changesDisabled}>
                {props.tabs.changesLabel} <Badge variant="count">{props.tabs.changesCount}</Badge>
              </TabsTrigger>
              <TabsTrigger value="history" data-testid="commit-dialog-tab-history">
                {props.tabs.historyLabel} <Badge variant="count">{props.tabs.historyCount}</Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="ml-auto"
            aria-label={props.closeLabel}
            data-testid="commit-dialog-close"
            onClick={props.onClose}
          >
            <Icon name="x" />
          </Button>
        </header>
        {props.tabs.view === 'changes' ? (
          <ChangesPane changes={props.changes} layout={props.diffLayout} onOpenHistory={props.openHistoryTab} />
        ) : (
          <HistoryPane history={props.history} layout={props.diffLayout} />
        )}
      </DialogContent>
    </Dialog>
  )
}
