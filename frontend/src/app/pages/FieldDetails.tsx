import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
    Box, Flex, Text, Spinner, Button, IconButton,
    Dialog, Portal, CloseButton, Input, Field as ChakraField, Circle,
    Tabs,
} from "@chakra-ui/react"
import { Sprout, Trash2, BrainCircuit, Leaf } from "lucide-react"

import { useTranslation } from "react-i18next"

import { MapContainer, TileLayer, Polygon } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

import { CartesianGrid, XAxis, YAxis, Tooltip, Area, ResponsiveContainer, AreaChart as RechartsAreaChart } from "recharts"

import { DashboardLayout } from "../../components/layout/DashboardLayout"
import { fieldsService } from "../../features/fields/fields.service"
import { normalizeCropName, toCropSlug } from "../../features/crop-guides/normalizeCropName"
import type {
    Field as FieldType,
    SensorData,
    WeatherData,
    HistoricalSensorData,
    AnalysisResult,
} from "../../features/fields/types"

const ESRI_SATELLITE = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const ESRI_LABELS = 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}';

function formatDate(d: Date): string {
    return d.toISOString().slice(0, 10);
}

function scenarioBadgeColor(scenario: string): string {
    if (scenario === 'RANGE')   return '#2f855a';
    if (scenario === 'FUTURE')  return '#2b6cb0';
    if (scenario === 'WHAT_IF') return '#6b46c1';
    return '#718096';
}

function probBadgeColor(prob: number): 'green' | 'orange' | 'gray' {
    if (prob >= 70) return 'green';
    if (prob >= 40) return 'orange';
    return 'gray';
}

/* ── Styled range slider ─────────────────────────────────────────────────── */
interface RangeSliderProps {
    value: number;
    min: number;
    max: number;
    step: number;
    accentColor: string;
    onChange: (v: number) => void;
}

const RangeSlider = ({ value, min, max, step, accentColor, onChange }: RangeSliderProps) => {
    const pct = ((value - min) / (max - min)) * 100;
    return (
        <Box position="relative" py={1}>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={e => onChange(Number(e.target.value))}
                style={{
                    width: '100%',
                    height: '6px',
                    borderRadius: '3px',
                    appearance: 'none',
                    WebkitAppearance: 'none',
                    outline: 'none',
                    cursor: 'pointer',
                    background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${pct}%, #E2E8F0 ${pct}%, #E2E8F0 100%)`,
                }}
            />
            <style>{`
                input[type='range']::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    width: 18px;
                    height: 18px;
                    border-radius: 50%;
                    background: white;
                    border: 2.5px solid ${accentColor};
                    cursor: pointer;
                    box-shadow: 0 1px 4px rgba(0,0,0,0.18);
                }
                input[type='range']::-moz-range-thumb {
                    width: 18px;
                    height: 18px;
                    border-radius: 50%;
                    background: white;
                    border: 2.5px solid ${accentColor};
                    cursor: pointer;
                    box-shadow: 0 1px 4px rgba(0,0,0,0.18);
                }
            `}</style>
        </Box>
    );
};
/* ─────────────────────────────────────────────────────────────────────────── */

const MonthSelect = ({
    value,
    onChange,
    labels,
}: {
    value: number;
    onChange: (v: number) => void;
    labels: string[];
}) => (
    <select
        value={value}
        onChange={(e) => onChange(Number(e.currentTarget.value))}
        style={{
            width: '100%',
            padding: '8px 12px',
            borderRadius: '8px',
            border: '1px solid #E2E8F0',
            background: 'white',
            fontSize: '14px',
            cursor: 'pointer',
        }}
    >
        {labels.map((name, idx) => (
            <option key={idx + 1} value={idx + 1}>{name}</option>
        ))}
    </select>
);

