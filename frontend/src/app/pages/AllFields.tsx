import { useState, useEffect, useCallback } from 'react'
import { Box, Flex, Text, Spinner, Input, Circle } from "@chakra-ui/react"
import { Search, MapPin, Wifi, WifiOff } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { DashboardLayout } from "../../components/layout/DashboardLayout"
import { fieldsService } from "../../features/fields/fields.service"
import type { Field } from "../../features/fields/types"
import { getDeviceStatus } from "../../utils/deviceStatus"

const FieldRow = ({ field, onDetailsClick }: { field: Field; onDetailsClick: (id: string) => void }) => {
    const { t } = useTranslation()
    const deviceStatus = getDeviceStatus(field, t)
    const compactStatusText = {
        online: t('fields_page.online'),
        inactive: t('fields_page.inactive'),
        offline: t('fields_page.offline')
    }[deviceStatus.status]
    const statusConfig = {
        online: { bg: "green.50", color: "green.700", border: "green.100", dot: "green.500" },
        inactive: { bg: "yellow.50", color: "yellow.700", border: "yellow.100", dot: "yellow.500" },
        offline: { bg: "red.50", color: "red.700", border: "red.100", dot: "red.500" },
    }[deviceStatus.status]

    return (
        <Flex
            align="center"
            justify="flex-start"
            direction="row"
            gap={4}
            bg="white"
            borderRadius="xl"
            border="1px solid"
            borderColor="neutral.border"
            px={{ base: 4, md: 6 }}
            py={4}
            shadow="sm"
            cursor="pointer"
            transition="all 0.2s"
            _hover={{ shadow: "md", borderColor: "brand.200" }}
            onClick={() => onDetailsClick(field.id)}
        >
            <Flex align="center" gap={4} minW={0} flex={1}>
                <Flex
                    w={10}
                    h={10}
                    bg={deviceStatus.status === 'online' ? "brand.50" : deviceStatus.status === 'inactive' ? "yellow.50" : "gray.50"}
                    borderRadius="lg"
                    align="center"
                    justify="center"
                >
                    {deviceStatus.status === 'online'
                        ? <Wifi size={18} color="#059669" />
                        : deviceStatus.status === 'inactive'
                            ? <Wifi size={18} color="#D97706" />
                            : <WifiOff size={18} color="#9ca3af" />
                    }
                </Flex>
                <Box minW={0} flex={1}>
                    <Text fontWeight="bold" color="gray.800" truncate>{field.name}</Text>
                    <Flex mt={0.5} align="center" justify="space-between" gap={2}>
                        <Flex align="center" gap={1} color="gray.400" minW={0}>
                            <MapPin size={12} />
                            <Text fontSize="xs" truncate>{field.areaHa} {t('field_details.hectares').toLowerCase()}</Text>
                        </Flex>
                        {field.deviceId && (
                            <Flex
                                align="center"
                                justify="center"
                                h="28px"
                                fontSize="xs"
                                color="brand.600"
                                fontWeight="medium"
                                lineHeight="1"
                                bg="brand.50"
                                px={2}
                                borderRadius="md"
                                maxW={{ base: "120px", md: "220px" }}
                                minW={0}
                                title={field.deviceId}
                                flexShrink={0}
                                display={{ base: "flex", md: "none" }}
                            >
                                <Text truncate>{field.deviceId}</Text>
                            </Flex>
                        )}
                    </Flex>
                    <Flex mt={2} justify="flex-end" display={{ base: "flex", md: "none" }}>
                        <Flex
                            px={2}
                            py={1}
                            borderRadius="full"
                            fontSize="xs"
                            fontWeight="bold"
                            border="1px solid"
                            align="center"
                            gap={1.5}
                            bg={statusConfig.bg}
                            color={statusConfig.color}
                            borderColor={statusConfig.border}
                            whiteSpace="normal"
                            title={deviceStatus.text}
                            flexShrink={0}
                        >
                            <Circle size={1.5} bg={statusConfig.dot} />
                            {deviceStatus.text}
                        </Flex>
                    </Flex>
                </Box>
            </Flex>
            <Flex align="center" gap={2} flexShrink={0} display={{ base: "none", md: "flex" }}>
                {field.deviceId && (
                    <Flex
                        align="center"
                        justify="center"
                        h="28px"
                        fontSize="xs"
                        color="brand.600"
                        fontWeight="medium"
                        lineHeight="1"
                        bg="brand.50"
                        px={2}
                        borderRadius="md"
                        maxW="220px"
                        minW={0}
                        title={field.deviceId}
                        flexShrink={0}
                    >
                        <Text truncate>{field.deviceId}</Text>
                    </Flex>
                )}
                <Flex
                    px={2}
                    py={1}
                    borderRadius="full"
                    fontSize="xs"
                    fontWeight="bold"
                    border="1px solid"
                    align="center"
                    gap={1.5}
                    bg={statusConfig.bg}
                    color={statusConfig.color}
                    borderColor={statusConfig.border}
                    whiteSpace="nowrap"
                    title={deviceStatus.text}
                    flexShrink={0}
                >
                    <Circle size={1.5} bg={statusConfig.dot} />
                    {compactStatusText}
                </Flex>
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
            const sorted = [...data].sort((a, b) => {
                const statusOrder = { online: 2, inactive: 1, offline: 0 }
                const aStatus = statusOrder[getDeviceStatus(a, t).status]
                const bStatus = statusOrder[getDeviceStatus(b, t).status]
                return bStatus - aStatus
            })
            setFields(sorted)
        } catch (error) {
            console.error("Error fetching fields:", error)
        } finally {
            setIsLoading(false)
        }
    }, [t])

    useEffect(() => {
        fetchFields()
    }, [fetchFields])

    const filtered = fields.filter(f =>
        f.name.toLowerCase().includes(search.toLowerCase()) ||
        f.soilType?.toLowerCase().includes(search.toLowerCase())
    )

    const onlineCount = fields.filter(f => getDeviceStatus(f, t).status === 'online').length

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
