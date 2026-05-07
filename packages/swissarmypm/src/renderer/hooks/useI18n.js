import { translations } from '@/i18n';
import { useUIStore } from '@/stores/useUIStore';
function getNestedValue(source, path) {
    return path.split('.').reduce((current, key) => current?.[key], source);
}
export function useI18n() {
    const language = useUIStore((state) => state.language);
    const t = (key) => {
        const value = getNestedValue(translations[language], key);
        if (typeof value === 'string')
            return value;
        const fallback = getNestedValue(translations.en, key);
        if (typeof fallback === 'string')
            return fallback;
        return key;
    };
    return { t, language };
}
