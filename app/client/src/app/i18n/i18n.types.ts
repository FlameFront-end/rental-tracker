import type { TranslationParams } from './i18n.context'

export type TranslationValue = string | ((params: TranslationParams) => string)

export type TranslationDictionary = Record<string, TranslationValue>
