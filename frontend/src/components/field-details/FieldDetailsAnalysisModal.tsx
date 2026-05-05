import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Box, Button, CloseButton, Dialog, Field as ChakraField, Flex, Input, Portal, Slider, Tabs, Text } from "@chakra-ui/react";
import { BrainCircuit } from "lucide-react";

const MonthSelect = ({ value, onChange, labels }: { value: number; onChange: (v: number) => void; labels: string[] }) => (
    <select
        value={value}
        onChange={e => onChange(Number(e.currentTarget.value))}
        style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #E2E8F0', background: 'white', fontSize: '14px', cursor: 'pointer' }}
    >
        {labels.map((name, idx) => <option key={idx + 1} value={idx + 1}>{name}</option>)}
    </select>
);

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
                    <input type="checkbox" checked={isChecked} onChange={e => onToggle(e.target.checked)} title={label} aria-label={label} style={{ width: 16, height: 16, accentColor: accentHex, cursor: 'pointer' }} />
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

interface FieldDetailsAnalysisModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    analysisError: string | null;
    activeScenario: 'range' | 'future' | 'whatif';
    setActiveScenario: (v: 'range' | 'future' | 'whatif') => void;
    rangeStart: string;
    setRangeStart: (v: string) => void;
    rangeEnd: string;
    setRangeEnd: (v: string) => void;
    maxDate: string;
    monthStart: number;
    setMonthStart: (v: number) => void;
    monthEnd: number;
    setMonthEnd: (v: number) => void;
    overrideTemp: number;
    setOverrideTemp: (v: number) => void;
    useOverrideTemp: boolean;
    setUseOverrideTemp: (v: boolean) => void;
    overrideHum: number;
    setOverrideHum: (v: number) => void;
    useOverrideHum: boolean;
    setUseOverrideHum: (v: boolean) => void;
    overrideRain: number;
    setOverrideRain: (v: number) => void;
    useOverrideRain: boolean;
    setUseOverrideRain: (v: boolean) => void;
    isAnalyzing: boolean;
    onRunAnalysis: () => void;
    onResetAnalysisError: () => void;
}

export function FieldDetailsAnalysisModal({
    open,
    onOpenChange,
    analysisError,
    activeScenario,
    setActiveScenario,
    rangeStart,
    setRangeStart,
    rangeEnd,
    setRangeEnd,
    maxDate,
    monthStart,
    setMonthStart,
    monthEnd,
    setMonthEnd,
    overrideTemp,
    setOverrideTemp,
    useOverrideTemp,
    setUseOverrideTemp,
    overrideHum,
    setOverrideHum,
    useOverrideHum,
    setUseOverrideHum,
    overrideRain,
    setOverrideRain,
    useOverrideRain,
    setUseOverrideRain,
    isAnalyzing,
    onRunAnalysis,
    onResetAnalysisError,
}: FieldDetailsAnalysisModalProps) {
    const { t, i18n } = useTranslation();
    const monthLabels = [
        t('field_details.ai.months.jan'), t('field_details.ai.months.feb'), t('field_details.ai.months.mar'),
        t('field_details.ai.months.apr'), t('field_details.ai.months.may'), t('field_details.ai.months.jun'),
        t('field_details.ai.months.jul'), t('field_details.ai.months.aug'), t('field_details.ai.months.sep'),
        t('field_details.ai.months.oct'), t('field_details.ai.months.nov'), t('field_details.ai.months.dec'),
    ];

    return (
        <Dialog.Root open={open} onOpenChange={e => onOpenChange(e.open)} placement="center" size="lg">
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
                        <Tabs.Root value={activeScenario} onValueChange={d => { setActiveScenario(d.value as 'range' | 'future' | 'whatif'); onResetAnalysisError(); }} variant="line">
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
                                        <ChakraField.Root flex={1}><ChakraField.Label>{t('field_details.ai.end_date')}</ChakraField.Label><Input type="date" lang={i18n.language === 'tr' ? 'tr-TR' : 'en-US'} value={rangeEnd} onChange={e => setRangeEnd(e.target.value)} min={rangeStart} max={maxDate} /></ChakraField.Root>
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
                                                min={0} max={2000} step={5}
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
                    <Dialog.Footer flexDirection={{ base: "column", sm: "row" }} gap={2}>
                        <Dialog.ActionTrigger asChild><Button w={{ base: "full", sm: "auto" }} variant="outline" onClick={() => onOpenChange(false)}>{t('field_details.cancel')}</Button></Dialog.ActionTrigger>
                        <Button w={{ base: "full", sm: "auto" }} colorPalette="brand" onClick={onRunAnalysis} loading={isAnalyzing} loadingText={t('field_details.ai.analyzing')}><BrainCircuit size={16} />{t('field_details.ai.analyze')}</Button>
                    </Dialog.Footer>
                    <Dialog.CloseTrigger asChild><CloseButton size="sm" /></Dialog.CloseTrigger>
                </Dialog.Content></Dialog.Positioner>
            </Portal>
        </Dialog.Root>
    );
}

