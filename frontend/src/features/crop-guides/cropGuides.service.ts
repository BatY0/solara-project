import api from "../../lib/axios";
import type { CropGuide } from "./types";
import { normalizeCropName } from "./normalizeCropName";

const getActiveLanguage = () => {
    const fromStorage = localStorage.getItem("i18nextLng")?.toLowerCase() ?? "en";
    return fromStorage.startsWith("tr") ? "tr" : "en";
};

export const cropGuidesService = {
    getAllGuides: async (): Promise<CropGuide[]> => {
        const response = await api.get("/crop-guides/get-all-guides", {
            params: { lang: getActiveLanguage() },
        });
        return response.data?.data ?? [];
    },

    getGuideBySlug: async (slug: string): Promise<CropGuide | null> => {
        const normalizedSlug = normalizeCropName(slug);
        const guides = await cropGuidesService.getAllGuides();

        return (
            guides.find((guide) => {
                const bySlug = guide.slug ? normalizeCropName(guide.slug) === normalizedSlug : false;
                const byName = normalizeCropName(guide.name) === normalizedSlug;
                return bySlug || byName;
            }) ?? null
        );
    },
};

