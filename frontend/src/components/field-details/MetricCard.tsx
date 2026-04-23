import type { ReactNode } from "react";
import { Box, Flex, Text } from "@chakra-ui/react";

interface MetricCardProps {
    label: string;
    value: string | number | null | undefined;
    unit: string;
    icon: ReactNode;
    accent: string;
}

export function MetricCard({ label, value, unit, icon, accent }: MetricCardProps) {
    const display = value != null
        ? (typeof value === 'number' ? value.toFixed(2) : String(value))
        : '--';

    return (
        <Box
            flex="1" minW={{ base: "100%", sm: "140px" }} p={{ base: 4, md: 5 }} borderRadius="2xl" border="1px solid"
            borderColor="gray.100" bg="white"
            style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
            transition="transform 0.2s, box-shadow 0.2s"
            _hover={{ transform: 'translateY(-2px)', boxShadow: '0 6px 20px rgba(0,0,0,0.10)' }}
        >
            <Flex align="center" gap={3} mb={3}>
                <Flex w={9} h={9} borderRadius="xl" bg={`${accent}.50`} align="center" justify="center" color={`${accent}.500`}>{icon}</Flex>
                <Text fontSize="xs" fontWeight="semibold" color="gray.500" textTransform="uppercase" letterSpacing="wide">{label}</Text>
            </Flex>
            <Text fontSize={{ base: "xl", md: "2xl" }} fontWeight="bold" color="gray.800" lineHeight={1}>{display}</Text>
            {value != null && <Text fontSize="sm" color="gray.400" mt={0.5}>{unit}</Text>}
        </Box>
    );
}
