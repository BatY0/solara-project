import { useState, useEffect } from "react"
import { Box, Flex, Text, Button, Circle, Skeleton } from "@chakra-ui/react"
import { Sprout, MapPin, Droplets, Thermometer, ArrowRight } from "lucide-react"
import type { Field, SensorData } from "../../features/fields/types"
import { fieldsService } from "../../features/fields/fields.service"
import { useTranslation } from "react-i18next"
import { getDeviceStatus } from "../../utils/deviceStatus"

interface FieldCardProps {
    field: Field
    onDetailsClick: (id: string) => void
}

export const FieldCard = ({ field, onDetailsClick }: FieldCardProps) => {
    const { t } = useTranslation()
    
    const [telemetry, setTelemetry] = useState<SensorData | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        let isMounted = true;
        
        const fetchData = async () => {
            setIsLoading(true);
            try {
                // Backend returns 200 + null (or 204 No Content mapped to null in service) if no data yet.
                // We fetch even if unpaired to show "Last Known" data if it exists in the logs.
                const data = await fieldsService.getMostRecentTelemetry(field.id);
                if (isMounted) setTelemetry(data ?? null);
            } catch (err: any) {
                if (err?.response?.status !== 404) {
                    console.error(`Failed to fetch telemetry for ${field.id}:`, err);
                }
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        fetchData();

        return () => {
            isMounted = false;
        };
    }, [field.id]);

    const deviceStatus = getDeviceStatus(field, t);
    const status: 'online' | 'inactive' | 'offline' = deviceStatus.status;
    const compactStatusText = {
        online: t('fields_page.online'),
        inactive: t('fields_page.inactive'),
        offline: t('fields_page.offline')
    }[status];

    const statusConfig = {
        online:   { bg: 'brand.50',  color: 'green.700',  border: 'brand.100', dot: 'green.500',  pulse: true },
        inactive: { bg: 'yellow.50', color: 'yellow.700', border: 'yellow.100', dot: 'yellow.500', pulse: false },
        offline:  { bg: 'red.50',    color: 'red.700',    border: 'red.100',    dot: 'red.500',    pulse: false },
    }[status];

    return (
        <Flex
            direction="column"
            bg="white"
            borderRadius="2xl"
            border="1px solid"
            borderColor="neutral.border"
            shadow="sm"
            transition="all 0.3s"
            _hover={{ shadow: "lg" }}
            overflow="hidden"
            css={{
                "&:hover .icon-box": { backgroundColor: "var(--chakra-colors-brand-100)" }
            }}
        >
            <Flex
                p={{ base: 4, md: 4 }}
                align="flex-start"
                justify={{ base: "flex-start", md: "space-between" }}
                direction={{ base: "column", md: "row" }}
                gap={{ base: 2, md: 3 }}
                borderBottom="1px solid"
                borderColor="gray.50"
            >
                <Flex gap={4} minW={0} flex={1} w="full" maxW="full">
                    <Flex
                        className="icon-box"
                        w={14}
                        h={14}
                        bg="brand.50"
                        borderRadius="xl"
                        align="center"
                        justify="center"
                        transition="colors 0.2s"
                    >
                        <Sprout size={28} color="#059669" />
                    </Flex>
                    <Box minW={0} flex={1} overflow="hidden" maxW="full">
                        <Text
                            fontSize="lg"
                            fontWeight="bold"
                            color="gray.800"
                            display="block"
                            w="full"
                            maxW="full"
                            overflow="hidden"
                            whiteSpace={{ base: "normal", md: "nowrap" }}
                            textOverflow={{ base: "clip", md: "ellipsis" }}
                            overflowWrap="anywhere"
                            wordBreak="break-word"
                        >
                            {field.name}
                        </Text>
                        <Flex
                            mt={1.5}
                            align={{ base: "flex-start", sm: "center" }}
                            justify="space-between"
                            direction={{ base: "column", sm: "row" }}
                            gap={{ base: 1.5, sm: 2 }}
                            minW={0}
                        >
                            <Flex align="center" gap={1} color="gray.500" minW={0}>
                                <MapPin size={14} />
                                <Text fontSize="sm" truncate>
                                    {field.areaHa} {t('field_details.hectares').toLowerCase()}
                                </Text>
                            </Flex>
                        </Flex>
                    </Box>
                </Flex>

                <Flex align="center" gap={2} flexShrink={0} alignSelf={{ base: "flex-end", md: "auto" }}>
                    <Flex
                        px={3}
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
                        maxW="fit-content"
                        whiteSpace="nowrap"
                        lineHeight="short"
                        flexShrink={0}
                        title={deviceStatus.text}
                    >
                        <Circle size={2} bg={statusConfig.dot} animation={statusConfig.pulse ? "pulse 2s infinite" : undefined} />
                        {compactStatusText}
                    </Flex>
                </Flex>
            </Flex>

            <Box display="grid" gridTemplateColumns={{ base: "repeat(2, 1fr)", md: "repeat(3, 1fr)" }} gap={{ base: 2, md: 3 }} p={{ base: 4, md: 4 }} flex={1}>
                {isLoading ? (
                    <>
                        <Skeleton height="60px" borderRadius="lg" />
                        <Skeleton height="60px" borderRadius="lg" />
                        <Skeleton height="60px" borderRadius="lg" gridColumn={{ base: "span 2", md: "span 1" }} />
                    </>
                ) : (
                    <>
                        <Flex direction="column" bg="gray.50" p={{ base: 3, md: 2.5 }} borderRadius="lg" border="1px solid" borderColor="gray.100" align="center">
                            <Text fontSize="xs" color="gray.500" mb={1}>{t('dashboard.moisture')}</Text>
                            <Flex align="center" justify="center" gap={1.5}>
                                <Droplets size={16} color="#3b82f6" />
                                <Text fontWeight="bold" color="gray.700">
                                    {typeof telemetry?.soilHumidity === 'number' ? telemetry.soilHumidity.toFixed(2) : (telemetry?.soilHumidity ?? "--")}%
                                </Text>
                            </Flex>
                        </Flex>

                        <Flex direction="column" bg="gray.50" p={{ base: 3, md: 2.5 }} borderRadius="lg" border="1px solid" borderColor="gray.100" align="center">
                            <Text fontSize="xs" color="gray.500" mb={1}>{t('dashboard.temperature')}</Text>
                            <Flex align="center" justify="center" gap={1.5}>
                                <Thermometer size={16} color="#f97316" />
                                <Text fontWeight="bold" color="gray.700">
                                    {typeof telemetry?.soilTemp === 'number' ? telemetry.soilTemp.toFixed(2) : (telemetry?.soilTemp ?? "--")}°C
                                </Text>
                            </Flex>
                        </Flex>

                        <Flex direction="column" bg="gray.50" p={{ base: 3, md: 2.5 }} borderRadius="lg" border="1px solid" borderColor="gray.100" align="center" gridColumn={{ base: "span 2", md: "span 1" }}>
                            <Text fontSize="xs" color="gray.500" mb={1}>{t('dashboard.air_temp')}</Text>
                            <Flex align="center" justify="center" gap={1.5}>
                                <Thermometer size={16} color="#0ea5e9" />
                                <Text fontWeight="bold" color="gray.700">
                                    {typeof telemetry?.ambientTemp === 'number' ? telemetry.ambientTemp.toFixed(2) : (telemetry?.ambientTemp ?? "--")}°C
                                </Text>
                            </Flex>
                        </Flex>
                    </>
                )}
            </Box>

            <Box p={{ base: 4, md: 4 }} pt={0}>
                <Button
                    w="full"
                    bg="gray.50"
                    color="gray.700"
                    border="1px solid"
                    borderColor="gray.200"
                    py={2.5}
                    borderRadius="xl"
                    fontWeight="semibold"
                    fontSize="sm"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    gap={2}
                    transition="all 0.2s"
                    _hover={{ bg: "accent.500", color: "white", borderColor: "transparent" }}
                    onClick={() => onDetailsClick(field.id)}
                >
                    {t('dashboard.view_details')}
                    <ArrowRight size={16} />
                </Button>
            </Box>
        </Flex>
    )
}
