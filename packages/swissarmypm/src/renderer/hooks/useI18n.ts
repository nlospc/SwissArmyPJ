import { translations } from '@/i18n';
import { useUIStore } from '@/stores/useUIStore';

function getNestedValue(source: Record<string, any>, path: string): string | undefined {
  return path.split('.').reduce<any>((current, key) => current?.[key], source);
}

export function useI18n() {
  const language = useUIStore((state) => state.language);

  const t = (key: string): string => {
    const value = getNestedValue(translations[language] as Record<string, any>, key);
    if (typeof value === 'string') return value;
    const fallback = getNestedValue(translations.en as Record<string, any>, key);
    if (typeof fallback === 'string') return fallback;
    return key;
  };

  return { t, language };
}
