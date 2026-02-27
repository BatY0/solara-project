import { Box, Flex, Text } from "@chakra-ui/react"
import React from "react"

interface StatCardProps {
    title: string
    value: string | number
    suffix?: string
    icon: React.ElementType
    iconBgColor: string
    iconColor: string
}

export const StatCard = ({ title, value, suffix, icon: IconComponent, iconBgColor, iconColor }: StatCardProps) => (
    <Flex
        bg="white"
        p={6}
        borderRadius="2xl"
        border="1px solid"
        borderColor="neutral.border"
        shadow="sm"
        align="start"
        justify="space-between"
    >
        <Box>
            <Text fontSize="sm" color="neutral.subtext" fontWeight="medium" mb={1}>
                {title}
            </Text>
            <Text fontSize="3xl" fontWeight="bold" color="neutral.dark">
                {value} {suffix && <Text as="span" fontSize="lg" color="neutral.subtext" fontWeight="normal">{suffix}</Text>}
            </Text>
        </Box>
        <Flex p={3} borderRadius="xl" bg={iconBgColor} color={iconColor}>
            <IconComponent size={24} />
        </Flex>
    </Flex>
)
