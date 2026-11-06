import { describe, expect, it } from 'vitest'
import { referencePath } from '@/features/workspace/lib/reference-groups'

describe('referencePath', () => {
  it('drops the base URL variable and the query', () => {
    expect(referencePath('{{baseUrl}}/v1/invoices?limit=10')).toBe('/v1/invoices')
  })

  it('keeps a full URL without its query', () => {
    expect(referencePath('https://api.example.test/v1?a=1')).toBe('https://api.example.test/v1')
  })
})
