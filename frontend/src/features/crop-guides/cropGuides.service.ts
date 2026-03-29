import api from "../../lib/axios";
import type { CropGuide } from "./types";
import { normalizeCropName } from "./normalizeCropName";

export const cropGuidesService = {
    getAllGuides: async (): Promise<CropGuide[]> => {
        const response = await api.get("/crop-guides/get-all-guides");
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

