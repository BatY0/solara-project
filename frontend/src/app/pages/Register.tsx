import { useState } from "react"
import { Box, Button, Container, Heading, Input, VStack, Text, Link, HStack, IconButton, SimpleGrid } from "@chakra-ui/react"
import { Link as RouterLink, useNavigate } from "react-router-dom"
import { useAuth } from "../../features/auth/useAuth"
import { Logo } from "../../components/ui/Logo"

// Simple Eye Icons
const EyeIcon = (props: React.ComponentProps<"svg">) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="1em" height="1em" {...props}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)

const EyeOffIcon = (props: React.ComponentProps<"svg">) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="1em" height="1em" {...props}>
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
)

export const Register = () => {
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState("")
  
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    try {
      await register({ 
        firstName, 
        lastName, 
        email, 
        password 
      })
      navigate("/login")
    } catch (err) {
      setError("Registration failed. Please try again.")
      console.error(err)
    }
  }

  return (
    <Box minH="100vh" display="flex" alignItems="center" bgGradient="to-br" gradientFrom="itten.deepTeal" gradientTo="itten.midnightBlue" py={8}>
      <Container maxW="md" bg="white/10" backdropFilter="blur(12px)" p={8} borderRadius="xl" shadow="2xl" border="1px solid" borderColor="white/20">
        <VStack gap={6} align="stretch">
          <Box display="flex" justifyContent="center" color="white">
            <Logo />
          </Box>
          <Heading size="xl" textAlign="center" color="white">Create Account</Heading>
          
          <form onSubmit={handleSubmit}>
            <VStack gap={4}>
              <SimpleGrid columns={2} gap={4} w="full">
                <Box>
                  <Text mb={1} fontSize="sm" fontWeight="medium" color="itten.paleBlue">First Name</Text>
                  <Input 
                    value={firstName} 
                    onChange={(e) => setFirstName(e.target.value)} 
                    required 
                    bg="white/10"
                    borderColor="white/20"
                    _focus={{ borderColor: "itten.emerald", outline: "none", boxShadow: "0 0 0 1px var(--chakra-colors-itten-emerald)", bg: "white/20" }}
                    color="white"
                  />
                </Box>
                <Box>
                  <Text mb={1} fontSize="sm" fontWeight="medium" color="itten.paleBlue">Last Name</Text>
                  <Input 
                    value={lastName} 
                    onChange={(e) => setLastName(e.target.value)} 
                    required 
                    bg="white/10"
                    borderColor="white/20"
                    _focus={{ borderColor: "itten.emerald", outline: "none", boxShadow: "0 0 0 1px var(--chakra-colors-itten-emerald)", bg: "white/20" }}
                    color="white"
                  />
                </Box>
              </SimpleGrid>

              <Box w="full">
                <Text mb={1} fontSize="sm" fontWeight="medium" color="itten.paleBlue">Email</Text>
                <Input 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  type="email" 
                  required 
                  bg="white/10"
                  borderColor="white/20"
                  _focus={{ borderColor: "itten.emerald", outline: "none", boxShadow: "0 0 0 1px var(--chakra-colors-itten-emerald)", bg: "white/20" }}
                  color="white"
                />
              </Box>

              <Box w="full">
                <Text mb={1} fontSize="sm" fontWeight="medium" color="itten.paleBlue">Password</Text>
                <HStack gap={0} position="relative">
                  <Input 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    type={showPassword ? "text" : "password"}
                    required 
                    bg="white/10"
                    borderColor="white/20"
                    _focus={{ borderColor: "itten.emerald", outline: "none", boxShadow: "0 0 0 1px var(--chakra-colors-itten-emerald)", bg: "white/20" }}
                    color="white"
                    pe="2.5rem"
                  />
                  <IconButton
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    variant="ghost"
                    size="sm"
                    position="absolute"
                    right={1}
                    top="50%"
                    transform="translateY(-50%)"
                    zIndex={2}
                    color="white/70"
                    _hover={{ color: "white", bg: "white/10" }}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </IconButton>
                </HStack>
              </Box>

              <Box w="full">
                <Text mb={1} fontSize="sm" fontWeight="medium" color="itten.paleBlue">Confirm Password</Text>
                <HStack gap={0} position="relative">
                  <Input 
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)} 
                    type={showConfirmPassword ? "text" : "password"}
                    required 
                    bg="white/10"
                    borderColor="white/20"
                    _focus={{ borderColor: "itten.emerald", outline: "none", boxShadow: "0 0 0 1px var(--chakra-colors-itten-emerald)", bg: "white/20" }}
                    color="white"
                    pe="2.5rem"
                  />
                  <IconButton
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    variant="ghost"
                    size="sm"
                    position="absolute"
                    right={1}
                    top="50%"
                    transform="translateY(-50%)"
                    zIndex={2}
                    color="white/70"
                    _hover={{ color: "white", bg: "white/10" }}
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </IconButton>
                </HStack>
              </Box>
              {error && <Text color="red.300" fontSize="sm">{error}</Text>}
              <Button type="submit" bg="itten.emerald" color="white" _hover={{ bg: "itten.mint", color: "itten.midnightBlue" }} width="full" mt={2} shadow="md">
                Register
              </Button>
            </VStack>
          </form>

          <Text fontSize="sm" textAlign="center" color="itten.paleBlue">
            Already have an account?{" "}
            <Link as={RouterLink} to="/login" color="itten.emerald" fontWeight="bold">
              Login
            </Link>
          </Text>
        </VStack>
      </Container>
    </Box>
  )
}
