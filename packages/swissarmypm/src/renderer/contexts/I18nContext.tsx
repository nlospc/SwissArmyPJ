import React, { createContext, useContext, ReactNode } from 'react';
import { useUIStore } from '@/stores/useUIStore';
import { translations, type TranslationKey } from '@/i18n';

interface I18nContextType {
  t: (key: keyof TranslationKey) => string;
  language: 'zh' | 'en';
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const language = useUIStore((state) => state.language);
  
  const t = (key: keyof TranslationKey): string => {
    const keys = key.split('.');
    let value: any = translations[language];
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    return value || key;
  };

  return (
    <I18nContext.Provider value={{ t, language }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18nContext() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18nContext must be used within I18nProvider');
  }
  return context;
}
