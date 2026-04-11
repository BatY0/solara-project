import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Leaf } from 'lucide-react-native';

import { theme } from '../../src/theme/theme';
import { cropGuidesService } from '../../src/services/cropGuidesService';
import { normalizeCropName } from '../../src/utils/normalizeCropName';
import type { CropGuide, CropGuidePestDisease, CropGuidePostHarvestProfile } from '../../src/types/cropGuides';

export default function GuideDetailScreen() {
    const { slug } = useLocalSearchParams<{ slug: string }>();
    const router = useRouter();
    const { t, i18n } = useTranslation();
    const isTurkish = i18n.language.toLowerCase().startsWith('tr');

    const [guide, setGuide] = useState<CropGuide | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const load = async () => {
            if (!slug) {
                setNotFound(true);
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            setNotFound(false);
            try {
                const result = await cropGuidesService.getGuideBySlug(slug as string);
                if (!isMounted) return;
                if (!result) {
                    setNotFound(true);
                } else {
                    setGuide(result);
                }
            } catch (error) {
                console.error('Failed to load crop guide detail:', error);
                if (isMounted) setNotFound(true);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        load();
        return () => { isMounted = false; };
    }, [slug]);

    // ── Helpers ────────────────────────────────────────────────────────────────
    const valueKey = (value: string) =>
        value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

    const trValue = (group: 'growth_habit' | 'soil_type', value?: string) => {
        if (!value) return '';
        return t(`crop_guide.values.${group}.${valueKey(value)}`, { defaultValue: value });
    };

    const pickPreferredCommonName = (commonNames?: string) => {
        if (!commonNames) return '';
        const parts = commonNames.split(',').map((x) => x.trim()).filter(Boolean);
        if (parts.length === 0) return '';
        if (isTurkish && parts.length > 1) return parts[1];
        return parts[0];
    };

    const localizedGuideName = () => {
        if (!guide?.name) return '';
        const key = normalizeCropName(guide.name);
        const translated = t(`crop_names.${key}`, { defaultValue: '' });
        if (translated) return translated;
        const commonName = pickPreferredCommonName(guide.commonNames);
        if (commonName) return commonName;
        return isTurkish ? '' : guide.name;
    };

    // ── Loading state ───────────────────────────────────────────────────────────
    if (isLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                        <ArrowLeft color={theme.colors.neutral.text} size={20} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{t('crop_guide.details_title')}</Text>
                </View>
                <View style={styles.centerBox}>
                    <ActivityIndicator size="large" color={theme.colors.brand[500]} />
                    <Text style={styles.loadingText}>{t('crop_guide.loading')}</Text>
                </View>
            </SafeAreaView>
        );
    }

    // ── Not found state ─────────────────────────────────────────────────────────
    if (notFound || !guide) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                        <ArrowLeft color={theme.colors.neutral.text} size={20} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{t('crop_guide.details_title')}</Text>
                </View>
                <View style={styles.centerBox}>
                    <Leaf color={theme.colors.neutral.subtext} size={32} />
                    <Text style={styles.notFoundTitle}>{t('crop_guide.not_found_title')}</Text>
                    <Text style={styles.notFoundDesc}>{t('crop_guide.not_found_desc')}</Text>
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <ArrowLeft color="#fff" size={14} />
                        <Text style={styles.backButtonText}>{t('crop_guide.back_to_list')}</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    // ── Build pest/disease and post-harvest text arrays (same logic as frontend) ──
    const pestDiseaseItems: string[] =
        guide.pestDiseases && guide.pestDiseases.length > 0
            ? (guide.pestDiseases as CropGuidePestDisease[]).map((item) => {
                  const type = item.itemType === 'DISEASE' ? 'Disease' : 'Pest';
                  const severity = item.severity ? ` (${item.severity})` : '';
                  const treatment = [item.organicTreatment, item.chemicalTreatment].filter(Boolean).join(' | ');
                  return [`${type}: ${item.name}${severity}`, item.prevention, treatment, item.notes]
                      .filter(Boolean)
                      .join(' - ');
              })
            : [];

    const postHarvestItems: string[] =
        guide.postHarvestProfiles && guide.postHarvestProfiles.length > 0
            ? (guide.postHarvestProfiles as CropGuidePostHarvestProfile[]).map((profile) => {
                  const temp =
                      typeof profile.storageTemperatureMin === 'number' &&
                      typeof profile.storageTemperatureMax === 'number'
                          ? `${profile.storageTemperatureMin}-${profile.storageTemperatureMax}°C`
                          : null;
                  const humidity =
                      typeof profile.storageHumidityMin === 'number' &&
                      typeof profile.storageHumidityMax === 'number'
                          ? `${profile.storageHumidityMin}-${profile.storageHumidityMax}% RH`
                          : null;
                  return [
                      profile.climateBand,
                      profile.curing,
                      temp,
                      humidity,
                      profile.shelfLifeDays ? `${profile.shelfLifeDays} days` : null,
                      profile.storageNotes,
                  ]
                      .filter(Boolean)
                      .join(' - ');
              })
            : [];

    const guideName = localizedGuideName() || guide.name;

    // ── Sections data ───────────────────────────────────────────────────────────
    const sections = [
        {
            title: t('crop_guide.section_overview'),
            items: null as string[] | null,
            content: guide.description,
        },
        {
            title: t('crop_guide.section_environment'),
            items: [
                guide.climateHardiness ? `${t('crop_guide.climate_hardiness')}: ${guide.climateHardiness}` : null,
                guide.frostTolerance   ? `${t('crop_guide.frost_tolerance')}: ${guide.frostTolerance}` : null,
                typeof guide.sunlightHours === 'number' ? `${t('crop_guide.sunlight_hours')}: ${guide.sunlightHours}` : null,
                typeof guide.waterWeeklyMm === 'number' ? `${t('crop_guide.weekly_water')}: ${guide.waterWeeklyMm} mm` : null,
                guide.droughtTolerance ? `${t('crop_guide.drought_tolerance')}: ${guide.droughtTolerance}` : null,
                guide.waterloggingSensitivity ? `${t('crop_guide.waterlogging_sensitivity')}: ${guide.waterloggingSensitivity}` : null,
            ].filter(Boolean) as string[],
            content: null,
        },
        {
            title: t('crop_guide.section_soil'),
            items: [
                guide.soilType ? `${t('crop_guide.soil_type')}: ${trValue('soil_type', guide.soilType)}` : null,
                typeof guide.phMin === 'number' && typeof guide.phMax === 'number'
                    ? `${t('crop_guide.ph_range')}: ${guide.phMin} - ${guide.phMax}`
                    : null,
                guide.nRequirement ? `N: ${guide.nRequirement}` : null,
                guide.pRequirement ? `P: ${guide.pRequirement}` : null,
                guide.kRequirement ? `K: ${guide.kRequirement}` : null,
                guide.soilPreparationSteps ? `${t('crop_guide.soil_preparation')}: ${guide.soilPreparationSteps}` : null,
            ].filter(Boolean) as string[],
            content: null,
        },
        {
            title: t('crop_guide.section_planting'),
            items: [
                guide.plantingMethod ? `${t('crop_guide.planting_method')}: ${guide.plantingMethod}` : null,
                guide.plantingTiming ? `${t('crop_guide.planting_timing')}: ${guide.plantingTiming}` : null,
                typeof guide.spacingPlantCm === 'number' ? `${t('crop_guide.spacing_plant')}: ${guide.spacingPlantCm} cm` : null,
                typeof guide.spacingRowCm === 'number'   ? `${t('crop_guide.spacing_row')}: ${guide.spacingRowCm} cm` : null,
                typeof guide.depthCm === 'number'        ? `${t('crop_guide.depth')}: ${guide.depthCm} cm` : null,
                typeof guide.germinationDays === 'number' ? `${t('crop_guide.germination_days')}: ${guide.germinationDays}` : null,
            ].filter(Boolean) as string[],
            content: null,
        },
        {
            title: t('crop_guide.section_management'),
            items: [
                guide.irrigation    ? `${t('crop_guide.irrigation')}: ${guide.irrigation}` : null,
                guide.fertilization ? `${t('crop_guide.fertilization')}: ${guide.fertilization}` : null,
                guide.weedControl   ? `${t('crop_guide.weed_control')}: ${guide.weedControl}` : null,
                guide.supportPruning ? `${t('crop_guide.support_pruning')}: ${guide.supportPruning}` : null,
            ].filter(Boolean) as string[],
            content: null,
        },
        {
            title: t('crop_guide.section_pests'),
            items: [
                ...pestDiseaseItems,
                ...(pestDiseaseItems.length === 0
                    ? [
                          guide.commonPests         ? `${t('crop_guide.common_pests')}: ${guide.commonPests}` : null,
                          guide.commonDiseases      ? `${t('crop_guide.common_diseases')}: ${guide.commonDiseases}` : null,
                          guide.managementStrategies ? `${t('crop_guide.management_strategies')}: ${guide.managementStrategies}` : null,
                      ]
                    : []),
            ].filter(Boolean) as string[],
            content: null,
        },
        {
            title: t('crop_guide.section_harvest'),
            items: [
                typeof guide.daysToMaturity === 'number' ? `${t('crop_guide.days_label')}: ${guide.daysToMaturity}` : null,
                guide.signsOfReadiness ? `${t('crop_guide.signs_of_readiness')}: ${guide.signsOfReadiness}` : null,
                guide.harvestingMethod ? `${t('crop_guide.harvesting_method')}: ${guide.harvestingMethod}` : null,
                guide.expectedYield   ? `${t('crop_guide.expected_yield')}: ${guide.expectedYield}` : null,
            ].filter(Boolean) as string[],
            content: null,
        },
        {
            title: t('crop_guide.section_storage'),
            items: [
                ...postHarvestItems,
                ...(postHarvestItems.length === 0
                    ? [
                          guide.curing            ? `${t('crop_guide.curing')}: ${guide.curing}` : null,
                          guide.storageConditions  ? `${t('crop_guide.storage_conditions')}: ${guide.storageConditions}` : null,
                          guide.shelfLife          ? `${t('crop_guide.shelf_life')}: ${guide.shelfLife}` : null,
                      ]
                    : []),
            ].filter(Boolean) as string[],
            content: null,
        },
    ];

    return (
        <SafeAreaView style={styles.container}>
            {/* HEADER */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <ArrowLeft color={theme.colors.neutral.text} size={20} />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>{guideName}</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* HERO CARD */}
                <View style={styles.heroCard}>
                    {guide.image ? (
                        <Image source={{ uri: guide.image }} style={styles.heroImage} />
                    ) : (
                        <View style={styles.heroImagePlaceholder}>
                            <Leaf color="#059669" size={40} />
                        </View>
                    )}

                    <View style={styles.heroInfo}>
                        <Text style={styles.heroName}>{guideName}</Text>
                        {guide.scientificName ? (
                            <Text style={styles.heroScientific}>{guide.scientificName}</Text>
                        ) : null}

                        {/* KEY STATS CHIPS */}
                        <View style={styles.chipRow}>
                            {typeof guide.optimalTemperatureMin === 'number' &&
                            typeof guide.optimalTemperatureMax === 'number' ? (
                                <View style={styles.chip}>
                                    <Text style={styles.chipLabel}>{t('crop_guide.optimal_temp')}</Text>
                                    <Text style={styles.chipValue}>
                                        {guide.optimalTemperatureMin}°C – {guide.optimalTemperatureMax}°C
                                    </Text>
                                </View>
                            ) : null}

                            {typeof guide.daysToMaturity === 'number' ? (
                                <View style={[styles.chip, styles.chipBlue]}>
                                    <Text style={[styles.chipLabel, { color: '#1d4ed8' }]}>{t('crop_guide.days_label')}</Text>
                                    <Text style={[styles.chipValue, { color: '#1e3a8a' }]}>{guide.daysToMaturity}</Text>
                                </View>
                            ) : null}

                            {guide.family ? (
                                <View style={[styles.chip, styles.chipPurple]}>
                                    <Text style={[styles.chipLabel, { color: '#6d28d9' }]}>{t('crop_guide.family')}</Text>
                                    <Text style={[styles.chipValue, { color: '#4c1d95' }]}>{guide.family}</Text>
                                </View>
                            ) : null}
                        </View>
                    </View>
                </View>

                {/* SECTION CARDS */}
                {sections.map((section) => (
                    <SectionCard key={section.title} title={section.title} items={section.items} content={section.content} comingSoon={t('crop_guide.coming_soon')} />
                ))}
            </ScrollView>
        </SafeAreaView>
    );
}

