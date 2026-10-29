import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'
import enCommon from '@/shared/i18n/locales/en/common.json'
import idCommon from '@/shared/i18n/locales/id/common.json'

export const languageStorageKey = 'api-docs-language'
export const supportedLanguages = ['en', 'id'] as const

// Every feature adds its own namespace here, in both languages.
const resources = {
  en: { common: enCommon },
  id: { common: idCommon },
}

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    supportedLngs: supportedLanguages,
    fallbackLng: 'en',
    defaultNS: 'common',
    interpolation: { escapeValue: false },
    detection: { order: ['localStorage', 'navigator'], lookupLocalStorage: languageStorageKey, caches: ['localStorage'] },
  })

export default i18n
