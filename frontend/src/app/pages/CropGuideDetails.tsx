import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Box, Button, Flex, Image, Spinner, Text } from "@chakra-ui/react";
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

    return (
        <DashboardLayout title={guide.name} subtitle={guide.scientificName || t("crop_guide.details_title")}>
            <Flex direction="column" gap={5}>
                <Button alignSelf="flex-start" variant="ghost" onClick={() => navigate("/guide")}>
                    <ArrowLeft size={14} />
                    {t("crop_guide.back_to_list")}
                </Button>

                <Box
                    bg="white"
                    borderRadius="2xl"
                    border="1px solid"
                    borderColor="neutral.border"
                    p={6}
                >
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
                            </Flex>
                        </Flex>
                    </Flex>
                </Box>

                <Box bg="white" borderRadius="2xl" border="1px solid" borderColor="neutral.border" p={6}>
                    <Text fontWeight="bold" mb={2}>
                        {t("crop_guide.description")}
                    </Text>
                    <Text color="neutral.subtext">
                        {guide.description || t("crop_guide.no_data")}
                    </Text>
                </Box>

                <Box bg="white" borderRadius="2xl" border="1px solid" borderColor="neutral.border" p={6}>
                    <Text fontWeight="bold" mb={2}>
                        {t("crop_guide.planting_instructions")}
                    </Text>
                    <Text color="neutral.subtext">
                        {guide.plantingInstructions || t("crop_guide.no_data")}
                    </Text>
                </Box>

                <Box bg="white" borderRadius="2xl" border="1px solid" borderColor="neutral.border" p={6}>
                    <Text fontWeight="bold" mb={2}>
                        {t("crop_guide.care_instructions")}
                    </Text>
                    <Text color="neutral.subtext">
                        {guide.careInstructions || t("crop_guide.no_data")}
                    </Text>
                </Box>
            </Flex>
        </DashboardLayout>
    );
};

