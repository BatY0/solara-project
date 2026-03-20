import React, { useState, useEffect, useCallback } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    RefreshControl,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Sprout, MapPin, Zap, Plus, LogOut, ChevronRight, Wifi, WifiOff } from 'lucide-react-native';

import { useAuth } from '../../src/context/AuthContext';
import { theme } from '../../src/theme/theme';
import { fieldsService } from '../../src/services/fieldsService';
import type { Field } from '../../src/types/fields';
import AddFieldModal from '../../src/components/AddFieldModal';

export default function DashboardScreen() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const { t } = useTranslation();

    const [fields, setFields] = useState<Field[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isWizardOpen, setIsWizardOpen] = useState(false);

    const fetchFields = useCallback(async (isRefresh = false) => {
        if (!isRefresh) setIsLoading(true);
        try {
            const data = await fieldsService.getUserFields();
            const sorted = [...data].sort((a, b) => (b.deviceId ? 1 : 0) - (a.deviceId ? 1 : 0));
            setFields(sorted);
        } catch (error) {
            console.error('Error fetching fields:', error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchFields();
    }, [fetchFields]);

    const handleLogout = () => {
        Alert.alert(
            t('auth.logout_confirm_title'),
            t('auth.logout_confirm_message'),
            [
                {
                    text: t('common.cancel'),
                    style: 'cancel',
                },
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

    const onRefresh = () => {
        setIsRefreshing(true);
        fetchFields(true);
    };

    const onlineCount = fields.filter(f => !!f.deviceId).length;

    return (
        <SafeAreaView style={styles.container}>
            {/* HEADER */}
            <View style={styles.header}>
                <View style={styles.logoRow}>
                    <Sprout color={theme.colors.brand[500]} size={26} />
                    <Text style={styles.brandText}>Solara</Text>
                </View>
                <TouchableOpacity style={styles.headerIcon} onPress={handleLogout}>
                    <LogOut color={theme.colors.chart.danger} size={20} />
                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={theme.colors.brand[500]} />}
            >
                {/* WELCOME CARD */}
                <View style={styles.welcomeCard}>
                    <Text style={styles.welcomeTitle}>{t('dashboard.welcome_back')}</Text>
                    <Text style={styles.userEmail}>{user?.name ? `${user.name} ${user.surname ?? ''}`.trim() : user?.email}</Text>
                    <Text style={styles.welcomeSubtitle}>{t('dashboard.everything_good')}</Text>
                </View>

                {/* STAT CARDS */}
                <View style={styles.statRow}>
                    <View style={[styles.statCard, { borderLeftColor: theme.colors.brand[500] }]}>
                        <View style={[styles.statIcon, { backgroundColor: theme.colors.brand[50] }]}>
                            <MapPin color={theme.colors.brand[500]} size={20} />
                        </View>
                        <Text style={styles.statValue}>{fields.length}</Text>
                        <Text style={styles.statLabel}>{t('dashboard.total_fields')}</Text>
                    </View>
                    <View style={[styles.statCard, { borderLeftColor: '#3b82f6' }]}>
                        <View style={[styles.statIcon, { backgroundColor: '#EFF6FF' }]}>
                            <Zap color={'#3b82f6'} size={20} />
                        </View>
                        <Text style={styles.statValue}>{onlineCount}<Text style={styles.statSuffix}> / {fields.length}</Text></Text>
                        <Text style={styles.statLabel}>{t('dashboard.active_sensors')}</Text>
                    </View>
                </View>

                {/* FIELDS SECTION */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>{t('dashboard.registered_fields')}</Text>
                    {fields.length > 4 && (
                        <TouchableOpacity onPress={() => router.push('/fields')}>
                            <Text style={{color: theme.colors.brand[500], fontWeight: '600', fontSize: 13}}>
                                {t('dashboard.view_all_fields', { count: fields.length })}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>

                {isLoading ? (
                    <View style={styles.centerBox}>
                        <ActivityIndicator size="large" color={theme.colors.brand[500]} />
                        <Text style={styles.loadingText}>{t('dashboard.loading')}</Text>
                    </View>
                ) : fields.length === 0 ? (
                    <View style={styles.emptyCard}>
                        <MapPin color={theme.colors.neutral.subtext} size={40} />
                        <Text style={styles.emptyTitle}>{t('dashboard.no_fields_title')}</Text>
                        <Text style={styles.emptyDesc}>{t('dashboard.no_fields_desc')}</Text>
                    </View>
                ) : (
                    fields.slice(0, 4).map(field => (
                        <FieldCard key={field.id} field={field} t={t} router={router} />
                    ))
                )}
            </ScrollView>

            {/* FAB */}
            {fields.length < 4 && (
                <TouchableOpacity style={styles.fab} onPress={() => setIsWizardOpen(true)} activeOpacity={0.85}>
                    <Plus color="#fff" size={26} />
                </TouchableOpacity>
            )}

            {/* ADD FIELD MODAL */}
            <AddFieldModal
                visible={isWizardOpen}
                onClose={() => setIsWizardOpen(false)}
                onSuccess={() => fetchFields()}
            />
        </SafeAreaView>
    );
}

function FieldCard({ field, t, router }: { field: Field; t: (key: string) => string; router: any }) {
    const isOnline = !!field.deviceId;
    const soilKey = `add_field.${field.soilType}`;
    const translatedSoil = t(soilKey);
    const soilLabel = translatedSoil === soilKey ? field.soilType : translatedSoil;
    return (
        <TouchableOpacity style={styles.fieldCard} onPress={() => router.push(`/fields/${field.id}`)}>
            <View style={styles.fieldCardLeft}>
                <View style={styles.fieldIconWrap}>
                    <MapPin color={theme.colors.brand[500]} size={18} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.fieldName} numberOfLines={1}>{field.name}</Text>
                    <Text style={styles.fieldMeta}>
                        {Number(field.areaHa.toFixed(2))} ha  ·  {soilLabel}
                    </Text>
                </View>
            </View>
            <View style={styles.fieldCardRight}>
                <View style={[styles.badge, isOnline ? styles.badgeOnline : styles.badgeOffline]}>
                    {isOnline
                        ? <Wifi color="#059669" size={12} />
                        : <WifiOff color="#94a3b8" size={12} />}
                    <Text style={[styles.badgeText, isOnline ? { color: '#059669' } : { color: '#94a3b8' }]}>
                        {isOnline ? t('dashboard.online') : t('dashboard.offline')}
                    </Text>
                </View>
                <ChevronRight color={theme.colors.neutral.subtext} size={18} />
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.neutral.canvas },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingVertical: 14, backgroundColor: '#fff',
        borderBottomWidth: 1, borderBottomColor: theme.colors.neutral.border,
    },
    logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    brandText: { fontSize: 20, fontWeight: 'bold', color: theme.colors.neutral.dark },
    headerIcon: { padding: 8 },
    content: { padding: 20, paddingBottom: 100 },
    welcomeCard: {
        backgroundColor: theme.colors.brand[900], borderRadius: 20, padding: 24,
        marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2, shadowRadius: 16, elevation: 8,
    },
    welcomeTitle: { color: 'rgba(255,255,255,0.75)', fontSize: 14, marginBottom: 4 },
    userEmail: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 6 },
    welcomeSubtitle: { color: theme.colors.brand[50], fontSize: 13, opacity: 0.85 },
    statRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
    statCard: {
        flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 16,
        borderLeftWidth: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
    },
    statIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
    statValue: { fontSize: 26, fontWeight: 'bold', color: theme.colors.neutral.dark },
    statSuffix: { fontSize: 14, fontWeight: 'normal', color: theme.colors.neutral.subtext },
    statLabel: { fontSize: 12, color: theme.colors.neutral.subtext, marginTop: 2 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
    sectionTitle: { fontSize: 17, fontWeight: 'bold', color: theme.colors.neutral.dark },
    centerBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48 },
    loadingText: { color: theme.colors.neutral.subtext, marginTop: 12, fontSize: 14 },
    emptyCard: {
        backgroundColor: '#fff', borderRadius: 16, padding: 32,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: theme.colors.neutral.border, borderStyle: 'dashed',
    },
    emptyTitle: { fontSize: 16, fontWeight: 'bold', color: theme.colors.neutral.dark, marginTop: 12 },
    emptyDesc: { fontSize: 13, color: theme.colors.neutral.subtext, marginTop: 6, textAlign: 'center' },
    fieldCard: {
        backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05,
        shadowRadius: 4, elevation: 1,
    },
    fieldCardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
    fieldIconWrap: {
        width: 38, height: 38, borderRadius: 10,
        backgroundColor: theme.colors.brand[50], alignItems: 'center', justifyContent: 'center',
    },
    fieldName: { fontSize: 14, fontWeight: '600', color: theme.colors.neutral.dark },
    fieldMeta: { fontSize: 12, color: theme.colors.neutral.subtext, marginTop: 2 },
    fieldCardRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
    badgeOnline: { backgroundColor: '#ECFDF5' },
    badgeOffline: { backgroundColor: '#F8FAFC' },
    badgeText: { fontSize: 11, fontWeight: '600' },
    fab: {
        position: 'absolute', right: 20, bottom: 28, width: 56, height: 56,
        borderRadius: 28, backgroundColor: theme.colors.brand[500],
        alignItems: 'center', justifyContent: 'center',
        shadowColor: theme.colors.brand[900], shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35, shadowRadius: 12, elevation: 10,
    },
});