function SectionCard({
    title,
    items,
    content,
    comingSoon,
}: {
    title: string;
    items: string[] | null;
    content: string | null | undefined;
    comingSoon: string;
}) {
    const hasItems = items && items.length > 0;
    const hasContent = content && content.trim().length > 0;

    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>{title}</Text>
            {hasItems ? (
                items.map((item, idx) => (
                    <Text key={idx} style={styles.sectionItem}>{'- '}{item}</Text>
                ))
            ) : hasContent ? (
                <Text style={styles.sectionContent}>{content}</Text>
            ) : (
                <Text style={styles.sectionPlaceholder}>{comingSoon}</Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.neutral.canvas },

    header: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        paddingHorizontal: 16, paddingVertical: 12,
        backgroundColor: '#fff', borderBottomWidth: 1,
        borderBottomColor: theme.colors.neutral.border,
    },
    backBtn: {
        width: 36, height: 36, borderRadius: 10,
        backgroundColor: theme.colors.neutral.canvas,
        alignItems: 'center', justifyContent: 'center',
    },
    headerTitle: {
        flex: 1, fontSize: 17, fontWeight: 'bold', color: theme.colors.neutral.dark,
    },

    centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
    loadingText: { color: theme.colors.neutral.subtext, marginTop: 12, fontSize: 14 },
    notFoundTitle: { fontSize: 17, fontWeight: '600', color: theme.colors.neutral.dark, marginTop: 12 },
    notFoundDesc: { fontSize: 14, color: theme.colors.neutral.subtext, marginTop: 6, textAlign: 'center' },
    backButton: {
        flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 20,
        backgroundColor: theme.colors.brand[500], borderRadius: 10,
        paddingHorizontal: 16, paddingVertical: 10,
    },
    backButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },

    scrollContent: { padding: 16, gap: 12, paddingBottom: 40 },

    heroCard: {
        backgroundColor: '#fff', borderRadius: 20,
        overflow: 'hidden', borderWidth: 1, borderColor: theme.colors.neutral.border,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
        marginBottom: 4,
    },
    heroImage: { width: '100%', height: 200 },
    heroImagePlaceholder: {
        width: '100%', height: 200,
        backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center',
    },

    heroInfo: { padding: 16 },
    heroName: { fontSize: 22, fontWeight: 'bold', color: theme.colors.neutral.dark },
    heroSubtext: { fontSize: 13, color: theme.colors.neutral.subtext, marginTop: 4 },
    heroScientific: { fontSize: 13, color: theme.colors.neutral.subtext, marginTop: 2, fontStyle: 'italic' },

    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
    chip: {
        backgroundColor: '#FFF7ED', borderRadius: 10,
        paddingHorizontal: 12, paddingVertical: 8,
    },
    chipBlue: { backgroundColor: '#EFF6FF' },
    chipPurple: { backgroundColor: '#F5F3FF' },
    chipLabel: { fontSize: 11, color: '#c2410c', marginBottom: 2 },
    chipValue: { fontSize: 14, fontWeight: '600', color: '#7c2d12' },

    section: {
        backgroundColor: '#fff', borderRadius: 16, padding: 16,
        borderWidth: 1, borderColor: theme.colors.neutral.border,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
    },
    sectionTitle: { fontSize: 15, fontWeight: 'bold', color: theme.colors.neutral.dark, marginBottom: 8 },
    sectionItem: { fontSize: 13, color: theme.colors.neutral.subtext, lineHeight: 20, marginBottom: 2 },
    sectionContent: { fontSize: 13, color: theme.colors.neutral.subtext, lineHeight: 20 },
    sectionPlaceholder: { fontSize: 13, color: theme.colors.neutral.subtext, fontStyle: 'italic' },
});
