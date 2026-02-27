import { Box, Flex, Text, Button } from "@chakra-ui/react"
import { ArrowRight } from "lucide-react"

interface AlertCardProps {
    title: string
    message: string
    ctaText: string
    onAction: () => void
}

export const AlertCard = ({ title, message, ctaText, onAction }: AlertCardProps) => (
    <Flex
        bgGradient="to-br"
        gradientFrom="neutral.dark"
        gradientTo="slate.800"
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
            opacity={0.05}
            borderRadius="full"
            transform="translate(50%, -50%)"
            filter="blur(24px)"
        />
        <Box position="relative" zIndex={10}>
            <Text color="accent.500" fontWeight="medium" fontSize="sm" mb={1}>
                {title}
            </Text>
            <Text fontSize="sm" opacity={0.9} maxW="80%">
                {message}
            </Text>
        </Box>
        <Button
            variant="plain"
            onClick={onAction}
            mt={4}
            w="fit-content"
            fontSize="sm"
            fontWeight="bold"
            color="white"
            p={0}
            _hover={{ color: "accent.500" }}
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
