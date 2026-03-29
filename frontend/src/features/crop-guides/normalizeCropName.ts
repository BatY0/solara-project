const CROP_ALIASES: Record<string, string> = {
    mothbean: "mothbeans",
    pigeonpea: "pigeonpeas",
    blackgramme: "blackgram",
    mungbean: "mungbean",
    kidneybean: "kidneybeans",
    watermelon: "watermelon",
};

export const normalizeCropName = (value: string): string => {
    const basic = value
        .toLowerCase()
        .trim()
        .replace(/[_\s-]+/g, "")
        .replace(/[^a-z0-9]/g, "");

    return CROP_ALIASES[basic] ?? basic;
};

export const toCropSlug = (value: string): string => {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/[_\s]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
};

