import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Thermometer, Droplet, Wind, CloudRain, Cpu, Link, Unlink, Wifi, Map as MapIcon, Trash2, BrainCircuit, Leaf } from 'lucide-react-native';
import MapView, { Polygon, PROVIDER_GOOGLE, type Region } from 'react-native-maps';

import { theme } from '../../src/theme/theme';
import { fieldsService } from '../../src/services/fieldsService';
import type { Field, SensorData, WeatherData, AnalysisResult } from '../../src/types/fields';
import MapSelector from '../../src/components/MapSelector';
import axios from 'axios';

export default function FieldDetailsScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { t } = useTranslation();

    const [field, setField] = useState<Field | null>(null);
    const [telemetry, setTelemetry] = useState<SensorData | null>(null);
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const [macInput, setMacInput] = useState('');
    const [isPairing, setIsPairing] = useState(false);

    // Read-only map ref (for fitToCoordinates)
    const readonlyMapRef = useRef<MapView>(null);

    // Map Editing State
    const [isEditingMap, setIsEditingMap] = useState(false);
    const [editedLocation, setEditedLocation] = useState<number[][] | null>(null);
    const [editedAreaHa, setEditedAreaHa] = useState<number | null>(null);
    const [isSavingMap, setIsSavingMap] = useState(false);

    useEffect(() => {
        if (!id) return;
        const fetchData = async () => {
            try {
                const f = await fieldsService.getFieldById(id);
                setField(f);
                const [tel, wea, analysisRes] = await Promise.all([
                    fieldsService.getMostRecentTelemetry(id).catch(() => null),
                    fieldsService.getLiveWeather(id).catch(() => null),
                    fieldsService.getLastAnalysis(id).catch(() => null)
                ]);
                setTelemetry(tel);
                setWeather(wea);
                setAnalysis(analysisRes);
            } catch (err) {
                console.error('Failed to fetch field details', err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
        // Poll every 30s
        const intervalId = setInterval(fetchData, 30000);
        return () => clearInterval(intervalId);
    }, [id]);

    // Fit the read-only map to the polygon whenever field data changes.
    // MUST be before any early returns to satisfy Rules of Hooks.
    useEffect(() => {
        if (!field?.location || field.location.length === 0) return;
        const coords = field.location.map((c) => ({ latitude: c[1], longitude: c[0] }));
        const t = setTimeout(() => {
            readonlyMapRef.current?.fitToCoordinates(coords, {
                edgePadding: { top: 40, right: 40, bottom: 40, left: 40 },
                animated: true,
            });
        }, 350);
        return () => clearTimeout(t);
    }, [field]);

    const handlePair = async () => {
        if (!macInput.trim() || !id) return;
        setIsPairing(true);
        try {
            const updatedField = await fieldsService.pairDevice(id, macInput.trim());
            setField(updatedField);
            setMacInput('');
            Alert.alert('Success', t('fields.pair_success'));
        } catch (err: any) {
            const backendMessage = axios.isAxiosError(err)
                ? (err.response?.data as { message?: string } | undefined)?.message
                : undefined;

            if (backendMessage?.toLowerCase().includes('not found in registry')) {
                const serialFromMessage = backendMessage.match(/'([^']+)'/)?.[1] ?? macInput.trim();
                Alert.alert(
                    t('common.error'),
                    t('fields.device_not_found', { serial: serialFromMessage }),
                );
            } else if (axios.isAxiosError(err) && err.response?.status === 400) {
                Alert.alert('Error', t('fields.mac_in_use'));
            } else {
                Alert.alert('Error', t('common.error'));
            }
        } finally {
            setIsPairing(false);
        }
    };

    const handleUnpair = () => {
        if (!id) return;
        Alert.alert(
            t('fields.unpair_device'),
            t('fields.unpair_confirm'),
            [
                { text: t('common.cancel'), style: 'cancel' },
                {
                    text: t('common.confirm'),
                    style: 'destructive',
                    onPress: async () => {
                        setIsPairing(true);
                        try {
                            const updatedField = await fieldsService.unpairDevice(id);
                            setField(updatedField);
                            Alert.alert('Success', t('fields.unpair_success'));
                        } catch (err) {
                            Alert.alert('Error', t('common.error'));
                        } finally {
                            setIsPairing(false);
                        }
                    }
                }
            ]
        );
    };

    const handleSaveMap = async () => {
        if (!id || !field || !editedLocation || editedAreaHa == null) return;
        setIsSavingMap(true);
        try {
            const updatedField = await fieldsService.updateField(id, {
                name: field.name,
                location: editedLocation,
                areaHa: Number(editedAreaHa.toFixed(2)),
                soilType: field.soilType
            });
            setField(updatedField);
            setIsEditingMap(false);
            Alert.alert('Success', t('fields.update_success', 'Field updated successfully'));
        } catch (err) {
            console.error('Failed to update field', err);
            Alert.alert('Error', t('common.error', 'An error occurred'));
        } finally {
            setIsSavingMap(false);
        }
    };

    const handleDeleteField = () => {
        if (!id) return;
        Alert.alert(
            t('fields.delete_title', 'Delete Field'),
            t('fields.delete_confirm', 'Are you sure you want to delete this field? This action cannot be undone.'),
            [
                { text: t('common.cancel', 'Cancel'), style: 'cancel' },
                {
                    text: t('common.delete', 'Delete'),
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await fieldsService.deleteField(id);
                            router.replace('/');
                        } catch (err) {
                            console.error('Failed to delete field', err);
                            Alert.alert('Error', t('common.error', 'An error occurred'));
                        }
                    }
                }
            ]
        );
    };

    if (isLoading) {
        return (
            <SafeAreaView style={styles.center}>
                <ActivityIndicator size="large" color={theme.colors.brand[500]} />
            </SafeAreaView>
        );
    }

    if (!field) {
        return (
            <SafeAreaView style={styles.center}>
                <Text style={styles.subtext}>{t('common.error')}</Text>
            </SafeAreaView>
        );
    }

    const isPaired = !!field.deviceId;

    // Map Region Calculation
    let mapRegion: Region | undefined;
    let polygonCoordinates: { latitude: number; longitude: number }[] | undefined;
    if (field.location && field.location.length > 0) {
        const lats = field.location.map((c) => c[1]);
        const lngs = field.location.map((c) => c[0]);
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);
        const minLng = Math.min(...lngs);
        const maxLng = Math.max(...lngs);
        const latPad = Math.max((maxLat - minLat) * 0.5, 0.003);
        const lngPad = Math.max((maxLng - minLng) * 0.5, 0.003);

        mapRegion = {
            latitude: (minLat + maxLat) / 2,
            longitude: (minLng + maxLng) / 2,
            latitudeDelta: (maxLat - minLat) + latPad,
            longitudeDelta: (maxLng - minLng) + lngPad,
        };

        polygonCoordinates = field.location.map((c) => ({
            latitude: c[1],
            longitude: c[0]
        }));
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft color={theme.colors.neutral.dark} size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{field.name}</Text>
                <TouchableOpacity onPress={handleDeleteField} style={styles.backButton}>
                    <Trash2 color="#ef4444" size={24} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                
                {/* MAP SECTION */}
                <View style={[styles.card, { marginBottom: 16, padding: isEditingMap ? 16 : 0, overflow: 'hidden' }]}>
                    {isEditingMap ? (
                        <>
                            <View style={{ marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Text style={styles.cardTitle}>{t('map.edit_polygon', 'Edit Field Area')}</Text>
                                <View style={{ flexDirection: 'row', gap: 8 }}>
                                    <TouchableOpacity onPress={() => setIsEditingMap(false)} style={styles.cancelBtn}>
                                        <Text style={styles.cancelBtnText}>{t('common.cancel', 'Cancel')}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={handleSaveMap} style={styles.saveBtn} disabled={isSavingMap || !editedLocation || editedLocation.length < 4}>
                                        {isSavingMap ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveBtnText}>{t('common.save', 'Save')}</Text>}
                                    </TouchableOpacity>
                                </View>
                            </View>
                            <MapSelector
                                value={editedLocation}
                                onChange={setEditedLocation}
                                onAreaCalculated={setEditedAreaHa}
                            />
                        </>
                    ) : (
                        mapRegion && polygonCoordinates && (
                            <View>
                                <MapView
                                    ref={readonlyMapRef}
                                    provider={PROVIDER_GOOGLE}
                                    style={{ width: '100%', height: 250 }}
                                    initialRegion={mapRegion}
                                    mapType="satellite"
                                >
                                    <Polygon
                                        coordinates={polygonCoordinates}
                                        fillColor="rgba(5, 150, 105, 0.2)"
                                        strokeColor="#059669"
                                        strokeWidth={2}
                                    />
                                </MapView>
                                <TouchableOpacity style={styles.editMapFloatBtn} onPress={() => {
                                    setEditedLocation(field.location);
                                    setEditedAreaHa(field.areaHa);
                                    setIsEditingMap(true);
                                }}>
                                    <MapIcon color="#fff" size={16} />
                                    <Text style={styles.editMapFloatText}>{t('common.edit', 'Edit')}</Text>
                                </TouchableOpacity>
                            </View>
                        )
                    )}
                </View>

                {/* PAIRING SECTION */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Cpu color={theme.colors.brand[600]} size={20} />
                        <Text style={styles.cardTitle}>{t('fields.device_pairing')}</Text>
                    </View>
                    
                    {isPaired ? (
                        <View style={styles.pairedContainer}>
                            <View style={styles.pairedInfo}>
                                <Text style={styles.pairedStatus}>{t('fields.device_paired')}</Text>
                                <Text style={styles.macText}>{field.deviceId}</Text>
                            </View>
                            <TouchableOpacity style={styles.unpairBtn} onPress={handleUnpair} disabled={isPairing}>
                                {isPairing ? <ActivityIndicator color="#fff" size="small" /> : <Unlink color="#fff" size={16} />}
                                <Text style={styles.btnText}>{t('fields.unpair_device')}</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.pairContainer}>
                            <Text style={styles.subtext}>{t('fields.device_unpaired')}</Text>
                            <View style={styles.inputRow}>
                                <TextInput
                                    style={styles.input}
                                    placeholder={t('fields.mac_placeholder')}
                                    placeholderTextColor="#9ca3af"
                                    value={macInput}
                                    onChangeText={setMacInput}
                                    autoCapitalize="characters"
                                />
                                <TouchableOpacity 
                                    style={[styles.pairBtn, !macInput.trim() && styles.pairBtnDisabled]} 
                                    onPress={handlePair}
                                    disabled={!macInput.trim() || isPairing}
                                >
                                    {isPairing ? <ActivityIndicator color="#fff" size="small" /> : <Link color="#fff" size={16} />}
                                    <Text style={styles.btnText}>{t('fields.pair_device')}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </View>

                {/* TELEMETRY SECTION */}
                <View style={[styles.card, { marginTop: 16 }]}>
                    <View style={styles.cardHeader}>
                        <Wifi color="#059669" size={20} />
                        <Text style={styles.cardTitle}>{t('fields.telemetry')}</Text>
                    </View>
                    
                    {!telemetry ? (
                        <Text style={styles.emptyText}>{t('fields.no_telemetry')}</Text>
                    ) : (
                        <View style={styles.grid}>
                            <Box label={t('fields.soil_temp')} value={telemetry.soilTemp?.toFixed(1)} unit="°C" icon={<Thermometer color="#f59e0b" size={24} />} />
                            <Box label={t('fields.soil_moisture')} value={telemetry.soilHumidity?.toFixed(1)} unit="%" icon={<Droplet color="#3b82f6" size={24} />} />
                            <Box label={t('fields.ambient_temp')} value={telemetry.ambientTemp?.toFixed(1)} unit="°C" icon={<Wind color="#10b981" size={24} />} />
                            <Box label={t('fields.ambient_humidity')} value={telemetry.ambientHumidity?.toFixed(1)} unit="%" icon={<CloudRain color="#6366f1" size={24} />} />
                        </View>
                    )}
                </View>

                {/* WEATHER SECTION */}
                {weather && (
                    <View style={[styles.card, { marginTop: 16 }]}>
                        <View style={styles.cardHeader}>
                            <CloudRain color="#0284c7" size={20} />
                            <Text style={styles.cardTitle}>{t('fields.weather')}</Text>
                        </View>
                        <View style={styles.grid}>
                            <Box label={t('dashboard.temperature')} value={weather.temperature.toFixed(1)} unit="°C" />
                            <Box label={t('fields.precipitation')} value={weather.precipitation.toFixed(1)} unit="mm" />
                        </View>
                    </View>
                )}

                {/* AI RECOMMENDATIONS SECTION */}
                {analysis && (
                    <View style={[styles.card, { marginTop: 16 }]}>
                        <View style={styles.cardHeader}>
                            <BrainCircuit color="#10b981" size={20} />
                            <Text style={styles.cardTitle}>{t('fields.ai_recommendations', 'AI Crop Recommendations')}</Text>
                        </View>
                        
                        {analysis.recommendations.length === 0 ? (
                            <Text style={styles.emptyText}>{t('fields.no_recommendations', 'No recommendations found.')}</Text>
                        ) : (
                            <View style={{ gap: 12 }}>
                                {analysis.recommendations.map((rec, idx) => {
                                    const probability = rec.probability;
                                    let barColor = '#9ca3af';
                                    let bgBox = '#f3f4f6';
                                    let borderColor = '#e5e7eb';
                                    if (probability >= 70) { barColor = '#10b981'; bgBox = '#ecfdf5'; borderColor = '#a7f3d0'; }
                                    else if (probability >= 40) { barColor = '#f59e0b'; bgBox = '#fffbeb'; borderColor = '#fde68a'; }
                                    
                                    return (
                                        <TouchableOpacity 
                                            key={rec.crop} 
                                            style={[styles.recBox, { backgroundColor: bgBox, borderColor }]}
                                            onPress={() => router.push(`/guides/${rec.crop.toLowerCase().replace(/\\s+/g, '-')}`)}
                                        >
                                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                                    <Leaf size={16} color={idx === 0 ? '#10b981' : '#6b7280'} />
                                                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#111827', textTransform: 'capitalize' }}>
                                                        {t(`crop_names.${rec.crop}`, rec.crop)}
                                                    </Text>
                                                </View>
                                                <Text style={{ fontSize: 16, fontWeight: 'bold', color: barColor }}>
                                                    {probability.toFixed(1)}%
                                                </Text>
                                            </View>
                                            <View style={{ height: 6, backgroundColor: '#e5e7eb', borderRadius: 3, overflow: 'hidden' }}>
                                                <View style={{ height: '100%', backgroundColor: barColor, width: `${Math.min(probability, 100)}%` }} />
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        )}
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

function Box({ label, value, unit, icon }: any) {
    return (
        <View style={styles.dataBox}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text style={styles.dataLabel}>{label}</Text>
                {icon}
            </View>
            <Text style={styles.dataValue}>
                {value !== undefined && value !== null ? value : '--'} <Text style={styles.dataUnit}>{unit}</Text>
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.neutral.canvas },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff',
        borderBottomWidth: 1, borderBottomColor: theme.colors.neutral.border,
    },
    backButton: { padding: 8 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: theme.colors.neutral.dark },
    content: { padding: 16 },
    card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
    cardTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.neutral.dark },
    subtext: { fontSize: 14, color: theme.colors.neutral.subtext, marginBottom: 10 },
    emptyText: { paddingVertical: 20, textAlign: 'center', color: '#9ca3af', fontSize: 13 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    dataBox: { flex: 1, minWidth: '45%', backgroundColor: '#f9fafb', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#e5e7eb' },
    dataLabel: { fontSize: 12, fontWeight: '600', color: '#6b7280' },
    dataValue: { fontSize: 22, fontWeight: 'bold', color: '#111827' },
    dataUnit: { fontSize: 14, fontWeight: '500', color: '#6b7280' },
    // Pairing
    pairContainer: { gap: 10 },
    inputRow: { flexDirection: 'row', gap: 8 },
    input: { flex: 1, height: 44, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, paddingHorizontal: 12, fontSize: 14, backgroundColor: '#f9fafb' },
    pairBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: theme.colors.brand[500], paddingHorizontal: 16, borderRadius: 10, justifyContent: 'center' },
    pairBtnDisabled: { backgroundColor: '#9ca3af' },
    btnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
    pairedContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f0fdf4', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#bbf7d0' },
    pairedInfo: { flex: 1 },
    pairedStatus: { fontSize: 12, fontWeight: '700', color: '#166534', marginBottom: 2 },
    macText: { fontSize: 14, color: '#14532d' },
    unpairBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#ef4444', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8 },
    // Map Editing
    editMapFloatBtn: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: 'rgba(0,0,0,0.6)',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        gap: 6
    },
    editMapFloatText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    cancelBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, backgroundColor: '#f3f4f6' },
    cancelBtnText: { color: '#374151', fontWeight: 'bold', fontSize: 13 },
    saveBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6, backgroundColor: '#059669', flexDirection: 'row', alignItems: 'center' },
    saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
    recBox: { padding: 12, borderRadius: 12, borderWidth: 1 },
});
