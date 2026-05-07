import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
    Box, Flex, Text, Spinner, Button, IconButton,
    Input, Circle,
} from "@chakra-ui/react"
import { Sprout, Trash2, BrainCircuit, Pencil, X, Save, AlertTriangle, Thermometer, Droplets, Wind, CloudRain, Battery, LocateFixed, Download } from "lucide-react"
import { useTranslation } from "react-i18next"
import { MapContainer, TileLayer, Polygon, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import {
    CartesianGrid, XAxis, YAxis, Tooltip, Area, ResponsiveContainer,
    AreaChart as RechartsAreaChart, Legend
} from "recharts"
import { DashboardLayout } from "../../components/layout/DashboardLayout"
import { useFieldTelemetrySocket } from "../../hooks/useFieldTelemetrySocket"
import { fieldsService } from "../../features/fields/fields.service"
import type { UpdateFieldRequest } from "../../features/fields/fields.service"
import { normalizeCropName, toCropSlug } from "../../features/crop-guides/normalizeCropName"
import MapSelector from "../../components/map/MapSelector"
import { MetricCard } from "../../components/field-details/MetricCard"
import { DeleteFieldDialog, PairDeviceDialog, UnpairDeviceDialog } from "../../components/field-details/FieldDetailsDialogs"
import { FieldDetailsAnalysisModal } from "../../components/field-details/FieldDetailsAnalysisModal"
import { FieldDetailsRecommendations } from "../../components/field-details/FieldDetailsRecommendations"
import { parseBackendDate, toLocalDateInputValue, toUtcIsoNoZone } from "../../utils/dateTime"
import type {
    Field as FieldType,
    SensorData,
    WeatherData,
    HistoricalSensorData,
    AnalysisResult,
    FieldProperties,
} from "../../features/fields/types"
import { getDeviceStatus } from "../../utils/deviceStatus"

const ESRI_SATELLITE = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const ESRI_LABELS = 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}';
const COMMON_SOIL_TYPES = [
    'alluvial',
    'colluvial',
    'brown_steppe',
    'chestnut_steppe',
    'terra_rossa',
    'brown_forest',
    'vertisol',
    'chernozem',
] as const;

function formatDate(d: Date): string { return toLocalDateInputValue(d); }

function scenarioBadgeColor(scenario: string): string {
    if (scenario === 'RANGE') return '#2f855a';
    if (scenario === 'FUTURE') return '#2b6cb0';
    if (scenario === 'WHAT_IF') return '#6b46c1';
    return '#718096';
}

// Haversine distance between two lat/lng points in km
function getPolygonCenter(pts: number[][]): { lat: number; lng: number } {
    if (!pts || pts.length === 0) return { lat: 0, lng: 0 };
    const sum = pts.reduce((acc, v) => ({ lat: acc.lat + v[1], lng: acc.lng + v[0] }), { lat: 0, lng: 0 });
    return { lat: sum.lat / pts.length, lng: sum.lng / pts.length };
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/* ── Inline edit form state ─────────────────────────────────────────────── */
interface EditState {
    name: string;
    soilType: string;
    areaHa: string;
    location: number[][] | null;
    nitrogen: string;
    phosphorus: string;
    potassium: string;
    ph: string;
}

/* ── Map Recenter Control ── */
const RecenterControl = ({ bounds }: { bounds: number[][] }) => {
    const map = useMap();
    const { t } = useTranslation();
    if (!bounds || bounds.length === 0) return null;
    return (
        <IconButton
            aria-label={t('field_details.map_editor.recenter')}
            title={t('field_details.map_editor.recenter')}
            position="absolute" bottom={4} right={4} zIndex={400}
            variant="solid" bg="white" color="green.600" size="sm" borderRadius="md"
            boxShadow="0 2px 6px rgba(0,0,0,0.2)" border="1px solid" borderColor="gray.200"
            _hover={{ bg: "gray.50" }}
            onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                map.fitBounds(bounds.map(c => [c[1], c[0]]) as [number, number][]);
            }}
        >
            <LocateFixed size={18} />
        </IconButton>
    );
};

