import { useState, useEffect, useCallback } from 'react'
import { Box, Flex, Text, Spinner, Input, Badge } from "@chakra-ui/react"
import { Search, MapPin, Wifi, WifiOff } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { DashboardLayout } from "../../components/layout/DashboardLayout"
import { fieldsService } from "../../features/fields/fields.service"
import type { Field } from "../../features/fields/types"

const FieldRow = ({ field, onDetailsClick }: { field: Field; onDetailsClick: (id: string) => void }) => {
    const { t } = useTranslation()
    const isOnline = !!field.deviceId
    return (
        <Flex
            align="center"
            justify="space-between"
            bg="white"
            borderRadius="xl"
            border="1px solid"
            borderColor="neutral.border"
            px={6}
            py={4}
            shadow="sm"
            cursor="pointer"
            transition="all 0.2s"
            _hover={{ shadow: "md", borderColor: "brand.200" }}
            onClick={() => onDetailsClick(field.id)}
        >
            <Flex align="center" gap={4}>
                <Flex
                    w={10} h={10}
                    bg={isOnline ? "brand.50" : "gray.50"}
                    borderRadius="lg"
                    align="center"
                    justify="center"
                >
                    {isOnline
                        ? <Wifi size={18} color="#059669" />
                        : <WifiOff size={18} color="#9ca3af" />
                    }
                </Flex>
                <Box>
                    <Text fontWeight="bold" color="gray.800">{field.name}</Text>
                    <Flex align="center" gap={1} color="gray.400" mt={0.5}>
                        <MapPin size={12} />
                        <Text fontSize="xs">{field.areaHa} {t('field_details.hectares').toLowerCase()} — {field.soilType}</Text>
                    </Flex>
                </Box>
            </Flex>

            <Flex align="center" gap={3}>
                {field.deviceId && (
                    <Text fontSize="xs" color="brand.600" fontWeight="medium" bg="brand.50" px={2} py={1} borderRadius="md">
                        {field.deviceId}
                    </Text>
                )}
                <Badge
                    px={2} py={1}
                    borderRadius="full"
                    fontSize="xs"
                    fontWeight="bold"
                    colorScheme={isOnline ? "green" : "red"}
                >
                    {isOnline ? t('fields_page.online') : t('fields_page.offline')}
                </Badge>
            </Flex>
        </Flex>
    )
}

export const AllFields = () => {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const [fields, setFields] = useState<Field[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [search, setSearch] = useState("")

    const fetchFields = useCallback(async () => {
        try {
            const data = await fieldsService.getUserFields()
            // Sort: online (has deviceId) first
            const sorted = [...data].sort((a, b) => {
                const aOnline = a.deviceId ? 1 : 0
                const bOnline = b.deviceId ? 1 : 0
                return bOnline - aOnline
            })
            setFields(sorted)
        } catch (error) {
            console.error("Error fetching fields:", error)
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchFields()
    }, [fetchFields])

    const filtered = fields.filter(f =>
        f.name.toLowerCase().includes(search.toLowerCase()) ||
        f.soilType?.toLowerCase().includes(search.toLowerCase())
    )

    const onlineCount = fields.filter(f => !!f.deviceId).length

    if (isLoading) {
        return (
            <DashboardLayout title={t("sidebar.fields")} subtitle="">
                <Flex minH="60vh" align="center" justify="center" direction="column" color="brand.500">
                    <Spinner size="xl" mb={4} />
                    <Text fontWeight="medium" color="neutral.subtext">{t("dashboard.loading")}</Text>
                </Flex>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout
            title={t("sidebar.fields")}
            subtitle={`${fields.length} ${t("dashboard.total_fields").toLowerCase()} — ${onlineCount} ${t('fields_page.online_stat')}`}
        >
            <Flex direction="column" gap={6} w="full">
                {/* Search bar */}
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
                        placeholder={t('fields_page.search_ph')}
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        py={3}
                        fontSize="sm"
                        border="none"
                        outline="none"
                        _focus={{ boxShadow: "none" }}
                    />
                </Flex>

                {/* Fields list */}
                <Flex direction="column" gap={3}>
                    {filtered.length === 0 ? (
                        <Flex align="center" justify="center" py={20}>
                            <Text color="neutral.subtext">{t('fields_page.no_results')}</Text>
                        </Flex>
                    ) : (
                        filtered.map(field => (
                            <FieldRow
                                key={field.id}
                                field={field}
                                onDetailsClick={id => navigate(`/fields/${id}`)}
                            />
                        ))
                    )}
                </Flex>
            </Flex>
        </DashboardLayout>
    )
}
