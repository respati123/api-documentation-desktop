import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { RESPONSE_TEXT } from '@/features/response/constants/response-text.constants'
import { savedResponseService } from '@/features/response/services/saved-response.service'
import { savedResponseSuggestions } from '@/lib/response-references'
import type { VariableSuggestion } from '@/shared/components/variable-field'

// Every query key for saved responses starts with this, so one invalidation refreshes all of them.
export const savedResponsesKey = 'saved-responses'

// The saved responses of the workspace, as menu entries for the variable fields.
export function useSavedResponsesViewModel(workspaceId: string): { suggestions: VariableSuggestion[] } {
  const { t } = useTranslation('response')
  const query = useQuery({
    queryKey: [savedResponsesKey, workspaceId],
    queryFn: () => savedResponseService.list(workspaceId),
    enabled: Boolean(workspaceId),
  })
  const suggestions = savedResponseSuggestions(query.data ?? [], (summary) =>
    t(RESPONSE_TEXT.suggestion.scope, { status: summary.status, statusText: summary.statusText }),
  )
  return { suggestions }
}
