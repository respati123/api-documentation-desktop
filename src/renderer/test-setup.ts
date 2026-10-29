import '@testing-library/jest-dom/vitest'
import i18n from '@/shared/i18n'

// Tests read English text, so pin the language instead of trusting the detector.
await i18n.changeLanguage('en')