export const FieldDetails = () => {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { t, i18n } = useTranslation()

    const soilTypeLabel = (value?: string) => value ? t(`add_field.${value}`, { defaultValue: value }) : '-';

    /* ── Core data ── */
    const [field, setField] = useState<FieldType | null>(null)
    const [fieldProps, setFieldProps] = useState<FieldProperties | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [telemetry, setTelemetry] = useState<SensorData | null>(null)
    const [weather, setWeather] = useState<WeatherData | null>(null)
    const [history, setHistory] = useState<HistoricalSensorData[]>([])
    const [timeframe, setTimeframe] = useState<'today' | 7 | 14 | 30>(7)

    const { liveReading, isConnected } = useFieldTelemetrySocket(id || '')

    useEffect(() => {
        if (liveReading) {
            setTelemetry(liveReading)
            setField(prev => prev ? { ...prev, deviceLastSeenAt: liveReading.recordedAt } : prev)
            
            setHistory(prev => {
                const recordedAt = liveReading.recordedAt || new Date().toISOString();
                
                if (timeframe === 'today') {
                    const newEntry: HistoricalSensorData = {
                        period: recordedAt,
                        avgAmbientTemp: liveReading.ambientTemp || 0,
                        avgSoilTemp: liveReading.soilTemp || 0,
                        avgAmbientHumidity: liveReading.ambientHumidity || 0,
                        avgSoilHumidity: liveReading.soilHumidity || 0,
                    };
                    const newHistory = [...prev, newEntry];
                    return newHistory.length > 50 ? newHistory.slice(newHistory.length - 50) : newHistory;
                } else {
                    const todayStr = new Date().toISOString().split('T')[0];
                    const lastEntry = prev.length > 0 ? prev[prev.length - 1] : null;
                    
                    if (lastEntry && lastEntry.period.startsWith(todayStr)) {
                        const updated = [...prev];
                        updated[updated.length - 1] = {
                            ...lastEntry,
                            avgAmbientTemp: liveReading.ambientTemp || lastEntry.avgAmbientTemp,
                            avgSoilTemp: liveReading.soilTemp || lastEntry.avgSoilTemp,
                            avgAmbientHumidity: liveReading.ambientHumidity || lastEntry.avgAmbientHumidity,
                            avgSoilHumidity: liveReading.soilHumidity || lastEntry.avgSoilHumidity,
                        };
                        return updated;
                    } else {
                        const newEntry: HistoricalSensorData = {
                            period: recordedAt,
                            avgAmbientTemp: liveReading.ambientTemp || 0,
                            avgSoilTemp: liveReading.soilTemp || 0,
                            avgAmbientHumidity: liveReading.ambientHumidity || 0,
                            avgSoilHumidity: liveReading.soilHumidity || 0,
                        };
                        return [...prev, newEntry];
                    }
                }
            });
        }
    }, [liveReading, timeframe])

    /* ── Graph Toggles ── */
    const [visibleMetrics, setVisibleMetrics] = useState({
        soilTemp: true,
        soilHumidity: true,
        ambientTemp: false,
        ambientHumidity: false
    })

    /* ── Inline edit ── */
    const [isEditing, setIsEditing] = useState(false)
    const [editState, setEditState] = useState<EditState | null>(null)
    const [isSaving, setIsSaving] = useState(false)
    const [editError, setEditError] = useState<string | null>(null)
    const [editSuccess, setEditSuccess] = useState(false)
    const [originalCenter, setOriginalCenter] = useState<{ lat: number; lng: number } | null>(null)
    const [driftKm, setDriftKm] = useState(0)

    /* ── Hardware pairing ── */
    const [isPairing, setIsPairing] = useState(false)
    const [macInput, setMacInput] = useState("")
    const [pairError, setPairError] = useState<string | null>(null)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [isUnpairDialogOpen, setIsUnpairDialogOpen] = useState(false)
    const [isPairDialogOpen, setIsPairDialogOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [isUnpairing, setIsUnpairing] = useState(false)
    const [isExporting, setIsExporting] = useState(false)
    const [exportError, setExportError] = useState<string | null>(null)
    const macInputRef = useRef<HTMLInputElement>(null)

    /* ── ML Analysis ── */
    const [lastAnalysis, setLastAnalysis] = useState<AnalysisResult | null>(null)
    const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false)
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [analysisError, setAnalysisError] = useState<string | null>(null)
    const [activeScenario, setActiveScenario] = useState<'range' | 'future' | 'whatif'>('range')
    const [rangeStart, setRangeStart] = useState(formatDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)))
    const [rangeEnd, setRangeEnd] = useState(formatDate(new Date()))
    const [monthStart, setMonthStart] = useState(6)
    const [monthEnd, setMonthEnd] = useState(9)
    const [overrideTemp, setOverrideTemp] = useState(25)
    const [useOverrideTemp, setUseOverrideTemp] = useState(false)
    const [overrideHum, setOverrideHum] = useState(60)
    const [useOverrideHum, setUseOverrideHum] = useState(false)
    const [overrideRain, setOverrideRain] = useState(400)
    const [useOverrideRain, setUseOverrideRain] = useState(false)

    /* ── Fetch core data ── */
    const loadHistory = useCallback(async (tf: 'today' | 7 | 14 | 30) => {
        if (!id) return;
        const end = toUtcIsoNoZone(new Date());
        let start: string;
        let interval: 'RAW' | 'HOURLY' | 'DAILY' = 'DAILY';

        if (tf === 'today') {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            start = toUtcIsoNoZone(today);
            interval = 'RAW';
        } else {
            const startDate = new Date(Date.now() - tf * 24 * 60 * 60 * 1000);
            start = toUtcIsoNoZone(startDate);
        }

        const data = await fieldsService.getHistoricalTelemetry(id, interval, start, end).catch(() => []);
        setHistory(data);
    }, [id]);

    useEffect(() => {
        if (!id) return;
        let isMounted = true;

        const fetchCritical = async () => {
            setIsLoading(true);
            try {
                const [fieldData, propsData] = await Promise.all([
                    fieldsService.getFieldById(id),
                    fieldsService.getFieldProperties(id).catch(() => null),
                ]);
                if (!isMounted) return;
                setField(fieldData);
                setFieldProps(propsData);
            } catch (err) {
                console.error('Error fetching field details:', err);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        const fetchBackground = async () => {
            try {
                const [telData, weatherData, histData, analysisData] = await Promise.all([
                    fieldsService.getMostRecentTelemetry(id).catch(() => null),
                    fieldsService.getLiveWeather(id).catch(() => null),
                    fieldsService.getHistoricalTelemetry(id, 'DAILY', toUtcIsoNoZone(new Date(Date.now() - 7 * 86400000)), toUtcIsoNoZone(new Date())).catch(() => []),
                    fieldsService.getLastAnalysis(id).catch(() => null),
                ]);
                if (!isMounted) return;
                if (telData) setTelemetry(telData);
                if (weatherData) setWeather(weatherData);
                if (histData) setHistory(histData);
                if (analysisData) setLastAnalysis(analysisData);
            } catch (err) {
                console.error('Error fetching background data:', err);
            }
        };

        fetchCritical().then(() => {
            if (isMounted) fetchBackground();
        });

        return () => { isMounted = false; };
    }, [id]);

    useEffect(() => { loadHistory(timeframe); }, [timeframe, loadHistory]);

    /* ── Enter / exit edit mode ── */
    const handleStartEdit = () => {
        if (!field) return;
        const center = getPolygonCenter(field.location ?? []);
        setOriginalCenter(center);
        setDriftKm(0);
        setEditState({
            name: field.name,
            soilType: field.soilType,
            areaHa: String(field.areaHa),
            location: field.location ?? null,
            nitrogen: fieldProps?.nitrogen != null ? String(fieldProps.nitrogen) : '',
            phosphorus: fieldProps?.phosphorus != null ? String(fieldProps.phosphorus) : '',
            potassium: fieldProps?.potassium != null ? String(fieldProps.potassium) : '',
            ph: fieldProps?.ph != null ? String(fieldProps.ph) : '',
        });
        setEditError(null);
        setEditSuccess(false);
        setIsEditing(true);
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditState(null);
        setEditError(null);
        setDriftKm(0);
    };

    // Track drift whenever location changes in edit state
    useEffect(() => {
        if (!originalCenter || !editState?.location) { setDriftKm(0); return; }
        const newCenter = getPolygonCenter(editState.location);
        setDriftKm(haversineKm(originalCenter.lat, originalCenter.lng, newCenter.lat, newCenter.lng));
    }, [editState?.location, originalCenter]);

    const handleSaveEdit = async () => {
        if (!id || !editState) return;
        setIsSaving(true);
        setEditError(null);
        try {
            const payload: UpdateFieldRequest = {
                name: editState.name.trim() || field!.name,
                areaHa: parseFloat(editState.areaHa) || field!.areaHa,
                soilType: editState.soilType || field!.soilType,
                location: editState.location ?? undefined,
            };
            const updated = await fieldsService.updateField(id, payload);
            await fieldsService.updateFieldProperties(id, {
                name: editState.name.trim() || field!.name,
                nitrogen: editState.nitrogen !== '' ? parseFloat(editState.nitrogen) : null,
                phosphorus: editState.phosphorus !== '' ? parseFloat(editState.phosphorus) : null,
                potassium: editState.potassium !== '' ? parseFloat(editState.potassium) : null,
                ph: editState.ph !== '' ? parseFloat(editState.ph) : null,
            });
            const freshProps = await fieldsService.getFieldProperties(id).catch(() => null);
            setField(updated);
            setFieldProps(freshProps);
            setEditSuccess(true);
            setIsEditing(false);
            setEditState(null);
            setTimeout(() => setEditSuccess(false), 3000);
        } catch (err) {
            setEditError(t('field_details.edit_error'));
        } finally {
            setIsSaving(false);
        }
    };

    /* ── Other handlers ── */
    const handleConfirmPair = async () => {
        if (!id || !macInput.trim()) return;
        setIsPairing(true); setPairError(null);
        try {
            await fieldsService.pairDevice(id, macInput.trim());
            setIsPairDialogOpen(false); setMacInput(''); window.location.reload();
        } catch (err: any) {
            setPairError(err.response?.data?.message || t('field_details.pair_error'));
        } finally { setIsPairing(false); }
    };

    const handleConfirmUnpair = async () => {
        if (!id) return;
        setIsUnpairing(true);
        try {
            await fieldsService.unpairDevice(id);
            const u = await fieldsService.getFieldById(id);
            setField(u); setIsUnpairDialogOpen(false);
        } catch (err) { console.error(err); }
        finally { setIsUnpairing(false); }
    };

    const handleConfirmDelete = async () => {
        if (!id) return;
        setIsDeleting(true);
        try { await fieldsService.deleteField(id); navigate('/dashboard'); }
        catch (err) { console.error(err); setIsDeleting(false); setIsDeleteDialogOpen(false); }
    };

    const handleRunAnalysis = async () => {
        if (!id) return;
        setIsAnalyzing(true); setAnalysisError(null);
        try {
            let result: AnalysisResult;
            if (activeScenario === 'range') {
                result = await fieldsService.runAnalysis({ fieldId: id, isFuturePrediction: false, startDate: rangeStart, endDate: rangeEnd, topN: 5 });
            } else if (activeScenario === 'future') {
                result = await fieldsService.runAnalysis({ fieldId: id, isFuturePrediction: true, targetMonthStart: monthStart, targetMonthEnd: monthEnd, topN: 5 });
            } else {
                const overrides: { temperature?: number; humidity?: number; rainfall?: number } = {};
                if (useOverrideTemp) overrides.temperature = overrideTemp;
                if (useOverrideHum) overrides.humidity = overrideHum;
                if (useOverrideRain) overrides.rainfall = overrideRain;
                result = await fieldsService.runAnalysis({
                    fieldId: id,
                    isFuturePrediction: true,
                    targetMonthStart: monthStart,
                    targetMonthEnd: monthEnd,
                    topN: 5,
                    overrides: Object.keys(overrides).length > 0 ? overrides : undefined,
                });
            }
            setLastAnalysis(result); setIsAnalysisModalOpen(false);
        } catch (err: any) {
            setAnalysisError(err.response?.data?.message || err.message || t('field_details.analysis_failed'));
        } finally { setIsAnalyzing(false); }
    };

    const handleExportCsv = async () => {
        if (!id || !field) return;
        setIsExporting(true);
        setExportError(null);
        try {
            const safeName = field.name.trim().toLowerCase().replace(/\s+/g, '-');
            await fieldsService.exportTelemetryCsv(id, safeName || 'field-telemetry');
        } catch (err) {
            setExportError(t('field_details.export_error'));
        } finally {
            setIsExporting(false);
        }
    };

    /* ── Label helpers ── */
    const scenarioLabel = (s: string) => s === 'RANGE' ? t('field_details.ai.scenario_range') : s === 'FUTURE' ? t('field_details.ai.scenario_future') : s === 'WHAT_IF' ? t('field_details.ai.scenario_whatif') : s;
    const weatherSourceLabel = (s: string) => s === 'IOT' ? t('field_details.ai.source_iot') : s === 'WEATHER_LOG' ? t('field_details.ai.source_weather_log') : t('field_details.ai.source_climatology');
    const confidenceLabel = (c: 'green' | 'orange' | 'gray') => c === 'green' ? t('field_details.ai.confidence_high') : c === 'orange' ? t('field_details.ai.confidence_moderate') : t('field_details.ai.confidence_low');
    const cropLabel = (crop: string) => t(`crop_names.${normalizeCropName(crop)}`, { defaultValue: crop });
    const contributionLabel = (feature: string) => t(`field_details.ai.features.${feature}`, { defaultValue: feature });
    const contributionUnit = (feature: string) => {
        if (feature === 'rainfall') return t('field_details.ai.units.rainfall');
        if (feature === 'temperature') return t('field_details.ai.units.temperature');
        if (feature === 'humidity') return t('field_details.ai.units.humidity');
        if (feature === 'N' || feature === 'P' || feature === 'K') return t('field_details.ai.units.npk');
        return '';
    };
    const formatContributionValue = (feature: string, value: number | undefined) => {
        if (value == null || Number.isNaN(value)) return t('field_details.ai.value_unknown');
        if (feature === 'ph' || feature === 'temperature') return value.toFixed(1);
        return value.toFixed(0);
    };
    const impactLabel = (score: number) => {
        if (score >= 3) return t('field_details.ai.impact_strong');
        if (score >= 1) return t('field_details.ai.impact_moderate');
        return t('field_details.ai.impact_slight');
    };
    const suitabilityLabel = (score: number) => {
        if (score >= 3) return t('field_details.ai.suitability_strong');
        if (score >= 1) return t('field_details.ai.suitability_moderate');
        return t('field_details.ai.suitability_slight');
    };
    const contributionExplanation = (feature: string, rawValue: number | undefined, score: number) => {
        return t('field_details.ai.factor_explanation_detailed', {
            feature: contributionLabel(feature),
            value: formatContributionValue(feature, rawValue),
            unit: contributionUnit(feature),
            suitability: suitabilityLabel(score),
            impact: impactLabel(score),
        });
    };

    const deviceStatus = field ? getDeviceStatus(field, t) : null;
    const status: 'online' | 'paired' | 'inactive' | 'offline' =
        !field?.deviceId ? 'offline'
            : !field.deviceLastSeenAt ? 'paired'
                : (deviceStatus?.status ?? 'offline');
    const statusConfig = {
        online: { bg: 'brand.50', color: 'green.700', border: 'brand.100', dot: 'green.500', pulse: true, label: t('dashboard.online') },
        paired: { bg: 'yellow.50', color: 'yellow.700', border: 'yellow.100', dot: 'yellow.500', pulse: false, label: t('dashboard.paired') },
        inactive: { bg: 'yellow.50', color: 'yellow.700', border: 'yellow.100', dot: 'yellow.500', pulse: false, label: t('fields_page.inactive') },
        offline: { bg: 'red.50', color: 'red.700', border: 'red.100', dot: 'red.500', pulse: false, label: t('dashboard.offline') },
    }[status];

    /* ── Chart gradient definition ── */
    const ChartGradients = () => (
        <defs>
            <linearGradient id="gradMoisture" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3182CE" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#3182CE" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="gradTemp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#DD6B20" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#DD6B20" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="gradAmbTemp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#38A169" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#38A169" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="gradAmbHum" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#805AD5" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#805AD5" stopOpacity={0.02} />
            </linearGradient>
        </defs>
    );

    const chartData = history.map(d => ({
        ...d,
        label: timeframe === 'today'
            ? parseBackendDate(d.period).toLocaleTimeString(i18n.language === 'tr' ? 'tr-TR' : 'en-US', { hour: '2-digit', minute: '2-digit' })
            : parseBackendDate(d.period).toLocaleDateString(i18n.language === 'tr' ? 'tr-TR' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
    }));

    if (isLoading || !field) {
        return (
            <DashboardLayout title={t('field_details.title')} subtitle={t('field_details.loading')}>
                <Flex minH="60vh" align="center" justify="center" direction="column" color="brand.500">
                    <Spinner size="xl" mb={4} />
                    <Text fontWeight="medium" color="neutral.subtext">{t('field_details.loading')}</Text>
                </Flex>
            </DashboardLayout>
        );
    }

    return (
        <>
            {/* ── Delete Dialog ── */}
            <DeleteFieldDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                title={t('field_details.delete_title')}
                description={t('field_details.delete_desc', { name: field.name })}
                cancelLabel={t('field_details.cancel')}
                confirmLabel={t('field_details.delete_btn')}
                isDeleting={isDeleting}
                onConfirm={handleConfirmDelete}
            />

            {/* ── Unpair Dialog ── */}
            <UnpairDeviceDialog
                open={isUnpairDialogOpen}
                onOpenChange={setIsUnpairDialogOpen}
                title={t('field_details.unpair_title')}
                description={t('field_details.unpair_desc', { id: field.deviceId })}
                cancelLabel={t('field_details.cancel')}
                confirmLabel={t('field_details.unpair_btn')}
                isUnpairing={isUnpairing}
                onConfirm={handleConfirmUnpair}
            />

            {/* ── Pair Dialog ── */}
            <PairDeviceDialog
                open={isPairDialogOpen}
                onOpenChange={(open) => {
                    setIsPairDialogOpen(open);
                    if (!open) {
                        setMacInput('');
                        setPairError(null);
                    }
                }}
                initialFocusEl={() => macInputRef.current}
                macLabel={t('field_details.mac_address')}
                macPlaceholder={t('field_details.mac_ph')}
                macHelper={t('field_details.mac_helper')}
                pairTitle={t('field_details.pair_title')}
                cancelLabel={t('field_details.cancel')}
                pairLabel={t('field_details.pair_btn')}
                macInput={macInput}
                pairError={pairError}
                isPairing={isPairing}
                inputRef={macInputRef}
                onMacChange={(value) => {
                    setMacInput(value);
                    setPairError(null);
                }}
                onConfirm={handleConfirmPair}
            />

            <FieldDetailsAnalysisModal
                open={isAnalysisModalOpen}
                onOpenChange={(open) => {
                    setIsAnalysisModalOpen(open);
                    if (!open) setAnalysisError(null);
                }}
                analysisError={analysisError}
                activeScenario={activeScenario}
                setActiveScenario={setActiveScenario}
                rangeStart={rangeStart}
                setRangeStart={setRangeStart}
                rangeEnd={rangeEnd}
                setRangeEnd={setRangeEnd}
                maxDate={formatDate(new Date())}
                monthStart={monthStart}
                setMonthStart={setMonthStart}
                monthEnd={monthEnd}
                setMonthEnd={setMonthEnd}
                overrideTemp={overrideTemp}
                setOverrideTemp={setOverrideTemp}
                useOverrideTemp={useOverrideTemp}
                setUseOverrideTemp={setUseOverrideTemp}
                overrideHum={overrideHum}
                setOverrideHum={setOverrideHum}
                useOverrideHum={useOverrideHum}
                setUseOverrideHum={setUseOverrideHum}
                overrideRain={overrideRain}
                setOverrideRain={setOverrideRain}
                useOverrideRain={useOverrideRain}
                setUseOverrideRain={setUseOverrideRain}
                isAnalyzing={isAnalyzing}
                onRunAnalysis={handleRunAnalysis}
                onResetAnalysisError={() => setAnalysisError(null)}
            />

            {/* ── Page ── */}
            <DashboardLayout title={isEditing ? t('field_details.edit_field') : field.name} subtitle={t('field_details.subtitle')}>

                {/* ── Success toast ── */}
                {editSuccess && (
                    <Box mb={4} p={4} bg="green.50" border="1px solid" borderColor="green.200" borderRadius="xl">
                        <Text color="green.700" fontWeight="medium" fontSize="sm">✓ {t('field_details.edit_success')}</Text>
                    </Box>
                )}

                {/* ══════════════ FIELD IDENTITY CARD ══════════════ */}
                <Box bg="white" p={{ base: 4, md: 6 }} borderRadius="2xl" borderWidth="1px" borderColor="gray.200" mb={6} style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                    <Flex align="flex-start" justify="space-between" gap={4} wrap="wrap">
                        {/* Left: identity info */}
                        <Flex align="center" gap={4} flex={1} minW={{ base: 0, md: "280px" }}>
                            <Flex bg="brand.50" p={4} borderRadius="2xl" flexShrink={0}>
                                <Sprout size={36} color="#059669" />
                            </Flex>
                            <Box flex={1}>
                                {isEditing && editState ? (
                                    <Flex direction="column" gap={3}>
                                        {/* Field Name */}
                                        <Box>
                                            <Text fontSize="xs" color="gray.500" fontWeight="semibold" mb={1}>{t('field_details.field_name_label')}</Text>
                                            <Input value={editState.name} onChange={e => setEditState(s => s ? { ...s, name: e.target.value } : s)} size="sm" borderRadius="lg" />
                                        </Box>
                                        {/* Area + Soil Type */}
                                        <Flex gap={3} direction={{ base: "column", md: "row" }}>
                                            <Box flex={1}>
                                                <Text fontSize="xs" color="gray.500" fontWeight="semibold" mb={1}>{t('field_details.area')} (ha)</Text>
                                                <Input type="number" step="0.1" value={editState.areaHa} onChange={e => setEditState(s => s ? { ...s, areaHa: e.target.value } : s)} size="sm" borderRadius="lg" />
                                            </Box>
                                            <Box flex={1}>
                                                <Text fontSize="xs" color="gray.500" fontWeight="semibold" mb={1}>{t('field_details.soil_type_label')}</Text>
                                                <select
                                                    value={editState.soilType}
                                                    onChange={e => setEditState(s => s ? { ...s, soilType: e.target.value } : s)}
                                                    style={{ width: '100%', padding: '6px 10px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '14px', background: 'white' }}
                                                >
                                                    {COMMON_SOIL_TYPES.map((soil) => (
                                                        <option key={soil} value={soil}>
                                                            {t(`add_field.${soil}`)}
                                                        </option>
                                                    ))}
                                                    {!COMMON_SOIL_TYPES.includes(editState.soilType as (typeof COMMON_SOIL_TYPES)[number]) && (
                                                        <option value={editState.soilType}>
                                                            {soilTypeLabel(editState.soilType)}
                                                        </option>
                                                    )}
                                                </select>
                                            </Box>
                                        </Flex>
                                        {/* N-P-K-pH */}
                                        <Flex gap={2} wrap="wrap">
                                            {[
                                                { key: 'nitrogen' as const, label: 'N' },
                                                { key: 'phosphorus' as const, label: 'P' },
                                                { key: 'potassium' as const, label: 'K' },
                                                { key: 'ph' as const, label: 'pH' },
                                            ].map(({ key, label }) => (
                                                <Box key={key} flex="1" minW={{ base: "48%", md: "60px" }}>
                                                    <Text fontSize="xs" color="gray.400" fontWeight="bold" mb={1}>{label}</Text>
                                                    <Input type="number" step="0.1" min={0} placeholder={t('add_field.auto')} value={editState[key]} onChange={e => setEditState(s => s ? { ...s, [key]: e.target.value } : s)} size="xs" borderRadius="md" />
                                                </Box>
                                            ))}
                                        </Flex>
                                    </Flex>
                                ) : (
                                    <>
                                        <Flex align={{ base: "flex-start", sm: "center" }} direction={{ base: "column", sm: "row" }} gap={2} mb={1}>
                                            <Text fontSize="2xl" fontWeight="bold">{field.name}</Text>
                                            <Flex px={3} py={1} borderRadius="full" fontSize="xs" fontWeight="bold" border="1px solid" align="center" gap={1.5}
                                                bg={statusConfig.bg} color={statusConfig.color} borderColor={statusConfig.border}>
                                                <Circle size={2} bg={statusConfig.dot} animation={statusConfig.pulse ? "pulse 2s infinite" : undefined} />
                                                {statusConfig.label}
                                            </Flex>
                                        </Flex>
                                        <Text color="gray.500" fontSize="sm" lineHeight="tall">
                                            {t('field_details.area')}: <strong>{field.areaHa} {t('field_details.hectares')}</strong>
                                            {' • '}
                                            {t('field_details.soil')}: <strong>{soilTypeLabel(field.soilType)}</strong>
                                        </Text>
                                        {fieldProps && (
                                            <Flex gap={2} mt={2} wrap="wrap">
                                                {[
                                                    { label: 'N', value: fieldProps.nitrogen, color: '#16a34a' },
                                                    { label: 'P', value: fieldProps.phosphorus, color: '#d97706' },
                                                    { label: 'K', value: fieldProps.potassium, color: '#dc2626' },
                                                    { label: 'pH', value: fieldProps.ph, color: '#2563eb' },
                                                ].map(({ label, value, color }) => (
                                                    <Box key={label} px={2} py={0.5} borderRadius="md" border="1px solid" borderColor="gray.200" bg="gray.50">
                                                        <Text fontSize="xs" fontWeight="bold" style={{ color }}>{label}: {value?.toFixed(1) ?? '—'}</Text>
                                                    </Box>
                                                ))}
                                            </Flex>
                                        )}
                                    </>
                                )}
                            </Box>
                        </Flex>

                        {/* Right: action buttons */}
                        <Flex gap={2} align="center" wrap="wrap" flexShrink={0} w={{ base: "full", md: "auto" }} direction={{ base: "column", sm: "row" }}>
                            {isEditing ? (
                                <>
                                    <Button w={{ base: "full", sm: "auto" }} size="sm" variant="ghost" colorPalette="gray" onClick={handleCancelEdit} title={t('field_details.cancel_edit')}>
                                        <X size={16} /> {t('field_details.cancel_edit')}
                                    </Button>
                                    <Button w={{ base: "full", sm: "auto" }} size="sm" colorPalette="brand" onClick={handleSaveEdit} loading={isSaving} title={t('field_details.save_changes')}>
                                        <Save size={16} /> {t('field_details.save_changes')}
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button w={{ base: "full", sm: "auto" }} colorPalette="brand" variant="solid" size="sm" onClick={() => setIsAnalysisModalOpen(true)} title={t('field_details.ai.button')}>
                                        <BrainCircuit size={16} />{t('field_details.ai.button')}
                                    </Button>
                                    <Button w={{ base: "full", sm: "auto" }} colorPalette="gray" variant="outline" size="sm" onClick={handleExportCsv} loading={isExporting} title={t('field_details.export_csv')}>
                                        <Download size={16} />{t('field_details.export_csv')}
                                    </Button>
                                    {field.deviceId ? (
                                        <Button w={{ base: "full", sm: "auto" }} colorPalette="red" variant="outline" size="sm" onClick={() => setIsUnpairDialogOpen(true)} title={t('field_details.unpair_short', { id: field.deviceId })}>
                                            {t('field_details.unpair_short', { id: field.deviceId })}
                                        </Button>
                                    ) : (
                                        <Button w={{ base: "full", sm: "auto" }} colorPalette="brand" variant="outline" size="sm" onClick={() => setIsPairDialogOpen(true)} loading={isPairing} title={t('field_details.pair_hardware')}>
                                            {t('field_details.pair_hardware')}
                                        </Button>
                                    )}
                                    <Flex display={{ base: "flex", sm: "none" }} w="full" gap={2}>
                                        <Button flex={1} variant="ghost" colorPalette="blue" size="sm" onClick={handleStartEdit} title={t('field_details.edit_field')}>
                                            <Pencil size={16} /> {t('field_details.edit_field')}
                                        </Button>
                                        <Button flex={1} variant="outline" colorPalette="red" size="sm" onClick={() => setIsDeleteDialogOpen(true)} title={t('field_details.delete_btn')}>
                                            <Trash2 size={16} /> {t('field_details.delete_btn')}
                                        </Button>
                                    </Flex>
                                    <IconButton display={{ base: "none", sm: "inline-flex" }} aria-label={t('field_details.edit_field')} title={t('field_details.edit_field')} colorPalette="blue" variant="ghost" size="sm" onClick={handleStartEdit}>
                                        <Pencil size={18} />
                                    </IconButton>
                                    <IconButton display={{ base: "none", sm: "inline-flex" }} aria-label={t('field_details.delete_btn')} title={t('field_details.delete_btn')} colorPalette="red" variant="ghost" size="sm" onClick={() => setIsDeleteDialogOpen(true)}>
                                        <Trash2 size={18} />
                                    </IconButton>
                                </>
                            )}
                        </Flex>
                    </Flex>

                    {/* Edit error */}
                    {editError && (
                        <Box mt={4} p={3} bg="red.50" border="1px solid" borderColor="red.200" borderRadius="lg">
                            <Text fontSize="sm" color="red.700">{editError}</Text>
                        </Box>
                    )}
                    {exportError && (
                        <Box mt={4} p={3} bg="red.50" border="1px solid" borderColor="red.200" borderRadius="lg">
                            <Text fontSize="sm" color="red.700">{exportError}</Text>
                        </Box>
                    )}

                    {/* Location drift warning */}
                    {isEditing && driftKm > 2 && (
                        <Box mt={4} p={4} bg="orange.50" border="1px solid" borderColor="orange.200" borderRadius="xl">
                            <Flex gap={3} align="flex-start">
                                <AlertTriangle size={20} color="#ea580c" style={{ flexShrink: 0, marginTop: 2 }} />
                                <Text fontSize="sm" color="orange.800" fontWeight="medium" lineHeight="tall">
                                    {t('field_details.location_drift_warning')}
                                    {' '}({driftKm.toFixed(1)} km)
                                </Text>
                            </Flex>
                        </Box>
                    )}
                </Box>

                {/* ══════════════ MAP CARD ══════════════ */}
                {(field.location && field.location.length > 0) && (
                    <Box mb={6}>
                        {isEditing && editState ? (
                            <Box borderRadius="2xl" overflow="hidden" border="2px solid" borderColor="brand.200">
                                <Flex bg="brand.50" px={4} py={2} align="center" gap={2} borderBottom="1px solid" borderColor="brand.100" justify="space-between" wrap="wrap">
                                    <Flex align="center" gap={2}>
                                        <Pencil size={14} color="#059669" />
                                        <Text fontSize="xs" fontWeight="semibold" color="brand.700">
                                            {t('field_details.map_editor.editing_boundary')}
                                        </Text>
                                    </Flex>
                                    <Text fontSize="xs" color="brand.500">
                                        {t('field_details.map_editor.editing_hint', {
                                            edit: t('map.edit'),
                                            clear: t('map.clear'),
                                        })}
                                    </Text>
                                </Flex>
                                <MapSelector
                                    value={editState.location}
                                    onChange={coords => setEditState(s => s ? { ...s, location: coords } : s)}
                                    onAreaCalculated={ha => setEditState(s => s ? { ...s, areaHa: ha.toFixed(2) } : s)}
                                />
                            </Box>
                        ) : (
                            <Box h={{ base: "220px", sm: "260px", md: "280px" }} w="100%" borderRadius="2xl" overflow="hidden" border="1px solid" borderColor="gray.200" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                                <MapContainer
                                    bounds={field.location.map((c: number[]) => [c[1], c[0]])}
                                    zoom={14}
                                    style={{ height: '100%', width: '100%', touchAction: 'none' }}
                                    scrollWheelZoom
                                >
                                    <TileLayer url={ESRI_SATELLITE} attribution="Esri World Imagery" maxZoom={19} />
                                    <TileLayer url={ESRI_LABELS} maxZoom={19} opacity={0.8} />
                                    <Polygon
                                        positions={field.location.map((c: number[]) => [c[1], c[0]])}
                                        pathOptions={{ color: '#059669', fillColor: '#059669', fillOpacity: 0.2, weight: 2 }}
                                    />
                                    <RecenterControl bounds={field.location} />
                                </MapContainer>
                            </Box>
                        )}
                    </Box>
                )}

                {/* ══════════════ REGIONAL WEATHER ══════════════ */}
                <Box bg="white" p={{ base: 4, md: 6 }} borderRadius="2xl" border="1px solid" borderColor="gray.200" mb={6} style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                    <Text fontSize="lg" fontWeight="bold" mb={4} color="gray.800">{t('field_details.regional_weather')}</Text>
                    <Flex gap={4} wrap="wrap">
                        {[
                            { label: t('field_details.air_temp'), value: weather?.temperature, unit: '°C', icon: <Thermometer size={18} />, accent: 'orange' },
                            { label: t('field_details.air_humidity'), value: weather?.humidity, unit: '%', icon: <Droplets size={18} />, accent: 'blue' },
                            { label: t('field_details.precipitation'), value: weather?.precipitation, unit: 'mm', icon: <CloudRain size={18} />, accent: 'teal' },
                        ].map(m => (
                            <MetricCard key={m.label} label={m.label} value={m.value} unit={m.unit} icon={m.icon} accent={m.accent} />
                        ))}
                    </Flex>
                </Box>

                {/* ══════════════ LIVE TELEMETRY ══════════════ */}
                <Box mb={6}>
                    <Flex align="center" gap={3} mb={4}>
                        <Text fontSize="lg" fontWeight="bold" color="gray.800">{t('field_details.live_telemetry')}</Text>
                        {isConnected && (
                            <Flex px={2} py={0.5} borderRadius="md" bg="green.50" color="green.700" align="center" gap={1.5} fontSize="xs" fontWeight="bold">
                                <Circle size={1.5} bg="green.500" animation="pulse 2s infinite" />
                                Live
                            </Flex>
                        )}
                        {deviceStatus?.timeAgo && (
                            <Text fontSize="sm" color="gray.500" fontWeight="medium">
                                ({t('field_details.updated', { timeAgo: deviceStatus?.timeAgo })})
                            </Text>
                        )}
                    </Flex>
                    <Flex gap={4} wrap="wrap">
                        <MetricCard label={t('field_details.soil_temp')} value={telemetry?.soilTemp} unit="°C" icon={<Thermometer size={18} />} accent="orange" />
                        <MetricCard label={t('field_details.soil_moisture')} value={telemetry?.soilHumidity} unit="%" icon={<Droplets size={18} />} accent="blue" />
                        <MetricCard label={t('field_details.ambient_temp')} value={telemetry?.ambientTemp} unit="°C" icon={<Wind size={18} />} accent="teal" />
                        <MetricCard label={t('field_details.ambient_humidity')} value={telemetry?.ambientHumidity} unit="%" icon={<CloudRain size={18} />} accent="cyan" />
                        {field.deviceId && (
                            <MetricCard label={t('dashboard.battery')} value={telemetry?.batteryPercentage} unit="%" icon={<Battery size={18} />} accent="green" />
                        )}
                    </Flex>
                </Box>

                {/* ══════════════ HISTORICAL CHART ══════════════ */}
                <Box bg="white" p={{ base: 4, md: 6 }} borderRadius="2xl" border="1px solid" borderColor="gray.200" mb={6} style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                    <Flex align="center" justify="space-between" mb={5} wrap="wrap" gap={3}>
                        <Text fontSize="lg" fontWeight="bold" color="gray.800">{t('field_details.historical_trends')}</Text>

                        <Flex gap={3} wrap="wrap" w={{ base: "full", md: "auto" }}>
                            {/* Metric Toggle Pills */}
                            <Flex bg="gray.50" p={1} borderRadius="lg" border="1px solid" borderColor="gray.200" gap={1} overflowX="auto" maxW="100%">
                                <Button size="xs" variant={visibleMetrics.soilTemp ? 'solid' : 'ghost'} colorPalette="orange" title={t('field_details.soil_temp')} onClick={() => setVisibleMetrics(s => ({ ...s, soilTemp: !s.soilTemp }))}>{t('field_details.soil_temp')}</Button>
                                <Button size="xs" variant={visibleMetrics.soilHumidity ? 'solid' : 'ghost'} colorPalette="blue" title={t('field_details.soil_moisture')} onClick={() => setVisibleMetrics(s => ({ ...s, soilHumidity: !s.soilHumidity }))}>{t('field_details.soil_moisture')}</Button>
                                <Button size="xs" variant={visibleMetrics.ambientTemp ? 'solid' : 'ghost'} colorPalette="green" title={t('field_details.ambient_temp')} onClick={() => setVisibleMetrics(s => ({ ...s, ambientTemp: !s.ambientTemp }))}>{t('field_details.ambient_temp')}</Button>
                                <Button size="xs" variant={visibleMetrics.ambientHumidity ? 'solid' : 'ghost'} colorPalette="purple" title={t('field_details.ambient_humidity')} onClick={() => setVisibleMetrics(s => ({ ...s, ambientHumidity: !s.ambientHumidity }))}>{t('field_details.ambient_humidity')}</Button>
                            </Flex>

                            {/* Timeframe pills */}
                            <Flex gap={2} overflowX="auto" maxW="100%">
                                {(['today', 7, 14, 30] as const).map(d => (
                                    <Button
                                        key={String(d)}
                                        size="xs"
                                        borderRadius="full"
                                        variant={timeframe === d ? 'solid' : 'outline'}
                                        colorPalette={timeframe === d ? 'brand' : 'gray'}
                                        onClick={() => setTimeframe(d)}
                                        title={d === 'today' ? t('field_details.timeframe_today') : t(`field_details.timeframe_${d}`)}
                                        px={4}
                                    >
                                        {d === 'today' ? t('field_details.timeframe_today') : t(`field_details.timeframe_${d}`)}
                                    </Button>
                                ))}
                            </Flex>
                        </Flex>
                    </Flex>

                    {history.length > 0 ? (
                        <ResponsiveContainer width="100%" height={260}>
                            <RechartsAreaChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                <ChartGradients />
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} minTickGap={28} />
                                <YAxis yAxisId="moisture" axisLine={false} tickLine={false} tick={{ fill: '#3182CE', fontSize: 11 }} domain={[0, 100]} unit="%" width={52} />
                                <YAxis yAxisId="temp" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#DD6B20', fontSize: 11 }} unit="°" width={32} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', fontSize: '13px' }}
                                    labelStyle={{ fontWeight: 700, color: '#374151' }}
                                    formatter={(value, name) => {
                                        const valStr = typeof value === 'number' ? value.toFixed(2) : value;
                                        const n = String(name);
                                        const suffix = (n.includes('%') || n.toLowerCase().includes('humid') || n.toLowerCase().includes('nem')) ? '%' : '°C';
                                        return [valStr + suffix, undefined];
                                    }}
                                />
                                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }} />
                                {visibleMetrics.soilHumidity && <Area yAxisId="moisture" connectNulls type="monotone" dataKey="avgSoilHumidity" name={t('field_details.moisture_pct')} stroke="#3182CE" strokeWidth={2.5} fill="url(#gradMoisture)" dot={chartData.length === 1 ? { r: 4, strokeWidth: 2 } : false} activeDot={{ r: 5 }} />}
                                {visibleMetrics.ambientHumidity && <Area yAxisId="moisture" connectNulls type="monotone" dataKey="avgAmbientHumidity" name={t('field_details.ambient_humidity')} stroke="#805AD5" strokeWidth={2.5} fill="url(#gradAmbHum)" dot={chartData.length === 1 ? { r: 4, strokeWidth: 2 } : false} activeDot={{ r: 5 }} />}
                                {visibleMetrics.soilTemp && <Area yAxisId="temp" connectNulls type="monotone" dataKey="avgSoilTemp" name={t('field_details.temp_c')} stroke="#DD6B20" strokeWidth={2.5} fill="url(#gradTemp)" dot={chartData.length === 1 ? { r: 4, strokeWidth: 2 } : false} activeDot={{ r: 5 }} />}
                                {visibleMetrics.ambientTemp && <Area yAxisId="temp" connectNulls type="monotone" dataKey="avgAmbientTemp" name={t('field_details.ambient_temp')} stroke="#38A169" strokeWidth={2.5} fill="url(#gradAmbTemp)" dot={chartData.length === 1 ? { r: 4, strokeWidth: 2 } : false} activeDot={{ r: 5 }} />}
                            </RechartsAreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <Flex h="200px" align="center" justify="center" direction="column" color="gray.400">
                            <Text>{t('field_details.no_history')}</Text>
                        </Flex>
                    )}
                </Box>

                <FieldDetailsRecommendations
                    lastAnalysis={lastAnalysis}
                    resultsTitle={t('field_details.ai.results_title')}
                    topPickLabel={t('field_details.ai.top_pick')}
                    reanalyzeLabel={t('field_details.ai.reanalyze')}
                    emptyTitle={t('field_details.ai.empty_title')}
                    emptyDescription={t('field_details.ai.empty_desc')}
                    analyzeButtonLabel={t('field_details.ai.button')}
                    noRecommendationsLabel={t('field_details.ai.no_recommendations')}
                    scenarioLabel={scenarioLabel}
                    weatherSourceLabel={weatherSourceLabel}
                    confidenceLabel={confidenceLabel}
                    cropLabel={cropLabel}
                    scenarioBadgeColor={scenarioBadgeColor}
                    formatTimestamp={(timestamp) => parseBackendDate(timestamp).toLocaleString()}
                    strongestFactorsLabel={t('field_details.ai.strongest_factors')}
                    contributionExplanation={contributionExplanation}
                    onOpenAnalysis={() => setIsAnalysisModalOpen(true)}
                    onNavigateGuide={(crop) => navigate(`/guide/${toCropSlug(crop)}`)}
                />
            </DashboardLayout>
        </>
    )
}
