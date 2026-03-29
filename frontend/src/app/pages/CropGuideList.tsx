import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge, Box, Button, Flex, Image, Input, SimpleGrid, Spinner, Text } from "@chakra-ui/react";
import { Search, Leaf } from "lucide-react";
import { useTranslation } from "react-i18next";

import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { cropGuidesService } from "../../features/crop-guides/cropGuides.service";
import { toCropSlug } from "../../features/crop-guides/normalizeCropName";
import type { CropGuide } from "../../features/crop-guides/types";

export const CropGuideList = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [guides, setGuides] = useState<CropGuide[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");

    const valueKey = (value: string) =>
        value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");

    const trValue = (group: "growth_habit" | "soil_type", value?: string) => {
        if (!value) return "";
        return t(`crop_guide.values.${group}.${valueKey(value)}`, { defaultValue: value });
    };

    useEffect(() => {
        let isMounted = true;

        const load = async () => {
            setIsLoading(true);
            try {
                const data = await cropGuidesService.getAllGuides();
                if (!isMounted) return;
                setGuides(data);
            } catch (error) {
                console.error("Failed to load crop guides:", error);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        load();
        return () => {
            isMounted = false;
        };
    }, []);

    const filteredGuides = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return guides;

        return guides.filter((guide) => {
            const haystack = [
                guide.name,
                guide.scientificName ?? "",
                guide.description ?? "",
            ]
                .join(" ")
                .toLowerCase();

            return haystack.includes(q);
        });
    }, [guides, search]);

    if (isLoading) {
        return (
            <DashboardLayout title={t("crop_guide.title")} subtitle={t("crop_guide.subtitle")}>
                <Flex minH="60vh" align="center" justify="center" direction="column" color="brand.500">
                    <Spinner size="xl" mb={4} />
                    <Text fontWeight="medium" color="neutral.subtext">
                        {t("crop_guide.loading")}
                    </Text>
                </Flex>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title={t("crop_guide.title")} subtitle={t("crop_guide.subtitle")}>
            <Flex direction="column" gap={6}>
                <Flex
                    bg="white"
                    border="1px solid"
                    borderColor="neutral.border"
                    borderRadius="xl"
                    px={4}
                    align="center"
                    gap={3}
                    shadow="sm"
                >
                    <Search size={18} color="var(--chakra-colors-gray-400)" />
                    <Input
                        placeholder={t("crop_guide.search_placeholder")}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        py={3}
                        fontSize="sm"
                        border="none"
                        outline="none"
                        _focus={{ boxShadow: "none" }}
                    />
                </Flex>

                {filteredGuides.length === 0 ? (
                    <Flex
                        align="center"
                        justify="center"
                        direction="column"
                        py={16}
                        bg="white"
                        borderRadius="xl"
                        border="1px solid"
                        borderColor="neutral.border"
                    >
                        <Leaf size={24} color="#9ca3af" />
                        <Text mt={3} color="neutral.subtext">
                            {t("crop_guide.empty")}
                        </Text>
                    </Flex>
                ) : (
                    <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} gap={4}>
                        {filteredGuides.map((guide) => (
                            <Box
                                key={guide.id || guide.name}
                                bg="white"
                                border="1px solid"
                                borderColor="neutral.border"
                                borderRadius="2xl"
                                overflow="hidden"
                                shadow="sm"
                            >
                                {guide.image ? (
                                    <Image
                                        src={guide.image}
                                        alt={guide.name}
                                        h="140px"
                                        w="full"
                                        objectFit="cover"
                                    />
                                ) : (
                                    <Flex h="140px" bg="green.50" align="center" justify="center">
                                        <Leaf size={28} color="#059669" />
                                    </Flex>
                                )}

                                <Flex p={4} direction="column" gap={3}>
                                    <Box>
                                        <Text fontWeight="bold" fontSize="lg" lineClamp={1}>
                                            {guide.name}
                                        </Text>
                                        {guide.scientificName && (
                                            <Text color="neutral.subtext" fontSize="sm" lineClamp={1}>
                                                {guide.scientificName}
                                            </Text>
                                        )}
                                    </Box>

                                    <Flex gap={2} wrap="wrap">
                                        {guide.growthHabit && (
                                            <Badge colorPalette="green">{trValue("growth_habit", guide.growthHabit)}</Badge>
                                        )}
                                        {guide.soilType && (
                                            <Badge colorPalette="purple">{trValue("soil_type", guide.soilType)}</Badge>
                                        )}
                                        {typeof guide.daysToMaturity === "number" && (
                                            <Badge colorPalette="blue">
                                                {t("crop_guide.days_short", { days: guide.daysToMaturity })}
                                            </Badge>
                                        )}
                                    </Flex>

                                    <Text color="gray.600" fontSize="sm" lineClamp={3}>
                                        {guide.description || t("crop_guide.no_data")}
                                    </Text>

                                    <Flex justify="space-between" align="center" mt={1}>
                                        <Text fontSize="xs" color="gray.500">
                                            {guide.family || t("crop_guide.family_unknown")}
                                        </Text>
                                        <Button
                                            size="sm"
                                            colorPalette="brand"
                                            onClick={() => navigate(`/guide/${toCropSlug(guide.slug || guide.name)}`)}
                                        >
                                            {t("crop_guide.view_details")}
                                        </Button>
                                    </Flex>
                                </Flex>
                            </Box>
                        ))}
                    </SimpleGrid>
                )}
            </Flex>
        </DashboardLayout>
    );
};

