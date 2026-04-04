import { useState, useCallback } from 'react';
import { Box, Flex, Text, Input, Button, chakra, Slider } from '@chakra-ui/react';
import { MapPin, CheckCircle, ArrowRight, ArrowLeft, Map as MapIcon, Leaf, Ruler, Mountain, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { fieldsService } from '../../features/fields/fields.service';
import MapSelector from '../../components/map/MapSelector';

interface AddFieldWizardProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

interface FormData {
    name: string;
    areaHa: string;
    soilType: string;
    location: number[][] | null;
    nitrogen: string;
    phosphorus: string;
    potassium: string;
    ph: number;
    useDefaultPh: boolean;
}

const initialFormData: FormData = {
    name: '',
    areaHa: '',
    soilType: '',
    location: null,
    nitrogen: '',
    phosphorus: '',
    potassium: '',
    ph: 7,
    useDefaultPh: true,
};

export const AddFieldWizard = ({ isOpen, onClose, onSuccess }: AddFieldWizardProps) => {
    const { t } = useTranslation();
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState<FormData>(initialFormData);
    // Separate draft state for pH so slider drags don't re-render the whole form
    const [phDraft, setPhDraft] = useState<number>(initialFormData.ph);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const setField = useCallback(<K extends keyof FormData>(key: K, value: FormData[K]) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    }, []);

    const handleClose = () => {
        setStep(1);
        setFormData(initialFormData);
        setPhDraft(initialFormData.ph);
        setErrors({});
        onClose();
    };

    const handleSaveAndFinish = async () => {
        setIsLoading(true);
        try {
            const createRes = await fieldsService.createField({
                name: formData.name,
                location: formData.location || [[30.7133, 36.8969], [30.7143, 36.8969], [30.7143, 36.8979], [30.7133, 36.8979], [30.7133, 36.8969]],
                areaHa: parseFloat(formData.areaHa) || 0.0,
                soilType: formData.soilType || 'clay',
            });

            await fieldsService.updateFieldProperties(createRes.id, {
                name: formData.name,
                nitrogen: parseFloat(formData.nitrogen) || 52.6,
                phosphorus: parseFloat(formData.phosphorus) || 58.1,
                potassium: parseFloat(formData.potassium) || 52.0,
                ph: formData.useDefaultPh ? 6.44 : formData.ph,
            });

            onSuccess?.();
            handleClose();
        } catch (error) {
            console.error('Error creating field:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    // pH color computed from live phDraft so it updates during drag
    const phColor = phDraft < 4 ? '#ef4444' : phDraft < 6 ? '#f97316' : phDraft <= 8 ? '#22c55e' : phDraft <= 10 ? '#3b82f6' : '#7c3aed';

    const validateStep = (s: number): boolean => {
        const newErrors: Record<string, string> = {};
        if (s === 1) {
            if (!formData.name.trim()) newErrors.name = t('validation.required');
            else if (formData.name.length > 100) newErrors.name = t('validation.max_length_100');

            const area = parseFloat(formData.areaHa);
            if (!formData.areaHa || isNaN(area) || area <= 0) newErrors.areaHa = t('validation.area_positive');
            else if (area > 1000000) newErrors.areaHa = t('validation.area_too_large');

            if (!formData.soilType) newErrors.soilType = t('validation.required');

            if (!formData.location || formData.location.length < 4) newErrors.location = t('validation.location_required');
        }
        if (s === 2) {
            if (formData.nitrogen !== '' && parseFloat(formData.nitrogen) < 0) newErrors.nitrogen = t('validation.positive_only');
            if (formData.phosphorus !== '' && parseFloat(formData.phosphorus) < 0) newErrors.phosphorus = t('validation.positive_only');
            if (formData.potassium !== '' && parseFloat(formData.potassium) < 0) newErrors.potassium = t('validation.positive_only');
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    return (
        <>
            {/* Backdrop */}
            <Box
                position="fixed"
                inset={0}
                bg="blackAlpha.600"
                zIndex={50}
                onClick={handleClose}
                backdropFilter="blur(4px)"
            />

            {/* Modal */}
            <Flex
                position="fixed"
                inset={0}
                zIndex={51}
                align="center"
                justify="center"
                p={4}
                pointerEvents="none"
            >
                <Flex
                    direction="column"
                    bg="white"
                    w="full"
                    maxW="4xl"
                    borderRadius="3xl"
                    shadow="2xl"
                    border="1px solid"
                    borderColor="gray.100"
                    overflow="hidden"
                    pointerEvents="auto"
                    h="90vh"
                >
                    {/* HEADER */}
                    <Flex bg="neutral.dark" p={6} color="white" justify="space-between" align="center" flexShrink={0}>
                        <Box>
                            <Text fontSize="xl" fontWeight="bold" letterSpacing="wide">{t('add_field.title')}</Text>
                            <Text color="gray.400" fontSize="sm" mt={0.5}>{t('add_field.step_1_3', { step })}</Text>
                        </Box>
                        <Flex gap={2}>
                            {[1, 2, 3].map(s => (
                                <Box key={s} w={3} h={3} borderRadius="full" transition="background-color 0.3s" bg={step >= s ? 'brand.500' : 'gray.600'} />
                            ))}
                        </Flex>
                    </Flex>

                    {/* BODY — scrollable */}
                    <Flex p={8} flex={1} overflowY="auto" direction="column">
                        {/* ─── STEP 1 ─── */}
                        {step === 1 && (
                            <Flex direction="column" gap={6} flex={1}>
                                {/* Field Name */}
                                <Box>
                                    <Flex align="center" gap={1.5} mb={1}>
                                        <Leaf size={16} color="#059669" />
                                        <Text fontSize="sm" fontWeight="semibold" color="gray.700">{t('add_field.field_name')}</Text>
                                        <Text fontSize="xs" color="red.400" fontWeight="medium">*</Text>
                                    </Flex>
                                    <Input
                                        placeholder={t('add_field.field_name_ph')}
                                        maxLength={100}
                                        size="lg" bg="gray.50" borderRadius="xl"
                                        borderColor={errors.name ? 'red.400' : 'gray.200'}
                                        value={formData.name}
                                        onChange={(e) => {
                                            setField('name', e.target.value);
                                            if (errors.name && e.target.value.trim()) setErrors(prev => ({ ...prev, name: '' }));
                                        }}
                                    />
                                    {errors.name && (
                                        <Text fontSize="xs" color="red.500" mt={1} fontWeight="medium">
                                            ⚠ {errors.name}
                                        </Text>
                                    )}
                                </Box>

                                {/* Area + Soil Type */}
                                <Box display="grid" gridTemplateColumns="1fr 1fr" gap={4}>
                                    <Box>
                                        <Flex align="center" gap={1.5} mb={1}>
                                            <Ruler size={16} color="#3b82f6" />
                                            <Text fontSize="sm" fontWeight="semibold" color="gray.700">{t('add_field.area_ha')}</Text>
                                            <Text fontSize="xs" color="red.400" fontWeight="medium">*</Text>
                                        </Flex>
                                        <Input
                                            type="number" step="0.1" placeholder={t('add_field.area_ha_ph')}
                                            size="lg" bg="gray.50" borderRadius="xl"
                                            borderColor={errors.areaHa ? 'red.400' : 'gray.200'}
                                            value={formData.areaHa}
                                            onChange={(e) => {
                                                setField('areaHa', e.target.value);
                                                if (errors.areaHa && parseFloat(e.target.value) > 0) setErrors(prev => ({ ...prev, areaHa: '' }));
                                            }}
                                        />
                                        {errors.areaHa && <Text fontSize="xs" color="red.500" mt={1} fontWeight="medium">⚠ {errors.areaHa}</Text>}
                                    </Box>
                                    <Box>
                                        <Flex align="center" gap={1.5} mb={1}>
                                            <Mountain size={16} color="#d97706" />
                                            <Text fontSize="sm" fontWeight="semibold" color="gray.700">{t('add_field.soil_type')}</Text>
                                            <Text fontSize="xs" color="red.400" fontWeight="medium">*</Text>
                                        </Flex>
                                        <chakra.select
                                            p={3} h="48px" bg="gray.50" borderRadius="xl" border="1px solid"
                                            borderColor={errors.soilType ? 'red.400' : 'gray.200'} w="full"
                                            value={formData.soilType}
                                            onChange={(e) => {
                                                setField('soilType', e.target.value);
                                                if (errors.soilType && e.target.value) setErrors(prev => ({ ...prev, soilType: '' }));
                                            }}
                                        >
                                            <option value="">{t('add_field.soil_type_ph')}</option>
                                            <option value="clay">{t('add_field.clay')}</option>
                                            <option value="loam">{t('add_field.loam')}</option>
                                            <option value="sand">{t('add_field.sand')}</option>
                                            <option value="chalk">{t('add_field.chalk')}</option>
                                            <option value="peat">Peat</option>
                                        </chakra.select>
                                        {errors.soilType && <Text fontSize="xs" color="red.500" mt={1} fontWeight="medium">⚠ {errors.soilType}</Text>}
                                    </Box>
                                </Box>

                                {/* Map Selector */}
                                <Flex direction="column" flex={1} minH="240px">
                                    <Flex align="center" gap={1.5} mb={2}>
                                        <MapIcon size={16} color="#059669" />
                                        <Text fontSize="sm" fontWeight="semibold" color="gray.700">{t('add_field.draw_boundaries')}</Text>
                                        <Text fontSize="xs" color="red.400" fontWeight="medium">*</Text>
                                    </Flex>
                                    <Box flex={1} position="relative">
                                        <Box position="absolute" inset={0}>
                                            <MapSelector
                                                value={formData.location}
                                                mapHeight="100%"
                                                onChange={(coords) => {
                                                    setField('location', coords);
                                                    if (errors.location && coords && coords.length >= 4) setErrors(prev => ({ ...prev, location: '' }));
                                                }}
                                                onAreaCalculated={(ha) => {
                                                    const rounded = parseFloat(ha.toFixed(2));
                                                    setField('areaHa', String(rounded));
                                                    if (errors.areaHa && rounded > 0) setErrors(prev => ({ ...prev, areaHa: '' }));
                                                }}
                                            />
                                        </Box>
                                    </Box>
                                    {errors.location && <Text fontSize="xs" color="red.500" mt={1} fontWeight="medium">⚠ {errors.location}</Text>}
                                </Flex>
                            </Flex>
                        )}

                        {/* ─── STEP 2 ─── */}
                        {step === 2 && (
                            <Flex direction="column" gap={6}>
                                <Flex bg="blue.50" p={4} borderRadius="xl" gap={3} border="1px solid" borderColor="blue.100">
                                    <AlertCircle color="#3b82f6" size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
                                    <Text fontSize="sm" color="blue.800" lineHeight="tall">{t('add_field.lab_alert')}</Text>
                                </Flex>

                                <Box display="grid" gridTemplateColumns="1fr 1fr 1fr" gap={4} pt={2}>
                                    {/* Nitrogen */}
                                    <Box bg="gray.50" p={4} borderRadius="xl" border="1px solid" borderColor={errors.nitrogen ? 'red.400' : 'gray.200'}>
                                        <Text fontSize="xs" fontWeight="bold" color={errors.nitrogen ? 'red.400' : 'gray.400'} textTransform="uppercase" mb={1}>{t('add_field.nitrogen')}</Text>
                                        <Flex align="center" gap={2}>
                                            <Input
                                                type="number" step="0.1" min={0} placeholder={t('add_field.auto')} variant="flushed"
                                                fontSize="lg" fontWeight="bold" color="gray.700"
                                                value={formData.nitrogen}
                                                onChange={(e) => {
                                                    setField('nitrogen', e.target.value);
                                                    if (errors.nitrogen && parseFloat(e.target.value) >= 0) setErrors(prev => ({ ...prev, nitrogen: '' }));
                                                }}
                                            />
                                            <Text fontSize="xs" color="gray.400" fontWeight="medium">mg/L</Text>
                                        </Flex>
                                        {errors.nitrogen && <Text fontSize="xs" color="red.500" mt={1}>⚠ {errors.nitrogen}</Text>}
                                    </Box>

                                    {/* Phosphorus */}
                                    <Box bg="gray.50" p={4} borderRadius="xl" border="1px solid" borderColor={errors.phosphorus ? 'red.400' : 'gray.200'}>
                                        <Text fontSize="xs" fontWeight="bold" color={errors.phosphorus ? 'red.400' : 'gray.400'} textTransform="uppercase" mb={1}>{t('add_field.phosphorus')}</Text>
                                        <Flex align="center" gap={2}>
                                            <Input
                                                type="number" step="0.1" min={0} placeholder={t('add_field.auto')} variant="flushed"
                                                fontSize="lg" fontWeight="bold" color="gray.700"
                                                value={formData.phosphorus}
                                                onChange={(e) => {
                                                    setField('phosphorus', e.target.value);
                                                    if (errors.phosphorus && parseFloat(e.target.value) >= 0) setErrors(prev => ({ ...prev, phosphorus: '' }));
                                                }}
                                            />
                                            <Text fontSize="xs" color="gray.400" fontWeight="medium">mg/L</Text>
                                        </Flex>
                                        {errors.phosphorus && <Text fontSize="xs" color="red.500" mt={1}>⚠ {errors.phosphorus}</Text>}
                                    </Box>

                                    {/* Potassium */}
                                    <Box bg="gray.50" p={4} borderRadius="xl" border="1px solid" borderColor={errors.potassium ? 'red.400' : 'gray.200'}>
                                        <Text fontSize="xs" fontWeight="bold" color={errors.potassium ? 'red.400' : 'gray.400'} textTransform="uppercase" mb={1}>{t('add_field.potassium')}</Text>
                                        <Flex align="center" gap={2}>
                                            <Input
                                                type="number" step="0.1" min={0} placeholder={t('add_field.auto')} variant="flushed"
                                                fontSize="lg" fontWeight="bold" color="gray.700"
                                                value={formData.potassium}
                                                onChange={(e) => {
                                                    setField('potassium', e.target.value);
                                                    if (errors.potassium && parseFloat(e.target.value) >= 0) setErrors(prev => ({ ...prev, potassium: '' }));
                                                }}
                                            />
                                            <Text fontSize="xs" color="gray.400" fontWeight="medium">mg/L</Text>
                                        </Flex>
                                        {errors.potassium && <Text fontSize="xs" color="red.500" mt={1}>⚠ {errors.potassium}</Text>}
                                    </Box>
                                </Box>

                                {/* pH — Full width card with opt-in toggle */}
                                <Box bg="gray.50" p={4} borderRadius="xl" border="1px solid" borderColor={formData.useDefaultPh ? 'gray.200' : phColor} transition="border-color 0.2s">
                                    {/* Header row: label + default toggle */}
                                    <Flex justify="space-between" align="center" mb={formData.useDefaultPh ? 0 : 3}>
                                        <Text fontSize="xs" fontWeight="bold" color="gray.400" textTransform="uppercase">{t('add_field.ph_value')}</Text>
                                        {/* Selectable toggle */}
                                        <Flex
                                            as="button"
                                            align="center"
                                            gap={2}
                                            cursor="pointer"
                                            px={3} py={1.5}
                                            borderRadius="lg"
                                            border="1.5px solid"
                                            borderColor={formData.useDefaultPh ? 'brand.400' : 'gray.300'}
                                            bg={formData.useDefaultPh ? 'brand.50' : 'white'}
                                            transition="all 0.15s"
                                            onClick={() => setField('useDefaultPh', !formData.useDefaultPh)}
                                        >
                                            <Box
                                                w={3.5} h={3.5} borderRadius="sm"
                                                border="1.5px solid"
                                                borderColor={formData.useDefaultPh ? 'brand.500' : 'gray.400'}
                                                bg={formData.useDefaultPh ? 'brand.500' : 'white'}
                                                display="flex" alignItems="center" justifyContent="center"
                                            >
                                                {formData.useDefaultPh && <CheckCircle size={9} color="white" strokeWidth={3} />}
                                            </Box>
                                            <Text fontSize="xs" fontWeight="semibold" color={formData.useDefaultPh ? 'brand.600' : 'gray.500'}>
                                                {t('add_field.use_default_ph', { value: '6.44' })}
                                            </Text>
                                        </Flex>
                                    </Flex>

                                    {/* Collapsible slider — only shown when not using default */}
                                    {!formData.useDefaultPh && (
                                        <>
                                            <Flex justify="flex-end" align="center" gap={1.5} mb={3}>
                                                <Input
                                                    type="number"
                                                    min={0} max={14} step={0.001}
                                                    value={phDraft}
                                                    onChange={(e) => {
                                                        const raw = parseFloat(e.target.value);
                                                        if (isNaN(raw)) return;
                                                        const clamped = Math.min(14, Math.max(0, raw));
                                                        setPhDraft(clamped);
                                                        setField('ph', clamped);
                                                    }}
                                                    w="80px"
                                                    textAlign="right"
                                                    fontSize="xl"
                                                    fontWeight="bold"
                                                    color={phColor}
                                                    variant="flushed"
                                                    borderColor="gray.300"
                                                    p={0}
                                                />
                                                <Text fontSize="xs" color="gray.400" fontWeight="bold">pH</Text>
                                            </Flex>

                                            {/* Rainbow gradient track */}
                                            <Box position="relative" mb={2}>
                                                <Box
                                                    h="10px" borderRadius="full"
                                                    style={{ background: 'linear-gradient(to right, #e53e3e, #e8532a, #e06d1a, #d4960e, #c1ba0a, #7ec82a, #2db84b, #24a880, #1e92b8, #1a5fb0, #3a3fa8, #5a3692, #6b2d7c)' }}
                                                    mb={1}
                                                />
                                                <Slider.Root
                                                    min={0} max={14} step={0.001}
                                                    value={[phDraft]}
                                                    onValueChange={(e) => setPhDraft(e.value[0])}
                                                    onValueChangeEnd={(e) => setField('ph', e.value[0])}
                                                    style={{ position: 'absolute', top: 0, left: 0, right: 0 }}
                                                >
                                                    <Slider.Control>
                                                        <Slider.Track bg="transparent" h="10px" borderRadius="full">
                                                            <Slider.Range display="none" />
                                                        </Slider.Track>
                                                        <Slider.Thumb
                                                            index={0} w={5} h={5}
                                                            bg="white"
                                                            boxShadow="0 2px 8px rgba(0,0,0,0.35)"
                                                            border="2.5px solid" borderColor={phColor}
                                                            top="-3px"
                                                        />
                                                    </Slider.Control>
                                                </Slider.Root>
                                            </Box>

                                            {/* Scale labels */}
                                            <Flex justify="space-between" mt={3}>
                                                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map(n => (
                                                    <Text key={n} fontSize="9px" color={Math.abs(formData.ph - n) < 0.5 ? phColor : 'gray.400'} fontWeight={Math.abs(formData.ph - n) < 0.5 ? 'bold' : 'normal'}>
                                                        {n}
                                                    </Text>
                                                ))}
                                            </Flex>
                                            <Flex justify="space-between" mt={1} px={1}>
                                                <Text fontSize="xs" color="red.400" fontWeight="medium">← Acidic</Text>
                                                <Text fontSize="xs" color="green.500" fontWeight="medium">Neutral</Text>
                                                <Text fontSize="xs" color="blue.500" fontWeight="medium">Alkaline →</Text>
                                            </Flex>
                                        </>
                                    )}
                                </Box>
                            </Flex>
                        )}

                        {/* ─── STEP 3 ─── */}
                        {step === 3 && (
                            <Flex direction="column" align="center" gap={6}>
                                <Flex w={20} h={20} bg="brand.100" color="brand.600" borderRadius="full" align="center" justify="center" mx="auto" border="4px solid white" shadow="sm">
                                    <CheckCircle size={40} />
                                </Flex>
                                <Text fontSize="xl" fontWeight="bold" color="gray.800">{t('add_field.success_title')}</Text>
                                <Text color="gray.500" fontSize="sm" maxW="sm" textAlign="center">
                                    {t('add_field.success_desc', { name: formData.name || 'İsimsiz Tarla' })}
                                </Text>
                                <Flex direction="column" gap={3} bg="gray.50" p={5} borderRadius="xl" w="full" maxW="sm" border="1px solid" borderColor="gray.200" shadow="sm">
                                    <Flex justify="space-between" align="center" borderBottom="1px solid" borderColor="gray.200" pb={2}>
                                        <Text color="gray.500" fontSize="sm" fontWeight="medium">{t('add_field.field_name')}</Text>
                                        <Text color="gray.800" fontSize="sm" fontWeight="bold">{formData.name || '-'}</Text>
                                    </Flex>
                                    <Flex justify="space-between" align="center" borderBottom="1px solid" borderColor="gray.200" pb={2}>
                                        <Text color="gray.500" fontSize="sm" fontWeight="medium">{t('add_field.area_and_soil')}</Text>
                                        <Text color="gray.800" fontSize="sm" fontWeight="bold">{formData.areaHa ? `${formData.areaHa} Ha` : '-'} / {formData.soilType || '-'}</Text>
                                    </Flex>
                                    <Flex justify="space-between" align="center" borderBottom="1px solid" borderColor="gray.200" pb={2}>
                                        <Text color="gray.500" fontSize="sm" fontWeight="medium">{t('add_field.location')}</Text>
                                        <Flex align="center" gap={1} color="brand.600" fontSize="sm" fontWeight="bold"><MapPin size={14} /> {t('add_field.marked')}</Flex>
                                    </Flex>
                                    <Box pt={1}>
                                        <Text color="gray.500" fontSize="sm" fontWeight="medium" mb={2}>{t('add_field.macro_elements')}</Text>
                                        <Flex gap={2} flexWrap="wrap">
                                            <Text px={2} py={1} bg="white" border="1px solid" borderColor="gray.200" borderRadius="md" fontSize="xs" fontWeight="bold" color="gray.600">N: {formData.nitrogen || t('add_field.auto')}</Text>
                                            <Text px={2} py={1} bg="white" border="1px solid" borderColor="gray.200" borderRadius="md" fontSize="xs" fontWeight="bold" color="gray.600">P: {formData.phosphorus || t('add_field.auto')}</Text>
                                            <Text px={2} py={1} bg="white" border="1px solid" borderColor="gray.200" borderRadius="md" fontSize="xs" fontWeight="bold" color="gray.600">K: {formData.potassium || t('add_field.auto')}</Text>
                                            <Text px={2} py={1} bg="white" border="1px solid" borderColor="gray.200" borderRadius="md" fontSize="xs" fontWeight="bold" color="gray.600">pH: {formData.useDefaultPh ? t('add_field.auto') : formData.ph.toFixed(1)}</Text>
                                        </Flex>
                                    </Box>
                                </Flex>
                            </Flex>
                        )}
                    </Flex>

                    {/* FOOTER */}
                    <Flex p={6} borderTop="1px solid" borderColor="gray.100" justify="space-between" bg="gray.50" flexShrink={0}>
                        {step > 1 ? (
                            <Button
                                variant="ghost"
                                onClick={() => setStep(s => s - 1)}
                                display="flex" alignItems="center" gap={2} px={6} py={6} borderRadius="xl" color="gray.600" fontWeight="bold"
                            >
                                <ArrowLeft size={18} /> {t('add_field.back')}
                            </Button>
                        ) : (
                            <Button
                                variant="ghost"
                                onClick={handleClose}
                                px={6} py={6} borderRadius="xl" color="gray.500"
                            >
                                {t('add_field.back')}
                            </Button>
                        )}

                        {step < 3 ? (
                            <Button
                                onClick={() => { if (validateStep(step)) setStep(s => s + 1); }}
                                display="flex" alignItems="center" gap={2} px={8} py={3} borderRadius="xl" bg="accent.500" color="white" fontWeight="bold"
                                _hover={{ bg: 'accent.600' }} shadow="lg" transition="all 0.2s"
                            >
                                {t('add_field.next')} <ArrowRight size={18} />
                            </Button>
                        ) : (
                            <Button
                                onClick={handleSaveAndFinish}
                                loading={isLoading}
                                display="flex" alignItems="center" gap={2} px={8} py={3} borderRadius="xl" bg="brand.500" color="white" fontWeight="bold"
                                _hover={{ bg: 'brand.600' }} shadow="lg" transition="all 0.2s"
                            >
                                {t('add_field.save')} <CheckCircle size={18} />
                            </Button>
                        )}
                    </Flex>
                </Flex>
            </Flex>
        </>
    );
};
