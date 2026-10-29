import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'
import enAiConnect from '@/shared/i18n/locales/en/ai-connect.json'
import enCommon from '@/shared/i18n/locales/en/common.json'
import enResponse from '@/shared/i18n/locales/en/response.json'
import enVariables from '@/shared/i18n/locales/en/variables.json'
import idAiConnect from '@/shared/i18n/locales/id/ai-connect.json'
import idCommon from '@/shared/i18n/locales/id/common.json'
import idResponse from '@/shared/i18n/locales/id/response.json'
import idVariables from '@/shared/i18n/locales/id/variables.json'

export const languageStorageKey = 'api-docs-language'
export const supportedLanguages = ['en', 'id'] as const

// Every feature adds its own namespace here, in both languages.
const resources = {
  en: { common: enCommon, variables: enVariables, 'ai-connect': enAiConnect, response: enResponse },
  id: { common: idCommon, variables: idVariables, 'ai-connect': idAiConnect, response: idResponse },
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
