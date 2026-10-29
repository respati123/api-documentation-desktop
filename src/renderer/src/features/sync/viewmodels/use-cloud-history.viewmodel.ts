import { skipToken, useQueries, useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { SYNC_TEXT } from '@/features/sync/constants/sync-text.constants'
import type { CloudCommitDetailRecord } from '@/features/sync/models/cloud-history.model'
import { syncService } from '@/features/sync/services/sync.service'

type Session = { token: string; cloudId: string }

// The session a cloud read needs. Null when the workspace is local-only or nobody is signed in.
function sessionFor(token: string | null, cloudId: string | null): Session | null {
  return token && cloudId ? { token, cloudId } : null
}

function messageOf(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback
}

// The cloud commit list for the history tab. It is fetched only while that tab is open.
export function useCloudHistoryViewModel(input: { token: string | null; cloudId: string | null; enabled: boolean }) {
  const { t } = useTranslation('sync')
  const session = sessionFor(input.token, input.cloudId)
  const query = useQuery({
    queryKey: ['sync', 'history', input.cloudId],
    queryFn: session ? () => syncService.listHistory(session) : skipToken,
    enabled: input.enabled && session !== null,
  })
  return {
    commits: session ? (query.data ?? []) : [],
    loading: input.enabled && query.isFetching,
    error: input.enabled && session && query.error ? messageOf(query.error, t(SYNC_TEXT.history.loadFailed)) : '',
  }
}

// The full cloud commits the history diff needs. Each commit is fetched once and then kept by its id.
export function useCloudCommitDetailsViewModel(input: { token: string | null; cloudId: string | null; commitIds: string[] }) {
  const { t } = useTranslation('sync')
  const session = sessionFor(input.token, input.cloudId)
  const queries = useQueries({
    queries: input.commitIds.map((commitId) => ({
      queryKey: ['sync', 'history', input.cloudId, 'commit', commitId],
      queryFn: session ? () => syncService.getCommit({ ...session, commitId }) : skipToken,
      enabled: session !== null,
    })),
  })
  const failed = queries.find((query) => query.error)
  const detailsById = new Map<string, CloudCommitDetailRecord>()
  input.commitIds.forEach((commitId, index) => {
    const data = queries[index]?.data
    if (data) detailsById.set(commitId, data)
  })
  let error = ''
  if (input.commitIds.length && !session) error = t(SYNC_TEXT.history.signInDetail)
  else if (failed) error = messageOf(failed.error, t(SYNC_TEXT.history.detailFailed))
  return {
    detailsById: detailsById as ReadonlyMap<string, CloudCommitDetailRecord>,
    loading: queries.some((query) => query.isFetching),
    error,
  }
}
