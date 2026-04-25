import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, TextInput, Alert, Modal, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Thermometer, Droplet, Wind, CloudRain, Cpu, Link, Unlink, Wifi, Map as MapIcon, Trash2, BrainCircuit, Leaf, Settings, Activity, MessageCircle, Zap, LocateFixed, Download } from 'lucide-react-native';
import MapView, { Polygon, PROVIDER_GOOGLE, type Region } from 'react-native-maps';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';

import { theme } from '../../src/theme/theme';
import { fieldsService } from '../../src/services/fieldsService';
import { cropGuidesService } from '../../src/services/cropGuidesService';
import type { Field, SensorData, WeatherData, AnalysisResult, HistoricalSensorData, FieldProperties } from '../../src/types/fields';
import MapSelector from '../../src/components/MapSelector';
import axios from 'axios';
import { normalizeCropName } from '../../src/utils/normalizeCropName';
import { parseBackendUtcDate } from '../../src/utils/parseBackendUtcDate';

const toLocalISO = (date: Date): string => {
    const tzOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - tzOffset).toISOString().slice(0, -1);
};

function phColor(ph: number) {
    if (ph < 4) return '#ef4444';
    if (ph < 6) return '#f97316';
    if (ph <= 8) return '#22c55e';
    if (ph <= 10) return '#3b82f6';
    return '#7c3aed';
}

