export const SOIL_TYPES = [
    'alluvial',
    'colluvial',
    'brown_steppe',
    'chestnut_steppe',
    'terra_rossa',
    'brown_forest',
    'vertisol',
    'chernozem',
] as const;

export type FieldSoilType = (typeof SOIL_TYPES)[number];

export function normalizeFieldSoilType(value: string | undefined | null): FieldSoilType {
    if (value && (SOIL_TYPES as readonly string[]).includes(value)) {
        return value as FieldSoilType;
    }
    return 'alluvial';
}
