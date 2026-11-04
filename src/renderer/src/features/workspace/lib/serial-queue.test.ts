import { describe, expect, it } from 'vitest'
import { createSerialQueue } from '@/features/workspace/lib/serial-queue'

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

describe('createSerialQueue', () => {
  it('starts each task only after the previous one has finished', async () => {
    const enqueue = createSerialQueue()
    const saved: string[] = []
    const first = enqueue(async () => {
      await pause(20)
      saved.push('first')
    })
    const second = enqueue(async () => {
      saved.push(`second sees ${saved.length}`)
    })
    await Promise.all([first, second])
    expect(saved).toEqual(['first', 'second sees 1'])
  })

  it('returns each task’s result to its own caller', async () => {
    const enqueue = createSerialQueue()
    expect(await enqueue(async () => 'a')).toBe('a')
    expect(await enqueue(async () => 'b')).toBe('b')
  })

  it('keeps running later tasks after one fails, and reports the failure to its caller', async () => {
    const enqueue = createSerialQueue()
    const failing = enqueue(async () => {
      throw new Error('offline')
    })
    const next = enqueue(async () => 'ran')
    await expect(failing).rejects.toThrow('offline')
    expect(await next).toBe('ran')
  })
})
