import { Box, Flex, Text, Button, IconButton } from "@chakra-ui/react"
import { ArrowRight, X } from "lucide-react"

interface AlertCardProps {
    title: string
    message: string
    ctaText: string
    onAction: () => void
    onDismiss?: () => void
}

export const AlertCard = ({ title, message, ctaText, onAction, onDismiss }: AlertCardProps) => (
    <Flex
        bg="red.500"
        p={6}
        borderRadius="2xl"
        shadow="md"
        color="white"
        direction="column"
        justify="space-between"
        position="relative"
        overflow="hidden"
    >
        <Box
            position="absolute"
            top={0}
            right={0}
            w={32}
            h={32}
            bg="white"
            opacity={0.1}
            borderRadius="full"
            transform="translate(50%, -50%)"
            filter="blur(24px)"
        />
        <Flex justify="space-between" align="flex-start" position="relative" zIndex={10}>
            <Box>
                <Text color="red.100" fontWeight="bold" fontSize="sm" mb={1} textTransform="uppercase" letterSpacing="wide">
                    {title}
                </Text>
                <Text fontSize="sm" opacity={0.95} maxW="100%">
                    {message}
                </Text>
            </Box>
            {onDismiss && (
                <IconButton 
                    aria-label="Dismiss alert"
                    bg="transparent"
                    _hover={{ bg: "whiteAlpha.200" }}
                    onClick={onDismiss}
                    size="sm"
                    color="white"
                >
                    <X size={18} />
                </IconButton>
            )}
        </Flex>
        <Button
            variant="plain"
            onClick={onAction}
            mt={4}
            w="fit-content"
            fontSize="sm"
            fontWeight="bold"
            color="white"
            p={0}
            _hover={{ color: "red.100" }}
            display="flex"
            alignItems="center"
            gap={1}
            position="relative"
            zIndex={10}
        >
            {ctaText} <ArrowRight size={16} />
        </Button>
    </Flex>
)
