import type { ReactElement } from 'react'
import type { useCommitDialogViewModel } from '@/features/sync/viewmodels/use-commit-dialog.viewmodel'
import { ChangeRow, HistoryChangeRow } from '@/features/sync/views/change-rows.view'
import type { TextDiffRow } from '@/lib/text-diff'
import { Button } from '@/shared/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { cn } from '@/shared/utils/cn'

export type CommitDialogViewProps = ReturnType<typeof useCommitDialogViewModel>

function DiffHeader({
  header,
  secondary,
}: {
  header: { code: string; status: string; text: string; name: string }
  secondary: string
}): ReactElement {
  return (
    <header className="diff-file-header">
      <span className={`change-badge change-${header.status}`}>{header.code}</span>
      <strong title={header.name}>{header.name}</strong>
      <span>{secondary}</span>
    </header>
  )
}

function DiffRows({ rows, label }: { rows: TextDiffRow[]; label: string }): ReactElement {
  return (
    // biome-ignore lint/a11y/useSemanticElements: the diff pane is a labelled region with a scroll container, which keeps its current layout
    <div className="diff-scroll" role="region" aria-label={label}>
      {rows.map((row, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: diff rows have no id, and the list is rebuilt whole each time it changes
        <div className="diff-row" key={`${row.kind}-${row.leftLine ?? 'x'}-${row.rightLine ?? 'x'}-${index}`}>
          <div className={`diff-cell ${row.kind === 'removed' ? 'diff-cell-removed' : ''}`}>
            <span className="diff-gutter">{row.leftLine ?? ''}</span>
            <code>{row.leftText || ' '}</code>
          </div>
          <div className={`diff-cell ${row.kind === 'added' ? 'diff-cell-added' : ''}`}>
            <span className="diff-gutter">{row.rightLine ?? ''}</span>
            <code>{row.rightText || ' '}</code>
          </div>
        </div>
      ))}
    </div>
  )
}

function ChangesPane({ changes }: { changes: CommitDialogViewProps['changes'] }): ReactElement {
  return (
    <form className="changes-layout" onSubmit={changes.onSubmit}>
      <div className="changes-sidebar changes-sidebar-commit">
        <Label htmlFor="commit-message" className="text-[12px] font-semibold leading-normal text-slate-700">
          {changes.messageLabel}
        </Label>
        {/* biome-ignore lint/a11y/noAutofocus: the commit dialog opens with the message field focused */}
        <Input
          id="commit-message"
          autoFocus
          required
          maxLength={200}
          value={changes.message}
          onChange={(event) => changes.onMessageChange(event.target.value)}
          placeholder={changes.messagePlaceholder}
        />
        <div className="changes-list-scroll">
          <section className="change-list-section">
            <div className="change-list-heading">
              <strong>{changes.stagedHeading}</strong>
              <span>{changes.stagedCount}</span>
              <button type="button" className="text-action" onClick={changes.onUnstageAll} disabled={!changes.canUnstageAll}>
                {changes.unstageAllLabel}
              </button>
            </div>
            {changes.stagedRows.length ? (
              changes.stagedRows.map((row) => (
                <ChangeRow
                  key={row.key}
                  change={row.change}
                  selected={row.selected}
                  onSelect={() => changes.onSelect(row.change.id)}
                  actionLabel={row.actionLabel}
                  onAction={() => changes.onStage(row.change, false)}
                />
              ))
            ) : (
              <p className="change-empty">{changes.stagedEmpty}</p>
            )}
          </section>
          <section className="change-list-section">
            <div className="change-list-heading">
              <strong>{changes.unstagedHeading}</strong>
              <span>{changes.unstagedCount}</span>
              <button type="button" className="text-action" onClick={changes.onStageAll} disabled={!changes.canStageAll}>
                {changes.stageAllLabel}
              </button>
            </div>
            {changes.unstagedRows.length ? (
              changes.unstagedRows.map((row) => (
                <ChangeRow
                  key={row.key}
                  change={row.change}
                  selected={row.selected}
                  onSelect={() => changes.onSelect(row.change.id)}
                  actionLabel={row.actionLabel}
                  onAction={() => changes.onStage(row.change, true)}
                />
              ))
            ) : (
              <p className="change-empty">{changes.unstagedEmpty}</p>
            )}
          </section>
        </div>
        <div className="changes-sidebar-footer">
          <Button type="submit" disabled={!changes.canSubmit}>
            {changes.submitLabel}
          </Button>
        </div>
      </div>
      <section className="diff-view" aria-label={changes.diffLabel}>
        {changes.diff ? (
          <>
            <DiffHeader header={changes.diff.header} secondary={changes.diff.header.text} />
            <div className="diff-column-headings">
              <span>{changes.diff.leftHeading}</span>
              <span>{changes.diff.rightHeading}</span>
            </div>
            <DiffRows rows={changes.diff.rows} label={changes.diff.regionLabel} />
            {changes.diff.noContentText && <p className="diff-note">{changes.diff.noContentText}</p>}
          </>
        ) : (
          <div className="diff-empty">{changes.diffEmpty}</div>
        )}
      </section>
    </form>
  )
}

