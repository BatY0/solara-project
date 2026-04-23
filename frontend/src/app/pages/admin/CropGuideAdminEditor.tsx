import { useEffect, useMemo, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Alert, Box, Button, Flex, Grid, Input, Tabs, Text, Textarea } from "@chakra-ui/react";
import { ArrowLeft, Plus, Save, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { DashboardLayout } from "../../../components/layout/DashboardLayout";
import { cropGuideAdminService } from "../../../features/crop-guides/admin.service";
import type {
    CropGuideAdminRequest,
    CropGuideAdminResponse,
    CropGuideTranslationAdmin,
} from "../../../features/crop-guides/adminTypes";

const defaultTranslation = (languageCode: "en" | "tr"): CropGuideTranslationAdmin => ({
    languageCode,
    description: "",
    commonVarieties: "",
    uses: "",
    soilPreparationSteps: "",
    plantingMethod: "",
    plantingTiming: "",
    irrigation: "",
    fertilization: "",
    weedControl: "",
    supportPruning: "",
    commonPests: "",
    commonDiseases: "",
    managementStrategies: "",
    signsOfReadiness: "",
    harvestingMethod: "",
    curing: "",
    storageConditions: "",
    shelfLife: "",
});

const emptyPayload = (): CropGuideAdminRequest => ({
    name: "",
    daysToMaturity: 0,
    translations: [defaultTranslation("en"), defaultTranslation("tr")],
    pestDiseases: [],
    postHarvestProfiles: [],
});

// ── Min/Max pair validation helper ───────────────────────────────────────────
type MinMaxError = { minError?: string; maxError?: string } | null;
function validateMinMax(min?: number, max?: number, tMsg?: string): MinMaxError {
    if (min !== undefined && max !== undefined) {
        if (max < min) return { minError: tMsg, maxError: tMsg };
    }
    return null;
}

export const CropGuideAdminEditor = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEdit = Boolean(id);

    const [form, setForm] = useState<CropGuideAdminRequest>(emptyPayload());
    const [isLoading, setIsLoading] = useState(isEdit);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!id) return;
        let mounted = true;
        const load = async () => {
            setIsLoading(true);
            try {
                const data = await cropGuideAdminService.getById(id);
                if (!mounted) return;
                setForm(fromApi(data));
            } catch (err) {
                console.error("Failed to load admin crop guide", err);
            } finally {
                if (mounted) setIsLoading(false);
            }
        };
        load();
        return () => { mounted = false; };
    }, [id]);

    const trMap = useMemo(() => {
        const map = new Map<string, CropGuideTranslationAdmin>();
        form.translations.forEach((tr) => map.set(tr.languageCode, tr));
        return map;
    }, [form.translations]);

    const setField = <K extends keyof CropGuideAdminRequest>(key: K, value: CropGuideAdminRequest[K]) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const setTranslation = (lang: "en" | "tr", key: keyof CropGuideTranslationAdmin, value: string) => {
        setForm((prev) => ({
            ...prev,
            translations: upsertLangTranslation(prev.translations, lang, key, value),
        }));
    };

    const addPestDisease = () => {
        setForm((prev) => ({
            ...prev,
            pestDiseases: [
                ...prev.pestDiseases,
                {
                    languageCode: "en",
                    itemType: "PEST",
                    name: "",
                    severity: "",
                    prevention: "",
                    organicTreatment: "",
                    chemicalTreatment: "",
                    notes: "",
                },
            ],
        }));
    };

    const addPostHarvest = () => {
        setForm((prev) => ({
            ...prev,
            postHarvestProfiles: [
                ...prev.postHarvestProfiles,
                {
                    languageCode: "en",
                    climateBand: "",
                    curing: "",
                    storageTemperatureMin: undefined,
                    storageTemperatureMax: undefined,
                    storageHumidityMin: undefined,
                    storageHumidityMax: undefined,
                    shelfLifeDays: undefined,
                    storageNotes: "",
                },
            ],
        }));
    };

    // ── Validation state ─────────────────────────────────────────────────────
    const tempValidationMsg = t("admin_crop_guides.validation.max_gte_min");
    const optTempErrors = validateMinMax(form.optimalTemperatureMin, form.optimalTemperatureMax, tempValidationMsg);
    const germTempErrors = validateMinMax(form.germinationTempMin, form.germinationTempMax, tempValidationMsg);
    const growTempErrors = validateMinMax(form.growthTempMin, form.growthTempMax, tempValidationMsg);
    const fruitTempErrors = validateMinMax(form.fruitingTempMin, form.fruitingTempMax, tempValidationMsg);
    const phErrors = validateMinMax(form.phMin, form.phMax, tempValidationMsg);

    const hasValidationErrors = !!(optTempErrors || germTempErrors || growTempErrors || fruitTempErrors || phErrors);

    const onSave = async () => {
        if (hasValidationErrors) return;
        setIsSaving(true);
        try {
            if (isEdit && id) {
                await cropGuideAdminService.update(id, form);
            } else {
                await cropGuideAdminService.create(form);
            }
            navigate("/admin/crop-guides");
        } catch (err) {
            console.error("Failed to save crop guide", err);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <DashboardLayout title={t("admin_crop_guides.editor_title")} subtitle={t("admin_crop_guides.loading")}>
                <Text>{t("admin_crop_guides.loading")}</Text>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout
            title={isEdit ? t("admin_crop_guides.edit_title") : t("admin_crop_guides.new_title")}
            subtitle={t("admin_crop_guides.editor_subtitle")}
        >
            <Flex direction="column" gap={6}>
                <Button variant="ghost" alignSelf="flex-start" onClick={() => navigate("/admin/crop-guides")}>
                    <ArrowLeft size={14} />
                    {t("admin_crop_guides.back")}
                </Button>

                {/* ── Core Information ─────────────────────────────────────── */}
                <Box bg="white" border="1px solid" borderColor="neutral.border" borderRadius="xl" p={5}>
                    <Text fontWeight="bold" mb={1}>{t("admin_crop_guides.core_title")}</Text>
                    <Text fontSize="sm" color="gray.600" mb={3}>{t("admin_crop_guides.core_desc")}</Text>
                    <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={3}>
                        <Input placeholder={t("admin_crop_guides.fields.name")} value={form.name} onChange={(e) => setField("name", e.target.value)} />
                        <Input placeholder={t("admin_crop_guides.fields.scientific_name")} value={form.scientificName ?? ""} onChange={(e) => setField("scientificName", e.target.value)} />
                        <Input placeholder={t("admin_crop_guides.fields.family")} value={form.family ?? ""} onChange={(e) => setField("family", e.target.value)} />
                        <Input placeholder={t("admin_crop_guides.fields.growth_habit")} value={form.growthHabit ?? ""} onChange={(e) => setField("growthHabit", e.target.value)} />
                        <Input placeholder={t("admin_crop_guides.fields.lifespan")} value={form.lifespan ?? ""} onChange={(e) => setField("lifespan", e.target.value)} />
                        <Input placeholder={t("admin_crop_guides.fields.soil_type")} value={form.soilType ?? ""} onChange={(e) => setField("soilType", e.target.value)} />
                        <Input placeholder={t("admin_crop_guides.fields.expected_yield")} value={form.expectedYield ?? ""} onChange={(e) => setField("expectedYield", e.target.value)} />
                        <Input
                            placeholder={t("admin_crop_guides.fields.days_to_maturity")}
                            type="number"
                            value={form.daysToMaturity}
                            onChange={(e) => setField("daysToMaturity", Number(e.target.value || 0))}
                        />
                        <Input placeholder={t("admin_crop_guides.fields.image_url")} value={form.image ?? ""} onChange={(e) => setField("image", e.target.value)} />
                    </Grid>
                </Box>

                {/* ── Climate & Environment ────────────────────────────────── */}
                <Box bg="white" border="1px solid" borderColor="neutral.border" borderRadius="xl" p={5}>
                    <Text fontWeight="bold" mb={1}>{t("admin_crop_guides.climate_title")}</Text>
                    <Text fontSize="sm" color="gray.600" mb={3}>{t("admin_crop_guides.climate_desc")}</Text>
                    <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={3}>
                        <Input placeholder={t("admin_crop_guides.climate_fields.climate_hardiness")} value={form.climateHardiness ?? ""} onChange={(e) => setField("climateHardiness", e.target.value)} />
                        <Input placeholder={t("admin_crop_guides.climate_fields.frost_tolerance")} value={form.frostTolerance ?? ""} onChange={(e) => setField("frostTolerance", e.target.value)} />
                        <Input placeholder={t("admin_crop_guides.climate_fields.sunlight_hours")} type="number" value={form.sunlightHours ?? ""} onChange={(e) => setField("sunlightHours", NumberOrUndef(e.target.value))} />
                        <Input placeholder={t("admin_crop_guides.climate_fields.water_weekly_mm")} type="number" value={form.waterWeeklyMm ?? ""} onChange={(e) => setField("waterWeeklyMm", NumberOrUndef(e.target.value))} />
                        <Input placeholder={t("admin_crop_guides.climate_fields.drought_tolerance")} value={form.droughtTolerance ?? ""} onChange={(e) => setField("droughtTolerance", e.target.value)} />
                        <Input placeholder={t("admin_crop_guides.climate_fields.waterlogging_sensitivity")} value={form.waterloggingSensitivity ?? ""} onChange={(e) => setField("waterloggingSensitivity", e.target.value)} />
                    </Grid>
                </Box>

                {/* ── Temperature Requirements ─────────────────────────────── */}
                <Box bg="white" border="1px solid" borderColor="neutral.border" borderRadius="xl" p={5}>
                    <Text fontWeight="bold" mb={1}>{t("admin_crop_guides.temperature_title")}</Text>
                    <Text fontSize="sm" color="gray.600" mb={3}>{t("admin_crop_guides.temperature_desc")}</Text>
                    {hasValidationErrors && (
                        <Alert.Root status="error" mb={3} borderRadius="md">
                            <Alert.Indicator />
                            <Alert.Title>{t("admin_crop_guides.validation.max_gte_min")}</Alert.Title>
                        </Alert.Root>
                    )}
                    <Flex direction="column" gap={4}>
                        {/* Optimal */}
                        <Box>
                            <Text fontSize="sm" fontWeight="semibold" color="gray.700" mb={2}>Optimal</Text>
                            <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={3}>
                                <Box>
                                    <Input placeholder={t("admin_crop_guides.temp_fields.optimal_min")} type="number" value={form.optimalTemperatureMin ?? ""} onChange={(e) => setField("optimalTemperatureMin", NumberOrUndef(e.target.value))} borderColor={optTempErrors?.minError ? "red.400" : undefined} />
                                    {optTempErrors?.minError && <Text fontSize="xs" color="red.500" mt={1}>{optTempErrors.minError}</Text>}
                                </Box>
                                <Box>
                                    <Input placeholder={t("admin_crop_guides.temp_fields.optimal_max")} type="number" value={form.optimalTemperatureMax ?? ""} onChange={(e) => setField("optimalTemperatureMax", NumberOrUndef(e.target.value))} borderColor={optTempErrors?.maxError ? "red.400" : undefined} />
                                    {optTempErrors?.maxError && <Text fontSize="xs" color="red.500" mt={1}>{optTempErrors.maxError}</Text>}
                                </Box>
                            </Grid>
                        </Box>
                        {/* Germination */}
                        <Box>
                            <Text fontSize="sm" fontWeight="semibold" color="gray.700" mb={2}>Germination</Text>
                            <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={3}>
                                <Box>
                                    <Input placeholder={t("admin_crop_guides.temp_fields.germination_min")} type="number" value={form.germinationTempMin ?? ""} onChange={(e) => setField("germinationTempMin", NumberOrUndef(e.target.value))} borderColor={germTempErrors?.minError ? "red.400" : undefined} />
                                    {germTempErrors?.minError && <Text fontSize="xs" color="red.500" mt={1}>{germTempErrors.minError}</Text>}
                                </Box>
                                <Box>
                                    <Input placeholder={t("admin_crop_guides.temp_fields.germination_max")} type="number" value={form.germinationTempMax ?? ""} onChange={(e) => setField("germinationTempMax", NumberOrUndef(e.target.value))} borderColor={germTempErrors?.maxError ? "red.400" : undefined} />
                                    {germTempErrors?.maxError && <Text fontSize="xs" color="red.500" mt={1}>{germTempErrors.maxError}</Text>}
                                </Box>
                            </Grid>
                        </Box>
                        {/* Growth */}
                        <Box>
                            <Text fontSize="sm" fontWeight="semibold" color="gray.700" mb={2}>Growth</Text>
                            <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={3}>
                                <Box>
                                    <Input placeholder={t("admin_crop_guides.temp_fields.growth_min")} type="number" value={form.growthTempMin ?? ""} onChange={(e) => setField("growthTempMin", NumberOrUndef(e.target.value))} borderColor={growTempErrors?.minError ? "red.400" : undefined} />
                                    {growTempErrors?.minError && <Text fontSize="xs" color="red.500" mt={1}>{growTempErrors.minError}</Text>}
                                </Box>
                                <Box>
                                    <Input placeholder={t("admin_crop_guides.temp_fields.growth_max")} type="number" value={form.growthTempMax ?? ""} onChange={(e) => setField("growthTempMax", NumberOrUndef(e.target.value))} borderColor={growTempErrors?.maxError ? "red.400" : undefined} />
                                    {growTempErrors?.maxError && <Text fontSize="xs" color="red.500" mt={1}>{growTempErrors.maxError}</Text>}
                                </Box>
                            </Grid>
                        </Box>
                        {/* Fruiting */}
                        <Box>
                            <Text fontSize="sm" fontWeight="semibold" color="gray.700" mb={2}>Fruiting</Text>
                            <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={3}>
                                <Box>
                                    <Input placeholder={t("admin_crop_guides.temp_fields.fruiting_min")} type="number" value={form.fruitingTempMin ?? ""} onChange={(e) => setField("fruitingTempMin", NumberOrUndef(e.target.value))} borderColor={fruitTempErrors?.minError ? "red.400" : undefined} />
                                    {fruitTempErrors?.minError && <Text fontSize="xs" color="red.500" mt={1}>{fruitTempErrors.minError}</Text>}
                                </Box>
                                <Box>
                                    <Input placeholder={t("admin_crop_guides.temp_fields.fruiting_max")} type="number" value={form.fruitingTempMax ?? ""} onChange={(e) => setField("fruitingTempMax", NumberOrUndef(e.target.value))} borderColor={fruitTempErrors?.maxError ? "red.400" : undefined} />
                                    {fruitTempErrors?.maxError && <Text fontSize="xs" color="red.500" mt={1}>{fruitTempErrors.maxError}</Text>}
                                </Box>
                            </Grid>
                        </Box>
                    </Flex>
                </Box>

                {/* ── Soil & Nutrients ─────────────────────────────────────── */}
                <Box bg="white" border="1px solid" borderColor="neutral.border" borderRadius="xl" p={5}>
                    <Text fontWeight="bold" mb={1}>{t("admin_crop_guides.soil_nutrients_title")}</Text>
                    <Text fontSize="sm" color="gray.600" mb={3}>{t("admin_crop_guides.soil_nutrients_desc")}</Text>
                    <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={3}>
                        <Box>
                            <Input placeholder={t("admin_crop_guides.soil_fields.ph_min")} type="number" value={form.phMin ?? ""} onChange={(e) => setField("phMin", NumberOrUndef(e.target.value))} borderColor={phErrors?.minError ? "red.400" : undefined} />
                            {phErrors?.minError && <Text fontSize="xs" color="red.500" mt={1}>{phErrors.minError}</Text>}
                        </Box>
                        <Box>
                            <Input placeholder={t("admin_crop_guides.soil_fields.ph_max")} type="number" value={form.phMax ?? ""} onChange={(e) => setField("phMax", NumberOrUndef(e.target.value))} borderColor={phErrors?.maxError ? "red.400" : undefined} />
                            {phErrors?.maxError && <Text fontSize="xs" color="red.500" mt={1}>{phErrors.maxError}</Text>}
                        </Box>
                        <Input placeholder={t("admin_crop_guides.soil_fields.n_requirement")} value={form.nRequirement ?? ""} onChange={(e) => setField("nRequirement", e.target.value)} />
                        <Input placeholder={t("admin_crop_guides.soil_fields.p_requirement")} value={form.pRequirement ?? ""} onChange={(e) => setField("pRequirement", e.target.value)} />
                        <Input placeholder={t("admin_crop_guides.soil_fields.k_requirement")} value={form.kRequirement ?? ""} onChange={(e) => setField("kRequirement", e.target.value)} />
                    </Grid>
                </Box>

                {/* ── Planting & Spacing ───────────────────────────────────── */}
                <Box bg="white" border="1px solid" borderColor="neutral.border" borderRadius="xl" p={5}>
                    <Text fontWeight="bold" mb={1}>{t("admin_crop_guides.planting_title")}</Text>
                    <Text fontSize="sm" color="gray.600" mb={3}>{t("admin_crop_guides.planting_desc")}</Text>
                    <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={3}>
                        <Input placeholder={t("admin_crop_guides.planting_fields.spacing_plant")} type="number" value={form.spacingPlantCm ?? ""} onChange={(e) => setField("spacingPlantCm", NumberOrUndef(e.target.value))} />
                        <Input placeholder={t("admin_crop_guides.planting_fields.spacing_row")} type="number" value={form.spacingRowCm ?? ""} onChange={(e) => setField("spacingRowCm", NumberOrUndef(e.target.value))} />
                        <Input placeholder={t("admin_crop_guides.planting_fields.depth")} type="number" value={form.depthCm ?? ""} onChange={(e) => setField("depthCm", NumberOrUndef(e.target.value))} />
                        <Input placeholder={t("admin_crop_guides.planting_fields.germination_days")} type="number" value={form.germinationDays ?? ""} onChange={(e) => setField("germinationDays", NumberOrUndef(e.target.value))} />
                    </Grid>
                </Box>

                {/* ── Localized Rich Text ──────────────────────────────────── */}
                <Box bg="white" border="1px solid" borderColor="neutral.border" borderRadius="xl" p={5}>
                    <Text fontWeight="bold" mb={1}>{t("admin_crop_guides.translations_title")}</Text>
                    <Text fontSize="sm" color="gray.600" mb={3}>{t("admin_crop_guides.translations_desc")}</Text>
                    <Tabs.Root defaultValue="en">
                        <Tabs.List mb={4}>
                            <Tabs.Trigger value="en">{t("admin_crop_guides.english")}</Tabs.Trigger>
                            <Tabs.Trigger value="tr">{t("admin_crop_guides.turkish")}</Tabs.Trigger>
                            <Tabs.Indicator />
                        </Tabs.List>

                        {(["en", "tr"] as const).map((lang) => (
                            <Tabs.Content key={lang} value={lang}>
                                <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={3}>
                                    <Textarea placeholder={t("admin_crop_guides.placeholders.description")} value={trMap.get(lang)?.description ?? ""} onChange={(e) => setTranslation(lang, "description", e.target.value)} />
                                    <Textarea placeholder={t("admin_crop_guides.placeholders.common_varieties")} value={trMap.get(lang)?.commonVarieties ?? ""} onChange={(e) => setTranslation(lang, "commonVarieties", e.target.value)} />
                                    <Textarea placeholder={t("admin_crop_guides.placeholders.uses")} value={trMap.get(lang)?.uses ?? ""} onChange={(e) => setTranslation(lang, "uses", e.target.value)} />
                                    <Textarea placeholder={t("admin_crop_guides.placeholders.soil_preparation_steps")} value={trMap.get(lang)?.soilPreparationSteps ?? ""} onChange={(e) => setTranslation(lang, "soilPreparationSteps", e.target.value)} />
                                    <Textarea placeholder={t("admin_crop_guides.placeholders.planting_method")} value={trMap.get(lang)?.plantingMethod ?? ""} onChange={(e) => setTranslation(lang, "plantingMethod", e.target.value)} />
                                    <Textarea placeholder={t("admin_crop_guides.placeholders.planting_timing")} value={trMap.get(lang)?.plantingTiming ?? ""} onChange={(e) => setTranslation(lang, "plantingTiming", e.target.value)} />
                                    <Textarea placeholder={t("admin_crop_guides.placeholders.irrigation")} value={trMap.get(lang)?.irrigation ?? ""} onChange={(e) => setTranslation(lang, "irrigation", e.target.value)} />
                                    <Textarea placeholder={t("admin_crop_guides.placeholders.fertilization")} value={trMap.get(lang)?.fertilization ?? ""} onChange={(e) => setTranslation(lang, "fertilization", e.target.value)} />
                                    <Textarea placeholder={t("admin_crop_guides.placeholders.weed_control")} value={trMap.get(lang)?.weedControl ?? ""} onChange={(e) => setTranslation(lang, "weedControl", e.target.value)} />
                                    <Textarea placeholder={t("admin_crop_guides.placeholders.support_pruning")} value={trMap.get(lang)?.supportPruning ?? ""} onChange={(e) => setTranslation(lang, "supportPruning", e.target.value)} />
                                    <Textarea placeholder={t("admin_crop_guides.placeholders.common_pests")} value={trMap.get(lang)?.commonPests ?? ""} onChange={(e) => setTranslation(lang, "commonPests", e.target.value)} />
                                    <Textarea placeholder={t("admin_crop_guides.placeholders.common_diseases")} value={trMap.get(lang)?.commonDiseases ?? ""} onChange={(e) => setTranslation(lang, "commonDiseases", e.target.value)} />
                                    <Textarea placeholder={t("admin_crop_guides.placeholders.management_strategies")} value={trMap.get(lang)?.managementStrategies ?? ""} onChange={(e) => setTranslation(lang, "managementStrategies", e.target.value)} />
                                    <Textarea placeholder={t("admin_crop_guides.placeholders.signs_of_readiness")} value={trMap.get(lang)?.signsOfReadiness ?? ""} onChange={(e) => setTranslation(lang, "signsOfReadiness", e.target.value)} />
                                    <Textarea placeholder={t("admin_crop_guides.placeholders.harvesting_method")} value={trMap.get(lang)?.harvestingMethod ?? ""} onChange={(e) => setTranslation(lang, "harvestingMethod", e.target.value)} />
                                    <Textarea placeholder={t("admin_crop_guides.placeholders.storage_conditions")} value={trMap.get(lang)?.storageConditions ?? ""} onChange={(e) => setTranslation(lang, "storageConditions", e.target.value)} />
                                    <Textarea placeholder={t("admin_crop_guides.placeholders.curing_instructions")} value={trMap.get(lang)?.curing ?? ""} onChange={(e) => setTranslation(lang, "curing", e.target.value)} />
                                    <Textarea placeholder={t("admin_crop_guides.placeholders.shelf_life")} value={trMap.get(lang)?.shelfLife ?? ""} onChange={(e) => setTranslation(lang, "shelfLife", e.target.value)} />
                                </Grid>
                            </Tabs.Content>
                        ))}
                    </Tabs.Root>
                </Box>

                {/* ── Pest / Disease Rows ──────────────────────────────────── */}
                <Box bg="white" border="1px solid" borderColor="neutral.border" borderRadius="xl" p={5}>
                    <Flex justify="space-between" align="center" mb={3}>
                        <Text fontWeight="bold">{t("admin_crop_guides.pest_title")}</Text>
                        <Button size="sm" variant="outline" onClick={addPestDisease}>
                            <Plus size={14} />
                            {t("admin_crop_guides.add_row")}
                        </Button>
                    </Flex>
                    <Flex direction="column" gap={3}>
                        {form.pestDiseases.map((row, i) => (
                            <Box key={i} border="1px solid" borderColor="gray.200" borderRadius="lg" p={3}>
                                <Grid templateColumns={{ base: "1fr", md: "140px 140px 1fr 120px" }} gap={2}>
                                    <select
                                        value={row.languageCode ?? "en"}
                                        onChange={(e) => updatePestRow(setForm, i, "languageCode", e.currentTarget.value)}
                                        style={{ padding: "8px", borderRadius: "6px", border: "1px solid #e2e8f0" }}
                                    >
                                        <option value="en">{t("admin_crop_guides.english")}</option>
                                        <option value="tr">{t("admin_crop_guides.turkish")}</option>
                                    </select>
                                    <select
                                        value={row.itemType}
                                        onChange={(e) => updatePestRow(setForm, i, "itemType", e.currentTarget.value)}
                                        style={{ padding: "8px", borderRadius: "6px", border: "1px solid #e2e8f0" }}
                                    >
                                        <option value="PEST">{t("admin_crop_guides.pest_option")}</option>
                                        <option value="DISEASE">{t("admin_crop_guides.disease_option")}</option>
                                    </select>
                                    <Input placeholder={t("admin_crop_guides.placeholders.name")} value={row.name} onChange={(e) => updatePestRow(setForm, i, "name", e.target.value)} />
                                    <Input placeholder={t("admin_crop_guides.placeholders.severity")} value={row.severity ?? ""} onChange={(e) => updatePestRow(setForm, i, "severity", e.target.value)} />
                                </Grid>
                                <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={2} mt={2}>
                                    <Textarea placeholder={t("admin_crop_guides.placeholders.prevention")} value={row.prevention ?? ""} onChange={(e) => updatePestRow(setForm, i, "prevention", e.target.value)} />
                                    <Textarea placeholder={t("admin_crop_guides.placeholders.organic_treatment")} value={row.organicTreatment ?? ""} onChange={(e) => updatePestRow(setForm, i, "organicTreatment", e.target.value)} />
                                    <Textarea placeholder={t("admin_crop_guides.placeholders.chemical_treatment")} value={row.chemicalTreatment ?? ""} onChange={(e) => updatePestRow(setForm, i, "chemicalTreatment", e.target.value)} />
                                    <Textarea placeholder={t("admin_crop_guides.placeholders.notes")} value={row.notes ?? ""} onChange={(e) => updatePestRow(setForm, i, "notes", e.target.value)} />
                                </Grid>
                                <Button size="xs" mt={2} colorPalette="red" variant="subtle" onClick={() => removePestRow(setForm, i)}>
                                    <Trash2 size={12} />
                                    {t("admin_crop_guides.remove")}
                                </Button>
                            </Box>
                        ))}
                    </Flex>
                </Box>

                {/* ── Post-Harvest Profiles ────────────────────────────────── */}
                <Box bg="white" border="1px solid" borderColor="neutral.border" borderRadius="xl" p={5}>
                    <Flex justify="space-between" align="center" mb={3}>
                        <Text fontWeight="bold">{t("admin_crop_guides.post_harvest_title")}</Text>
                        <Button size="sm" variant="outline" onClick={addPostHarvest}>
                            <Plus size={14} />
                            {t("admin_crop_guides.add_profile")}
                        </Button>
                    </Flex>
                    <Flex direction="column" gap={3}>
                        {form.postHarvestProfiles.map((row, i) => (
                            <Box key={i} border="1px solid" borderColor="gray.200" borderRadius="lg" p={3}>
                                <Grid templateColumns={{ base: "1fr", md: "120px 1fr 1fr" }} gap={2}>
                                    <select
                                        value={row.languageCode ?? "en"}
                                        onChange={(e) => updatePostRow(setForm, i, "languageCode", e.currentTarget.value)}
                                        style={{ padding: "8px", borderRadius: "6px", border: "1px solid #e2e8f0" }}
                                    >
                                        <option value="en">{t("admin_crop_guides.english")}</option>
                                        <option value="tr">{t("admin_crop_guides.turkish")}</option>
                                    </select>
                                    <Input placeholder={t("admin_crop_guides.placeholders.climate_band")} value={row.climateBand ?? ""} onChange={(e) => updatePostRow(setForm, i, "climateBand", e.target.value)} />
                                    <Input placeholder={t("admin_crop_guides.placeholders.shelf_life_days")} type="number" value={row.shelfLifeDays ?? ""} onChange={(e) => updatePostRow(setForm, i, "shelfLifeDays", NumberOrUndef(e.target.value))} />
                                </Grid>
                                <Grid templateColumns={{ base: "1fr", md: "1fr 1fr 1fr 1fr" }} gap={2} mt={2}>
                                    <Input placeholder={t("admin_crop_guides.placeholders.temp_min")} type="number" value={row.storageTemperatureMin ?? ""} onChange={(e) => updatePostRow(setForm, i, "storageTemperatureMin", NumberOrUndef(e.target.value))} />
                                    <Input placeholder={t("admin_crop_guides.placeholders.temp_max")} type="number" value={row.storageTemperatureMax ?? ""} onChange={(e) => updatePostRow(setForm, i, "storageTemperatureMax", NumberOrUndef(e.target.value))} />
                                    <Input placeholder={t("admin_crop_guides.placeholders.humidity_min")} type="number" value={row.storageHumidityMin ?? ""} onChange={(e) => updatePostRow(setForm, i, "storageHumidityMin", NumberOrUndef(e.target.value))} />
                                    <Input placeholder={t("admin_crop_guides.placeholders.humidity_max")} type="number" value={row.storageHumidityMax ?? ""} onChange={(e) => updatePostRow(setForm, i, "storageHumidityMax", NumberOrUndef(e.target.value))} />
                                </Grid>
                                <Textarea mt={2} placeholder={t("admin_crop_guides.placeholders.curing_instructions")} value={row.curing ?? ""} onChange={(e) => updatePostRow(setForm, i, "curing", e.target.value)} />
                                <Textarea mt={2} placeholder={t("admin_crop_guides.placeholders.storage_notes")} value={row.storageNotes ?? ""} onChange={(e) => updatePostRow(setForm, i, "storageNotes", e.target.value)} />
                                <Button size="xs" mt={2} colorPalette="red" variant="subtle" onClick={() => removePostRow(setForm, i)}>
                                    <Trash2 size={12} />
                                    {t("admin_crop_guides.remove")}
                                </Button>
                            </Box>
                        ))}
                    </Flex>
                </Box>

                <Button
                    colorPalette="green"
                    alignSelf="flex-end"
                    loading={isSaving}
                    disabled={hasValidationErrors}
                    onClick={onSave}
                >
                    <Save size={14} />
                    {t("admin_crop_guides.save")}
                </Button>
            </Flex>
        </DashboardLayout>
    );
};

