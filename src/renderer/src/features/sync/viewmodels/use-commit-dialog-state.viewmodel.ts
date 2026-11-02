import { useState } from 'react'

export type CommitTab = 'changes' | 'history'

// The commit dialog's own state: which tab is open, the commit message, and the selected items.
// The workspace reads it early, because its history loading depends on the open tab.
export function useCommitDialogStateViewModel() {
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<CommitTab>('changes')
  const [message, setMessage] = useState('')
  const [selectedChangeId, setSelectedChangeId] = useState('')
  const [selectedHistoryCommitId, setSelectedHistoryCommitId] = useState('')
  const [selectedHistoryChangeId, setSelectedHistoryChangeId] = useState('')

  return {
    commitDialogOpen: open,
    setCommitDialogOpen: setOpen,
    commitDialogView: view,
    setCommitDialogView: setView,
    commitMessage: message,
    setCommitMessage: setMessage,
    selectedChangeId,
    setSelectedChangeId,
    selectedHistoryCommitId,
    setSelectedHistoryCommitId,
    selectedHistoryChangeId,
    setSelectedHistoryChangeId,
  }
}
