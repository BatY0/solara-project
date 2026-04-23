import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
    Box, Flex, Text, Spinner, Button, IconButton,
    Dialog, Portal, CloseButton, Input, Field as ChakraField, Circle,
    Tabs, Slider,
} from "@chakra-ui/react"
import { Sprout, Trash2, BrainCircuit, Leaf, Pencil, X, Save, AlertTriangle, Thermometer, Droplets, Wind, CloudRain, Battery, LocateFixed } from "lucide-react"
import { useTranslation } from "react-i18next"
import { MapContainer, TileLayer, Polygon, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import {
    CartesianGrid, XAxis, YAxis, Tooltip, Area, ResponsiveContainer,
    AreaChart as RechartsAreaChart, Legend
} from "recharts"
import { DashboardLayout } from "../../components/layout/DashboardLayout"
import { fieldsService } from "../../features/fields/fields.service"
import type { UpdateFieldRequest } from "../../features/fields/fields.service"
import { normalizeCropName, toCropSlug } from "../../features/crop-guides/normalizeCropName"
import MapSelector from "../../components/map/MapSelector"
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

function probBadgeColor(prob: number): 'green' | 'orange' | 'gray' {
    if (prob >= 70) return 'green';
    if (prob >= 40) return 'orange';
    return 'gray';
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

const MonthSelect = ({ value, onChange, labels }: { value: number; onChange: (v: number) => void; labels: string[] }) => (
    <select value={value} onChange={e => onChange(Number(e.currentTarget.value))}
        style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #E2E8F0', background: 'white', fontSize: '14px', cursor: 'pointer' }}>
        {labels.map((name, idx) => <option key={idx + 1} value={idx + 1}>{name}</option>)}
    </select>
);

/* ── Telemetry metric card ─────────────────────────────────────────────────── */
function MetricCard({ label, value, unit, icon, accent }: { label: string; value: string | number | null | undefined; unit: string; icon: React.ReactNode; accent: string }) {
    const display = value != null
        ? (typeof value === 'number' ? value.toFixed(2) : String(value))
        : '--';
    return (
        <Box
            flex="1" minW={{ base: "100%", sm: "140px" }} p={5} borderRadius="2xl" border="1px solid"
            borderColor="gray.100" bg="white"
            style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
            transition="transform 0.2s, box-shadow 0.2s"
            _hover={{ transform: 'translateY(-2px)', boxShadow: '0 6px 20px rgba(0,0,0,0.10)' }}
        >
            <Flex align="center" gap={3} mb={3}>
                <Flex w={9} h={9} borderRadius="xl" bg={`${accent}.50`} align="center" justify="center" color={`${accent}.500`}>{icon}</Flex>
                <Text fontSize="xs" fontWeight="semibold" color="gray.500" textTransform="uppercase" letterSpacing="wide">{label}</Text>
            </Flex>
            <Text fontSize="2xl" fontWeight="bold" color="gray.800" lineHeight={1}>{display}</Text>
            {value != null && <Text fontSize="sm" color="gray.400" mt={0.5}>{unit}</Text>}
        </Box>
    );
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
    if (!bounds || bounds.length === 0) return null;
    return (
        <IconButton
            aria-label="Return to Field" title="Return to Field"
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

/* ── Override Slider Component ── */
const OverrideSlider = ({
    label,
    themeColor,
    min,
    max,
    step,
    defaultValue,
    unit,
    precision = 0,
    onValueChangeEnd,
    isChecked,
    onToggle,
    accentHex
}: {
    label: string,
    themeColor: string,
    min: number,
    max: number,
    step: number,
    defaultValue: number,
    unit: string,
    precision?: number,
    onValueChangeEnd: (val: number) => void,
    isChecked: boolean,
    onToggle: (checked: boolean) => void,
    accentHex: string
}) => {
    const [liveVal, setLiveVal] = useState<number | string>(defaultValue);

    const handleInputBlur = () => {
        let v = typeof liveVal === 'string' ? parseFloat(liveVal) : liveVal;
        if (isNaN(v)) v = min;
        v = Math.min(max, Math.max(min, v));
        setLiveVal(v);
        onValueChangeEnd(v);
    };

    const formatVal = (v: number) => `${v.toFixed(precision)} ${unit}`;
    const parsedVal = typeof liveVal === 'string' ? parseFloat(liveVal) : liveVal;
    const sliderVal = isNaN(parsedVal) ? min : parsedVal;

    return (
        <Slider.Root
            min={min} max={max} step={step}
            value={[sliderVal]}
            colorPalette={themeColor}
            onValueChange={e => { setLiveVal(e.value[0]); }}
            onValueChangeEnd={e => onValueChangeEnd(e.value[0])}
        >
            <Flex justify="space-between" align="center" mb={3}>
                <Flex align="center" gap={2}>
                    <input type="checkbox" checked={isChecked} onChange={e => onToggle(e.target.checked)} style={{ width: 16, height: 16, accentColor: accentHex, cursor: 'pointer' }} />
                    <Slider.Label fontSize="sm" fontWeight="medium" color="gray.800">{label}</Slider.Label>
                </Flex>
                <Flex align="center" gap={1}>
                    <Input
                        type="number" min={min} max={max} step={step}
                        value={liveVal}
                        onChange={e => setLiveVal(e.target.value)}
                        onBlur={handleInputBlur}
                        onKeyDown={e => e.key === 'Enter' && handleInputBlur()}
                        size="sm" width="50px" textAlign="right" fontWeight="bold"
                        color={`${themeColor}.600`} bg="transparent"
                        border="none" borderBottom="2px solid" borderColor={`${themeColor}.300`}
                        borderRadius="0" px={0} py={0}
                        _focus={{ outline: 'none', borderColor: `${themeColor}.600` }}
                    />
                    <Text fontSize="sm" fontWeight="bold" color={`${themeColor}.600`}>{unit}</Text>
                </Flex>
            </Flex>
            <Slider.Control><Slider.Track><Slider.Range /></Slider.Track><Slider.Thumbs /></Slider.Control>
            <Flex justify="space-between" mt={1}>
                <Text fontSize="xs" color="gray.400">{formatVal(min)}</Text>
                <Text fontSize="xs" color="gray.400">{formatVal(max)}</Text>
            </Flex>
        </Slider.Root>
    );
};

export const FieldDetails = () => {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { t, i18n } = useTranslation()

    const monthLabels = [
        t('field_details.ai.months.jan'), t('field_details.ai.months.feb'), t('field_details.ai.months.mar'),
        t('field_details.ai.months.apr'), t('field_details.ai.months.may'), t('field_details.ai.months.jun'),
        t('field_details.ai.months.jul'), t('field_details.ai.months.aug'), t('field_details.ai.months.sep'),
        t('field_details.ai.months.oct'), t('field_details.ai.months.nov'), t('field_details.ai.months.dec'),
    ];
    const soilTypeLabel = (value?: string) => value ? t(`add_field.${value}`, { defaultValue: value }) : '-';

    /* ── Core data ── */
    const [field, setField] = useState<FieldType | null>(null)
    const [fieldProps, setFieldProps] = useState<FieldProperties | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [telemetry, setTelemetry] = useState<SensorData | null>(null)
    const [weather, setWeather] = useState<WeatherData | null>(null)
    const [history, setHistory] = useState<HistoricalSensorData[]>([])
    const [timeframe, setTimeframe] = useState<'today' | 7 | 14 | 30>(7)

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
            setPairError(err.response?.data?.message || 'Failed to pair device.');
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
            setAnalysisError(err.response?.data?.message || err.message || 'Analysis failed.');
        } finally { setIsAnalyzing(false); }
    };

    /* ── Label helpers ── */
    const scenarioLabel = (s: string) => s === 'RANGE' ? t('field_details.ai.scenario_range') : s === 'FUTURE' ? t('field_details.ai.scenario_future') : s === 'WHAT_IF' ? t('field_details.ai.scenario_whatif') : s;
    const weatherSourceLabel = (s: string) => s === 'IOT' ? t('field_details.ai.source_iot') : s === 'WEATHER_LOG' ? t('field_details.ai.source_weather_log') : t('field_details.ai.source_climatology');
    const confidenceLabel = (c: 'green' | 'orange' | 'gray') => c === 'green' ? t('field_details.ai.confidence_high') : c === 'orange' ? t('field_details.ai.confidence_moderate') : t('field_details.ai.confidence_low');
    const cropLabel = (crop: string) => t(`crop_names.${normalizeCropName(crop)}`, { defaultValue: crop });

    const status: 'online' | 'paired' | 'offline' = field?.deviceId && telemetry ? 'online' : field?.deviceId ? 'paired' : 'offline';
    const statusConfig = {
        online: { bg: 'brand.50', color: 'green.700', border: 'brand.100', dot: 'green.500', pulse: true, label: t('dashboard.online') },
        paired: { bg: 'yellow.50', color: 'yellow.700', border: 'yellow.100', dot: 'yellow.500', pulse: false, label: t('dashboard.paired', 'Paired') },
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
            <Dialog.Root role="alertdialog" open={isDeleteDialogOpen} onOpenChange={e => setIsDeleteDialogOpen(e.open)} placement="center">
                <Portal>
                    <Dialog.Backdrop backdropFilter="auto" backdropBlur="sm" />
                    <Dialog.Positioner><Dialog.Content>
                        <Dialog.Header><Dialog.Title>{t('field_details.delete_title')}</Dialog.Title></Dialog.Header>
                        <Dialog.Body><Text>{t('field_details.delete_desc', { name: field.name })}</Text></Dialog.Body>
                        <Dialog.Footer>
                            <Dialog.ActionTrigger asChild><Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>{t('field_details.cancel')}</Button></Dialog.ActionTrigger>
                            <Button colorPalette="red" onClick={handleConfirmDelete} loading={isDeleting}>{t('field_details.delete_btn')}</Button>
                        </Dialog.Footer>
                        <Dialog.CloseTrigger asChild><CloseButton size="sm" /></Dialog.CloseTrigger>
                    </Dialog.Content></Dialog.Positioner>
                </Portal>
            </Dialog.Root>

            {/* ── Unpair Dialog ── */}
            <Dialog.Root role="alertdialog" open={isUnpairDialogOpen} onOpenChange={e => setIsUnpairDialogOpen(e.open)} placement="center">
                <Portal>
                    <Dialog.Backdrop backdropFilter="auto" backdropBlur="sm" />
                    <Dialog.Positioner><Dialog.Content>
                        <Dialog.Header><Dialog.Title>{t('field_details.unpair_title')}</Dialog.Title></Dialog.Header>
                        <Dialog.Body><Text>{t('field_details.unpair_desc', { id: field.deviceId })}</Text></Dialog.Body>
                        <Dialog.Footer>
                            <Dialog.ActionTrigger asChild><Button variant="outline" onClick={() => setIsUnpairDialogOpen(false)}>{t('field_details.cancel')}</Button></Dialog.ActionTrigger>
                            <Button colorPalette="red" onClick={handleConfirmUnpair} loading={isUnpairing}>{t('field_details.unpair_btn')}</Button>
                        </Dialog.Footer>
                        <Dialog.CloseTrigger asChild><CloseButton size="sm" /></Dialog.CloseTrigger>
                    </Dialog.Content></Dialog.Positioner>
                </Portal>
            </Dialog.Root>

            {/* ── Pair Dialog ── */}
            <Dialog.Root open={isPairDialogOpen} onOpenChange={e => { setIsPairDialogOpen(e.open); if (!e.open) { setMacInput(''); setPairError(null); } }} placement="center" initialFocusEl={() => macInputRef.current}>
                <Portal>
                    <Dialog.Backdrop backdropFilter="auto" backdropBlur="sm" />
                    <Dialog.Positioner><Dialog.Content>
                        <Dialog.Header><Dialog.Title>{t('field_details.pair_title')}</Dialog.Title></Dialog.Header>
                        <Dialog.Body pb={4}>
                            <ChakraField.Root invalid={!!pairError}>
                                <ChakraField.Label>{t('field_details.mac_address')}</ChakraField.Label>
                                <Input ref={macInputRef} placeholder={t('field_details.mac_ph')} value={macInput} onChange={e => { setMacInput(e.target.value); setPairError(null); }} onKeyDown={e => e.key === 'Enter' && handleConfirmPair()} />
                                {pairError ? <ChakraField.ErrorText>{pairError}</ChakraField.ErrorText> : <ChakraField.HelperText>{t('field_details.mac_helper')}</ChakraField.HelperText>}
                            </ChakraField.Root>
                        </Dialog.Body>
                        <Dialog.Footer>
                            <Dialog.ActionTrigger asChild><Button variant="outline" onClick={() => setIsPairDialogOpen(false)}>{t('field_details.cancel')}</Button></Dialog.ActionTrigger>
                            <Button colorPalette="brand" onClick={handleConfirmPair} loading={isPairing} disabled={!macInput.trim()}>{t('field_details.pair_btn')}</Button>
                        </Dialog.Footer>
                        <Dialog.CloseTrigger asChild><CloseButton size="sm" /></Dialog.CloseTrigger>
                    </Dialog.Content></Dialog.Positioner>
                </Portal>
            </Dialog.Root>

            {/* ── AI Analysis Modal ── */}
            <Dialog.Root open={isAnalysisModalOpen} onOpenChange={e => { setIsAnalysisModalOpen(e.open); if (!e.open) setAnalysisError(null); }} placement="center" size="lg">
                <Portal>
                    <Dialog.Backdrop backdropFilter="auto" backdropBlur="sm" />
                    <Dialog.Positioner><Dialog.Content maxW={{ base: "calc(100vw - 2rem)", md: "560px" }}>
                        <Dialog.Header pb={0}>
                            <Dialog.Title>
                                <Flex align="center" gap={2}><BrainCircuit size={20} color="#059669" />{t('field_details.ai.modal_title')}</Flex>
                            </Dialog.Title>
                            <Text fontSize="sm" color="gray.500" mt={1}>{t('field_details.ai.modal_subtitle')}</Text>
                        </Dialog.Header>
                        <Dialog.Body pt={4} pb={6}>
                            <Tabs.Root value={activeScenario} onValueChange={d => { setActiveScenario(d.value as 'range' | 'future' | 'whatif'); setAnalysisError(null); }} variant="line">
                                <Tabs.List mb={5} flexWrap="wrap" gap={1}>
                                    <Tabs.Trigger value="range">{t('field_details.ai.tab_range')}</Tabs.Trigger>
                                    <Tabs.Trigger value="future">{t('field_details.ai.tab_future')}</Tabs.Trigger>
                                    <Tabs.Trigger value="whatif">{t('field_details.ai.tab_whatif')}</Tabs.Trigger>
                                    <Tabs.Indicator />
                                </Tabs.List>
                                <Tabs.Content value="range">
                                    <Flex direction="column" gap={4}>
                                        <Box bg="green.50" border="1px solid" borderColor="green.100" borderRadius="lg" p={3}><Text fontSize="sm" color="green.700">{t('field_details.ai.range_info')}</Text></Box>
                                        <Flex gap={4} direction={{ base: "column", md: "row" }}>
                                            <ChakraField.Root flex={1}><ChakraField.Label>{t('field_details.ai.start_date')}</ChakraField.Label><Input type="date" lang={i18n.language === 'tr' ? 'tr-TR' : 'en-US'} value={rangeStart} onChange={e => setRangeStart(e.target.value)} max={rangeEnd} /></ChakraField.Root>
                                            <ChakraField.Root flex={1}><ChakraField.Label>{t('field_details.ai.end_date')}</ChakraField.Label><Input type="date" lang={i18n.language === 'tr' ? 'tr-TR' : 'en-US'} value={rangeEnd} onChange={e => setRangeEnd(e.target.value)} min={rangeStart} max={formatDate(new Date())} /></ChakraField.Root>
                                        </Flex>
                                    </Flex>
                                </Tabs.Content>
                                <Tabs.Content value="future">
                                    <Flex direction="column" gap={4}>
                                        <Box bg="blue.50" border="1px solid" borderColor="blue.100" borderRadius="lg" p={3}><Text fontSize="sm" color="blue.700">{t('field_details.ai.future_info')}</Text></Box>
                                        <Flex gap={4} direction={{ base: "column", md: "row" }}>
                                            <ChakraField.Root flex={1}><ChakraField.Label>{t('field_details.ai.season_start')}</ChakraField.Label><MonthSelect value={monthStart} onChange={setMonthStart} labels={monthLabels} /></ChakraField.Root>
                                            <ChakraField.Root flex={1}><ChakraField.Label>{t('field_details.ai.season_end')}</ChakraField.Label><MonthSelect value={monthEnd} onChange={setMonthEnd} labels={monthLabels} /></ChakraField.Root>
                                        </Flex>
                                    </Flex>
                                </Tabs.Content>
                                <Tabs.Content value="whatif">
                                    <Flex direction="column" gap={5}>
                                        <Box bg="purple.50" border="1px solid" borderColor="purple.100" borderRadius="lg" p={3}><Text fontSize="sm" color="purple.700">{t('field_details.ai.whatif_info')}</Text></Box>
                                        <Flex gap={4} direction={{ base: "column", md: "row" }}>
                                            <ChakraField.Root flex={1}><ChakraField.Label>{t('field_details.ai.season_start')}</ChakraField.Label><MonthSelect value={monthStart} onChange={setMonthStart} labels={monthLabels} /></ChakraField.Root>
                                            <ChakraField.Root flex={1}><ChakraField.Label>{t('field_details.ai.season_end')}</ChakraField.Label><MonthSelect value={monthEnd} onChange={setMonthEnd} labels={monthLabels} /></ChakraField.Root>
                                        </Flex>
                                        {/* ─ Temperature Override ─ */}
                                        <Box p={3} borderRadius="lg" border="1px solid" borderColor={useOverrideTemp ? 'orange.200' : 'gray.100'} bg={useOverrideTemp ? 'orange.50' : 'gray.50'} transition="all 0.2s">
                                            {!useOverrideTemp ? (
                                                <Flex align="center" gap={2}>
                                                    <input id="toggle-temp" type="checkbox" checked={false} onChange={e => setUseOverrideTemp(e.target.checked)} style={{ width: 16, height: 16, accentColor: '#DD6B20', cursor: 'pointer' }} />
                                                    <Text fontSize="sm" fontWeight="medium" color="gray.400" cursor="pointer" onClick={() => setUseOverrideTemp(true)}>{t('field_details.ai.temp_override')}</Text>
                                                </Flex>
                                            ) : (
                                                <OverrideSlider
                                                    label={t('field_details.ai.temp_override')}
                                                    themeColor="orange" accentHex="#DD6B20"
                                                    min={0} max={50} step={0.5}
                                                    defaultValue={overrideTemp}
                                                    unit="°C" precision={1}
                                                    onValueChangeEnd={setOverrideTemp}
                                                    isChecked={true} onToggle={setUseOverrideTemp}
                                                />
                                            )}
                                        </Box>
                                        {/* ─ Humidity Override ─ */}
                                        <Box p={3} borderRadius="lg" border="1px solid" borderColor={useOverrideHum ? 'blue.200' : 'gray.100'} bg={useOverrideHum ? 'blue.50' : 'gray.50'} transition="all 0.2s">
                                            {!useOverrideHum ? (
                                                <Flex align="center" gap={2}>
                                                    <input id="toggle-hum" type="checkbox" checked={false} onChange={e => setUseOverrideHum(e.target.checked)} style={{ width: 16, height: 16, accentColor: '#3182CE', cursor: 'pointer' }} />
                                                    <Text fontSize="sm" fontWeight="medium" color="gray.400" cursor="pointer" onClick={() => setUseOverrideHum(true)}>{t('field_details.ai.hum_override')}</Text>
                                                </Flex>
                                            ) : (
                                                <OverrideSlider
                                                    label={t('field_details.ai.hum_override')}
                                                    themeColor="blue" accentHex="#3182CE"
                                                    min={0} max={100} step={1}
                                                    defaultValue={overrideHum}
                                                    unit="%" precision={0}
                                                    onValueChangeEnd={setOverrideHum}
                                                    isChecked={true} onToggle={setUseOverrideHum}
                                                />
                                            )}
                                        </Box>
                                        {/* ─ Rainfall Override ─ */}
                                        <Box p={3} borderRadius="lg" border="1px solid" borderColor={useOverrideRain ? 'teal.200' : 'gray.100'} bg={useOverrideRain ? 'teal.50' : 'gray.50'} transition="all 0.2s">
                                            {!useOverrideRain ? (
                                                <Flex align="center" gap={2}>
                                                    <input id="toggle-rain" type="checkbox" checked={false} onChange={e => setUseOverrideRain(e.target.checked)} style={{ width: 16, height: 16, accentColor: '#319795', cursor: 'pointer' }} />
                                                    <Text fontSize="sm" fontWeight="medium" color="gray.400" cursor="pointer" onClick={() => setUseOverrideRain(true)}>{t('field_details.ai.rain_override')}</Text>
                                                </Flex>
                                            ) : (
                                                <OverrideSlider
                                                    label={t('field_details.ai.rain_override')}
                                                    themeColor="teal" accentHex="#319795"
                                                    min={0} max={1000} step={5}
                                                    defaultValue={overrideRain}
                                                    unit="mm" precision={0}
                                                    onValueChangeEnd={setOverrideRain}
                                                    isChecked={true} onToggle={setUseOverrideRain}
                                                />
                                            )}
                                        </Box>
                                    </Flex>
                                </Tabs.Content>
                            </Tabs.Root>
                            {analysisError && <Box mt={4} p={3} bg="red.50" border="1px solid" borderColor="red.200" borderRadius="lg"><Text fontSize="sm" color="red.700">{analysisError}</Text></Box>}
                        </Dialog.Body>
                        <Dialog.Footer>
                            <Dialog.ActionTrigger asChild><Button variant="outline" onClick={() => setIsAnalysisModalOpen(false)}>{t('field_details.cancel')}</Button></Dialog.ActionTrigger>
                            <Button colorPalette="brand" onClick={handleRunAnalysis} loading={isAnalyzing} loadingText={t('field_details.ai.analyzing')}><BrainCircuit size={16} />{t('field_details.ai.analyze')}</Button>
                        </Dialog.Footer>
                        <Dialog.CloseTrigger asChild><CloseButton size="sm" /></Dialog.CloseTrigger>
                    </Dialog.Content></Dialog.Positioner>
                </Portal>
            </Dialog.Root>

            {/* ── Page ── */}
            <DashboardLayout title={isEditing ? t('field_details.edit_field') : field.name} subtitle={t('field_details.subtitle')}>

                {/* ── Success toast ── */}
                {editSuccess && (
                    <Box mb={4} p={4} bg="green.50" border="1px solid" borderColor="green.200" borderRadius="xl">
                        <Text color="green.700" fontWeight="medium" fontSize="sm">✓ {t('field_details.edit_success')}</Text>
                    </Box>
                )}

                {/* ══════════════ FIELD IDENTITY CARD ══════════════ */}
                <Box bg="white" p={6} borderRadius="2xl" borderWidth="1px" borderColor="gray.200" mb={6} style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
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
                                                    <Input type="number" step="0.1" min={0} placeholder="Auto" value={editState[key]} onChange={e => setEditState(s => s ? { ...s, [key]: e.target.value } : s)} size="xs" borderRadius="md" />
                                                </Box>
                                            ))}
                                        </Flex>
                                    </Flex>
                                ) : (
                                    <>
                                        <Flex align="center" gap={3} mb={1}>
                                            <Text fontSize="2xl" fontWeight="bold">{field.name}</Text>
                                            <Flex px={3} py={1} borderRadius="full" fontSize="xs" fontWeight="bold" border="1px solid" align="center" gap={1.5}
                                                bg={statusConfig.bg} color={statusConfig.color} borderColor={statusConfig.border}>
                                                <Circle size={2} bg={statusConfig.dot} animation={statusConfig.pulse ? "pulse 2s infinite" : undefined} />
                                                {statusConfig.label}
                                            </Flex>
                                        </Flex>
                                        <Text color="gray.500" fontSize="sm">
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
                        <Flex gap={2} align="center" wrap="wrap" flexShrink={0} w={{ base: "full", md: "auto" }}>
                            {isEditing ? (
                                <>
                                    <Button size="sm" variant="ghost" colorPalette="gray" onClick={handleCancelEdit}>
                                        <X size={16} /> {t('field_details.cancel_edit')}
                                    </Button>
                                    <Button size="sm" colorPalette="brand" onClick={handleSaveEdit} loading={isSaving}>
                                        <Save size={16} /> {t('field_details.save_changes')}
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button colorPalette="brand" variant="solid" size="sm" onClick={() => setIsAnalysisModalOpen(true)}>
                                        <BrainCircuit size={16} />{t('field_details.ai.button')}
                                    </Button>
                                    {field.deviceId ? (
                                        <Button colorPalette="red" variant="outline" size="sm" onClick={() => setIsUnpairDialogOpen(true)}>
                                            {t('field_details.unpair_short', { id: field.deviceId })}
                                        </Button>
                                    ) : (
                                        <Button colorPalette="brand" variant="outline" size="sm" onClick={() => setIsPairDialogOpen(true)} loading={isPairing}>
                                            {t('field_details.pair_hardware')}
                                        </Button>
                                    )}
                                    <IconButton aria-label="Edit field" colorPalette="blue" variant="ghost" size="sm" onClick={handleStartEdit}>
                                        <Pencil size={18} />
                                    </IconButton>
                                    <IconButton aria-label="Delete field" colorPalette="red" variant="ghost" size="sm" onClick={() => setIsDeleteDialogOpen(true)}>
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
                                            Editing boundary — drag the numbered corners to reshape your field
                                        </Text>
                                    </Flex>
                                    <Text fontSize="xs" color="brand.500">
                                        Use <strong>Edit</strong> on the map to add points · <strong>Clear</strong> to redraw from scratch
                                    </Text>
                                </Flex>
                                <MapSelector
                                    value={editState.location}
                                    onChange={coords => setEditState(s => s ? { ...s, location: coords } : s)}
                                    onAreaCalculated={ha => setEditState(s => s ? { ...s, areaHa: ha.toFixed(2) } : s)}
                                />
                            </Box>
                        ) : (
                            <Box h="280px" w="100%" borderRadius="2xl" overflow="hidden" border="1px solid" borderColor="gray.200" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                                <MapContainer
                                    bounds={field.location.map((c: number[]) => [c[1], c[0]])}
                                    zoom={14}
                                    style={{ height: '100%', width: '100%' }}
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
                <Box bg="white" p={6} borderRadius="2xl" border="1px solid" borderColor="gray.200" mb={6} style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
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
                        {getDeviceStatus(field, t).timeAgo && (
                            <Text fontSize="sm" color="gray.500" fontWeight="medium">
                                (updated {getDeviceStatus(field, t).timeAgo})
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
                <Box bg="white" p={6} borderRadius="2xl" border="1px solid" borderColor="gray.200" mb={6} style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                    <Flex align="center" justify="space-between" mb={5} wrap="wrap" gap={3}>
                        <Text fontSize="lg" fontWeight="bold" color="gray.800">{t('field_details.historical_trends')}</Text>

                        <Flex gap={3} wrap="wrap">
                            {/* Metric Toggle Pills */}
                            <Flex bg="gray.50" p={1} borderRadius="lg" border="1px solid" borderColor="gray.200" gap={1}>
                                <Button size="xs" variant={visibleMetrics.soilTemp ? 'solid' : 'ghost'} colorPalette="orange" onClick={() => setVisibleMetrics(s => ({ ...s, soilTemp: !s.soilTemp }))}>{t('field_details.soil_temp')}</Button>
                                <Button size="xs" variant={visibleMetrics.soilHumidity ? 'solid' : 'ghost'} colorPalette="blue" onClick={() => setVisibleMetrics(s => ({ ...s, soilHumidity: !s.soilHumidity }))}>{t('field_details.soil_moisture')}</Button>
                                <Button size="xs" variant={visibleMetrics.ambientTemp ? 'solid' : 'ghost'} colorPalette="green" onClick={() => setVisibleMetrics(s => ({ ...s, ambientTemp: !s.ambientTemp }))}>{t('field_details.ambient_temp')}</Button>
                                <Button size="xs" variant={visibleMetrics.ambientHumidity ? 'solid' : 'ghost'} colorPalette="purple" onClick={() => setVisibleMetrics(s => ({ ...s, ambientHumidity: !s.ambientHumidity }))}>{t('field_details.ambient_humidity')}</Button>
                            </Flex>

                            {/* Timeframe pills */}
                            <Flex gap={2}>
                                {(['today', 7, 14, 30] as const).map(d => (
                                    <Button
                                        key={String(d)}
                                        size="xs"
                                        borderRadius="full"
                                        variant={timeframe === d ? 'solid' : 'outline'}
                                        colorPalette={timeframe === d ? 'brand' : 'gray'}
                                        onClick={() => setTimeframe(d)}
                                        px={4}
                                    >
                                        {d === 'today' ? t('field_details.timeframe_today', 'Today') : t(`field_details.timeframe_${d}`)}
                                    </Button>
                                ))}
                            </Flex>
                        </Flex>
                    </Flex>

                    {history.length > 0 ? (
                        <ResponsiveContainer width="100%" height={280}>
                            <RechartsAreaChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                <ChartGradients />
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} />
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
                                {visibleMetrics.soilHumidity && <Area yAxisId="moisture" connectNulls type="monotone" dataKey="avgSoilHumidity" name={t('field_details.moisture_pct')} stroke="#3182CE" strokeWidth={2.5} fill="url(#gradMoisture)" dot={false} activeDot={{ r: 5 }} />}
                                {visibleMetrics.ambientHumidity && <Area yAxisId="moisture" connectNulls type="monotone" dataKey="avgAmbientHumidity" name={t('field_details.ambient_humidity')} stroke="#805AD5" strokeWidth={2.5} fill="url(#gradAmbHum)" dot={false} activeDot={{ r: 5 }} />}
                                {visibleMetrics.soilTemp && <Area yAxisId="temp" connectNulls type="monotone" dataKey="avgSoilTemp" name={t('field_details.temp_c')} stroke="#DD6B20" strokeWidth={2.5} fill="url(#gradTemp)" dot={false} activeDot={{ r: 5 }} />}
                                {visibleMetrics.ambientTemp && <Area yAxisId="temp" connectNulls type="monotone" dataKey="avgAmbientTemp" name={t('field_details.ambient_temp')} stroke="#38A169" strokeWidth={2.5} fill="url(#gradAmbTemp)" dot={false} activeDot={{ r: 5 }} />}
                            </RechartsAreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <Flex h="200px" align="center" justify="center" direction="column" color="gray.400">
                            <Text>{t('field_details.no_history')}</Text>
                        </Flex>
                    )}
                </Box>

                {/* ══════════════ AI RECOMMENDATIONS ══════════════ */}
                {lastAnalysis ? (
                    <Box bg="white" p={6} borderRadius="2xl" border="1px solid" borderColor="gray.200" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                        <Flex align="center" justify="space-between" mb={4} direction={{ base: "column", md: "row" }} gap={3}>
                            <Flex align="center" gap={3} wrap="wrap">
                                <Flex bg="green.50" p={2} borderRadius="lg"><BrainCircuit size={20} color="#059669" /></Flex>
                                <Box>
                                    <Text fontSize="lg" fontWeight="semibold">{t('field_details.ai.results_title')}</Text>
                                    <Text fontSize="xs" color="gray.500">{parseBackendDate(lastAnalysis.timestamp).toLocaleString()}</Text>
                                </Box>
                                <Flex px={2} py={0.5} borderRadius="full" fontSize="xs" fontWeight="bold" color="white" bg={scenarioBadgeColor(lastAnalysis.scenario)}>
                                    {scenarioLabel(lastAnalysis.scenario)}
                                </Flex>
                            </Flex>
                            <Button size="xs" variant="outline" colorPalette="brand" onClick={() => setIsAnalysisModalOpen(true)} w={{ base: "full", md: "auto" }}>{t('field_details.ai.reanalyze')}</Button>
                        </Flex>
                        <Box p={3} mb={4} bg="green.50" border="1px solid" borderColor="green.100" borderRadius="lg">
                            <Text fontSize="sm" color="green.800">{weatherSourceLabel(lastAnalysis.weatherSource)}</Text>
                        </Box>
                        {lastAnalysis.recommendations.length === 0 ? (
                            <Box p={6} bg="gray.50" borderRadius="xl" textAlign="center"><Text color="gray.500" fontSize="sm">{t('field_details.ai.no_recommendations')}</Text></Box>
                        ) : (
                            <Flex gap={4} direction="column">
                                {lastAnalysis.recommendations.map((rec, idx) => {
                                    const badge = probBadgeColor(rec.probability);
                                    const barColor = badge === 'green' ? '#38a169' : badge === 'orange' ? '#dd6b20' : '#a0aec0';
                                    return (
                                        <Box key={rec.crop} p={4} bg={idx === 0 ? 'green.50' : 'gray.50'} borderRadius="xl" border="1px solid" borderColor={idx === 0 ? 'green.200' : 'gray.200'}>
                                            <Flex align="center" justify="space-between" mb={2}>
                                                <Flex align="center" gap={2}>
                                                    <Leaf size={16} color={idx === 0 ? '#059669' : '#718096'} />
                                                    <Text as="button" fontWeight="semibold" fontSize="md" textTransform="capitalize" cursor="pointer" _hover={{ textDecoration: "underline", color: "brand.700" }} onClick={() => navigate(`/guide/${toCropSlug(rec.crop)}`)}>
                                                        {cropLabel(rec.crop)}
                                                    </Text>
                                                    {idx === 0 && <Flex px={2} py={0.5} borderRadius="full" fontSize="10px" fontWeight="bold" bg="green.500" color="white">{t('field_details.ai.top_pick')}</Flex>}
                                                </Flex>
                                                <Flex align="center" gap={2}>
                                                    <Flex px={2} py={0.5} borderRadius="full" fontSize="xs" fontWeight="bold" bg={`${badge}.100`} color={`${badge}.800`}>{confidenceLabel(badge)}</Flex>
                                                    <Text fontWeight="bold" fontSize="md" style={{ color: barColor }}>{rec.probability.toFixed(1)}%</Text>
                                                </Flex>
                                            </Flex>
                                            <Box bg="gray.200" borderRadius="full" h="6px" overflow="hidden">
                                                <Box h="100%" borderRadius="full" bg={barColor} style={{ width: `${Math.min(rec.probability, 100).toFixed(1)}%`, transition: 'width 0.6s ease' }} />
                                            </Box>
                                        </Box>
                                    );
                                })}
                            </Flex>
                        )}
                    </Box>
                ) : (
                    <Box p={6} bg="gray.50" borderRadius="2xl" border="1px dashed" borderColor="gray.300" textAlign="center">
                        <Flex justify="center" mb={3}><Flex bg="green.50" p={3} borderRadius="xl"><BrainCircuit size={28} color="#059669" /></Flex></Flex>
                        <Text fontWeight="semibold" mb={1}>{t('field_details.ai.empty_title')}</Text>
                        <Text fontSize="sm" color="gray.500" mb={4}>{t('field_details.ai.empty_desc')}</Text>
                        <Button colorPalette="brand" size="sm" onClick={() => setIsAnalysisModalOpen(true)}><BrainCircuit size={15} />{t('field_details.ai.button')}</Button>
                    </Box>
                )}
            </DashboardLayout>
        </>
    )
}