const upsertLangTranslation = (
    rows: CropGuideTranslationAdmin[],
    lang: "en" | "tr",
    key: keyof CropGuideTranslationAdmin,
    value: string
) => {
    const next = [...rows];
    const index = next.findIndex((r) => r.languageCode === lang);
    if (index === -1) {
        const row = { ...defaultTranslation(lang), [key]: value };
        next.push(row);
        return next;
    }
    next[index] = { ...next[index], [key]: value };
    return next;
};

const NumberOrUndef = (value: string): number | undefined => {
    if (value.trim() === "") return undefined;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? undefined : parsed;
};

const updatePestRow = (
    setForm: Dispatch<SetStateAction<CropGuideAdminRequest>>,
    index: number,
    key: string,
    value: unknown
) => {
    setForm((prev) => {
        const next = [...prev.pestDiseases];
        next[index] = { ...next[index], [key]: value };
        return { ...prev, pestDiseases: next };
    });
};

const removePestRow = (
    setForm: Dispatch<SetStateAction<CropGuideAdminRequest>>,
    index: number
) => {
    setForm((prev) => ({ ...prev, pestDiseases: prev.pestDiseases.filter((_, i) => i !== index) }));
};

const updatePostRow = (
    setForm: Dispatch<SetStateAction<CropGuideAdminRequest>>,
    index: number,
    key: string,
    value: unknown
) => {
    setForm((prev) => {
        const next = [...prev.postHarvestProfiles];
        next[index] = { ...next[index], [key]: value };
        return { ...prev, postHarvestProfiles: next };
    });
};

