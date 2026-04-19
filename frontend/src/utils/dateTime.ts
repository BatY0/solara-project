const HAS_TIMEZONE_PATTERN = /([zZ]|[+\-]\d{2}:\d{2})$/;

/**
 * Parses backend timestamps as UTC when they arrive without an explicit offset.
 * This avoids browser-local reinterpretation of server-side LocalDateTime values.
 */
export function parseBackendDate(value: string | null | undefined): Date {
    if (!value) return new Date(NaN);
    const normalized = HAS_TIMEZONE_PATTERN.test(value) ? value : `${value}Z`;
    return new Date(normalized);
}

/**
 * Formats a JS Date into ISO date-time without timezone marker.
 * Backend currently accepts LocalDateTime query params.
 */
export function toUtcIsoNoZone(value: Date): string {
    return value.toISOString().slice(0, -1);
}

/**
 * Formats Date for `<input type="date">` using local calendar day.
 */
export function toLocalDateInputValue(value: Date): string {
    const offsetMs = value.getTimezoneOffset() * 60000;
    return new Date(value.getTime() - offsetMs).toISOString().slice(0, 10);
}
