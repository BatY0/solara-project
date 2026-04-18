import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Leaf, LogOut, Search } from 'lucide-react-native';

import { theme } from '../../src/theme/theme';
import { useAuth } from '../../src/context/AuthContext';
import { cropGuidesService } from '../../src/services/cropGuidesService';
import { normalizeCropName, toCropSlug } from '../../src/utils/normalizeCropName';
import type { CropGuide } from '../../src/types/cropGuides';

export default function GuidesScreen() {
    const router = useRouter();
    const { logout } = useAuth();
    const { t, i18n } = useTranslation();
    const isTurkish = i18n.language.toLowerCase().startsWith('tr');

    const handleLogout = () => {
        Alert.alert(
            t('auth.logout_confirm_title'),
            t('auth.logout_confirm_message'),
            [
                { text: t('common.cancel'), style: 'cancel' },
                {
                    text: t('common.confirm'),
                    style: 'destructive',
                    onPress: async () => {
                        await logout();
                        router.replace('/(auth)/login');
                    },
                },
            ],
            { cancelable: true },
        );
    };

    const [guides, setGuides] = useState<CropGuide[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [search, setSearch] = useState('');

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

    const cropLabel = (name?: string, commonNames?: string) => {
        if (!name) return '';
        const translated = t(`crop_names.${normalizeCropName(name)}`, { defaultValue: '' });
        if (translated) return translated;
        const commonName = pickPreferredCommonName(commonNames);
        if (commonName) return commonName;
        return isTurkish ? '' : name;
    };

    const loadGuides = useCallback(async (isRefresh = false) => {
        if (!isRefresh) setIsLoading(true);
        try {
            const data = await cropGuidesService.getAllGuides();
            setGuides(data);
        } catch (error) {
            console.error('Failed to load crop guides:', error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadGuides();
    }, [loadGuides]);

    const onRefresh = () => {
        setIsRefreshing(true);
        loadGuides(true);
    };

    const filteredGuides = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return guides;

        return guides.filter((guide) => {
            const localizedName = cropLabel(guide.name, guide.commonNames);
            const haystack = [
                guide.name,
                localizedName,
                guide.commonNames ?? '',
                guide.scientificName ?? '',
                guide.description ?? '',
            ]
                .join(' ')
                .toLowerCase();

            return haystack.includes(q);
        });
    }, [guides, search, isTurkish]);

    return (
        <SafeAreaView style={styles.container}>
            {/* HEADER */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>{t('crop_guide.title')}</Text>
                    <Text style={styles.headerSubtitle}>{t('crop_guide.subtitle')}</Text>
                </View>
                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                    <LogOut color={theme.colors.chart.danger} size={20} />
                </TouchableOpacity>
            </View>

            {/* SEARCH BAR */}
            <View style={styles.searchRow}>
                <View style={styles.searchBox}>
                    <Search size={16} color={theme.colors.neutral.subtext} />
                    <TextInput
                        style={styles.searchInput}
                        value={search}
                        onChangeText={setSearch}
                        placeholder={t('crop_guide.search_placeholder')}
                        placeholderTextColor={theme.colors.neutral.subtext}
                    />
                </View>
            </View>

            {isLoading ? (
                <View style={styles.centerBox}>
                    <ActivityIndicator size="large" color={theme.colors.brand[500]} />
                    <Text style={styles.loadingText}>{t('crop_guide.loading')}</Text>
                </View>
            ) : (
                <ScrollView
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefreshing}
                            onRefresh={onRefresh}
                            tintColor={theme.colors.brand[500]}
                        />
                    }
                >
                    {filteredGuides.length === 0 ? (
                        <View style={styles.emptyCard}>
                            <Leaf color={theme.colors.neutral.subtext} size={32} />
                            <Text style={styles.emptyText}>{t('crop_guide.empty')}</Text>
                        </View>
                    ) : (
                        filteredGuides.map((guide) => (
                            <GuideCard
                                key={guide.id || guide.name}
                                guide={guide}
                                label={cropLabel(guide.name, guide.commonNames) || guide.commonNames || guide.name}
                                trValue={trValue}
                                onPress={() =>
                                    router.push(`/guides/${toCropSlug(guide.slug || guide.name)}`)
                                }
                            />
                        ))
                    )}
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

function GuideCard({
    guide,
    label,
    trValue,
    onPress,
}: {
    guide: CropGuide;
    label: string;
    trValue: (group: 'growth_habit' | 'soil_type', value?: string) => string;
    onPress: () => void;
}) {
    const { t } = useTranslation();

    return (
        <View style={styles.card}>
            {guide.image ? (
                <Image source={{ uri: guide.image }} style={styles.cardImage} />
            ) : (
                <View style={styles.cardImagePlaceholder}>
                    <Leaf color="#059669" size={28} />
                </View>
            )}

            <View style={styles.cardBody}>
                <Text style={styles.cardName} numberOfLines={1}>{label}</Text>
                {guide.scientificName ? (
                    <Text style={styles.cardScientific} numberOfLines={1}>{guide.scientificName}</Text>
                ) : null}

                {/* BADGES */}
                <View style={styles.badgeRow}>
                    {guide.growthHabit ? (
                        <View style={[styles.badge, styles.badgeGreen]}>
                            <Text style={[styles.badgeText, { color: '#065f46' }]}>
                                {trValue('growth_habit', guide.growthHabit)}
                            </Text>
                        </View>
                    ) : null}
                    {guide.soilType ? (
                        <View style={[styles.badge, styles.badgePurple]}>
                            <Text style={[styles.badgeText, { color: '#5b21b6' }]}>
                                {trValue('soil_type', guide.soilType)}
                            </Text>
                        </View>
                    ) : null}
                    {typeof guide.daysToMaturity === 'number' ? (
                        <View style={[styles.badge, styles.badgeBlue]}>
                            <Text style={[styles.badgeText, { color: '#1e40af' }]}>
                                {t('crop_guide.days_short', { days: guide.daysToMaturity })}
                            </Text>
                        </View>
                    ) : null}
                </View>

                <Text style={styles.cardDesc} numberOfLines={3}>
                    {guide.description || t('crop_guide.no_data')}
                </Text>

                <View style={styles.cardFooter}>
                    <Text style={styles.cardFamily}>
                        {guide.family || t('crop_guide.family_unknown')}
                    </Text>
                    <TouchableOpacity style={styles.detailButton} onPress={onPress} activeOpacity={0.8}>
                        <Text style={styles.detailButtonText}>{t('crop_guide.view_details')}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.neutral.canvas },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 14,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.neutral.border,
    },
    headerTitle: { fontSize: 22, fontWeight: 'bold', color: theme.colors.neutral.dark },
    headerSubtitle: { fontSize: 13, color: theme.colors.neutral.subtext, marginTop: 2 },
    logoutBtn: { padding: 8 },

    searchRow: { padding: 16, paddingBottom: 8 },
    searchBox: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
        borderWidth: 1, borderColor: theme.colors.neutral.border,
    },
    searchInput: { flex: 1, fontSize: 14, color: theme.colors.neutral.dark, padding: 0 },

    centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
    loadingText: { color: theme.colors.neutral.subtext, marginTop: 12, fontSize: 14 },

    listContent: { padding: 16, paddingTop: 8, gap: 12 },

    emptyCard: {
        backgroundColor: '#fff', borderRadius: 16, padding: 40,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: theme.colors.neutral.border,
        borderStyle: 'dashed',
    },
    emptyText: { color: theme.colors.neutral.subtext, marginTop: 12, fontSize: 14, textAlign: 'center' },

    card: {
        backgroundColor: '#fff', borderRadius: 16,
        overflow: 'hidden', borderWidth: 1, borderColor: theme.colors.neutral.border,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
    },
    cardImage: { width: '100%', height: 140 },
    cardImagePlaceholder: {
        width: '100%', height: 140,
        backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center',
    },
    cardBody: { padding: 14 },
    cardName: { fontSize: 16, fontWeight: 'bold', color: theme.colors.neutral.dark },
    cardScientific: { fontSize: 13, color: theme.colors.neutral.subtext, marginTop: 2 },

    badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
    badge: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 999 },
    badgeGreen: { backgroundColor: '#DCFCE7' },
    badgePurple: { backgroundColor: '#EDE9FE' },
    badgeBlue: { backgroundColor: '#DBEAFE' },
    badgeText: { fontSize: 11, fontWeight: '600' },

    cardDesc: { fontSize: 13, color: '#4b5563', marginTop: 10, lineHeight: 18 },

    cardFooter: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12,
    },
    cardFamily: { fontSize: 12, color: theme.colors.neutral.subtext, flexShrink: 1 },

    detailButton: {
        backgroundColor: theme.colors.brand[500], borderRadius: 8,
        paddingHorizontal: 14, paddingVertical: 7,
    },
    detailButtonText: { color: '#fff', fontSize: 13, fontWeight: '600' },
});

