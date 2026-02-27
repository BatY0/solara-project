import { Box, Flex, Text, Button, Circle } from "@chakra-ui/react"
import { Sprout, MapPin, Droplets, Thermometer, Zap, ArrowRight } from "lucide-react"
import type { Field } from "../../features/fields/types"
import { useTranslation } from "react-i18next"

interface FieldCardProps {
    field: Field
    onDetailsClick: (id: string) => void
}

export const FieldCard = ({ field, onDetailsClick }: FieldCardProps) => {
    const { t } = useTranslation()
    const isOnline = field.status === 'online'

    // Placeholder sensory values for UI mockup matching Tailwind version
    const moisture = "45"
    const temp = "28"
    const battery = "85"

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
            css={{
                "&:hover .icon-box": { backgroundColor: "var(--chakra-colors-brand-100)" }
            }}
        >
            <Flex p={5} justify="space-between" align="start" borderBottom="1px solid" borderColor="gray.50">
                <Flex gap={4}>
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
                    <Box>
                        <Text fontSize="lg" fontWeight="bold" color="gray.800">
                            {field.name}
                        </Text>
                        <Flex align="center" gap={1} mt={1} color="gray.500">
                            <MapPin size={14} />
                            <Text fontSize="sm">Konum Bilgisi</Text>
                        </Flex>
                    </Box>
                </Flex>

                <Flex
                    px={3}
                    py={1}
                    borderRadius="full"
                    fontSize="xs"
                    fontWeight="bold"
                    border="1px solid"
                    align="center"
                    gap={1.5}
                    bg={isOnline ? "brand.50" : "red.50"}
                    color={isOnline ? "green.700" : "red.700"}
                    borderColor={isOnline ? "brand.100" : "red.100"}
                >
                    <Circle size={2} bg={isOnline ? "green.500" : "red.500"} animation={isOnline ? "pulse 2s infinite" : undefined} />
                    {isOnline ? t('dashboard.online') : t('dashboard.offline')}
                </Flex>
            </Flex>

            <Box display="grid" gridTemplateColumns="repeat(3, 1fr)" gap={4} p={5} flex={1}>
                <Flex direction="column" bg="gray.50" p={3} borderRadius="lg" border="1px solid" borderColor="gray.100" align="center">
                    <Text fontSize="xs" color="gray.500" mb={1}>{t('dashboard.moisture')}</Text>
                    <Flex align="center" justify="center" gap={1.5}>
                        <Droplets size={16} color="#3b82f6" />
                        <Text fontWeight="bold" color="gray.700">{moisture}%</Text>
                    </Flex>
                </Flex>

                <Flex direction="column" bg="gray.50" p={3} borderRadius="lg" border="1px solid" borderColor="gray.100" align="center">
                    <Text fontSize="xs" color="gray.500" mb={1}>{t('dashboard.temperature')}</Text>
                    <Flex align="center" justify="center" gap={1.5}>
                        <Thermometer size={16} color="#f97316" />
                        <Text fontWeight="bold" color="gray.700">{temp}°C</Text>
                    </Flex>
                </Flex>

                <Flex direction="column" bg="gray.50" p={3} borderRadius="lg" border="1px solid" borderColor="gray.100" align="center">
                    <Text fontSize="xs" color="gray.500" mb={1}>{t('dashboard.battery')}</Text>
                    <Flex align="center" justify="center" gap={1.5}>
                        <Zap size={16} color="#f59e0b" />
                        <Text fontWeight="bold" color="gray.700">{battery}%</Text>
                    </Flex>
                </Flex>
            </Box>

            <Box p={4} pt={0}>
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
