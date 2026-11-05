import { describe, expect, it } from 'vitest'
import {
  applyScriptRequest,
  applyVariableChanges,
  scriptVariableValues,
  secretValuesOf,
  toScriptRequest,
} from '@/features/request/lib/script-run'
import type { WorkspaceVariables } from '@/lib/workspace-variables'
import type { RequestNode } from '@/shared/models/api-node.model'

const variables: WorkspaceVariables = {
  globals: [{ id: 'g1', name: 'apiVersion', value: 'v1', secret: false }],
  environments: [
    {
      id: 'dev',
      name: 'Dev',
      variables: [
        { id: 'e1', name: 'baseUrl', value: 'https://dev.example.com', secret: false },
        { id: 'e2', name: 'accessToken', value: 'tok-secret', secret: true },
      ],
    },
  ],
}

const request = {
  id: 'r1',
  kind: 'request',
  name: 'Me',
  method: 'GET',
  url: '{{baseUrl}}/me',
  body: '',
  headers: [
    { id: 'h1', name: 'Accept', value: '*/*', enabled: true },
    { id: 'h2', name: 'X-Old', value: '1', enabled: false },
  ],
} as RequestNode

describe('scriptVariableValues and secretValuesOf', () => {
  it('gives the active environment and the globals, and lists the secret values', () => {
    expect(scriptVariableValues(variables, 'dev')).toEqual({
      environment: { baseUrl: 'https://dev.example.com', accessToken: 'tok-secret' },
      globals: { apiVersion: 'v1' },
    })
    expect(secretValuesOf(variables)).toEqual(['tok-secret'])
  })
})

describe('toScriptRequest and applyScriptRequest', () => {
  it('shows a script only the enabled headers', () => {
    expect(toScriptRequest(request).headers).toEqual([{ name: 'Accept', value: '*/*' }])
  })

  it('applies the script request, keeps disabled headers, and reuses an existing header id', () => {
    const applied = applyScriptRequest(request, {
      method: 'POST',
      url: 'https://dev.example.com/me',
      headers: [
        { name: 'Accept', value: 'application/json' },
        { name: 'Authorization', value: 'Bearer x' },
      ],
    })
    expect(applied.method).toBe('POST')
    expect(applied.url).toBe('https://dev.example.com/me')
    expect(applied.headers).toEqual([
      { id: 'h1', name: 'Accept', value: 'application/json', enabled: true },
      { id: expect.any(String), name: 'Authorization', value: 'Bearer x', enabled: true },
      { id: 'h2', name: 'X-Old', value: '1', enabled: false },
    ])
  })
})

describe('applyVariableChanges', () => {
  it('saves a write to the active environment and a write to globals, and replaces a value that exists', () => {
    const { variables: next, skipped } = applyVariableChanges(variables, 'dev', {
      writes: [
        { scope: 'environment', name: 'baseUrl', value: 'https://new.example.com' },
        { scope: 'global', name: 'apiVersion', value: 'v2' },
        { scope: 'environment', name: 'userId', value: '7' },
      ],
      removals: [],
    })
    expect(skipped).toEqual([])
    expect(next.globals.find((row) => row.name === 'apiVersion')?.value).toBe('v2')
    const env = next.environments[0].variables
    expect(env.find((row) => row.name === 'baseUrl')?.value).toBe('https://new.example.com')
    expect(env.find((row) => row.name === 'userId')?.value).toBe('7')
  })

  it('does not change the variables it was given', () => {
    applyVariableChanges(variables, 'dev', { writes: [{ scope: 'global', name: 'apiVersion', value: 'v9' }], removals: [] })
    expect(variables.globals[0].value).toBe('v1')
  })

  it('names an environment write that cannot be saved because no environment is active', () => {
    const { skipped } = applyVariableChanges(variables, null, {
      writes: [{ scope: 'environment', name: 'userId', value: '7' }],
      removals: [],
    })
    expect(skipped).toEqual([{ name: 'userId', reason: 'noEnvironment' }])
  })

  it('does not overwrite or remove a secret variable, and names it as skipped', () => {
    const { variables: next, skipped } = applyVariableChanges(variables, 'dev', {
      writes: [{ scope: 'environment', name: 'accessToken', value: 'stolen' }],
      removals: [{ scope: 'environment', name: 'accessToken' }],
    })
    expect(next.environments[0].variables.find((row) => row.name === 'accessToken')?.value).toBe('tok-secret')
    expect(skipped).toEqual([
      { name: 'accessToken', reason: 'secret' },
      { name: 'accessToken', reason: 'secret' },
    ])
  })

  it('removes a variable from the chosen scope', () => {
    const { variables: next } = applyVariableChanges(variables, 'dev', {
      writes: [],
      removals: [{ scope: 'environment', name: 'baseUrl' }],
    })
    expect(next.environments[0].variables.map((row) => row.name)).toEqual(['accessToken'])
  })
})
