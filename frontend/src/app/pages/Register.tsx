import { useState, useEffect } from "react"
import { Box, Button, Heading, Input, VStack, Text, Link, IconButton, HStack, Flex, Icon, SimpleGrid } from "@chakra-ui/react"
import { Link as RouterLink, useNavigate } from "react-router-dom"
import { useAuth } from "../../features/auth/useAuth"
import { LanguageSwitcher } from "../../components/ui/LanguageSwitcher"
import { useTranslation } from "react-i18next"
import { User, Mail, Lock, CheckCircle, ArrowLeft, Loader2, AlertCircle, Eye, EyeOff, XCircle } from "lucide-react"
import { Sprout } from "lucide-react"

export const Register = () => {
  const { t } = useTranslation()
  const [name, setName] = useState("")
  const [surname, setSurname] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const { register } = useAuth()
  const navigate = useNavigate()

  // Password Validation State
  const [passwordValidations, setPasswordValidations] = useState({
    length: false,
    uppercase: false,
    number: false,
    special: false
  })

  useEffect(() => {
    setPasswordValidations({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    })
  }, [password])

  const isPasswordValid = Object.values(passwordValidations).every(Boolean)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (password !== confirmPassword) {
      setError(t('register.error_password_match'))
      return
    }

    if (!isPasswordValid) {
      // Technically disabled button prevents this, but good as fallback
      return;
    }

    setIsLoading(true)
    try {
      await register({
        name,
        surname,
        email,
        password
      })
      navigate(`/verify-email?email=${encodeURIComponent(email)}`)
    } catch (err) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      const backendMessage = axiosError?.response?.data?.message;
      setError(backendMessage || t('register.error_failed'))
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const RequirementItem = ({ valid, text }: { valid: boolean, text: string }) => (
    <HStack gap={2} color={valid ? "brand.500" : "neutral.subtext"}>
      <Icon asChild size="sm">
        {valid ? <CheckCircle size={14} /> : <XCircle size={14} />}
      </Icon>
      <Text fontSize="xs" fontWeight={valid ? "medium" : "normal"}>{text}</Text>
    </HStack>
  )

  return (
    <Box minH="100vh" display="flex" flexDirection={{ base: "column", md: "row" }} fontFamily="heading">

      {/* LEFT SIDE (VISUAL) */}
      <Box
        flex="1"
        bg="neutral.dark"
        position="relative"
        display="flex"
        alignItems="center"
        justifyContent="center"
        p={{ base: 8, md: 12 }}
        overflow="hidden"
        color="white"
        order={{ base: 2, md: 1 }}
      >
        {/* Background Overlay */}
        <Box
          position="absolute"
          inset="0"
          bgImage="url('https://images.unsplash.com/photo-1599687267812-35905d212aa7?q=80&w=1000&auto=format&fit=crop')"
          backgroundSize="cover"
          backgroundPosition="center"
          opacity="0.2"
        />

        <Box position="relative" zIndex="10" maxW="lg" w="full">
          <Box mb={8}>
            <Heading size="3xl" fontWeight="bold" mb={4}>{t('register.brand_title')}</Heading>
            <Text color="neutral.subtext" fontSize="lg">{t('register.brand_subtitle')}</Text>
          </Box>

          <VStack gap={4} align="start">
            <Flex gap={4} align="start">
              <Box p={2} bg="brand.500/20" borderRadius="lg" color="brand.400" mt={1}>
                <Icon asChild size="lg"><CheckCircle size={20} /></Icon>
              </Box>
              <Box>
                <Heading size="md" fontWeight="bold" color="white">{t('register.feature_1_title')}</Heading>
                <Text fontSize="sm" color="neutral.subtext">{t('register.feature_1_desc')}</Text>
              </Box>
            </Flex>
            <Flex gap={4} align="start">
              <Box p={2} bg="brand.500/20" borderRadius="lg" color="brand.400" mt={1}>
                <Icon asChild size="lg"><CheckCircle size={20} /></Icon>
              </Box>
              <Box>
                <Heading size="md" fontWeight="bold" color="white">{t('register.feature_2_title')}</Heading>
                <Text fontSize="sm" color="neutral.subtext">{t('register.feature_2_desc')}</Text>
              </Box>
            </Flex>
          </VStack>
        </Box>
      </Box>

      {/* RIGHT SIDE (FORM) */}
      <Box flex="1" bg="white" display="flex" alignItems="center" justifyContent="center" p={8} position="relative" order={{ base: 1, md: 2 }}>
        <Link
          asChild
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
          <RouterLink to="/">
            <Icon asChild size="md"><ArrowLeft size={18} /></Icon>
            Home
          </RouterLink>
        </Link>
        <Box position="absolute" top={8} right={8}>
          <LanguageSwitcher />
        </Box>

        <Box w="full" maxW="md" mt={{ base: 10, md: 0 }}>
          <Box mb={8}>
            <Box w={12} h={12} bg="brand.50" borderRadius="xl" display="flex" alignItems="center" justifyContent="center" mb={4} color="brand.600">
              <Icon asChild size="xl"><Sprout size={24} /></Icon>
            </Box>
            <Heading size="2xl" fontWeight="bold" color="neutral.dark">{t('register.title')}</Heading>
            <Text color="neutral.subtext" mt={2}>{t('register.subtitle')}</Text>
          </Box>

          {error && (
            <Box mb={6} p={4} bg="red.50" borderWidth="1px" borderColor="red.200" borderRadius="xl" display="flex" alignItems="center" gap={3} color="red.700" fontSize="sm">
              <Icon asChild size="md"><AlertCircle size={18} /></Icon>
              {error}
            </Box>
          )}

          <form onSubmit={handleSubmit}>
            <VStack gap={5}>
              {/* First & Last Name Grid */}
              <SimpleGrid columns={2} gap={4} w="full">
                <Box>
                  <Text mb={2} fontSize="sm" fontWeight="semibold" color="neutral.text">{t('register.first_name_label')}</Text>
                  <Box position="relative">
                    <Box position="absolute" left="3" top="50%" transform="translateY(-50%)" color="neutral.subtext" zIndex="2">
                      <User size={18} />
                    </Box>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      pl="9"
                      pr="3"
                      py="2.5"
                      bg="neutral.canvas"
                      borderColor="neutral.border"
                      borderRadius="lg"
                      _focus={{ borderColor: "brand.500", outline: "none", boxShadow: "0 0 0 2px var(--chakra-colors-brand-500-20)" }}
                      fontSize="sm"
                      placeholder={t('register.first_name_placeholder')}
                    />
                  </Box>
                </Box>
                <Box>
                  <Text mb={2} fontSize="sm" fontWeight="semibold" color="neutral.text">{t('register.last_name_label')}</Text>
                  <Input
                    value={surname}
                    onChange={(e) => setSurname(e.target.value)}
                    required
                    px="3"
                    py="2.5"
                    bg="neutral.canvas"
                    borderColor="neutral.border"
                    borderRadius="lg"
                    _focus={{ borderColor: "brand.500", outline: "none", boxShadow: "0 0 0 2px var(--chakra-colors-brand-500-20)" }}
                    fontSize="sm"
                    placeholder={t('register.last_name_placeholder')}
                  />
                </Box>
              </SimpleGrid>

              <Box w="full">
                <Text mb={2} fontSize="sm" fontWeight="semibold" color="neutral.text">{t('register.email_label')}</Text>
                <Box position="relative">
                  <Box position="absolute" left="3" top="50%" transform="translateY(-50%)" color="neutral.subtext" zIndex="2">
                    <Mail size={18} />
                  </Box>
                  <Input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    required
                    pl="9"
                    pr="3"
                    py="2.5"
                    bg="neutral.canvas"
                    borderColor="neutral.border"
                    borderRadius="lg"
                    _focus={{ borderColor: "brand.500", outline: "none", boxShadow: "0 0 0 2px var(--chakra-colors-brand-500-20)" }}
                    fontSize="sm"
                    placeholder={t('register.email_placeholder')}
                  />
                </Box>
              </Box>

              <Box w="full">
                {/* Password Requirements - Moved Here */}
                <Box mb={3} p={3} bg="neutral.canvas" borderRadius="lg">
                  <Text fontSize="xs" fontWeight="semibold" color="neutral.text" mb={2}>
                    {t('register.password_req_title')}
                  </Text>
                  <SimpleGrid columns={2} gap={2}>
                    <RequirementItem valid={passwordValidations.length} text={t('register.password_req_length')} />
                    <RequirementItem valid={passwordValidations.uppercase} text={t('register.password_req_uppercase')} />
                    <RequirementItem valid={passwordValidations.number} text={t('register.password_req_number')} />
                    <RequirementItem valid={passwordValidations.special} text={t('register.password_req_special')} />
                  </SimpleGrid>
                </Box>

                <Text mb={2} fontSize="sm" fontWeight="semibold" color="neutral.text">{t('register.password_label')}</Text>
                <Box position="relative">
                  <Box position="absolute" left="3" top="50%" transform="translateY(-50%)" color="neutral.subtext" zIndex="2">
                    <Lock size={18} />
                  </Box>
                  <Input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type={showPassword ? "text" : "password"}
                    required
                    pl="9"
                    pr="10"
                    py="2.5"
                    bg="neutral.canvas"
                    borderColor={password ? (isPasswordValid ? "brand.500" : "red.300") : "neutral.border"}
                    borderRadius="lg"
                    _focus={{ borderColor: "brand.500", outline: "none", boxShadow: "0 0 0 2px var(--chakra-colors-brand-500-20)" }}
                    fontSize="sm"
                    placeholder={t('register.password_placeholder')}
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

              <Box w="full">
                <Text mb={2} fontSize="sm" fontWeight="semibold" color="neutral.text">{t('register.password_confirm_label')}</Text>
                <Box position="relative">
                  <Box position="absolute" left="3" top="50%" transform="translateY(-50%)" color="neutral.subtext" zIndex="2">
                    <Lock size={18} />
                  </Box>
                  <Input
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    pl="9"
                    pr="10"
                    py="2.5"
                    bg="neutral.canvas"
                    borderColor={confirmPassword && password !== confirmPassword ? "red.300" : "neutral.border"}
                    borderRadius="lg"
                    _focus={{ borderColor: "brand.500", outline: "none", boxShadow: "0 0 0 2px var(--chakra-colors-brand-500-20)" }}
                    fontSize="sm"
                    placeholder={t('register.password_confirm_placeholder')}
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
                    color="neutral.subtext"
                    _hover={{ bg: "transparent", color: "neutral.text" }}
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff /> : <Eye />}
                  </IconButton>
                </Box>
              </Box>

              <Button
                type="submit"
                disabled={isLoading || !isPasswordValid}
                bg="brand.600"
                color="white"
                _hover={{ bg: "brand.700" }}
                w="full"
                py="3"
                h="auto"
                borderRadius="xl"
                shadow="lg"
                shadowColor="brand.200"
                fontWeight="bold"
                mt={4}
                display="flex"
                alignItems="center"
                justifyContent="center"
                gap={2}
                _disabled={{ opacity: 0.7, cursor: "not-allowed", bg: "neutral.subtext" }}
              >
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : t('register.submit')}
              </Button>
            </VStack>
          </form>

          <Box mt={8} pt={6} borderTopWidth="1px" borderColor="neutral.canvas" textAlign="center" fontSize="sm" color="neutral.subtext">
            {t('register.has_account')}{" "}
            <Link asChild color="brand.400" fontWeight="bold" _hover={{ color: "brand.300" }}>
              <RouterLink to="/login">
                {t('register.login_link')}
              </RouterLink>
            </Link>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
