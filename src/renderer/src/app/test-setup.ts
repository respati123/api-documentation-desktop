import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'
import i18n from '@/shared/i18n'

class TestResizeObserver implements ResizeObserver {
  observe(_target: Element, _options?: ResizeObserverOptions): void {}

  unobserve(_target: Element): void {}

  disconnect(): void {}
}

if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = TestResizeObserver
}

// Tests read English text, so pin the language instead of trusting the detector.
await i18n.changeLanguage('en')

// Vitest globals are off, so Testing Library cannot register its own cleanup.
afterEach(cleanup)
