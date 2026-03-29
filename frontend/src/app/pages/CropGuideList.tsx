import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, Flex, Image, Input, Spinner, Text } from "@chakra-ui/react";
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
                    <Flex direction="column" gap={4}>
                        {filteredGuides.map((guide) => (
                            <Flex
                                key={guide.name}
                                bg="white"
                                border="1px solid"
                                borderColor="neutral.border"
                                borderRadius="xl"
                                p={4}
                                align="center"
                                justify="space-between"
                                gap={4}
                            >
                                <Flex align="center" gap={4} flex="1" minW={0}>
                                    {guide.image ? (
                                        <Image
                                            src={guide.image}
                                            alt={guide.name}
                                            boxSize="64px"
                                            objectFit="cover"
                                            borderRadius="lg"
                                            flexShrink={0}
                                        />
                                    ) : (
                                        <Flex
                                            boxSize="64px"
                                            borderRadius="lg"
                                            bg="green.50"
                                            align="center"
                                            justify="center"
                                            flexShrink={0}
                                        >
                                            <Leaf size={20} color="#059669" />
                                        </Flex>
                                    )}

                                    <Box minW={0}>
                                        <Text fontWeight="bold" fontSize="md" truncate>
                                            {guide.name}
                                        </Text>
                                        {guide.scientificName && (
                                            <Text color="neutral.subtext" fontSize="sm" truncate>
                                                {guide.scientificName}
                                            </Text>
                                        )}
                                        {typeof guide.daysToMaturity === "number" && (
                                            <Text color="gray.500" fontSize="xs" mt={1}>
                                                {t("crop_guide.days_to_maturity", {
                                                    days: guide.daysToMaturity,
                                                })}
                                            </Text>
                                        )}
                                    </Box>
                                </Flex>

                                <Button
                                    size="sm"
                                    colorPalette="brand"
                                    onClick={() => navigate(`/guide/${toCropSlug(guide.name)}`)}
                                >
                                    {t("crop_guide.view_details")}
                                </Button>
                            </Flex>
                        ))}
                    </Flex>
                )}
            </Flex>
        </DashboardLayout>
    );
};

