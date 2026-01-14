import { useState } from "react"
import { Box, Button, Container, Heading, Input, VStack, Text, Link, IconButton, HStack, Flex, Icon, Group, InputElement } from "@chakra-ui/react"
import { Link as RouterLink, useNavigate } from "react-router-dom"
import { useAuth } from "../../features/auth/useAuth"
import { Logo } from "../../components/ui/Logo"
import { LanguageSwitcher } from "../../components/ui/LanguageSwitcher"
import { useTranslation } from "react-i18next"
import { Mail, Lock, ArrowRight, Sprout, AlertCircle, Eye, EyeOff, ArrowLeft } from "lucide-react"

export const Login = () => {
  const { t } = useTranslation()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { login, mockLogin } = useAuth()
  const navigate = useNavigate()
  
  const isDev = import.meta.env.DEV;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)
    try {
      await login({ email, password })
      navigate("/dashboard")
    } catch (err) {
      setError(t('login.error_failed'))
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDevLogin = async () => {
      await mockLogin();
      navigate("/dashboard");
  }

  return (
    <Box minH="100vh" display="flex" flexDirection={{ base: "column", md: "row" }} fontFamily="heading">
      
      {/* LEFT SIDE (BRANDING) */}
      <Box 
        flex="1" 
        bg="brand.600" 
        position="relative" 
        display="flex" 
        alignItems="center" 
        justifyContent="center" 
        p={{ base: 8, md: 12 }} 
        overflow="hidden" 
        color="white"
      >
        {/* Background Overlay */}
        <Box 
          position="absolute" 
          inset="0" 
          bgImage="url('https://images.unsplash.com/photo-1625246333195-78d9c38ad449?q=80&w=1000&auto=format&fit=crop')" 
          bgSize="cover" 
          bgPosition="center" 
          opacity="0.2" 
          mixBlendMode="overlay"
        />
        <Box 
          position="absolute" 
          inset="0" 
          bgGradient="to-br" 
          gradientFrom="brand.900/80" 
          gradientTo="brand.600/50" 
        />

        <Box position="relative" zIndex="10" maxW="lg" w="full">
          <HStack gap={3} mb={8} align="center">
            <Box p={3} bg="white/10" backdropFilter="blur(12px)" borderRadius="xl" borderWidth="1px" borderColor="white/20">
              <Icon asChild fontSize="32px" color="brand.50">
                <Sprout size={32} />
              </Icon>
            </Box>
            <Heading size="3xl" fontWeight="bold" letterSpacing="tight">Solara</Heading>
          </HStack>
          
          <Heading size={{ base: "3xl", md: "4xl" }} fontWeight="medium" lineHeight="tight" mb={6}>
            {t('login.brand_title_start')} <br />
            <Box as="span" fontWeight="bold" color="white">{t('login.brand_title_highlight')}</Box> {t('login.brand_title_end')}
          </Heading>
          <Text color="brand.50" fontSize="lg" lineHeight="relaxed" opacity="0.9">
            {t('login.brand_subtitle')}
          </Text>

          <HStack mt={12} pt={8} borderTopWidth="1px" borderColor="white/20" gap={8}>
             <Box>
                <Text fontSize="3xl" fontWeight="bold" color="white">IoT</Text>
                <Text fontSize="xs" color="brand.200" textTransform="uppercase" mt={1} letterSpacing="wider">{t('login.stat_iot')}</Text>
             </Box>
             <Box>
                <Text fontSize="3xl" fontWeight="bold" color="white">AI</Text>
                <Text fontSize="xs" color="brand.200" textTransform="uppercase" mt={1} letterSpacing="wider">{t('login.stat_ai')}</Text>
             </Box>
          </HStack>
        </Box>
      </Box>

      {/* RIGHT SIDE (FORM) */}
      <Box flex="1" bg="neutral.canvas" display="flex" alignItems="center" justifyContent="center" p={8} position="relative">
        <Link 
          as={RouterLink} 
          to="/" 
          position="absolute" 
          top={8} 
          left={8} 
          display="flex" 
          alignItems="center" 
          gap={2} 
          color="neutral.subtext" 
          _hover={{ color: "brand.600" }} 
          fontSize="sm" 
          fontWeight="medium"
        >
            <Icon asChild size="18px"><ArrowLeft size={18} /></Icon> 
            Home
        </Link>
        <Box position="absolute" top={8} right={8}>
          <LanguageSwitcher />
        </Box>

        <Box w="full" maxW="md" bg="white" p={{ base: 8, md: 10 }} borderRadius="2xl" shadow="xl" borderWidth="1px" borderColor="neutral.border">
            
            <Box textAlign="center" mb={8}>
                <Heading size="2xl" fontWeight="bold" color="neutral.dark">{t('login.title')}</Heading>
                <Text color="neutral.subtext" fontSize="sm" mt={2}>{t('login.subtitle')}</Text>
            </Box>

            {error && (
                <Box mb={6} p={4} bg="red.50" borderWidth="1px" borderColor="red.200" borderRadius="xl" display="flex" alignItems="center" gap={3} color="red.700" fontSize="sm">
                    <Icon asChild size="18px"><AlertCircle size={18} /></Icon>
                    {error}
                </Box>
            )}

            <form onSubmit={handleSubmit}>
              <VStack gap={5} align="stretch">
                <Box>
                  <Text mb={2} fontSize="sm" fontWeight="semibold" color="neutral.text" ml={1}>{t('login.email_label')}</Text>
                  <Box position="relative">
                    <Box position="absolute" left="3" top="50%" transform="translateY(-50%)" color="neutral.subtext" zIndex="2">
                      <Mail size={20} />
                    </Box>
                    <Input 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      type="email" 
                      required 
                      pl="10" 
                      pr="4" 
                      py="3" 
                      h="auto"
                      bg="neutral.canvas" 
                      borderColor="neutral.border" 
                      borderRadius="xl"
                      _focus={{ borderColor: "brand.500", outline: "none", boxShadow: "0 0 0 2px var(--chakra-colors-brand-500-20)", bg: "white" }}
                      color="neutral.dark"
                      placeholder={t('login.email_placeholder')}
                      _placeholder={{ color: "neutral.subtext" }}
                    />
                  </Box>
                </Box>

                <Box>
                  <Flex justify="space-between" align="center" ml={1} mb={2}>
                      <Text fontSize="sm" fontWeight="semibold" color="neutral.text">{t('login.password_label')}</Text>
                      <Link fontSize="xs" fontWeight="medium" color="brand.600" _hover={{ textDecoration: "underline" }}>{t('login.forgot_password')}</Link>
                  </Flex>
                  <Box position="relative">
                    <Box position="absolute" left="3" top="50%" transform="translateY(-50%)" color="neutral.subtext" zIndex="2">
                      <Lock size={20} />
                    </Box>
                    <Input 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      type={showPassword ? "text" : "password"}
                      required 
                      pl="10" 
                      pr="10" 
                      py="3" 
                      h="auto"
                      bg="neutral.canvas" 
                      borderColor="neutral.border" 
                      borderRadius="xl"
                      _focus={{ borderColor: "brand.500", outline: "none", boxShadow: "0 0 0 2px var(--chakra-colors-brand-500-20)", bg: "white" }}
                      color="neutral.dark"
                      placeholder={t('login.password_placeholder')}
                      _placeholder={{ color: "neutral.subtext" }}
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
                        color="neutral.subtext"
                        _hover={{ bg: "transparent", color: "neutral.text" }}
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff /> : <Eye />}
                      </IconButton>
                  </Box>
                </Box>

                <Button 
                  type="submit" 
                  disabled={isLoading}
                  bg="brand.500" 
                  color="white" 
                  _hover={{ bg: "brand.600" }} 
                  size="xl" 
                  w="full" 
                  borderRadius="xl"
                  shadow="lg"
                  shadowColor="brand.200"
                  py="3.5"
                  h="auto"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  gap={2}
                  _disabled={{ opacity: 0.7, cursor: "not-allowed" }}
                >
                  {isLoading ? t('login.loading') : <>{t('login.submit')} <Icon asChild><ArrowRight size={20} /></Icon></>}
                </Button>
              </VStack>
            </form>

            <Box mt={8} pt={6} borderTopWidth="1px" borderColor="neutral.canvas" textAlign="center" fontSize="sm" color="neutral.subtext">
                {t('login.no_account')}{' '}
                <Link as={RouterLink} to="/register" color="brand.600" fontWeight="bold" _hover={{ color: "brand.700" }}>
                    {t('login.register_link')}
                </Link>
            </Box>
            
            {isDev && (
                <Box mt={4} textAlign="center">
                    <Button
                        onClick={handleDevLogin}
                        variant="ghost"
                        size="xs"
                        bg="neutral.canvas"
                        px={2}
                        py={1}
                        borderRadius="md"
                        color="neutral.subtext"
                        fontFamily="mono"
                        fontWeight="normal"
                        h="auto"
                    >
                        DEV MODE: demo@solara.com / 123456
                    </Button>
                </Box>
            )}
        </Box>
      </Box>
    </Box>
  )
}
