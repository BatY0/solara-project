import { Box, Button, Container, Heading, Text, VStack, Stack } from "@chakra-ui/react"
import { Link as RouterLink } from "react-router-dom"
import { Logo } from "../../components/ui/Logo"

export const Home = () => {
  return (
    <Box minH="100vh" bgGradient="to-br" gradientFrom="itten.deepTeal" gradientTo="itten.midnightBlue" color="white">
      <Box as="header" p={4} bg="black/10" backdropFilter="blur(10px)" borderBottom="1px solid" borderColor="white/10">
        <Container maxW="container.xl">
          <Stack direction="row" justify="space-between" align="center">
            <Box color="white">
              <Logo />
            </Box>
            <Button as={RouterLink} to="/login" variant="solid" bg="itten.emerald" color="white" _hover={{ bg: "itten.mint", color: "itten.midnightBlue" }}>
              Login
            </Button>
          </Stack>
        </Container>
      </Box>

      <Container maxW="container.md" centerContent py={20}>
        <VStack gap={8} textAlign="center">
          <Heading size="4xl" color="white" fontWeight="bold" textShadow="0 2px 4px rgba(0,0,0,0.3)">
            Welcome to Solara
          </Heading>
          <Text fontSize="2xl" color="itten.paleBlue" maxW="2xl" fontWeight="medium">
            IoT and Machine Learning Based Smart Crop Recommendation and Field Management System
          </Text>
          <Button as={RouterLink} to="/register" size="xl" bg="itten.emerald" color="white" _hover={{ bg: "itten.mint", color: "itten.midnightBlue" }} px={8} py={4} fontSize="lg" borderRadius="full" shadow="lg">
            Get Started
          </Button>
        </VStack>
      </Container>
      
      {/* Decorative organic shape overlay - adjusted for dark mode */}
      <Box position="absolute" bottom="0" left="0" right="0" height="40vh" bgGradient="to-t" gradientFrom="black/40" gradientTo="transparent" opacity="0.6" zIndex="-1" pointerEvents="none" />
    </Box>
  )
}
