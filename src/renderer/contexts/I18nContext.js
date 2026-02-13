import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext } from 'react';
import { useUIStore } from '@/stores/useUIStore';
import { translations } from '@/i18n';
const I18nContext = createContext(undefined);
export function I18nProvider({ children }) {
    const language = useUIStore((state) => state.language);
    const t = (key) => {
        const keys = key.split('.');
        let value = translations[language];
        for (const k of keys) {
            value = value?.[k];
        }
        return value || key;
    };
    return (_jsx(I18nContext.Provider, { value: { t, language }, children: children }));
}
export function useI18nContext() {
    const context = useContext(I18nContext);
    if (!context) {
        throw new Error('useI18nContext must be used within I18nProvider');
    }
    return context;
}