const removePostRow = (
    setForm: Dispatch<SetStateAction<CropGuideAdminRequest>>,
    index: number
) => {
    setForm((prev) => ({ ...prev, postHarvestProfiles: prev.postHarvestProfiles.filter((_, i) => i !== index) }));
};

const fromApi = (input: CropGuideAdminResponse): CropGuideAdminRequest => ({
    name: input.core.name ?? "",
    scientificName: input.core.scientificName,
    family: input.core.family,
    growthHabit: input.core.growthHabit,
    lifespan: input.core.lifespan,
    image: input.core.image,
    climateHardiness: input.core.climateHardiness,
    frostTolerance: input.core.frostTolerance,
    sunlightHours: input.core.sunlightHours,
    optimalTemperatureMin: input.core.optimalTemperatureMin,
    optimalTemperatureMax: input.core.optimalTemperatureMax,
    germinationTempMin: input.core.germinationTempMin,
    germinationTempMax: input.core.germinationTempMax,
    growthTempMin: input.core.growthTempMin,
    growthTempMax: input.core.growthTempMax,
    fruitingTempMin: input.core.fruitingTempMin,
    fruitingTempMax: input.core.fruitingTempMax,
    waterWeeklyMm: input.core.waterWeeklyMm,
    droughtTolerance: input.core.droughtTolerance,
    waterloggingSensitivity: input.core.waterloggingSensitivity,
    soilType: input.core.soilType,
    phMin: input.core.phMin,
    phMax: input.core.phMax,
    nRequirement: input.core.nRequirement,
    pRequirement: input.core.pRequirement,
    kRequirement: input.core.kRequirement,
    spacingPlantCm: input.core.spacingPlantCm,
    spacingRowCm: input.core.spacingRowCm,
    depthCm: input.core.depthCm,
    germinationDays: input.core.germinationDays,
    daysToMaturity: input.core.daysToMaturity ?? 0,
    expectedYield: input.core.expectedYield,
    translations:
        input.translations.length > 0
            ? (input.translations as CropGuideTranslationAdmin[])
            : [defaultTranslation("en"), defaultTranslation("tr")],
    pestDiseases: input.pestDiseases.map((x) => ({ ...x, languageCode: x.languageCode ?? "en" })),
    postHarvestProfiles: input.postHarvestProfiles.map((x) => ({ ...x, languageCode: x.languageCode ?? "en" })),
});
