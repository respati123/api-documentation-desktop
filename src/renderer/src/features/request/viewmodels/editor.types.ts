import type { VariableSuggestion } from '@/shared/components/variable-field'
import type { RequestNode } from '@/shared/models/api-node.model'

// What every editor ViewModel receives from the request workbench.
export interface EditorInput {
  request: RequestNode
  readOnly: boolean
  suggestions: VariableSuggestion[]
  onVariableClick: (name: string, sourceValue: string) => void
  onChange: (patch: Partial<RequestNode>) => void
}
