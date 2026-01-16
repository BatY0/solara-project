import { Box, Container, Heading, Text, Button, HStack } from "@chakra-ui/react"
import { useAuth } from "../../features/auth/useAuth"
import { Logo } from "../../components/ui/Logo"
import { useNavigate } from "react-router-dom"

export const Dashboard = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  return (
    <Box minH="100vh" bgGradient="to-br" gradientFrom="itten.deepTeal" gradientTo="itten.midnightBlue">
      <Box as="header" bg="black/10" backdropFilter="blur(10px)" shadow="sm" py={4} borderBottom="1px solid" borderColor="white/10">
        <Container maxW="container.xl">
          <HStack justify="space-between">
            <Box color="white">
              <Logo />
            </Box>
            <HStack gap={4}>
              <Text fontSize="sm" fontWeight="medium" color="white/90">
                {user?.email}
              </Text>
              <Button 
                size="sm" 
                variant="outline" 
                borderColor="itten.emerald" 
                color="itten.emerald" 
                _hover={{ bg: "itten.emerald", color: "white" }}
                onClick={handleLogout}
              >
                Logout
              </Button>
            </HStack>
          </HStack>
        </Container>
      </Box>

      <Container maxW="container.xl" py={8}>
        <Heading size="2xl" mb={6} color="white">Dashboard</Heading>
        <Box bg="white/10" backdropFilter="blur(8px)" p={6} borderRadius="lg" shadow="lg" minH="400px" border="1px solid" borderColor="white/10">
          <Text color="itten.paleBlue">
            Welcome to your dashboard. This area is ready for content.
          </Text>
        </Box>
      </Container>
    </Box>
  )
}