export const FieldDetails = () => {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { t, i18n } = useTranslation()
    const monthLabels = [
        t('field_details.ai.months.jan'),
        t('field_details.ai.months.feb'),
        t('field_details.ai.months.mar'),
        t('field_details.ai.months.apr'),
        t('field_details.ai.months.may'),
        t('field_details.ai.months.jun'),
        t('field_details.ai.months.jul'),
        t('field_details.ai.months.aug'),
        t('field_details.ai.months.sep'),
        t('field_details.ai.months.oct'),
        t('field_details.ai.months.nov'),
        t('field_details.ai.months.dec'),
    ];

    const [field, setField] = useState<FieldType | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    // Data Aggregation
    const [telemetry, setTelemetry] = useState<SensorData | null>(null)
    const [weather, setWeather] = useState<WeatherData | null>(null)
    const [history, setHistory] = useState<HistoricalSensorData[]>([])

    // Hardware Pairing States
    const [isPairing, setIsPairing] = useState(false)
    const [macInput, setMacInput] = useState("")
    const [pairError, setPairError] = useState<string | null>(null)

    // Dialog state
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [isUnpairDialogOpen, setIsUnpairDialogOpen] = useState(false)
    const [isPairDialogOpen, setIsPairDialogOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [isUnpairing, setIsUnpairing] = useState(false)

    // ML Analysis state
    const [lastAnalysis, setLastAnalysis] = useState<AnalysisResult | null>(null)
    const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false)
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [analysisError, setAnalysisError] = useState<string | null>(null)
    const [activeScenario, setActiveScenario] = useState<'range' | 'future' | 'whatif'>('range')

    // Scenario A form fields
    const [rangeStart, setRangeStart] = useState(formatDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)))
    const [rangeEnd, setRangeEnd] = useState(formatDate(new Date()))

    // Scenario B / C form fields
    const [monthStart, setMonthStart] = useState(6)
    const [monthEnd, setMonthEnd] = useState(9)

    // Scenario C sliders
    const [overrideTemp, setOverrideTemp] = useState(25)
    const [overrideHum, setOverrideHum] = useState(60)
    const [overrideRain, setOverrideRain] = useState(400)

    // For initial focus in pair dialog
    const macInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (!id) return;
        let isMounted = true;
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const fieldData = await fieldsService.getFieldById(id);
                if (!isMounted) return;
                setField(fieldData);

                const endDate = new Date().toISOString();
                const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

                const [telData, weatherData, histData, analysisData] = await Promise.all([
                    fieldsService.getMostRecentTelemetry(id).catch(() => null),
                    fieldsService.getLiveWeather(id).catch(() => null),
                    fieldsService.getHistoricalTelemetry(id, 'DAILY', startDate, endDate).catch(() => []),
                    fieldsService.getLastAnalysis(id).catch(() => null),
                ]);

                if (!isMounted) return;
                if (telData)      setTelemetry(telData);
                if (weatherData)  setWeather(weatherData);
                if (histData)     setHistory(histData);
                if (analysisData) setLastAnalysis(analysisData);
            } catch (error) {
                console.error("Error fetching field details:", error);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };
        fetchData();
        return () => { isMounted = false; };
    }, [id]);

    const handleConfirmPair = async () => {
        if (!id || !macInput.trim()) return;
        setIsPairing(true);
        setPairError(null);
        try {
            await fieldsService.pairDevice(id, macInput.trim());
            setIsPairDialogOpen(false);
            setMacInput("");
            window.location.reload();
        } catch (error: any) {
            setPairError(error.response?.data?.message || "Failed to pair device. Please try again.");
        } finally {
            setIsPairing(false);
        }
    };

    const handleConfirmUnpair = async () => {
        if (!id) return;
        setIsUnpairing(true);
        try {
            await fieldsService.unpairDevice(id);
            const updatedField = await fieldsService.getFieldById(id);
            setField(updatedField);
            setIsUnpairDialogOpen(false);
        } catch (error) {
            console.error("Failed to unpair device:", error);
        } finally {
            setIsUnpairing(false);
        }
    };

    const handleConfirmDelete = async () => {
        if (!id) return;
        setIsDeleting(true);
        try {
            await fieldsService.deleteField(id);
            navigate('/dashboard');
        } catch (error) {
            console.error("Failed to delete field:", error);
            setIsDeleting(false);
            setIsDeleteDialogOpen(false);
        }
    };

    const handleRunAnalysis = async () => {
        if (!id) return;
        setIsAnalyzing(true);
        setAnalysisError(null);
        try {
            let result: AnalysisResult;
            if (activeScenario === 'range') {
                result = await fieldsService.runAnalysis({
                    fieldId: id,
                    isFuturePrediction: false,
                    startDate: rangeStart,
                    endDate: rangeEnd,
                    topN: 5,
                });
            } else if (activeScenario === 'future') {
                result = await fieldsService.runAnalysis({
                    fieldId: id,
                    isFuturePrediction: true,
                    targetMonthStart: monthStart,
                    targetMonthEnd: monthEnd,
                    topN: 5,
                });
            } else {
                result = await fieldsService.runAnalysis({
                    fieldId: id,
                    isFuturePrediction: true,
                    targetMonthStart: monthStart,
                    targetMonthEnd: monthEnd,
                    topN: 5,
                    overrides: { temperature: overrideTemp, humidity: overrideHum, rainfall: overrideRain },
                });
            }
            setLastAnalysis(result);
            setIsAnalysisModalOpen(false);
        } catch (err: any) {
            setAnalysisError(err.response?.data?.message || err.message || 'Analysis failed. Please try again.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const scenarioLabel = (scenario: string) => {
        if (scenario === 'RANGE')   return t('field_details.ai.scenario_range');
        if (scenario === 'FUTURE')  return t('field_details.ai.scenario_future');
        if (scenario === 'WHAT_IF') return t('field_details.ai.scenario_whatif');
        return scenario;
    };

    const weatherSourceLabel = (src: string) => {
        if (src === 'IOT')         return t('field_details.ai.source_iot');
        if (src === 'WEATHER_LOG') return t('field_details.ai.source_weather_log');
        if (src === 'CLIMATOLOGY') return t('field_details.ai.source_climatology');
        return src;
    };

    const confidenceLabel = (color: 'green' | 'orange' | 'gray') => {
        if (color === 'green')  return t('field_details.ai.confidence_high');
        if (color === 'orange') return t('field_details.ai.confidence_moderate');
        return t('field_details.ai.confidence_low');
    };

    const cropLabel = (crop: string) => {
        const key = normalizeCropName(crop);
        return t(`crop_names.${key}`, { defaultValue: crop });
    };

    const status: 'online' | 'paired' | 'offline' =
        field?.deviceId && telemetry ? 'online'
        : field?.deviceId           ? 'paired'
        :                            'offline';

    const statusConfig = {
        online:  { bg: 'brand.50',  color: 'green.700',  border: 'brand.100',  dot: 'green.500',  pulse: true,  label: t('dashboard.online') },
        paired:  { bg: 'yellow.50', color: 'yellow.700', border: 'yellow.100', dot: 'yellow.500', pulse: false, label: t('dashboard.paired', 'Paired') },
        offline: { bg: 'red.50',    color: 'red.700',    border: 'red.100',    dot: 'red.500',    pulse: false, label: t('dashboard.offline') },
    }[status];

    if (isLoading || !field) {
        return (
            <DashboardLayout title={t('field_details.title')} subtitle={t('field_details.loading')}>
                <Flex minH="60vh" align="center" justify="center" direction="column" color="brand.500">
                    <Spinner size="xl" mb={4} />
                    <Text fontWeight="medium" color="neutral.subtext">{t('field_details.loading')}</Text>
                </Flex>
            </DashboardLayout>
        )
    }

    return (
        <>
            {/* ── Delete Field Dialog ── */}
            <Dialog.Root
                role="alertdialog"
                open={isDeleteDialogOpen}
                onOpenChange={(e) => setIsDeleteDialogOpen(e.open)}
                placement="center"
            >
                <Portal>
                    <Dialog.Backdrop backdropFilter="auto" backdropBlur="sm" />
                    <Dialog.Positioner>
                        <Dialog.Content>
                            <Dialog.Header>
                                <Dialog.Title>{t('field_details.delete_title')}</Dialog.Title>
                            </Dialog.Header>
                            <Dialog.Body>
                                <Text>{t('field_details.delete_desc', { name: field.name })}</Text>
                            </Dialog.Body>
                            <Dialog.Footer>
                                <Dialog.ActionTrigger asChild>
                                    <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                                        {t('field_details.cancel')}
                                    </Button>
                                </Dialog.ActionTrigger>
                                <Button colorPalette="red" onClick={handleConfirmDelete} loading={isDeleting}>
                                    {t('field_details.delete_btn')}
                                </Button>
                            </Dialog.Footer>
                            <Dialog.CloseTrigger asChild><CloseButton size="sm" /></Dialog.CloseTrigger>
                        </Dialog.Content>
                    </Dialog.Positioner>
                </Portal>
            </Dialog.Root>

            {/* ── Unpair Device Dialog ── */}
            <Dialog.Root
                role="alertdialog"
                open={isUnpairDialogOpen}
                onOpenChange={(e) => setIsUnpairDialogOpen(e.open)}
                placement="center"
            >
                <Portal>
                    <Dialog.Backdrop backdropFilter="auto" backdropBlur="sm" />
                    <Dialog.Positioner>
                        <Dialog.Content>
                            <Dialog.Header>
                                <Dialog.Title>{t('field_details.unpair_title')}</Dialog.Title>
                            </Dialog.Header>
                            <Dialog.Body>
                                <Text>{t('field_details.unpair_desc', { id: field.deviceId })}</Text>
                            </Dialog.Body>
                            <Dialog.Footer>
                                <Dialog.ActionTrigger asChild>
                                    <Button variant="outline" onClick={() => setIsUnpairDialogOpen(false)}>
                                        {t('field_details.cancel')}
                                    </Button>
                                </Dialog.ActionTrigger>
                                <Button colorPalette="red" onClick={handleConfirmUnpair} loading={isUnpairing}>
                                    {t('field_details.unpair_btn')}
                                </Button>
                            </Dialog.Footer>
                            <Dialog.CloseTrigger asChild><CloseButton size="sm" /></Dialog.CloseTrigger>
                        </Dialog.Content>
                    </Dialog.Positioner>
                </Portal>
            </Dialog.Root>

            {/* ── Pair Device Dialog ── */}
            <Dialog.Root
                open={isPairDialogOpen}
                onOpenChange={(e) => { setIsPairDialogOpen(e.open); if (!e.open) { setMacInput(""); setPairError(null); } }}
                placement="center"
                initialFocusEl={() => macInputRef.current}
            >
                <Portal>
                    <Dialog.Backdrop backdropFilter="auto" backdropBlur="sm" />
                    <Dialog.Positioner>
                        <Dialog.Content>
                            <Dialog.Header>
                                <Dialog.Title>{t('field_details.pair_title')}</Dialog.Title>
                            </Dialog.Header>
                            <Dialog.Body pb={4}>
                                <ChakraField.Root invalid={!!pairError}>
                                    <ChakraField.Label>{t('field_details.mac_address')}</ChakraField.Label>
                                    <Input
                                        ref={macInputRef}
                                        placeholder={t('field_details.mac_ph')}
                                        value={macInput}
                                        onChange={e => { setMacInput(e.target.value); setPairError(null); }}
                                        onKeyDown={e => e.key === 'Enter' && handleConfirmPair()}
                                    />
                                    {pairError
                                        ? <ChakraField.ErrorText>{pairError}</ChakraField.ErrorText>
                                        : <ChakraField.HelperText>{t('field_details.mac_helper')}</ChakraField.HelperText>
                                    }
                                </ChakraField.Root>
                            </Dialog.Body>
                            <Dialog.Footer>
                                <Dialog.ActionTrigger asChild>
                                    <Button variant="outline" onClick={() => setIsPairDialogOpen(false)}>
                                        {t('field_details.cancel')}
                                    </Button>
                                </Dialog.ActionTrigger>
                                <Button colorPalette="brand" onClick={handleConfirmPair} loading={isPairing} disabled={!macInput.trim()}>
                                    {t('field_details.pair_btn')}
                                </Button>
                            </Dialog.Footer>
                            <Dialog.CloseTrigger asChild><CloseButton size="sm" /></Dialog.CloseTrigger>
                        </Dialog.Content>
                    </Dialog.Positioner>
                </Portal>
            </Dialog.Root>

            {/* ── AI Analysis Modal ── */}
            <Dialog.Root
                open={isAnalysisModalOpen}
                onOpenChange={(e) => { setIsAnalysisModalOpen(e.open); if (!e.open) setAnalysisError(null); }}
                placement="center"
                size="lg"
            >
                <Portal>
                    <Dialog.Backdrop backdropFilter="auto" backdropBlur="sm" />
                    <Dialog.Positioner>
                        <Dialog.Content maxW="560px">
                            <Dialog.Header pb={0}>
                                <Dialog.Title>
                                    <Flex align="center" gap={2}>
                                        <BrainCircuit size={20} color="#059669" />
                                        {t('field_details.ai.modal_title')}
                                    </Flex>
                                </Dialog.Title>
                                <Text fontSize="sm" color="gray.500" mt={1}>
                                    {t('field_details.ai.modal_subtitle')}
                                </Text>
                            </Dialog.Header>

                            <Dialog.Body pt={4} pb={6}>
                                <Tabs.Root
                                    value={activeScenario}
                                    onValueChange={(d) => {
                                        setActiveScenario(d.value as 'range' | 'future' | 'whatif');
                                        setAnalysisError(null);
                                    }}
                                    variant="line"
                                >
                                    <Tabs.List mb={5}>
                                        <Tabs.Trigger value="range">{t('field_details.ai.tab_range')}</Tabs.Trigger>
                                        <Tabs.Trigger value="future">{t('field_details.ai.tab_future')}</Tabs.Trigger>
                                        <Tabs.Trigger value="whatif">{t('field_details.ai.tab_whatif')}</Tabs.Trigger>
                                        <Tabs.Indicator />
                                    </Tabs.List>

                                    {/* ── Scenario A: Range ── */}
                                    <Tabs.Content value="range">
                                        <Flex direction="column" gap={4}>
                                            <Box bg="green.50" border="1px solid" borderColor="green.100" borderRadius="lg" p={3}>
                                                <Text fontSize="sm" color="green.700">{t('field_details.ai.range_info')}</Text>
                                            </Box>
                                            <Flex gap={4}>
                                                <ChakraField.Root flex={1}>
                                                    <ChakraField.Label>{t('field_details.ai.start_date')}</ChakraField.Label>
                                                    <Input
                                                        type="date"
                                                        lang={i18n.language === 'tr' ? 'tr-TR' : 'en-US'}
                                                        value={rangeStart}
                                                        onChange={e => setRangeStart(e.target.value)}
                                                        max={rangeEnd}
                                                    />
                                                </ChakraField.Root>
                                                <ChakraField.Root flex={1}>
                                                    <ChakraField.Label>{t('field_details.ai.end_date')}</ChakraField.Label>
                                                    <Input
                                                        type="date"
                                                        lang={i18n.language === 'tr' ? 'tr-TR' : 'en-US'}
                                                        value={rangeEnd}
                                                        onChange={e => setRangeEnd(e.target.value)}
                                                        min={rangeStart}
                                                        max={formatDate(new Date())}
                                                    />
                                                </ChakraField.Root>
                                            </Flex>
                                        </Flex>
                                    </Tabs.Content>

                                    {/* ── Scenario B: Future Season ── */}
                                    <Tabs.Content value="future">
                                        <Flex direction="column" gap={4}>
                                            <Box bg="blue.50" border="1px solid" borderColor="blue.100" borderRadius="lg" p={3}>
                                                <Text fontSize="sm" color="blue.700">{t('field_details.ai.future_info')}</Text>
                                            </Box>
                                            <Flex gap={4}>
                                                <ChakraField.Root flex={1}>
                                                    <ChakraField.Label>{t('field_details.ai.season_start')}</ChakraField.Label>
                                                    <MonthSelect value={monthStart} onChange={setMonthStart} labels={monthLabels} />
                                                </ChakraField.Root>
                                                <ChakraField.Root flex={1}>
                                                    <ChakraField.Label>{t('field_details.ai.season_end')}</ChakraField.Label>
                                                    <MonthSelect value={monthEnd} onChange={setMonthEnd} labels={monthLabels} />
                                                </ChakraField.Root>
                                            </Flex>
                                        </Flex>
                                    </Tabs.Content>

                                    {/* ── Scenario C: What-If ── */}
                                    <Tabs.Content value="whatif">
                                        <Flex direction="column" gap={5}>
                                            <Box bg="purple.50" border="1px solid" borderColor="purple.100" borderRadius="lg" p={3}>
                                                <Text fontSize="sm" color="purple.700">{t('field_details.ai.whatif_info')}</Text>
                                            </Box>

                                            <Flex gap={4}>
                                                <ChakraField.Root flex={1}>
                                                    <ChakraField.Label>{t('field_details.ai.season_start')}</ChakraField.Label>
                                                    <MonthSelect value={monthStart} onChange={setMonthStart} labels={monthLabels} />
                                                </ChakraField.Root>
                                                <ChakraField.Root flex={1}>
                                                    <ChakraField.Label>{t('field_details.ai.season_end')}</ChakraField.Label>
                                                    <MonthSelect value={monthEnd} onChange={setMonthEnd} labels={monthLabels} />
                                                </ChakraField.Root>
                                            </Flex>

                                            {/* Temperature slider */}
                                            <Box>
                                                <Flex justify="space-between" align="center" mb={2}>
                                                    <Text fontSize="sm" fontWeight="medium">{t('field_details.ai.temp_override')}</Text>
                                                    <Text fontSize="sm" fontWeight="bold" color="orange.600">{overrideTemp} °C</Text>
                                                </Flex>
                                                <RangeSlider value={overrideTemp} min={0} max={50} step={0.5} accentColor="#DD6B20" onChange={setOverrideTemp} />
                                                <Flex justify="space-between" mt={1}>
                                                    <Text fontSize="xs" color="gray.400">0 °C</Text>
                                                    <Text fontSize="xs" color="gray.400">50 °C</Text>
                                                </Flex>
                                            </Box>

                                            {/* Humidity slider */}
                                            <Box>
                                                <Flex justify="space-between" align="center" mb={2}>
                                                    <Text fontSize="sm" fontWeight="medium">{t('field_details.ai.hum_override')}</Text>
                                                    <Text fontSize="sm" fontWeight="bold" color="blue.600">{overrideHum} %</Text>
                                                </Flex>
                                                <RangeSlider value={overrideHum} min={0} max={100} step={1} accentColor="#3182CE" onChange={setOverrideHum} />
                                                <Flex justify="space-between" mt={1}>
                                                    <Text fontSize="xs" color="gray.400">0 %</Text>
                                                    <Text fontSize="xs" color="gray.400">100 %</Text>
                                                </Flex>
                                            </Box>

                                            {/* Rainfall slider */}
                                            <Box>
                                                <Flex justify="space-between" align="center" mb={2}>
                                                    <Text fontSize="sm" fontWeight="medium">{t('field_details.ai.rain_override')}</Text>
                                                    <Text fontSize="sm" fontWeight="bold" color="teal.600">{overrideRain} mm</Text>
                                                </Flex>
                                                <RangeSlider value={overrideRain} min={0} max={1000} step={5} accentColor="#319795" onChange={setOverrideRain} />
                                                <Flex justify="space-between" mt={1}>
                                                    <Text fontSize="xs" color="gray.400">0 mm</Text>
                                                    <Text fontSize="xs" color="gray.400">1000 mm</Text>
                                                </Flex>
                                            </Box>
                                        </Flex>
                                    </Tabs.Content>
                                </Tabs.Root>

                                {analysisError && (
                                    <Box mt={4} p={3} bg="red.50" border="1px solid" borderColor="red.200" borderRadius="lg">
                                        <Text fontSize="sm" color="red.700">{analysisError}</Text>
                                    </Box>
                                )}
                            </Dialog.Body>

                            <Dialog.Footer>
                                <Dialog.ActionTrigger asChild>
                                    <Button variant="outline" onClick={() => setIsAnalysisModalOpen(false)}>
                                        {t('field_details.cancel')}
                                    </Button>
                                </Dialog.ActionTrigger>
                                <Button
                                    colorPalette="brand"
                                    onClick={handleRunAnalysis}
                                    loading={isAnalyzing}
                                    loadingText={t('field_details.ai.analyzing')}
                                >
                                    <BrainCircuit size={16} />
                                    {t('field_details.ai.analyze')}
                                </Button>
                            </Dialog.Footer>

                            <Dialog.CloseTrigger asChild><CloseButton size="sm" /></Dialog.CloseTrigger>
                        </Dialog.Content>
                    </Dialog.Positioner>
                </Portal>
            </Dialog.Root>

            {/* ── Page content ── */}
            <DashboardLayout title={field.name} subtitle={t('field_details.subtitle')}>

                <Box bg="white" p={6} borderRadius="2xl" borderWidth="1px" borderColor="gray.200">
                    {/* Header */}
                    <Flex align="center" justify="space-between" mb={6}>
                        <Flex align="center" gap={4}>
                            <Flex bg="brand.50" p={4} borderRadius="xl">
                                <Sprout size={32} color="#059669" />
                            </Flex>
                            <Box>
                                <Flex align="center" gap={3}>
                                    <Text fontSize="2xl" fontWeight="bold">{field.name}</Text>
                                    <Flex
                                        px={3} py={1} borderRadius="full" fontSize="xs" fontWeight="bold"
                                        border="1px solid" align="center" gap={1.5}
                                        bg={statusConfig.bg} color={statusConfig.color} borderColor={statusConfig.border}
                                    >
                                        <Circle size={2} bg={statusConfig.dot} animation={statusConfig.pulse ? "pulse 2s infinite" : undefined} />
                                        {statusConfig.label}
                                    </Flex>
                                </Flex>
                                <Text color="gray.500">
                                    {t('field_details.area')}: {field.areaHa} {t('field_details.hectares')} • {t('field_details.soil')}: {field.soilType}
                                </Text>
                            </Box>
                        </Flex>

                        <Flex gap={3} align="center">
                            <Button colorPalette="brand" variant="solid" size="sm" onClick={() => setIsAnalysisModalOpen(true)}>
                                <BrainCircuit size={16} />
                                {t('field_details.ai.button')}
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
                            <IconButton aria-label="Delete field" colorPalette="red" variant="ghost" size="sm" onClick={() => setIsDeleteDialogOpen(true)}>
                                <Trash2 size={20} />
                            </IconButton>
                        </Flex>
                    </Flex>

                    {/* Map */}
                    {field.location && field.location.length > 0 && (
                        <Box h="300px" w="100%" borderRadius="xl" overflow="hidden" mb={8} border="1px solid" borderColor="gray.200">
                            <MapContainer
                                bounds={field.location.map((c: number[]) => [c[1], c[0]])}
                                zoom={14}
                                style={{ height: '100%', width: '100%' }}
                                scrollWheelZoom={true}
                            >
                                <TileLayer url={ESRI_SATELLITE} attribution="Esri World Imagery" maxZoom={19} />
                                <TileLayer url={ESRI_LABELS} maxZoom={19} opacity={0.8} />
                                <Polygon
                                    positions={field.location.map((c: number[]) => [c[1], c[0]])}
                                    pathOptions={{ color: '#059669', fillColor: '#059669', fillOpacity: 0.2, weight: 2 }}
                                />
                            </MapContainer>
                        </Box>
                    )}

                    {/* Live telemetry */}
                    <Text fontSize="lg" fontWeight="semibold" mt={8} mb={4}>{t('field_details.live_telemetry')}</Text>
                    <Flex gap={4} wrap="wrap" justify="space-between">
                        <Box p={4} bg="gray.50" rounded="lg" flex="1" minW="150px">
                            <Text color="gray.500" fontSize="sm">{t('field_details.soil_temp')}</Text>
                            <Text fontSize="xl" fontWeight="bold">{telemetry?.soilTemp ?? "--"} °C</Text>
                        </Box>
                        <Box p={4} bg="gray.50" rounded="lg" flex="1" minW="150px">
                            <Text color="gray.500" fontSize="sm">{t('field_details.soil_moisture')}</Text>
                            <Text fontSize="xl" fontWeight="bold">{telemetry?.soilHumidity ?? "--"} %</Text>
                        </Box>
                        <Box p={4} bg="gray.50" rounded="lg" flex="1" minW="150px">
                            <Text color="gray.500" fontSize="sm">{t('field_details.ambient_temp')}</Text>
                            <Text fontSize="xl" fontWeight="bold">{telemetry?.ambientTemp ?? "--"} °C</Text>
                        </Box>
                        <Box p={4} bg="gray.50" rounded="lg" flex="1" minW="150px">
                            <Text color="gray.500" fontSize="sm">{t('field_details.ambient_humidity')}</Text>
                            <Text fontSize="xl" fontWeight="bold">{telemetry?.ambientHumidity ?? "--"} %</Text>
                        </Box>
                    </Flex>

                    {/* Historical trends */}
                    <Text fontSize="lg" fontWeight="semibold" mt={8} mb={4}>{t('field_details.historical_trends')}</Text>
                    <Box h="300px" bg="gray.50" rounded="lg" p={4} minW={0} overflow="hidden">
                        {history.length > 0 ? (
                            <ResponsiveContainer width="100%" height={260}>
                                <RechartsAreaChart data={history.map(d => ({ ...d, day: new Date(d.period).toLocaleDateString('en-US', { weekday: 'short' }) }))}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#718096' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#718096' }} />
                                    <Tooltip />
                                    <Area type="monotone" dataKey="avgSoilHumidity" name={t('field_details.moisture_pct')} stroke="#3182CE" fill="#EBF8FF" strokeWidth={3} />
                                    <Area type="monotone" dataKey="avgSoilTemp" name={t('field_details.temp_c')} stroke="#DD6B20" fill="#FFFAF0" strokeWidth={3} />
                                </RechartsAreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <Flex h="full" align="center" justify="center" direction="column" color="gray.400">
                                <Text>{t('field_details.no_history')}</Text>
                            </Flex>
                        )}
                    </Box>

                    {/* Regional weather */}
                    <Text fontSize="lg" fontWeight="semibold" mt={8} mb={4}>{t('field_details.regional_weather')}</Text>
                    <Flex gap={4}>
                        <Box p={4} bg="blue.50" rounded="lg" flex={1}>
                            <Text color="blue.600" fontSize="sm">{t('field_details.air_temp')}</Text>
                            <Text fontSize="xl" fontWeight="bold" color="blue.900">{weather?.temperature ?? "--"} °C</Text>
                        </Box>
                        <Box p={4} bg="blue.50" rounded="lg" flex={1}>
                            <Text color="blue.600" fontSize="sm">{t('field_details.air_humidity')}</Text>
                            <Text fontSize="xl" fontWeight="bold" color="blue.900">{weather?.humidity ?? "--"} %</Text>
                        </Box>
                        <Box p={4} bg="blue.50" rounded="lg" flex={1}>
                            <Text color="blue.600" fontSize="sm">{t('field_details.precipitation')}</Text>
                            <Text fontSize="xl" fontWeight="bold" color="blue.900">{weather?.precipitation ?? "--"} mm</Text>
                        </Box>
                    </Flex>

                    {/* ── AI Crop Recommendations ── */}
                    {lastAnalysis ? (
                        <Box mt={8}>
                            <Flex align="center" justify="space-between" mb={4}>
                                <Flex align="center" gap={3}>
                                    <Flex bg="green.50" p={2} borderRadius="lg">
                                        <BrainCircuit size={20} color="#059669" />
                                    </Flex>
                                    <Box>
                                        <Text fontSize="lg" fontWeight="semibold">{t('field_details.ai.results_title')}</Text>
                                        <Text fontSize="xs" color="gray.500">
                                            {new Date(lastAnalysis.timestamp).toLocaleString()}
                                        </Text>
                                    </Box>
                                    <Flex
                                        px={2} py={0.5} borderRadius="full" fontSize="xs" fontWeight="bold"
                                        color="white" bg={scenarioBadgeColor(lastAnalysis.scenario)}
                                    >
                                        {scenarioLabel(lastAnalysis.scenario)}
                                    </Flex>
                                </Flex>
                                <Button size="xs" variant="outline" colorPalette="brand" onClick={() => setIsAnalysisModalOpen(true)}>
                                    {t('field_details.ai.reanalyze')}
                                </Button>
                            </Flex>

                            <Box p={3} mb={4} bg="green.50" border="1px solid" borderColor="green.100" borderRadius="lg">
                                <Text fontSize="sm" color="green.800">
                                    {weatherSourceLabel(lastAnalysis.weatherSource)}
                                </Text>
                            </Box>

                            {lastAnalysis.recommendations.length === 0 ? (
                                <Box p={6} bg="gray.50" borderRadius="xl" textAlign="center">
                                    <Text color="gray.500" fontSize="sm">{t('field_details.ai.no_recommendations')}</Text>
                                </Box>
                            ) : (
                                <Flex gap={4} direction="column">
                                    {lastAnalysis.recommendations.map((rec, idx) => {
                                        const badge = probBadgeColor(rec.probability);
                                        const barColor = badge === 'green' ? '#38a169' : badge === 'orange' ? '#dd6b20' : '#a0aec0';
                                        return (
                                            <Box
                                                key={rec.crop}
                                                p={4}
                                                bg={idx === 0 ? 'green.50' : 'gray.50'}
                                                borderRadius="xl"
                                                border="1px solid"
                                                borderColor={idx === 0 ? 'green.200' : 'gray.200'}
                                            >
                                                <Flex align="center" justify="space-between" mb={2}>
                                                    <Flex align="center" gap={2}>
                                                        <Leaf size={16} color={idx === 0 ? '#059669' : '#718096'} />
                                                        <Text
                                                            as="button"
                                                            fontWeight="semibold"
                                                            fontSize="md"
                                                            textTransform="capitalize"
                                                            textAlign="left"
                                                            cursor="pointer"
                                                            _hover={{ textDecoration: "underline", color: "brand.700" }}
                                                            onClick={() => navigate(`/guide/${toCropSlug(rec.crop)}`)}
                                                        >
                                                            {cropLabel(rec.crop)}
                                                        </Text>
                                                        {idx === 0 && (
                                                            <Flex px={2} py={0.5} borderRadius="full" fontSize="10px" fontWeight="bold" bg="green.500" color="white">
                                                                {t('field_details.ai.top_pick')}
                                                            </Flex>
                                                        )}
                                                    </Flex>
                                                    <Flex align="center" gap={2}>
                                                        <Flex
                                                            px={2} py={0.5} borderRadius="full" fontSize="xs" fontWeight="bold"
                                                            bg={`${badge}.100`} color={`${badge}.800`}
                                                        >
                                                            {confidenceLabel(badge)}
                                                        </Flex>
                                                        <Text fontWeight="bold" fontSize="md" color={barColor}>
                                                            {rec.probability.toFixed(1)}%
                                                        </Text>
                                                    </Flex>
                                                </Flex>
                                                <Box bg="gray.200" borderRadius="full" h="6px" overflow="hidden">
                                                    <Box
                                                        h="100%" borderRadius="full" bg={barColor}
                                                        style={{ width: `${Math.min(rec.probability, 100).toFixed(1)}%`, transition: 'width 0.6s ease' }}
                                                    />
                                                </Box>
                                            </Box>
                                        );
                                    })}
                                </Flex>
                            )}
                        </Box>
                    ) : (
                        /* Empty state */
                        <Box
                            mt={8} p={6} bg="gray.50" borderRadius="2xl"
                            border="1px dashed" borderColor="gray.300" textAlign="center"
                        >
                            <Flex justify="center" mb={3}>
                                <Flex bg="green.50" p={3} borderRadius="xl">
                                    <BrainCircuit size={28} color="#059669" />
                                </Flex>
                            </Flex>
                            <Text fontWeight="semibold" mb={1}>{t('field_details.ai.empty_title')}</Text>
                            <Text fontSize="sm" color="gray.500" mb={4}>{t('field_details.ai.empty_desc')}</Text>
                            <Button colorPalette="brand" size="sm" onClick={() => setIsAnalysisModalOpen(true)}>
                                <BrainCircuit size={15} />
                                {t('field_details.ai.button')}
                            </Button>
                        </Box>
                    )}
                </Box>
            </DashboardLayout>
        </>
    )
}