export default function FieldDetailsScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { t, i18n } = useTranslation();

    const [field, setField] = useState<Field | null>(null);
    const [properties, setProperties] = useState<FieldProperties | null>(null);
    const [telemetry, setTelemetry] = useState<SensorData | null>(null);
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Historical Telemetry State
    const [history, setHistory] = useState<HistoricalSensorData[]>([]);
    const [timeframe, setTimeframe] = useState<'today' | 7 | 30>(7);
    const [isHistoryLoading, setIsHistoryLoading] = useState(false);
    const [isHistoryTableExpanded, setIsHistoryTableExpanded] = useState(false);
    const [visibleMetrics, setVisibleMetrics] = useState({
        soilTemp: true,
        soilHumidity: true,
        ambientTemp: true,
        ambientHumidity: true
    });

    const screenWidth = Dimensions.get('window').width;

    const [macInput, setMacInput] = useState('');
    const [isPairing, setIsPairing] = useState(false);

    // Read-only map ref (for fitToCoordinates)
    const readonlyMapRef = useRef<MapView>(null);

    // Map Editing State
    const [isEditingMap, setIsEditingMap] = useState(false);
    const [editedLocation, setEditedLocation] = useState<number[][] | null>(null);
    const [editedAreaHa, setEditedAreaHa] = useState<number | null>(null);
    const [isSavingMap, setIsSavingMap] = useState(false);

    // AI Analysis State
    const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [activeScenario, setActiveScenario] = useState<'RANGE' | 'FUTURE' | 'WHAT_IF'>('RANGE');
    const [rangeStart, setRangeStart] = useState('2026-01-01');
    const [rangeEnd, setRangeEnd] = useState('2026-04-01');
    const [monthStart, setMonthStart] = useState('6');
    const [monthEnd, setMonthEnd] = useState('9');
    const [overrideTemp, setOverrideTemp] = useState(25);
    const [useOverrideTemp, setUseOverrideTemp] = useState(false);
    const [overrideHum, setOverrideHum] = useState(60);
    const [useOverrideHum, setUseOverrideHum] = useState(false);
    const [overrideRain, setOverrideRain] = useState(400);
    const [useOverrideRain, setUseOverrideRain] = useState(false);

    // Properties Edit State
    const [isEditingProps, setIsEditingProps] = useState(false);
    const [editPropsForm, setEditPropsForm] = useState({
        nitrogen: '',
        phosphorus: '',
        potassium: '',
        ph: 6.44,
        phText: '6.4',
        useDefaultPh: false
    });
    const [isSavingProps, setIsSavingProps] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    useEffect(() => {
        if (!id) return;
        const fetchData = async () => {
            try {
                const f = await fieldsService.getFieldById(id);
                setField(f);
                const [tel, wea, analysisRes, props] = await Promise.all([
                    fieldsService.getMostRecentTelemetry(id).catch(() => null),
                    fieldsService.getLiveWeather(id).catch(() => null),
                    fieldsService.getLastAnalysis(id).catch(() => null),
                    fieldsService.getFieldProperties(id).catch(() => null)
                ]);
                setTelemetry(tel);
                setWeather(wea);
                setAnalysis(analysisRes);
                setProperties(props);
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

    // Fetch historical data whenever timeframe changes
    useEffect(() => {
        if (!id) return;
        const fetchHistory = async () => {
            setIsHistoryLoading(true);
            try {
                const end = toLocalISO(new Date());
                let start = '';
                let interval = 'DAILY';

                if (timeframe === 'today') {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    start = toLocalISO(today);
                    interval = 'RAW';
                } else {
                    const startDate = new Date(Date.now() - timeframe * 24 * 60 * 60 * 1000);
                    start = toLocalISO(startDate);
                }

                const data = await fieldsService.getHistoricalTelemetry(id as string, interval, start, end);
                setHistory(data || []);
            } catch (err) {
                console.error('Failed to fetch historical telemetry', err);
                setHistory([]);
            } finally {
                setIsHistoryLoading(false);
            }
        };
        fetchHistory();
    }, [id, timeframe]);

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

    const handleRecenterMap = () => {
        if (!field?.location || field.location.length === 0) return;
        const coords = field.location.map((c) => ({ latitude: c[1], longitude: c[0] }));
        readonlyMapRef.current?.fitToCoordinates(coords, {
            edgePadding: { top: 40, right: 40, bottom: 40, left: 40 },
            animated: true,
        });
    };

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

    const handleSaveProperties = async () => {
        if (!id || !field) return;
        setIsSavingProps(true);
        try {
            const updatedProps = await fieldsService.updateFieldProperties(id, {
                name: field.name,
                nitrogen: editPropsForm.nitrogen ? parseFloat(editPropsForm.nitrogen) : 52.6,
                phosphorus: editPropsForm.phosphorus ? parseFloat(editPropsForm.phosphorus) : 58.1,
                potassium: editPropsForm.potassium ? parseFloat(editPropsForm.potassium) : 52.0,
                ph: editPropsForm.useDefaultPh ? 6.44 : editPropsForm.ph,
            });
            setProperties(updatedProps);
            setIsEditingProps(false);
            Alert.alert(t('common.success', 'Success'), t('fields.props_update_success', 'Properties updated successfully'));
        } catch (err) {
            console.error('Failed to update properties', err);
            Alert.alert(t('common.error', 'Error'), t('fields.props_update_failed', 'Failed to update properties'));
        } finally {
            setIsSavingProps(false);
        }
    };

    const openEditPropsModal = () => {
        const initialPh = properties?.ph || 6.44;
        setEditPropsForm({
            nitrogen: properties?.nitrogen?.toString() || '',
            phosphorus: properties?.phosphorus?.toString() || '',
            potassium: properties?.potassium?.toString() || '',
            ph: initialPh,
            phText: initialPh.toString(),
            useDefaultPh: false
        });
        setIsEditingProps(true);
    };

    const handleRunAnalysis = async () => {
        if (!id) return;
        setIsAnalyzing(true);
        try {
            let result;
            if (activeScenario === 'RANGE') {
                result = await fieldsService.runAnalysis({ fieldId: id as string, isFuturePrediction: false, startDate: rangeStart, endDate: rangeEnd, topN: 5 });
            } else if (activeScenario === 'FUTURE') {
                result = await fieldsService.runAnalysis({ fieldId: id as string, isFuturePrediction: true, targetMonthStart: Number(monthStart), targetMonthEnd: Number(monthEnd), topN: 5 });
            } else {
                const overrides: any = {};
                if (useOverrideTemp) overrides.temperature = overrideTemp;
                if (useOverrideHum) overrides.humidity = overrideHum;
                if (useOverrideRain) overrides.rainfall = overrideRain;

                result = await fieldsService.runAnalysis({ 
                    fieldId: id as string, 
                    isFuturePrediction: true, 
                    targetMonthStart: Number(monthStart), 
                    targetMonthEnd: Number(monthEnd), 
                    topN: 5, 
                    overrides: Object.keys(overrides).length > 0 ? overrides : undefined 
                });
            }
            setAnalysis(result);
            setIsAnalysisModalOpen(false);
            Alert.alert(t('common.success', 'Success'), t('fields.analysis_success', 'Analysis completed successfully.'));
        } catch (err: any) {
            console.error(err);
            const backendMessage = axios.isAxiosError(err) ? (err.response?.data as any)?.message : '';
            Alert.alert(t('common.error', 'Error'), backendMessage || t('fields.analysis_failed', 'Failed to run analysis.'));
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleExportCsv = async () => {
        if (!id || !field) return;
        setIsExporting(true);
        try {
            const safeName = field.name.trim().toLowerCase().replace(/\s+/g, '-');
            await fieldsService.exportTelemetryCsv(id, safeName || 'field-telemetry');
        } catch (err: unknown) {
            console.error('Failed to export CSV', err);
            const message = axios.isAxiosError(err)
                ? (err.response?.data as { message?: string } | undefined)?.message
                : err instanceof Error
                    ? err.message
                    : t('fields.export_error');
            Alert.alert(t('common.error'), message || t('fields.export_error'));
        } finally {
            setIsExporting(false);
        }
    };

    const handleAskAiForField = async () => {
        const firstRecommendation = analysis?.recommendations?.[0]?.crop;
        const translatedCropName = firstRecommendation ? t(`crop_names.${firstRecommendation}`, firstRecommendation) : field?.name;

        if (!firstRecommendation) {
            router.push({
                pathname: '/chatbot',
                params: { cropName: translatedCropName },
            });
            return;
        }

        try {
            const guides = await cropGuidesService.getAllGuides();
            const normalizedRecommendation = normalizeCropName(firstRecommendation);
            const matchedGuide = guides.find((guide) => {
                const normalizedSlug = guide.slug ? normalizeCropName(guide.slug) : '';
                const normalizedName = normalizeCropName(guide.name);
                return normalizedSlug === normalizedRecommendation || normalizedName === normalizedRecommendation;
            });

            router.push({
                pathname: '/chatbot',
                params: {
                    cropId: matchedGuide?.id,
                    cropName: matchedGuide?.name ?? translatedCropName,
                },
            });
        } catch (error) {
            console.error('Failed to resolve crop context for chatbot:', error);
            router.push({
                pathname: '/chatbot',
                params: { cropName: translatedCropName },
            });
        }
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
                <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                    <TouchableOpacity onPress={handleExportCsv} style={styles.backButton} disabled={isExporting}>
                        {isExporting
                            ? <ActivityIndicator size={20} color={theme.colors.brand[500]} />
                            : <Download color={theme.colors.brand[600]} size={22} />}
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleDeleteField} style={styles.backButton}>
                        <Trash2 color="#ef4444" size={24} />
                    </TouchableOpacity>
                </View>
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
                                <TouchableOpacity style={styles.recenterMapFloatBtn} onPress={handleRecenterMap}>
                                    <LocateFixed color="#fff" size={16} />
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

                {/* PROPERTIES SECTION */}
                {properties && (
                    <View style={[styles.card, { marginTop: 16 }]}>
                        <View style={[styles.cardHeader, { justifyContent: 'space-between' }]}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <Leaf color="#10b981" size={20} />
                                <Text style={styles.cardTitle}>{t('fields.properties', 'Field Properties')}</Text>
                            </View>
                            <TouchableOpacity onPress={openEditPropsModal} style={{ padding: 4 }}>
                                <Settings color="#6b7280" size={20} />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.grid}>
                            <Box label={t('add_field.nitrogen')} value={properties.nitrogen != null ? Number(properties.nitrogen.toFixed(2)) : undefined} unit="mg/kg" icon={<Activity color="#10b981" size={24} />} />
                            <Box label={t('add_field.phosphorus')} value={properties.phosphorus != null ? Number(properties.phosphorus.toFixed(2)) : undefined} unit="mg/kg" icon={<Activity color="#3b82f6" size={24} />} />
                            <Box label={t('add_field.potassium')} value={properties.potassium != null ? Number(properties.potassium.toFixed(2)) : undefined} unit="mg/kg" icon={<Activity color="#f59e0b" size={24} />} />
                            <Box label={t('add_field.ph_value')} value={properties.ph != null ? Number(properties.ph.toFixed(2)) : undefined} unit="pH" icon={<Activity color="#8b5cf6" size={24} />} />
                        </View>
                    </View>
                )}

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
                            <Box label={t('fields.battery')} value={telemetry.batteryPercentage?.toFixed(0)} unit="%" icon={<Zap color="#16a34a" size={24} />} />
                            <Box label={t('fields.battery_voltage')} value={telemetry.batteryVoltage?.toFixed(2)} unit="V" icon={<Cpu color="#0f766e" size={24} />} />
                        </View>
                    )}
                </View>

                {/* HISTORICAL DATA SECTION */}
                <View style={[styles.card, { marginTop: 16 }]}>
                    <View style={styles.cardHeader}>
                        <Activity color="#0c4a6e" size={20} />
                        <Text style={styles.cardTitle}>{t('fields.historical_data', 'Historical Data')}</Text>
                    </View>
                    
                    <View style={styles.tabContainer}>
                        <TouchableOpacity style={[styles.tabBtn, timeframe === 'today' && styles.tabBtnActive]} onPress={() => setTimeframe('today')}>
                            <Text style={[styles.tabText, timeframe === 'today' && styles.tabTextActive]}>{t('common.today', 'Today')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.tabBtn, timeframe === 7 && styles.tabBtnActive]} onPress={() => setTimeframe(7)}>
                            <Text style={[styles.tabText, timeframe === 7 && styles.tabTextActive]}>{t('fields.timeframe_7', '7 Days')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.tabBtn, timeframe === 30 && styles.tabBtnActive]} onPress={() => setTimeframe(30)}>
                            <Text style={[styles.tabText, timeframe === 30 && styles.tabTextActive]}>{t('fields.timeframe_30', '30 Days')}</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Metric Toggles */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                        <View style={{ flexDirection: 'row', gap: 6, paddingVertical: 4 }}>
                            <TouchableOpacity style={[styles.metricFilterBtn, visibleMetrics.soilTemp && { backgroundColor: '#ea580c', borderColor: '#ea580c' }]} onPress={() => setVisibleMetrics(s => ({ ...s, soilTemp: !s.soilTemp }))}>
                                <Text style={[styles.metricFilterText, visibleMetrics.soilTemp && { color: '#fff' }]}>{t('fields.soil_temp', 'Soil Temp')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.metricFilterBtn, visibleMetrics.soilHumidity && { backgroundColor: '#2563eb', borderColor: '#2563eb' }]} onPress={() => setVisibleMetrics(s => ({ ...s, soilHumidity: !s.soilHumidity }))}>
                                <Text style={[styles.metricFilterText, visibleMetrics.soilHumidity && { color: '#fff' }]}>{t('fields.soil_moisture', 'Soil Moist')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.metricFilterBtn, visibleMetrics.ambientTemp && { backgroundColor: '#16a34a', borderColor: '#16a34a' }]} onPress={() => setVisibleMetrics(s => ({ ...s, ambientTemp: !s.ambientTemp }))}>
                                <Text style={[styles.metricFilterText, visibleMetrics.ambientTemp && { color: '#fff' }]}>{t('fields.ambient_temp', 'Amb Temp')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.metricFilterBtn, visibleMetrics.ambientHumidity && { backgroundColor: '#9333ea', borderColor: '#9333ea' }]} onPress={() => setVisibleMetrics(s => ({ ...s, ambientHumidity: !s.ambientHumidity }))}>
                                <Text style={[styles.metricFilterText, visibleMetrics.ambientHumidity && { color: '#fff' }]}>{t('fields.ambient_humidity', 'Amb Hum')}</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>

                    {isHistoryLoading ? (
                        <ActivityIndicator style={{ paddingVertical: 20 }} color={theme.colors.brand[500]} />
                    ) : history.length === 0 ? (
                        <Text style={styles.emptyText}>{t('fields.no_history', 'No historical data found.')}</Text>
                    ) : (() => {
                        const chartLabels = history.map(item => {
                            const dateObj = parseBackendUtcDate(item.period);
                            if (!dateObj) return '--';
                            return timeframe === 'today' 
                                ? dateObj.toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit', hour12: false })
                                : dateObj.toLocaleDateString(i18n.language, { month: '2-digit', day: '2-digit' });
                        });
                        const step = Math.max(1, Math.floor(chartLabels.length / 5));
                        const filteredLabels = chartLabels.map((l, i) => i % step === 0 ? l : '');

                        const datasets = [];
                        if (visibleMetrics.soilTemp) datasets.push({ data: history.map(h => h.avgSoilTemp ?? 0), color: (opacity = 1) => `rgba(234, 88, 12, ${opacity})`, strokeWidth: 2 });
                        if (visibleMetrics.soilHumidity) datasets.push({ data: history.map(h => h.avgSoilHumidity ?? 0), color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`, strokeWidth: 2 });
                        if (visibleMetrics.ambientTemp) datasets.push({ data: history.map(h => h.avgAmbientTemp ?? 0), color: (opacity = 1) => `rgba(22, 163, 74, ${opacity})`, strokeWidth: 2 });
                        if (visibleMetrics.ambientHumidity) datasets.push({ data: history.map(h => h.avgAmbientHumidity ?? 0), color: (opacity = 1) => `rgba(147, 51, 234, ${opacity})`, strokeWidth: 2 });

                        if (datasets.length === 0) {
                            return <Text style={[styles.emptyText, { marginTop: 10 }]}>{t('fields.select_metric_prompt', 'Select at least one metric to display the graph.')}</Text>;
                        }

                        return (
                            <View>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                    <View style={{ marginTop: 10, paddingRight: 16 }}>
                                        <LineChart
                                            data={{ labels: filteredLabels, datasets }}
                                            width={Math.max(screenWidth - 32, history.length * 35)}
                                            height={220}
                                            yAxisSuffix=""
                                            yAxisInterval={1}
                                            withDots={timeframe === 'today' || history.length < 15}
                                            chartConfig={{
                                                backgroundColor: "#ffffff",
                                                backgroundGradientFrom: "#ffffff",
                                                backgroundGradientTo: "#ffffff",
                                                decimalPlaces: 0,
                                                color: (opacity = 1) => `rgba(203, 213, 225, ${opacity})`, // grid
                                                labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`, // text
                                                fillShadowGradientOpacity: 0.1,
                                                style: { borderRadius: 16 },
                                                propsForDots: { r: "3", strokeWidth: "1", stroke: "#cbd5e1" }
                                            }}
                                            bezier
                                            style={{ marginVertical: 8, borderRadius: 16 }}
                                        />
                                    </View>
                                </ScrollView>

                                <View style={{ marginTop: 20 }}>
                                    <TouchableOpacity
                                        style={styles.tableToggleBtn}
                                        onPress={() => setIsHistoryTableExpanded((prev) => !prev)}
                                    >
                                        <Text style={styles.tableToggleBtnText}>
                                            {isHistoryTableExpanded
                                                ? t('fields.hide_historical_table', 'Hide historical table')
                                                : t('fields.show_historical_table', 'Show historical table')}
                                        </Text>
                                    </TouchableOpacity>

                                    {isHistoryTableExpanded && (
                                        <View style={{ marginTop: 12 }}>
                                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                                <View>
                                                    <View style={styles.tableRowHeader}>
                                                        <Text style={[styles.tableCellHeader, { width: 100 }]}>{t('common.date', 'Date')}</Text>
                                                        <Text style={[styles.tableCellHeader, { width: 75 }]}>{t('fields.soil_temp', 'Soil Temp')}</Text>
                                                        <Text style={[styles.tableCellHeader, { width: 75 }]}>{t('fields.soil_moisture', 'Soil Moist')}</Text>
                                                        <Text style={[styles.tableCellHeader, { width: 75 }]}>{t('fields.ambient_temp', 'Amb Temp')}</Text>
                                                        <Text style={[styles.tableCellHeader, { width: 75 }]}>{t('fields.ambient_humidity', 'Amb Hum')}</Text>
                                                    </View>
                                                    {history.map((item, index) => {
                                                        const dateObj = parseBackendUtcDate(item.period);
                                                        const dateStr = !dateObj
                                                            ? '--'
                                                            : timeframe === 'today'
                                                              ? dateObj.toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit', hour12: false })
                                                              : dateObj.toLocaleDateString(i18n.language, { month: 'short', day: 'numeric' });

                                                        return (
                                                            <View key={index} style={[styles.tableRow, index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd]}>
                                                                <Text style={[styles.tableCell, { width: 100, fontWeight: 'bold' }]}>{dateStr}</Text>
                                                                <Text style={[styles.tableCell, { width: 75 }]}>{item.avgSoilTemp != null ? item.avgSoilTemp.toFixed(1) + '°C' : '--'}</Text>
                                                                <Text style={[styles.tableCell, { width: 75 }]}>{item.avgSoilHumidity != null ? item.avgSoilHumidity.toFixed(1) + '%' : '--'}</Text>
                                                                <Text style={[styles.tableCell, { width: 75 }]}>{item.avgAmbientTemp != null ? item.avgAmbientTemp.toFixed(1) + '°C' : '--'}</Text>
                                                                <Text style={[styles.tableCell, { width: 75 }]}>{item.avgAmbientHumidity != null ? item.avgAmbientHumidity.toFixed(1) + '%' : '--'}</Text>
                                                            </View>
                                                        );
                                                    })}
                                                </View>
                                            </ScrollView>
                                        </View>
                                    )}
                                </View>
                            </View>
                        );
                    })()}
                </View>

                {/* WEATHER SECTION */}
                {weather && (
                    <View style={[styles.card, { marginTop: 16 }]}>
                        <View style={styles.cardHeader}>
                            <CloudRain color="#0284c7" size={20} />
                            <Text style={styles.cardTitle}>{t('fields.weather')}</Text>
                        </View>
                        <View style={styles.grid}>
                            <Box label={t('dashboard.temperature')} value={weather.temperature.toFixed(1)} unit="°C" icon={<Thermometer color="#f59e0b" size={24} />} />
                            <Box label={t('fields.ambient_humidity')} value={weather.humidity.toFixed(0)} unit="%" icon={<CloudRain color="#6366f1" size={24} />} />
                            <Box label={t('fields.precipitation')} value={weather.precipitation.toFixed(1)} unit="mm" icon={<Droplet color="#3b82f6" size={24} />} />
                        </View>
                    </View>
                )}

                {/* AI RECOMMENDATIONS SECTION */}
                <View style={[styles.card, { marginTop: 16 }]}>
                    <View style={[styles.cardHeader, { justifyContent: 'space-between' }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <BrainCircuit color="#10b981" size={20} />
                            <Text style={styles.cardTitle}>{t('fields.ai_recommendations', 'AI Crop Recommendations')}</Text>
                        </View>
                        <TouchableOpacity onPress={() => setIsAnalysisModalOpen(true)} style={{ padding: 4 }}>
                            <Settings color="#6b7280" size={20} />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity style={styles.askAiButton} onPress={handleAskAiForField}>
                        <MessageCircle color="#fff" size={16} />
                        <Text style={styles.askAiButtonText}>{t('fields.ask_ai_about_field')}</Text>
                    </TouchableOpacity>

                    {!analysis || analysis.recommendations.length === 0 ? (
                        <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                            <Text style={styles.emptyText}>{t('fields.no_recommendations', 'No recommendations found.')}</Text>
                            <TouchableOpacity onPress={() => setIsAnalysisModalOpen(true)} style={{ marginTop: 12, backgroundColor: '#10b981', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 }}>
                                <Text style={{ color: '#fff', fontWeight: 'bold' }}>{t('fields.run_analysis', 'Run Analysis')}</Text>
                            </TouchableOpacity>
                        </View>
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
            </ScrollView>

            {/* AI Analysis Settings Modal */}
            <Modal visible={isAnalysisModalOpen} transparent animationType="slide" onRequestClose={() => setIsAnalysisModalOpen(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{t('fields.ai_settings_title', 'AI Analysis Settings')}</Text>
                            <TouchableOpacity onPress={() => setIsAnalysisModalOpen(false)}><Text style={{ fontSize: 24, color: '#6b7280' }}>×</Text></TouchableOpacity>
                        </View>
                        <ScrollView style={{ maxHeight: 500 }}>
                            <View style={styles.tabContainer}>
                                <TouchableOpacity style={[styles.tabBtn, activeScenario === 'RANGE' && styles.tabBtnActive]} onPress={() => setActiveScenario('RANGE')}>
                                    <Text style={[styles.tabText, activeScenario === 'RANGE' && styles.tabTextActive]}>{t('fields.ai_tab_range', 'Range')}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.tabBtn, activeScenario === 'FUTURE' && styles.tabBtnActive]} onPress={() => setActiveScenario('FUTURE')}>
                                    <Text style={[styles.tabText, activeScenario === 'FUTURE' && styles.tabTextActive]}>{t('fields.ai_tab_future', 'Future')}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.tabBtn, activeScenario === 'WHAT_IF' && styles.tabBtnActive]} onPress={() => setActiveScenario('WHAT_IF')}>
                                    <Text style={[styles.tabText, activeScenario === 'WHAT_IF' && styles.tabTextActive]}>{t('fields.ai_tab_whatif', 'What-If')}</Text>
                                </TouchableOpacity>
                            </View>

                            {activeScenario === 'RANGE' && (
                                <View style={{ gap: 12 }}>
                                    <Text style={styles.inputLabel}>{t('fields.ai_start_date', 'Start Date (YYYY-MM-DD)')}</Text>
                                    <TextInput style={styles.input} value={rangeStart} onChangeText={setRangeStart} placeholder="2023-01-01" />
                                    <Text style={styles.inputLabel}>{t('fields.ai_end_date', 'End Date (YYYY-MM-DD)')}</Text>
                                    <TextInput style={styles.input} value={rangeEnd} onChangeText={setRangeEnd} placeholder="2023-12-31" />
                                </View>
                            )}

                            {(activeScenario === 'FUTURE' || activeScenario === 'WHAT_IF') && (
                                <View style={{ gap: 12 }}>
                                    <Text style={styles.inputLabel}>{t('fields.ai_season_start', 'Target Season Start (Month 1-12)')}</Text>
                                    <TextInput style={styles.input} keyboardType="numeric" value={monthStart} onChangeText={setMonthStart} placeholder="6" />
                                    <Text style={styles.inputLabel}>{t('fields.ai_season_end', 'Target Season End (Month 1-12)')}</Text>
                                    <TextInput style={styles.input} keyboardType="numeric" value={monthEnd} onChangeText={setMonthEnd} placeholder="9" />
                                </View>
                            )}

                            {activeScenario === 'WHAT_IF' && (
                                <View style={{ gap: 16, marginTop: 12 }}>
                                    <View>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Text style={[styles.inputLabel, { color: useOverrideTemp ? '#111827' : '#9ca3af' }]}>{t('fields.ai_override_temp', 'Override Temp (°C):')} {overrideTemp.toFixed(1)}</Text>
                                            <Switch value={useOverrideTemp} onValueChange={setUseOverrideTemp} trackColor={{ true: '#10b981' }} />
                                        </View>
                                        <Slider
                                            style={{ width: '100%', height: 40, opacity: useOverrideTemp ? 1 : 0.5 }}
                                            minimumValue={-10}
                                            maximumValue={50}
                                            step={0.5}
                                            value={overrideTemp}
                                            onValueChange={setOverrideTemp}
                                            disabled={!useOverrideTemp}
                                            minimumTrackTintColor="#10b981"
                                            maximumTrackTintColor="#d1d5db"
                                            thumbTintColor={useOverrideTemp ? "#10b981" : "#d1d5db"}
                                        />
                                    </View>
                                    
                                    <View>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Text style={[styles.inputLabel, { color: useOverrideHum ? '#111827' : '#9ca3af' }]}>{t('fields.ai_override_hum', 'Override Humidity (%):')} {overrideHum.toFixed(0)}</Text>
                                            <Switch value={useOverrideHum} onValueChange={setUseOverrideHum} trackColor={{ true: '#3b82f6' }} />
                                        </View>
                                        <Slider
                                            style={{ width: '100%', height: 40, opacity: useOverrideHum ? 1 : 0.5 }}
                                            minimumValue={0}
                                            maximumValue={100}
                                            step={1}
                                            value={overrideHum}
                                            onValueChange={setOverrideHum}
                                            disabled={!useOverrideHum}
                                            minimumTrackTintColor="#3b82f6"
                                            maximumTrackTintColor="#d1d5db"
                                            thumbTintColor={useOverrideHum ? "#3b82f6" : "#d1d5db"}
                                        />
                                    </View>
                                    
                                    <View>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Text style={[styles.inputLabel, { color: useOverrideRain ? '#111827' : '#9ca3af' }]}>{t('fields.ai_override_rain', 'Override Rain (mm):')} {overrideRain.toFixed(0)}</Text>
                                            <Switch value={useOverrideRain} onValueChange={setUseOverrideRain} trackColor={{ true: '#0ea5e9' }} />
                                        </View>
                                        <Slider
                                            style={{ width: '100%', height: 40, opacity: useOverrideRain ? 1 : 0.5 }}
                                            minimumValue={0}
                                            maximumValue={1000}
                                            step={10}
                                            value={overrideRain}
                                            onValueChange={setOverrideRain}
                                            disabled={!useOverrideRain}
                                            minimumTrackTintColor="#0ea5e9"
                                            maximumTrackTintColor="#d1d5db"
                                            thumbTintColor={useOverrideRain ? "#0ea5e9" : "#d1d5db"}
                                        />
                                    </View>
                                </View>
                            )}
                        </ScrollView>
                        <View style={{ marginTop: 20, flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }}>
                            <TouchableOpacity onPress={() => setIsAnalysisModalOpen(false)} style={styles.cancelBtn}>
                                <Text style={styles.cancelBtnText}>{t('common.cancel', 'Cancel')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleRunAnalysis} style={[styles.saveBtn, { opacity: isAnalyzing ? 0.7 : 1 }]} disabled={isAnalyzing}>
                                {isAnalyzing ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveBtnText}>{t('fields.ai_analyze', 'Analyze')}</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Edit Properties Modal */}
            <Modal visible={isEditingProps} transparent animationType="slide" onRequestClose={() => setIsEditingProps(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{t('fields.edit_properties', 'Edit Properties')}</Text>
                            <TouchableOpacity onPress={() => setIsEditingProps(false)}><Text style={{ fontSize: 24, color: '#6b7280' }}>×</Text></TouchableOpacity>
                        </View>
                        <ScrollView style={{ maxHeight: 500 }} keyboardShouldPersistTaps="handled">
                            <Text style={[styles.subtext, { marginBottom: 16 }]}>{t('add_field.lab_alert', 'Leave fields empty to use automatic values.')}</Text>
                            <View style={{ gap: 12 }}>
                                <Text style={styles.inputLabel}>{t('add_field.nitrogen')}</Text>
                                <TextInput style={styles.input} keyboardType="decimal-pad" value={editPropsForm.nitrogen} onChangeText={(v) => setEditPropsForm(p => ({ ...p, nitrogen: v }))} placeholder={t('add_field.auto')} />
                                
                                <Text style={styles.inputLabel}>{t('add_field.phosphorus')}</Text>
                                <TextInput style={styles.input} keyboardType="decimal-pad" value={editPropsForm.phosphorus} onChangeText={(v) => setEditPropsForm(p => ({ ...p, phosphorus: v }))} placeholder={t('add_field.auto')} />
                                
                                <Text style={styles.inputLabel}>{t('add_field.potassium')}</Text>
                                <TextInput style={styles.input} keyboardType="decimal-pad" value={editPropsForm.potassium} onChangeText={(v) => setEditPropsForm(p => ({ ...p, potassium: v }))} placeholder={t('add_field.auto')} />
                                
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                                    <Text style={styles.inputLabel}>{t('add_field.use_default_ph', { value: '6.44' })}</Text>
                                    <Switch value={editPropsForm.useDefaultPh} onValueChange={(v) => setEditPropsForm(p => ({ ...p, useDefaultPh: v }))} trackColor={{ true: '#10b981' }} />
                                </View>
                                
                                {!editPropsForm.useDefaultPh && (
                                    <View>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Text style={styles.inputLabel}>{t('add_field.ph_value')}</Text>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                                <TextInput
                                                    style={{ width: 64, paddingVertical: 6, borderWidth: 2, borderColor: phColor(editPropsForm.ph), color: phColor(editPropsForm.ph), fontWeight: 'bold', borderRadius: 8, paddingHorizontal: 8, fontSize: 15, backgroundColor: '#f9fafb', textAlign: 'center' }}
                                                    keyboardType="decimal-pad"
                                                    value={editPropsForm.phText}
                                                    onChangeText={(v) => {
                                                        setEditPropsForm(p => ({ ...p, phText: v }));
                                                        const num = parseFloat(v);
                                                        if (!isNaN(num)) {
                                                            const clamped = Math.min(14, Math.max(0, num));
                                                            setEditPropsForm(p => ({ ...p, ph: clamped }));
                                                        }
                                                    }}
                                                    onEndEditing={() => {
                                                        setEditPropsForm(p => ({ ...p, phText: p.ph.toString() }));
                                                    }}
                                                />
                                                <Text style={{ fontSize: 12, color: '#6b7280' }}>pH</Text>
                                            </View>
                                        </View>
                                        <Slider
                                            style={{ width: '100%', height: 40 }}
                                            minimumValue={0}
                                            maximumValue={14}
                                            step={0.1}
                                            value={editPropsForm.ph}
                                            onValueChange={(v) => {
                                                const rounded = Math.round(v * 10) / 10;
                                                setEditPropsForm(p => ({ ...p, ph: rounded, phText: rounded.toString() }));
                                            }}
                                            minimumTrackTintColor={phColor(editPropsForm.ph)}
                                            maximumTrackTintColor="#d1d5db"
                                        />
                                    </View>
                                )}
                            </View>
                        </ScrollView>
                        <View style={{ marginTop: 20, flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }}>
                            <TouchableOpacity onPress={() => setIsEditingProps(false)} style={styles.cancelBtn}>
                                <Text style={styles.cancelBtnText}>{t('common.cancel', 'Cancel')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleSaveProperties} style={[styles.saveBtn, { opacity: isSavingProps ? 0.7 : 1 }]} disabled={isSavingProps}>
                                {isSavingProps ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveBtnText}>{t('common.save', 'Save')}</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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
    recenterMapFloatBtn: {
        position: 'absolute',
        bottom: 10,
        right: 10,
        backgroundColor: 'rgba(0,0,0,0.6)',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 10,
        borderRadius: 8,
        justifyContent: 'center'
    },
    cancelBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, backgroundColor: '#f3f4f6' },
    cancelBtnText: { color: '#374151', fontWeight: 'bold', fontSize: 13 },
    saveBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6, backgroundColor: '#059669', flexDirection: 'row', alignItems: 'center' },
    saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
    recBox: { padding: 12, borderRadius: 12, borderWidth: 1 },
    askAiButton: {
        backgroundColor: theme.colors.brand[600],
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 12,
    },
    askAiButtonText: { color: '#fff', fontSize: 13, fontWeight: '700' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modalContent: { backgroundColor: '#fff', borderRadius: 16, padding: 20, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
    tabContainer: { flexDirection: 'row', marginBottom: 16, borderRadius: 8, backgroundColor: '#f3f4f6', padding: 4 },
    tabBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6 },
    tabBtnActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
    tabText: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
    tabTextActive: { color: '#059669' },
    inputLabel: { fontSize: 12, fontWeight: '600', color: '#374151', marginBottom: 4 },
    metricFilterBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#f9fafb' },
    metricFilterText: { fontSize: 12, fontWeight: '600', color: '#6b7280' },
    tableToggleBtn: {
        alignSelf: 'flex-start',
        backgroundColor: '#f3f4f6',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    tableToggleBtnText: {
        color: '#374151',
        fontSize: 12,
        fontWeight: '700',
    },
    // Table
    tableRowHeader: { flexDirection: 'row', paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: '#e5e7eb', marginBottom: 4 },
    tableCellHeader: { fontSize: 12, fontWeight: '700', color: '#4b5563', paddingHorizontal: 4 },
    tableRow: { flexDirection: 'row', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
    tableRowEven: { backgroundColor: '#ffffff' },
    tableRowOdd: { backgroundColor: '#f9fafb' },
    tableCell: { fontSize: 13, color: '#1f2937', paddingHorizontal: 4 }
});
