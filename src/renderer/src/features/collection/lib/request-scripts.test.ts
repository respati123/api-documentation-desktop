import { describe, expect, it } from 'vitest'
import { nodeDiffText } from '@/features/collection/lib/tree'
import { normalizeSharedTree, normalizeTree } from '@/features/collection/lib/tree-normalize'
import type { RequestNode } from '@/shared/models/api-node.model'

const request = {
  id: 'r1',
  kind: 'request',
  name: 'Login',
  method: 'POST',
  url: 'https://api.example.com/login',
  body: '',
  preScript: 'apidocs.log("before")',
  postScript: 'apidocs.vars.set("accessToken", apidocs.res.data().token)',
}

describe('request scripts in the tree', () => {
  it('keeps both scripts when a local tree is normalized', () => {
    const [node] = normalizeTree([request as never]) as RequestNode[]
    expect(node.preScript).toBe(request.preScript)
    expect(node.postScript).toBe(request.postScript)
  })

  it('keeps both scripts when a shared tree is normalized', () => {
    const [node] = normalizeSharedTree([request as never]) as RequestNode[]
    expect(node.preScript).toBe(request.preScript)
    expect(node.postScript).toBe(request.postScript)
  })

  it('leaves a request without scripts without script values, so older requests do not change', () => {
    const { preScript: _pre, postScript: _post, ...older } = request
    const [node] = normalizeTree([older as never]) as RequestNode[]
    expect(node.preScript).toBeUndefined()
    expect(node.postScript).toBeUndefined()
  })

  it('drops a script that is not text instead of failing the whole request', () => {
    const [node] = normalizeTree([{ ...request, preScript: 42 } as never]) as RequestNode[]
    expect(node.name).toBe('Login')
    expect(node.preScript).toBeUndefined()
  })

  it('shows a change to a script in the diff text, so the change is not missed', () => {
    const before = nodeDiffText(normalizeTree([request as never])[0] as never)
    const after = nodeDiffText(normalizeTree([{ ...request, postScript: 'apidocs.log(1)' } as never])[0] as never)
    expect(after).not.toBe(before)
  })
})
