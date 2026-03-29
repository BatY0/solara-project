import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, Flex, Spinner, Text } from "@chakra-ui/react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { DashboardLayout } from "../../../components/layout/DashboardLayout";
import { cropGuideAdminService } from "../../../features/crop-guides/admin.service";
import type { CropGuideAdminResponse } from "../../../features/crop-guides/adminTypes";

export const CropGuideAdminList = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [items, setItems] = useState<CropGuideAdminResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

    const load = async () => {
        setIsLoading(true);
        try {
            setItems(await cropGuideAdminService.list());
        } catch (err) {
            console.error("Failed to load crop guide admin list", err);
            setItems([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const onDelete = async (id: string) => {
        if (!window.confirm(t("admin_crop_guides.delete_confirm"))) return;
        setIsDeletingId(id);
        try {
            await cropGuideAdminService.delete(id);
            await load();
        } catch (err) {
            console.error("Failed to delete crop guide", err);
        } finally {
            setIsDeletingId(null);
        }
    };

    return (
        <DashboardLayout
            title={t("admin_crop_guides.title")}
            subtitle={t("admin_crop_guides.subtitle")}
        >
            <Flex direction="column" gap={4}>
                <Box bg="blue.50" border="1px solid" borderColor="blue.100" borderRadius="xl" p={4}>
                    <Text fontWeight="semibold" color="blue.800" mb={1}>
                        {t("admin_crop_guides.info_title")}
                    </Text>
                    <Text fontSize="sm" color="blue.700">
                        {t("admin_crop_guides.info_desc")}
                    </Text>
                </Box>
                <Flex justify="space-between" align="center">
                    <Text fontWeight="semibold">{t("admin_crop_guides.guides_label")}</Text>
                    <Button colorPalette="green" onClick={() => navigate("/admin/crop-guides/new")}>
                        <Plus size={14} />
                        {t("admin_crop_guides.new_guide")}
                    </Button>
                </Flex>

                {isLoading ? (
                    <Flex minH="40vh" align="center" justify="center">
                        <Spinner />
                    </Flex>
                ) : (
                    <Flex direction="column" gap={3}>
                        {items.map((item) => (
                            <Box key={item.core.id} bg="white" border="1px solid" borderColor="neutral.border" borderRadius="xl" p={4}>
                                <Flex align="center" justify="space-between" gap={4}>
                                    <Box>
                                        <Text fontWeight="bold">{item.core.name}</Text>
                                        <Text color="gray.500" fontSize="sm">
                                            {item.core.scientificName || "-"}
                                        </Text>
                                    </Box>

                                    <Flex gap={2}>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => navigate(`/admin/crop-guides/${item.core.id}/edit`)}
                                        >
                                            <Pencil size={14} />
                                            {t("admin_crop_guides.edit")}
                                        </Button>
                                        <Button
                                            size="sm"
                                            colorPalette="red"
                                            loading={isDeletingId === item.core.id}
                                            onClick={() => onDelete(item.core.id)}
                                        >
                                            <Trash2 size={14} />
                                            {t("admin_crop_guides.delete")}
                                        </Button>
                                    </Flex>
                                </Flex>
                            </Box>
                        ))}
                    </Flex>
                )}
            </Flex>
        </DashboardLayout>
    );
};

