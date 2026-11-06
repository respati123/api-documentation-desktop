import { describe, expect, it } from 'vitest'
import { formatBytes } from '@/shared/lib/format-bytes'

describe('formatBytes', () => {
  it('uses bytes below one kilobyte', () => expect(formatBytes(345)).toBe('345 B'))
  it('uses one decimal for kilobytes', () => expect(formatBytes(1536)).toBe('1.5 KB'))
  it('uses one decimal for megabytes', () => expect(formatBytes(3 * 1024 * 1024)).toBe('3.0 MB'))
})
