import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
    Box, Flex, Text, Spinner, Button, IconButton,
    Dialog, Portal, CloseButton, Input, Field as ChakraField, Circle
} from "@chakra-ui/react"
import { Sprout, Trash2 } from "lucide-react"

import { useTranslation } from "react-i18next"

import { MapContainer, TileLayer, Polygon } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

import { CartesianGrid, XAxis, YAxis, Tooltip, Area, ResponsiveContainer, AreaChart as RechartsAreaChart } from "recharts"

import { DashboardLayout } from "../../components/layout/DashboardLayout"
import { fieldsService } from "../../features/fields/fields.service"
import type { Field as FieldType, SensorData, WeatherData, HistoricalSensorData } from "../../features/fields/types"

const ESRI_SATELLITE = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const ESRI_LABELS = 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}';

export const FieldDetails = () => {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { t } = useTranslation()

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

                const [telData, weatherData, histData] = await Promise.all([
                    fieldsService.getMostRecentTelemetry(id).catch(() => null),
                    fieldsService.getLiveWeather(id).catch(() => null),
                    fieldsService.getHistoricalTelemetry(id, 'DAILY', startDate, endDate).catch(() => [])
                ]);

                if (!isMounted) return;

                if (telData) setTelemetry(telData);
                if (weatherData) setWeather(weatherData);
                if (histData) setHistory(histData);

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
            console.error("Failed to pair device:", error);
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
            // Don't clear data so last-known telemetry stays visible
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

    const status: 'online' | 'paired' | 'offline' =
        field?.deviceId && telemetry ? 'online'
        : field?.deviceId           ? 'paired'
        :                            'offline';

    const statusConfig = {
        online:  { bg: 'brand.50',  color: 'green.700',  border: 'brand.100', dot: 'green.500',  pulse: true,  label: t('dashboard.online') },
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
                                <Text>
                                    {t('field_details.delete_desc', { name: field.name })}
                                </Text>
                            </Dialog.Body>
                            <Dialog.Footer>
                                <Dialog.ActionTrigger asChild>
                                    <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                                        {t('field_details.cancel')}
                                    </Button>
                                </Dialog.ActionTrigger>
                                <Button
                                    colorPalette="red"
                                    onClick={handleConfirmDelete}
                                    loading={isDeleting}
                                >
                                    {t('field_details.delete_btn')}
                                </Button>
                            </Dialog.Footer>
                            <Dialog.CloseTrigger asChild>
                                <CloseButton size="sm" />
                            </Dialog.CloseTrigger>
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
                                <Text>
                                    {t('field_details.unpair_desc', { id: field.deviceId })}
                                </Text>
                            </Dialog.Body>
                            <Dialog.Footer>
                                <Dialog.ActionTrigger asChild>
                                    <Button variant="outline" onClick={() => setIsUnpairDialogOpen(false)}>
                                        {t('field_details.cancel')}
                                    </Button>
                                </Dialog.ActionTrigger>
                                <Button
                                    colorPalette="red"
                                    onClick={handleConfirmUnpair}
                                    loading={isUnpairing}
                                >
                                    {t('field_details.unpair_btn')}
                                </Button>
                            </Dialog.Footer>
                            <Dialog.CloseTrigger asChild>
                                <CloseButton size="sm" />
                            </Dialog.CloseTrigger>
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
                                    {pairError ? (
                                        <ChakraField.ErrorText>{pairError}</ChakraField.ErrorText>
                                    ) : (
                                        <ChakraField.HelperText>
                                            {t('field_details.mac_helper')}
                                        </ChakraField.HelperText>
                                    )}
                                </ChakraField.Root>
                            </Dialog.Body>
                            <Dialog.Footer>
                                <Dialog.ActionTrigger asChild>
                                    <Button variant="outline" onClick={() => setIsPairDialogOpen(false)}>
                                        {t('field_details.cancel')}
                                    </Button>
                                </Dialog.ActionTrigger>
                                <Button
                                    colorPalette="brand"
                                    onClick={handleConfirmPair}
                                    loading={isPairing}
                                    disabled={!macInput.trim()}
                                >
                                    {t('field_details.pair_btn')}
                                </Button>
                            </Dialog.Footer>
                            <Dialog.CloseTrigger asChild>
                                <CloseButton size="sm" />
                            </Dialog.CloseTrigger>
                        </Dialog.Content>
                    </Dialog.Positioner>
                </Portal>
            </Dialog.Root>

            {/* ── Page content ── */}
            <DashboardLayout title={field.name} subtitle="Real-time IoT Insights">

                <Box bg="white" p={6} borderRadius="2xl" borderWidth="1px" borderColor="gray.200">
                    <Flex align="center" justify="space-between" mb={6}>
                        <Flex align="center" gap={4}>
                            <Flex bg="brand.50" p={4} borderRadius="xl">
                                <Sprout size={32} color="#059669" />
                            </Flex>
                            <Box>
                                <Flex align="center" gap={3}>
                                    <Text fontSize="2xl" fontWeight="bold">{field.name}</Text>
                                    <Flex
                                        px={3}
                                        py={1}
                                        borderRadius="full"
                                        fontSize="xs"
                                        fontWeight="bold"
                                        border="1px solid"
                                        align="center"
                                        gap={1.5}
                                        bg={statusConfig.bg}
                                        color={statusConfig.color}
                                        borderColor={statusConfig.border}
                                    >
                                        <Circle size={2} bg={statusConfig.dot} animation={statusConfig.pulse ? "pulse 2s infinite" : undefined} />
                                        {statusConfig.label}
                                    </Flex>
                                </Flex>
                                <Text color="gray.500">{t('field_details.area')}: {field.areaHa} {t('field_details.hectares')} • {t('field_details.soil')}: {field.soilType}</Text>
                            </Box>
                        </Flex>

                        <Flex gap={3}>
                            {field.deviceId ? (
                                <Button colorPalette="red" variant="outline" size="sm" onClick={() => setIsUnpairDialogOpen(true)}>
                                    {t('field_details.unpair_short', { id: field.deviceId })}
                                </Button>
                            ) : (
                                <Button colorPalette="brand" variant="solid" onClick={() => setIsPairDialogOpen(true)} loading={isPairing}>
                                    {t('field_details.pair_hardware')}
                                </Button>
                            )}
                            <IconButton
                                aria-label="Delete field"
                                colorPalette="red"
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsDeleteDialogOpen(true)}
                            >
                                <Trash2 size={20} />
                            </IconButton>
                        </Flex>
                    </Flex>

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
                </Box>
            </DashboardLayout>
        </>
    )
}
