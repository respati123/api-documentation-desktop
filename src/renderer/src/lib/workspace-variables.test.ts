import { describe, expect, test } from 'vitest'
import {
  isReservedVariableName,
  normalizeWorkspaceVariables,
  preserveLocalSecretValues,
  shareableWorkspaceVariables,
  type WorkspaceVariables,
} from '@/lib/workspace-variables'

const local: WorkspaceVariables = {
  globals: [
    { id: 'g1', name: 'token', value: 'real-token', secret: true },
    { id: 'g2', name: 'host', value: 'example.test', secret: false },
  ],
  environments: [{ id: 'e1', name: 'dev', variables: [{ id: 'e1v', name: 'password', value: 'hunter2', secret: true }] }],
}

describe('shareableWorkspaceVariables', () => {
  test('blanks secret values before the variables leave the device', () => {
    const shared = shareableWorkspaceVariables(local)

    expect(shared.globals[0].value).toBe('')
    expect(shared.environments[0].variables[0].value).toBe('')
  })

  test('keeps values that are not secret', () => {
    expect(shareableWorkspaceVariables(local).globals[1].value).toBe('example.test')
  })
})

describe('preserveLocalSecretValues', () => {
  test('puts back the local secret values that the shared copy blanked', () => {
    const restored = preserveLocalSecretValues(shareableWorkspaceVariables(local), local)

    expect(restored).toEqual(local)
  })
})

describe('normalizeWorkspaceVariables', () => {
  test('drops rows that are missing an id, name, or value', () => {
    const normalized = normalizeWorkspaceVariables({
      globals: [
        { id: 'a', name: 'ok', value: '1' },
        { id: 'b', name: 'no value' },
      ],
    })

    expect(normalized.globals).toEqual([{ id: 'a', name: 'ok', value: '1', secret: false }])
  })

  test('returns empty variables for input that is not an object', () => {
    expect(normalizeWorkspaceVariables('nope')).toEqual({ globals: [], environments: [] })
  })
})

describe('isReservedVariableName', () => {
  test('reserves the response. prefix only', () => {
    expect(isReservedVariableName('response.login')).toBe(true)
    expect(isReservedVariableName('responses')).toBe(false)
    expect(isReservedVariableName('baseUrl')).toBe(false)
  })
})
