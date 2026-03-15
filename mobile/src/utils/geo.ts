/**
 * Geodesic polygon area (spherical excess formula). Same as frontend MapSelector.
 * Returns area in hectares.
 */
export function computeAreaHa(pts: [number, number][]): number {
    if (pts.length < 3) return 0;
    const R = 6371000; // Earth radius in metres
    const toRad = (d: number) => (d * Math.PI) / 180;
    let area = 0;
    const n = pts.length;
    for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        const lat1 = toRad(pts[i][0]);
        const lat2 = toRad(pts[j][0]);
        const dLng = toRad(pts[j][1] - pts[i][1]);
        area += dLng * (2 + Math.sin(lat1) + Math.sin(lat2));
    }
    return Math.abs((area * R * R) / 2) / 10_000; // m² → ha
}

/** [[lat, lng], ...] → backend [[lng, lat], ...] closed ring */
export function toBackendClosed(points: [number, number][]): number[][] {
    if (points.length < 3) return [];
    const backend = points.map(([lat, lng]) => [lng, lat]);
    backend.push([...backend[0]]);
    return backend;
}

/** Backend [[lng, lat], ...] (closed) → internal [[lat, lng], ...] (no closing point) */
export function fromBackend(coords: number[][]): [number, number][] {
    if (!coords || coords.length < 4) return [];
    return coords.slice(0, -1).map(([lng, lat]) => [lat, lng]);
}
