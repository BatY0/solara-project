import React, { useState, useCallback } from 'react';
import {
    Modal,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    ActivityIndicator,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { CheckCircle, ArrowLeft, ArrowRight, AlertCircle, Leaf, Ruler, Mountain, MapPin, X } from 'lucide-react-native';
import { theme } from '../theme/theme';
import { fieldsService } from '../services/fieldsService';
import MapSelector from './MapSelector';

interface Props {
    visible: boolean;
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

const SOIL_TYPES = ['clay', 'loam', 'sand', 'chalk', 'peat'] as const;

const DEFAULT_PH = 6.44;

const initialFormData: FormData = {
    name: '',
    areaHa: '',
    soilType: '',
    location: null,
    nitrogen: '',
    phosphorus: '',
    potassium: '',
    ph: DEFAULT_PH,
    useDefaultPh: true,
};

function phColor(ph: number) {
    if (ph < 4) return '#ef4444';
    if (ph < 6) return '#f97316';
    if (ph <= 8) return '#22c55e';
    if (ph <= 10) return '#3b82f6';
    return '#7c3aed';
}

export default function AddFieldModal({ visible, onClose, onSuccess }: Props) {
    const { t } = useTranslation();
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState<FormData>(initialFormData);
    const [phInput, setPhInput] = useState(String(DEFAULT_PH));
    const [errors, setErrors] = useState<Record<string, string>>({});

    const setField = useCallback(<K extends keyof FormData>(key: K, value: FormData[K]) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    }, []);

    const handleClose = () => {
        setStep(1);
        setFormData(initialFormData);
        setPhInput(String(DEFAULT_PH));
        setErrors({});
        onClose();
    };

    const getLocationForApi = (): number[][] => {
        if (formData.location && formData.location.length >= 4) return formData.location;
        // Default: Turkey region (closed polygon [[lng, lat], ...])
        return [
            [30.7133, 36.8969], [30.7143, 36.8969], [30.7143, 36.8979],
            [30.7133, 36.8979], [30.7133, 36.8969],
        ];
    };

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

    const handleSave = async () => {
        setIsLoading(true);
        try {
            const created = await fieldsService.createField({
                name: formData.name,
                location: getLocationForApi(),
                areaHa: parseFloat(formData.areaHa) || 0,
                soilType: formData.soilType || 'clay',
            });
            await fieldsService.updateFieldProperties(created.id, {
                name: formData.name,
                nitrogen: formData.nitrogen ? parseFloat(formData.nitrogen) : null,
                phosphorus: formData.phosphorus ? parseFloat(formData.phosphorus) : null,
                potassium: formData.potassium ? parseFloat(formData.potassium) : null,
                ph: formData.useDefaultPh ? null : formData.ph,
            });
            onSuccess?.();
            setStep(3);
        } catch (error) {
            console.error('Error creating field:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const currentPhColor = phColor(formData.ph);

    const soilTypeKey = (s: string) => {
        const map: Record<string, string> = {
            clay: t('add_field.clay'),
            loam: t('add_field.loam'),
            sand: t('add_field.sand'),
            chalk: t('add_field.chalk'),
            peat: t('add_field.peat'),
        };
        return map[s] ?? s;
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
            <SafeAreaView style={styles.container}>
                {/* HEADER */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.headerTitle}>{t('add_field.title')}</Text>
                        <Text style={styles.headerSub}>{t('add_field.step', { step })}</Text>
                    </View>
                    <View style={styles.dotsRow}>
                        {[1, 2, 3].map(s => (
                            <View key={s} style={[styles.dot, step >= s ? styles.dotActive : styles.dotInactive]} />
                        ))}
                        <TouchableOpacity onPress={handleClose} style={{ marginLeft: 12 }}>
                            <X color="rgba(255,255,255,0.7)" size={22} />
                        </TouchableOpacity>
                    </View>
                </View>

                <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">

                    {/* ─── STEP 1 ─── */}
                    {step === 1 && (
                        <View style={styles.stepContent}>
                            {/* Field Name */}
                            <View style={styles.fieldGroup}>
                                <View style={styles.labelRow}>
                                    <Leaf color="#059669" size={15} />
                                    <Text style={styles.label}>{t('add_field.field_name')}</Text>
                                    <Text style={styles.required}>*</Text>
                                </View>
                                <TextInput
                                    style={[styles.input, errors.name ? styles.inputError : null]}
                                    placeholder={t('add_field.field_name_ph')}
                                    placeholderTextColor={theme.colors.neutral.subtext}
                                    maxLength={100}
                                    value={formData.name}
                                    onChangeText={v => {
                                        setField('name', v);
                                        if (errors.name && v.trim()) setErrors(p => ({ ...p, name: '' }));
                                    }}
                                />
                                {errors.name ? <Text style={styles.errorText}>⚠ {errors.name}</Text> : null}
                            </View>

                            {/* Area + Soil Type */}
                            <View style={styles.twoCol}>
                                <View style={[styles.fieldGroup, { flex: 1 }]}>
                                    <View style={styles.labelRow}>
                                        <Ruler color="#3b82f6" size={15} />
                                        <Text style={styles.label}>{t('add_field.area_ha')}</Text>
                                        <Text style={styles.required}>*</Text>
                                    </View>
                                    <TextInput
                                        style={[styles.input, errors.areaHa ? styles.inputError : null]}
                                        placeholder={t('add_field.area_ha_ph')}
                                        placeholderTextColor={theme.colors.neutral.subtext}
                                        keyboardType="decimal-pad"
                                        value={formData.areaHa}
                                        onChangeText={v => {
                                            setField('areaHa', v);
                                            if (errors.areaHa && parseFloat(v) > 0) setErrors(p => ({ ...p, areaHa: '' }));
                                        }}
                                    />
                                    {errors.areaHa ? <Text style={styles.errorText}>⚠ {errors.areaHa}</Text> : null}
                                </View>

                                <View style={[styles.fieldGroup, { flex: 1 }]}>
                                    <View style={styles.labelRow}>
                                        <Mountain color="#d97706" size={15} />
                                        <Text style={styles.label}>{t('add_field.soil_type')}</Text>
                                        <Text style={styles.required}>*</Text>
                                    </View>
                                    <View style={[styles.pickerContainer, errors.soilType ? styles.inputError : null]}>
                                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                                            {SOIL_TYPES.map(st => (
                                                <TouchableOpacity
                                                    key={st}
                                                    style={[styles.soilChip, formData.soilType === st && styles.soilChipActive]}
                                                    onPress={() => {
                                                        setField('soilType', st);
                                                        if (errors.soilType) setErrors(p => ({ ...p, soilType: '' }));
                                                    }}
                                                >
                                                    <Text style={[styles.soilChipText, formData.soilType === st && styles.soilChipTextActive]}>
                                                        {soilTypeKey(st)}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>
                                    </View>
                                    {errors.soilType ? <Text style={styles.errorText}>⚠ {errors.soilType}</Text> : null}
                                </View>
                            </View>

                            {/* Location — polygon on map */}
                            <View style={styles.fieldGroup}>
                                <View style={styles.labelRow}>
                                    <MapPin color="#059669" size={15} />
                                    <Text style={styles.label}>{t('map.draw_boundaries')}</Text>
                                    <Text style={styles.required}>*</Text>
                                </View>
                                <Text style={styles.hintText}>{t('map.map_hint')}</Text>
                                <MapSelector
                                    value={formData.location}
                                    onChange={(coords) => {
                                        setField('location', coords);
                                        if (errors.location && coords && coords.length >= 4) setErrors(p => ({ ...p, location: '' }));
                                    }}
                                    onAreaCalculated={(ha) => {
                                        const rounded = Math.round(ha * 100) / 100;
                                        setField('areaHa', String(rounded));
                                        if (errors.areaHa && rounded > 0) setErrors(p => ({ ...p, areaHa: '' }));
                                    }}
                                />
                                {errors.location ? <Text style={styles.errorText}>⚠ {errors.location}</Text> : null}
                            </View>
                        </View>
                    )}

                    {/* ─── STEP 2 ─── */}
                    {step === 2 && (
                        <View style={styles.stepContent}>
                            {/* Lab Alert */}
                            <View style={styles.alertBox}>
                                <AlertCircle color="#3b82f6" size={18} style={{ flexShrink: 0, marginTop: 1 }} />
                                <Text style={styles.alertText}>{t('add_field.lab_alert')}</Text>
                            </View>

                            {/* NPK Grid */}
                            <View style={styles.npkGrid}>
                                {(['nitrogen', 'phosphorus', 'potassium'] as const).map(key => (
                                    <View key={key} style={[styles.npkCard, errors[key] ? { borderColor: '#ef4444' } : null]}>
                                        <Text style={styles.npkLabel}>
                                            {t(`add_field.${key}`)}
                                        </Text>
                                        <TextInput
                                            style={styles.npkInput}
                                            placeholder={t('add_field.auto')}
                                            placeholderTextColor={theme.colors.neutral.subtext}
                                            keyboardType="decimal-pad"
                                            value={formData[key]}
                                            onChangeText={v => {
                                                setField(key, v);
                                                if (errors[key] && parseFloat(v) >= 0) setErrors(p => ({ ...p, [key]: '' }));
                                            }}
                                        />
                                        <Text style={styles.npkUnit}>mg/kg</Text>
                                        {errors[key] ? <Text style={styles.errorText}>⚠ {errors[key]}</Text> : null}
                                    </View>
                                ))}
                            </View>

                            {/* pH */}
                            <View style={[styles.phCard, { borderColor: formData.useDefaultPh ? theme.colors.neutral.border : currentPhColor }]}>
                                <View style={styles.phHeader}>
                                    <Text style={styles.npkLabel}>{t('add_field.ph_value')}</Text>
                                    <TouchableOpacity
                                        style={[styles.defaultToggle, formData.useDefaultPh && styles.defaultToggleActive]}
                                        onPress={() => setField('useDefaultPh', !formData.useDefaultPh)}
                                    >
                                        <View style={[styles.checkbox, formData.useDefaultPh && styles.checkboxActive]}>
                                            {formData.useDefaultPh && <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>✓</Text>}
                                        </View>
                                        <Text style={[styles.defaultToggleText, formData.useDefaultPh && { color: theme.colors.brand[500] }]}>
                                            {t('add_field.use_default_ph', { value: DEFAULT_PH.toFixed(2) })}
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                {!formData.useDefaultPh && (
                                    <View style={{ marginTop: 12 }}>
                                        <View style={styles.phInputRow}>
                                            <TextInput
                                                style={[styles.phValueInput, { color: currentPhColor, borderBottomColor: currentPhColor }]}
                                                keyboardType="decimal-pad"
                                                value={phInput}
                                                onChangeText={v => {
                                                    setPhInput(v);
                                                    const num = parseFloat(v);
                                                    if (!isNaN(num)) {
                                                        const clamped = Math.min(14, Math.max(0, num));
                                                        setField('ph', clamped);
                                                    }
                                                }}
                                            />
                                            <Text style={styles.phUnit}>pH</Text>
                                        </View>

                                        {/* Rainbow bar */}
                                        <View style={styles.rainbowBar} />

                                        {/* Slider replacement: +/- buttons and number taps */}
                                        <View style={styles.phSliderRow}>
                                            {[0, 2, 4, 6, 7, 8, 10, 12, 14].map(n => (
                                                <TouchableOpacity key={n} onPress={() => { setField('ph', n); setPhInput(String(n)); }}>
                                                    <Text style={[styles.phTick, { color: Math.abs(formData.ph - n) < 0.5 ? currentPhColor : '#94a3b8' }]}>{n}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>

                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                                            <Text style={{ fontSize: 11, color: '#ef4444' }}>{t('add_field.acidic')}</Text>
                                            <Text style={{ fontSize: 11, color: '#22c55e' }}>{t('add_field.neutral')}</Text>
                                            <Text style={{ fontSize: 11, color: '#3b82f6' }}>{t('add_field.alkaline')}</Text>
                                        </View>
                                    </View>
                                )}
                            </View>
                        </View>
                    )}

                    {/* ─── STEP 3 ─── */}
                    {step === 3 && (
                        <View style={[styles.stepContent, { alignItems: 'center' }]}>
                            <View style={styles.successIcon}>
                                <CheckCircle color={theme.colors.brand[500]} size={44} />
                            </View>
                            <Text style={styles.successTitle}>{t('add_field.success_title')}</Text>
                            <Text style={styles.successDesc}>{t('add_field.success_desc', { name: formData.name || '—' })}</Text>

                            <View style={styles.summaryCard}>
                                <SummaryRow label={t('add_field.field_name')} value={formData.name || '—'} />
                                <SummaryRow label={t('add_field.area_and_soil')} value={`${formData.areaHa} ha / ${formData.soilType || '—'}`} />
                                <View style={styles.summaryRow}>
                                    <Text style={styles.summaryLabel}>{t('add_field.macro_elements')}</Text>
                                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                                        {[
                                            { label: 'N', val: formData.nitrogen },
                                            { label: 'P', val: formData.phosphorus },
                                            { label: 'K', val: formData.potassium },
                                            { label: 'pH', val: formData.useDefaultPh ? `${DEFAULT_PH} (${t('add_field.auto').toLowerCase()})` : formData.ph.toFixed(1) },
                                        ].map(item => (
                                            <View key={item.label} style={styles.npkBadge}>
                                                <Text style={styles.npkBadgeText}>{item.label}: {item.val || t('add_field.auto')}</Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            </View>
                        </View>
                    )}
                </ScrollView>

                {/* FOOTER */}
                <View style={styles.footer}>
                    {step > 1 && step < 3 ? (
                        <TouchableOpacity style={styles.backBtn} onPress={() => setStep(s => s - 1)}>
                            <ArrowLeft color={theme.colors.neutral.text} size={18} />
                            <Text style={styles.backBtnText}>{t('add_field.back')}</Text>
                        </TouchableOpacity>
                    ) : step === 1 ? (
                        <TouchableOpacity style={styles.backBtn} onPress={handleClose}>
                            <Text style={styles.backBtnText}>{t('add_field.cancel')}</Text>
                        </TouchableOpacity>
                    ) : (
                        <View />
                    )}

                    {step < 2 ? (
                        <TouchableOpacity
                            style={styles.nextBtn}
                            onPress={() => { if (validateStep(step)) setStep(s => s + 1); }}
                        >
                            <Text style={styles.nextBtnText}>{t('add_field.next')}</Text>
                            <ArrowRight color="#fff" size={18} />
                        </TouchableOpacity>
                    ) : step === 2 ? (
                        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={isLoading}>
                            {isLoading
                                ? <ActivityIndicator color="#fff" />
                                : <>
                                    <Text style={styles.nextBtnText}>{t('add_field.save')}</Text>
                                    <CheckCircle color="#fff" size={18} />
                                </>
                            }
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity style={styles.saveBtn} onPress={handleClose}>
                            <Text style={styles.nextBtnText}>{t('common.confirm')}</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </SafeAreaView>
        </Modal>
    );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
    return (
        <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{label}</Text>
            <Text style={styles.summaryValue}>{value}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: {
        backgroundColor: theme.colors.neutral.dark, paddingHorizontal: 20, paddingVertical: 18,
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    },
    headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    headerSub: { color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 2 },
    dotsRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
    dot: { width: 10, height: 10, borderRadius: 5 },
    dotActive: { backgroundColor: theme.colors.brand[500] },
    dotInactive: { backgroundColor: 'rgba(255,255,255,0.25)' },
    stepContent: { gap: 16 },
    fieldGroup: { gap: 6 },
    labelRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    label: { fontSize: 13, fontWeight: '600', color: '#374151' },
    required: { color: '#f87171', fontSize: 12, fontWeight: '600' },
    input: {
        backgroundColor: '#F9FAFB', borderRadius: 12, borderWidth: 1,
        borderColor: '#E5E7EB', paddingHorizontal: 14, paddingVertical: 12,
        fontSize: 15, color: theme.colors.neutral.dark,
    },
    inputError: { borderColor: '#ef4444' },
    errorText: { fontSize: 12, color: '#ef4444', marginTop: 2 },
    hintText: { fontSize: 12, color: theme.colors.neutral.subtext, marginBottom: 4 },
    twoCol: { flexDirection: 'row', gap: 10 },
    pickerContainer: {
        backgroundColor: '#F9FAFB', borderRadius: 12, borderWidth: 1,
        borderColor: '#E5E7EB', paddingVertical: 10, paddingHorizontal: 8, minHeight: 46,
    },
    soilChip: {
        paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
        backgroundColor: '#E5E7EB', borderWidth: 1, borderColor: 'transparent',
    },
    soilChipActive: { backgroundColor: theme.colors.brand[50], borderColor: theme.colors.brand[500] },
    soilChipText: { fontSize: 12, color: '#374151', fontWeight: '500' },
    soilChipTextActive: { color: theme.colors.brand[500], fontWeight: '700' },
    alertBox: {
        backgroundColor: '#EFF6FF', borderRadius: 12, padding: 12, flexDirection: 'row',
        gap: 10, borderWidth: 1, borderColor: '#BFDBFE', alignItems: 'flex-start',
    },
    alertText: { fontSize: 13, color: '#1E40AF', flex: 1, lineHeight: 19 },
    npkGrid: { flexDirection: 'row', gap: 10 },
    npkCard: {
        flex: 1, backgroundColor: '#F9FAFB', borderRadius: 14, padding: 12,
        borderWidth: 1, borderColor: '#E5E7EB',
    },
    npkLabel: { fontSize: 11, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 6 },
    npkInput: { fontSize: 16, fontWeight: 'bold', color: '#374151', borderBottomWidth: 1, borderBottomColor: '#D1D5DB', paddingBottom: 4 },
    npkUnit: { fontSize: 10, color: '#9CA3AF', fontWeight: '600', marginTop: 4 },
    phCard: {
        backgroundColor: '#F9FAFB', borderRadius: 14, padding: 14, borderWidth: 1.5,
        borderColor: '#E5E7EB',
    },
    phHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    defaultToggle: {
        flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6,
        borderRadius: 10, borderWidth: 1.5, borderColor: '#D1D5DB', backgroundColor: '#fff',
    },
    defaultToggleActive: { borderColor: theme.colors.brand[500], backgroundColor: theme.colors.brand[50] },
    checkbox: {
        width: 16, height: 16, borderRadius: 4, borderWidth: 1.5, borderColor: '#D1D5DB',
        backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    },
    checkboxActive: { backgroundColor: theme.colors.brand[500], borderColor: theme.colors.brand[500] },
    defaultToggleText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
    phInputRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'flex-end', gap: 4, marginBottom: 10 },
    phValueInput: { fontSize: 28, fontWeight: 'bold', borderBottomWidth: 2, paddingBottom: 2, minWidth: 60, textAlign: 'right' },
    phUnit: { fontSize: 13, color: '#9CA3AF', fontWeight: '700', marginBottom: 4 },
    rainbowBar: {
        height: 10, borderRadius: 10, marginBottom: 8,
        backgroundColor: 'transparent',
        // Rainbow approximation
        borderWidth: 0,
    },
    phSliderRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    phTick: { fontSize: 12, fontWeight: '600' },
    successIcon: {
        width: 80, height: 80, borderRadius: 40, backgroundColor: theme.colors.brand[50],
        alignItems: 'center', justifyContent: 'center', marginBottom: 12,
        borderWidth: 4, borderColor: '#fff', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
    },
    successTitle: { fontSize: 20, fontWeight: 'bold', color: theme.colors.neutral.dark, marginBottom: 6 },
    successDesc: { fontSize: 14, color: theme.colors.neutral.subtext, textAlign: 'center', marginBottom: 20 },
    summaryCard: {
        backgroundColor: '#F9FAFB', borderRadius: 16, padding: 16, width: '100%',
        borderWidth: 1, borderColor: '#E5E7EB', gap: 10,
    },
    summaryRow: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingBottom: 8 },
    summaryLabel: { fontSize: 12, color: '#9CA3AF', fontWeight: '500' },
    summaryValue: { fontSize: 13, fontWeight: '700', color: theme.colors.neutral.dark, marginTop: 2 },
    npkBadge: { paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8 },
    npkBadgeText: { fontSize: 11, fontWeight: '700', color: '#6B7280' },
    footer: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        padding: 16, borderTopWidth: 1, borderTopColor: '#F3F4F6', backgroundColor: '#FAFBFB',
    },
    backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 12, borderRadius: 12 },
    backBtnText: { fontSize: 14, fontWeight: '600', color: theme.colors.neutral.text },
    nextBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 22, paddingVertical: 12,
        backgroundColor: theme.colors.accent[500], borderRadius: 14,
        shadowColor: theme.colors.accent[600], shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
    },
    saveBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 22, paddingVertical: 12,
        backgroundColor: theme.colors.brand[500], borderRadius: 14,
        shadowColor: theme.colors.brand[900], shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
    },
    nextBtnText: { fontSize: 14, fontWeight: 'bold', color: '#fff' },
});
