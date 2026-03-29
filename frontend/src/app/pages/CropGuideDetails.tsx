import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Box, Button, Flex, Image, SimpleGrid, Spinner, Text } from "@chakra-ui/react";
import { ArrowLeft, Leaf } from "lucide-react";
import { useTranslation } from "react-i18next";

import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { cropGuidesService } from "../../features/crop-guides/cropGuides.service";
import type { CropGuide } from "../../features/crop-guides/types";

export const CropGuideDetails = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [guide, setGuide] = useState<CropGuide | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const load = async () => {
            if (!slug) {
                setNotFound(true);
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            setNotFound(false);
            try {
                const result = await cropGuidesService.getGuideBySlug(slug);
                if (!isMounted) return;
                if (!result) {
                    setGuide(null);
                    setNotFound(true);
                } else {
                    setGuide(result);
                }
            } catch (error) {
                console.error("Failed to load crop guide detail:", error);
                if (isMounted) setNotFound(true);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        load();
        return () => {
            isMounted = false;
        };
    }, [slug]);

    if (isLoading) {
        return (
            <DashboardLayout title={t("crop_guide.details_title")} subtitle={t("crop_guide.subtitle")}>
                <Flex minH="60vh" align="center" justify="center" direction="column" color="brand.500">
                    <Spinner size="xl" mb={4} />
                    <Text fontWeight="medium" color="neutral.subtext">
                        {t("crop_guide.loading")}
                    </Text>
                </Flex>
            </DashboardLayout>
        );
    }

    if (notFound || !guide) {
        return (
            <DashboardLayout title={t("crop_guide.details_title")} subtitle={t("crop_guide.subtitle")}>
                <Flex
                    minH="60vh"
                    align="center"
                    justify="center"
                    direction="column"
                    bg="white"
                    borderRadius="2xl"
                    border="1px solid"
                    borderColor="neutral.border"
                    p={8}
                >
                    <Leaf size={26} color="#9ca3af" />
                    <Text mt={3} fontWeight="semibold">
                        {t("crop_guide.not_found_title")}
                    </Text>
                    <Text mt={1} color="neutral.subtext">
                        {t("crop_guide.not_found_desc")}
                    </Text>
                    <Button mt={5} variant="outline" onClick={() => navigate("/guide")}>
                        <ArrowLeft size={14} />
                        {t("crop_guide.back_to_list")}
                    </Button>
                </Flex>
            </DashboardLayout>
        );
    }

    const valueKey = (value: string) =>
        value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");

    const trValue = (group: "growth_habit" | "soil_type", value?: string) => {
        if (!value) return "";
        return t(`crop_guide.values.${group}.${valueKey(value)}`, { defaultValue: value });
    };

    const SectionCard = ({ title, items, content }: { title: string; items?: string[]; content?: string | null }) => (
        <Box bg="white" borderRadius="2xl" border="1px solid" borderColor="neutral.border" p={6}>
            <Text fontWeight="bold" mb={2}>{title}</Text>
            {items && items.length > 0 ? (
                <Flex direction="column" gap={1}>
                    {items.map((item, idx) => (
                        <Text key={idx} color="neutral.subtext">
                            {"- "}{item}
                        </Text>
                    ))}
                </Flex>
            ) : (
                <Text color="neutral.subtext">
                    {content && content.trim().length > 0 ? content : t("crop_guide.coming_soon")}
                </Text>
            )}
        </Box>
    );

    return (
        <DashboardLayout title={guide.name} subtitle={guide.scientificName || t("crop_guide.details_title")}>
            <Flex direction="column" gap={5}>
                <Button alignSelf="flex-start" variant="ghost" onClick={() => navigate("/guide")}>
                    <ArrowLeft size={14} />
                    {t("crop_guide.back_to_list")}
                </Button>

                <Box bg="white" borderRadius="2xl" border="1px solid" borderColor="neutral.border" p={6}>
                    <Flex direction={{ base: "column", md: "row" }} gap={6}>
                        {guide.image ? (
                            <Image
                                src={guide.image}
                                alt={guide.name}
                                borderRadius="xl"
                                objectFit="cover"
                                w={{ base: "100%", md: "280px" }}
                                h={{ base: "200px", md: "280px" }}
                            />
                        ) : (
                            <Flex
                                borderRadius="xl"
                                bg="green.50"
                                w={{ base: "100%", md: "280px" }}
                                h={{ base: "200px", md: "280px" }}
                                align="center"
                                justify="center"
                            >
                                <Leaf size={34} color="#059669" />
                            </Flex>
                        )}

                        <Flex direction="column" gap={3} flex="1">
                            <Text fontSize="2xl" fontWeight="bold">
                                {guide.name}
                            </Text>
                            {guide.commonNames && (
                                <Text fontSize="sm" color="neutral.subtext">
                                    {t("crop_guide.common_names")}: {guide.commonNames}
                                </Text>
                            )}
                            {guide.scientificName && (
                                <Text fontSize="sm" color="neutral.subtext">
                                    {guide.scientificName}
                                </Text>
                            )}

                            <Flex gap={3} wrap="wrap" mt={2}>
                                {typeof guide.optimalTemperatureMin === "number" &&
                                    typeof guide.optimalTemperatureMax === "number" && (
                                        <Box bg="orange.50" px={3} py={2} borderRadius="lg">
                                            <Text fontSize="xs" color="orange.700">
                                                {t("crop_guide.optimal_temp")}
                                            </Text>
                                            <Text fontWeight="semibold" color="orange.800">
                                                {guide.optimalTemperatureMin}°C - {guide.optimalTemperatureMax}°C
                                            </Text>
                                        </Box>
                                    )}

                                {typeof guide.daysToMaturity === "number" && (
                                    <Box bg="blue.50" px={3} py={2} borderRadius="lg">
                                        <Text fontSize="xs" color="blue.700">
                                            {t("crop_guide.days_label")}
                                        </Text>
                                        <Text fontWeight="semibold" color="blue.800">
                                            {guide.daysToMaturity}
                                        </Text>
                                    </Box>
                                )}
                                {guide.family && (
                                    <Box bg="purple.50" px={3} py={2} borderRadius="lg">
                                        <Text fontSize="xs" color="purple.700">
                                            {t("crop_guide.family")}
                                        </Text>
                                        <Text fontWeight="semibold" color="purple.800">
                                            {guide.family}
                                        </Text>
                                    </Box>
                                )}
                            </Flex>
                        </Flex>
                    </Flex>
                </Box>

                <SimpleGrid columns={{ base: 1, lg: 2 }} gap={4}>
                    <SectionCard title={t("crop_guide.section_overview")} content={guide.description} />
                    <SectionCard
                        title={t("crop_guide.section_environment")}
                        items={[
                            guide.climateHardiness ? `${t("crop_guide.climate_hardiness")}: ${guide.climateHardiness}` : null,
                            guide.frostTolerance ? `${t("crop_guide.frost_tolerance")}: ${guide.frostTolerance}` : null,
                            typeof guide.sunlightHours === "number" ? `${t("crop_guide.sunlight_hours")}: ${guide.sunlightHours}` : null,
                            typeof guide.waterWeeklyMm === "number" ? `${t("crop_guide.weekly_water")}: ${guide.waterWeeklyMm} mm` : null,
                            guide.droughtTolerance ? `${t("crop_guide.drought_tolerance")}: ${guide.droughtTolerance}` : null,
                            guide.waterloggingSensitivity ? `${t("crop_guide.waterlogging_sensitivity")}: ${guide.waterloggingSensitivity}` : null,
                        ].filter(Boolean) as string[]}
                    />
                    <SectionCard
                        title={t("crop_guide.section_soil")}
                        items={[
                            guide.soilType ? `${t("crop_guide.soil_type")}: ${trValue("soil_type", guide.soilType)}` : null,
                            typeof guide.phMin === "number" && typeof guide.phMax === "number"
                                ? `${t("crop_guide.ph_range")}: ${guide.phMin} - ${guide.phMax}`
                                : null,
                            guide.nRequirement ? `N: ${guide.nRequirement}` : null,
                            guide.pRequirement ? `P: ${guide.pRequirement}` : null,
                            guide.kRequirement ? `K: ${guide.kRequirement}` : null,
                            guide.soilPreparationSteps ? `${t("crop_guide.soil_preparation")}: ${guide.soilPreparationSteps}` : null,
                        ].filter(Boolean) as string[]}
                    />
                    <SectionCard
                        title={t("crop_guide.section_planting")}
                        items={[
                            guide.plantingMethod ? `${t("crop_guide.planting_method")}: ${guide.plantingMethod}` : null,
                            guide.plantingTiming ? `${t("crop_guide.planting_timing")}: ${guide.plantingTiming}` : null,
                            typeof guide.spacingPlantCm === "number" ? `${t("crop_guide.spacing_plant")}: ${guide.spacingPlantCm} cm` : null,
                            typeof guide.spacingRowCm === "number" ? `${t("crop_guide.spacing_row")}: ${guide.spacingRowCm} cm` : null,
                            typeof guide.depthCm === "number" ? `${t("crop_guide.depth")}: ${guide.depthCm} cm` : null,
                            typeof guide.germinationDays === "number" ? `${t("crop_guide.germination_days")}: ${guide.germinationDays}` : null,
                        ].filter(Boolean) as string[]}
                    />
                    <SectionCard
                        title={t("crop_guide.section_management")}
                        items={[
                            guide.irrigation ? `${t("crop_guide.irrigation")}: ${guide.irrigation}` : null,
                            guide.fertilization ? `${t("crop_guide.fertilization")}: ${guide.fertilization}` : null,
                            guide.weedControl ? `${t("crop_guide.weed_control")}: ${guide.weedControl}` : null,
                            guide.supportPruning ? `${t("crop_guide.support_pruning")}: ${guide.supportPruning}` : null,
                        ].filter(Boolean) as string[]}
                    />
                    <SectionCard
                        title={t("crop_guide.section_pests")}
                        items={[
                            guide.commonPests ? `${t("crop_guide.common_pests")}: ${guide.commonPests}` : null,
                            guide.commonDiseases ? `${t("crop_guide.common_diseases")}: ${guide.commonDiseases}` : null,
                            guide.managementStrategies ? `${t("crop_guide.management_strategies")}: ${guide.managementStrategies}` : null,
                        ].filter(Boolean) as string[]}
                    />
                    <SectionCard
                        title={t("crop_guide.section_harvest")}
                        items={[
                            typeof guide.daysToMaturity === "number" ? `${t("crop_guide.days_label")}: ${guide.daysToMaturity}` : null,
                            guide.signsOfReadiness ? `${t("crop_guide.signs_of_readiness")}: ${guide.signsOfReadiness}` : null,
                            guide.harvestingMethod ? `${t("crop_guide.harvesting_method")}: ${guide.harvestingMethod}` : null,
                            guide.expectedYield ? `${t("crop_guide.expected_yield")}: ${guide.expectedYield}` : null,
                        ].filter(Boolean) as string[]}
                    />
                    <SectionCard
                        title={t("crop_guide.section_storage")}
                        items={[
                            guide.curing ? `${t("crop_guide.curing")}: ${guide.curing}` : null,
                            guide.storageConditions ? `${t("crop_guide.storage_conditions")}: ${guide.storageConditions}` : null,
                            guide.shelfLife ? `${t("crop_guide.shelf_life")}: ${guide.shelfLife}` : null,
                        ].filter(Boolean) as string[]}
                    />
                </SimpleGrid>
            </Flex>
        </DashboardLayout>
    );
};

