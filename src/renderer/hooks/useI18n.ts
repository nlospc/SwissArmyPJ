/**
 * Internationalization hook stub
 * TODO: Implement proper i18n system with react-i18next or similar
 */

const TRANSLATIONS: Record<string, string> = {
  'app.name':       'SwissArmyPM',
  'nav.dashboard':  'Dashboard',
  'nav.portfolio':  'Gantt Chart',
  'nav.inbox':      'Inbox',
  'nav.myWork':     'My Work',
  'nav.search':     'Search',
  'nav.settings':   'Settings',
};

export function useI18n() {
  const t = (key: string): string => {
    if (TRANSLATIONS[key]) return TRANSLATIONS[key];
    // Fallback: capitalize last key segment
    const last = key.split('.').pop() || key;
    return last.charAt(0).toUpperCase() + last.slice(1);
  };

  return { t };
}
