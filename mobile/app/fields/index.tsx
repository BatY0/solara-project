import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MapPin, Wifi, WifiOff, ChevronRight, ArrowLeft } from 'lucide-react-native';

import { theme } from '../../src/theme/theme';
import { fieldsService } from '../../src/services/fieldsService';
import type { Field } from '../../src/types/fields';
import { getDeviceStatus } from '../../src/utils/deviceStatus';

export default function AllFieldsScreen() {
    const { t } = useTranslation();
    const router = useRouter();
    const [fields, setFields] = useState<Field[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fieldsService.getUserFields().then(data => {
            setFields(data);
            setIsLoading(false);
        }).catch(err => {
            console.error('Failed to fetch fields', err);
            setIsLoading(false);
        });
    }, []);

    const renderItem = ({ item }: { item: Field }) => {
        const deviceStatus = getDeviceStatus(item, t);
        const isOnline = deviceStatus.status === 'online';
        const isInactive = deviceStatus.status === 'inactive';
        const soilKey = `add_field.${item.soilType}`;
        const translatedSoil = t(soilKey);
        const soilLabel = translatedSoil === soilKey ? item.soilType : translatedSoil;

        return (
            <TouchableOpacity style={styles.fieldCard} onPress={() => router.push(`/fields/${item.id}`)}>
                <View style={styles.fieldCardLeft}>
                    <View style={styles.fieldIconWrap}>
                        <MapPin color={theme.colors.brand[500]} size={18} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.fieldName} numberOfLines={1}>{item.name}</Text>
                        <Text style={styles.fieldMeta}>
                            {Number(item.areaHa.toFixed(2))} ha  ·  {soilLabel}
                        </Text>
                    </View>
                </View>
                <View style={styles.fieldCardRight}>
                    <View style={styles.fieldCardStatusRow}>
                        <View style={[styles.badge, isOnline ? styles.badgeOnline : isInactive ? styles.badgeInactive : styles.badgeOffline]}>
                            {isOnline
                                ? <Wifi color="#059669" size={12} />
                                : isInactive
                                  ? <Wifi color="#ca8a04" size={12} />
                                  : <WifiOff color="#94a3b8" size={12} />}
                            <Text style={[styles.badgeText, isOnline ? { color: '#059669' } : isInactive ? { color: '#a16207' } : { color: '#94a3b8' }]}>
                                {deviceStatus.label}
                            </Text>
                        </View>
                        <ChevronRight color={theme.colors.neutral.subtext} size={18} />
                    </View>
                    {deviceStatus.lastSeenText ? <Text style={styles.lastSeenText}>{deviceStatus.lastSeenText}</Text> : null}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft color={theme.colors.neutral.dark} size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('fields.all_fields')}</Text>
                <View style={{ width: 40 }} />
            </View>

            {isLoading ? (
                <View style={styles.centerBox}>
                    <ActivityIndicator size="large" color={theme.colors.brand[500]} />
                    <Text style={styles.loadingText}>{t('common.loading')}</Text>
                </View>
            ) : (
                <FlatList
                    contentContainerStyle={styles.listContent}
                    data={fields}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                    ListEmptyComponent={
                        <View style={styles.centerBox}>
                            <MapPin color={theme.colors.neutral.subtext} size={40} />
                            <Text style={styles.loadingText}>{t('dashboard.no_fields_title')}</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.neutral.canvas },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff',
        borderBottomWidth: 1, borderBottomColor: theme.colors.neutral.border,
    },
    backButton: { padding: 8 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: theme.colors.neutral.dark },
    listContent: { padding: 20 },
    centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 48 },
    loadingText: { color: theme.colors.neutral.subtext, marginTop: 12, fontSize: 14 },
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
    fieldCardRight: { alignItems: 'flex-end', gap: 6 },
    fieldCardStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
    badgeOnline: { backgroundColor: '#ECFDF5' },
    badgeInactive: { backgroundColor: '#FEF9C3' },
    badgeOffline: { backgroundColor: '#F8FAFC' },
    badgeText: { fontSize: 11, fontWeight: '600' },
    lastSeenText: { fontSize: 10, color: theme.colors.neutral.subtext, maxWidth: 130, textAlign: 'right' },
});
