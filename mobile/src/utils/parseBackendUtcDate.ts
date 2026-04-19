/**
 * Backend stores instants in UTC, but some JSON values are ISO-like strings **without**
 * a `Z` / offset (e.g. naïve `LocalDateTime`). `new Date('2026-04-19T12:00:00')` is then
 * interpreted as **local** wall time, which shifts "last seen" and charts by the zone offset.
 * When there is no explicit zone, treat the timestamp as UTC.
 */
function normalizeIsoFractionalSeconds(s: string): string {
    return s.replace(/(\.\d{3})\d+/, '$1');
}

function hasExplicitTimeZone(s: string): boolean {
    return /([zZ]|[+-]\d{2}:\d{2})$/.test(s.trim());
}

export function parseBackendUtcDate(raw: string | null | undefined): Date | null {
    if (raw == null) return null;
    const trimmed = raw.trim();
    if (!trimmed) return null;

    const normalized = normalizeIsoFractionalSeconds(trimmed);

    let parseInput = normalized;
    if (!hasExplicitTimeZone(normalized) && /^\d{4}-\d{2}-\d{2}T/.test(normalized)) {
        parseInput = `${normalized}Z`;
    }

    const d = new Date(parseInput);
    return Number.isNaN(d.getTime()) ? null : d;
}
