/**
 * Internationalization hook stub
 * TODO: Implement proper i18n system with react-i18next or similar
 */
export function useI18n() {
    // For now, just return the key as-is (no translation)
    const t = (key) => {
        // Extract last segment for basic formatting
        // e.g., "portfolio.title" -> "title"
        const segments = key.split('.');
        const lastSegment = segments[segments.length - 1];
        // Capitalize first letter
        return lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1);
    };
    return { t };
}
