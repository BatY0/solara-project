import i18n from '../i18n/i18n';
import api from '../api/api';
import type { CropGuide } from '../types/cropGuides';
import { normalizeCropName } from '../utils/normalizeCropName';

const getActiveLanguage = (): string => {
    const lang = i18n.language?.toLowerCase() ?? 'en';
    return lang.startsWith('tr') ? 'tr' : 'en';
};

export const cropGuidesService = {
    getAllGuides: async (): Promise<CropGuide[]> => {
        const response = await api.get('/crop-guides/get-all-guides', {
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
