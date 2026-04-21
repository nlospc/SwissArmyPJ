import zh from './locales/zh';
import en from './locales/en';

export type Language = 'zh' | 'en';

export const translations = {
  zh,
  en,
} as const;

export type TranslationKey = typeof translations.zh;