function HistoryPane({ history }: { history: CommitDialogViewProps['history'] }): ReactElement {
  return (
    <div className="changes-layout history-layout">
      <div className="changes-sidebar history-sidebar">
        <section className="change-list-section">
          <div className="change-list-heading">
            <strong>{history.commitsHeading}</strong>
            <span>{history.commitCount}</span>
          </div>
          {history.loadingText && (
            <p className="change-empty" role="status">
              {history.loadingText}
            </p>
          )}
          {history.errorText && (
            <p className="history-error" role="status">
              {history.errorText}
            </p>
          )}
          {history.emptyText && <p className="change-empty">{history.emptyText}</p>}
          {history.commits.map((commit) => (
            <button
              key={commit.id}
              type="button"
              className={cn('history-commit-row', commit.selected && 'history-commit-row-selected')}
              aria-pressed={commit.selected}
              onClick={() => history.onSelectCommit(commit.id)}
            >
              <span className={`history-commit-state history-commit-${commit.stateClass}`}>{commit.state}</span>
              <span className="history-commit-copy">
                <strong title={commit.message}>{commit.message}</strong>
                <small>{commit.date}</small>
              </span>
            </button>
          ))}
        </section>
        {history.selectedCommit && (
          <section className="change-list-section" aria-busy={history.selectedCommit.busy}>
            <div className="change-list-heading">
              <strong>{history.changedItemsHeading}</strong>
              <span>{history.changedItemsCount}</span>
            </div>
            {history.changesEmpty ? (
              <p className="change-empty" role="status">
                {history.changesEmpty}
              </p>
            ) : (
              history.changes.map((row) => (
                <HistoryChangeRow
                  key={row.key}
                  change={row.change}
                  selected={row.selected}
                  onSelect={() => history.onSelectChange(row.change.id)}
                  statusText={row.text}
                />
              ))
            )}
          </section>
        )}
      </div>
      <section className="diff-view" aria-label={history.diffRegionLabel}>
        {history.selectedCommit && history.selectedChange ? (
          <>
            <DiffHeader header={history.selectedChange} secondary={history.selectedChange.text} />
            <div className="diff-column-headings">
              <span>{history.parentHeading}</span>
              <span>{history.parentMessage}</span>
            </div>
            <DiffRows rows={history.diffRows} label={history.diffScrollLabel} />
          </>
        ) : (
          <div className="diff-empty">{history.diffEmpty}</div>
        )}
      </section>
    </div>
  )
}

export function CommitDialogView(props: CommitDialogViewProps): ReactElement {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="changes-dialog">
        <DialogHeader>
          <DialogTitle>{props.title}</DialogTitle>
          <DialogDescription>{props.description}</DialogDescription>
        </DialogHeader>
        <div className="commit-view-tabs" role="tablist" aria-label={props.tabs.label}>
          <button
            type="button"
            role="tab"
            aria-selected={props.tabs.view === 'changes'}
            disabled={props.tabs.changesDisabled}
            onClick={() => props.tabs.onSelect('changes')}
          >
            {props.tabs.changesLabel} <span>{props.tabs.changesCount}</span>
          </button>
          <button type="button" role="tab" aria-selected={props.tabs.view === 'history'} onClick={() => props.tabs.onSelect('history')}>
            {props.tabs.historyLabel} <span>{props.tabs.historyCount}</span>
          </button>
        </div>
        {props.tabs.view === 'changes' ? <ChangesPane changes={props.changes} /> : <HistoryPane history={props.history} />}
      </DialogContent>
    </Dialog>
  )
}
