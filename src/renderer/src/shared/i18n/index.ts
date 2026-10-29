import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'
import enCommon from '@/shared/i18n/locales/en/common.json'
import enVariables from '@/shared/i18n/locales/en/variables.json'
import idCommon from '@/shared/i18n/locales/id/common.json'
import idVariables from '@/shared/i18n/locales/id/variables.json'

export const languageStorageKey = 'api-docs-language'
export const supportedLanguages = ['en', 'id'] as const

// Every feature adds its own namespace here, in both languages.
const resources = {
  en: { common: enCommon, variables: enVariables },
  id: { common: idCommon, variables: idVariables },
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
