import {
  Box,
  Button,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  SimpleGrid,
  Icon,
  Flex,
  Image,
  Link
} from "@chakra-ui/react"
import { Link as RouterLink } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Sprout, Wifi, BarChart2, ArrowDown, Database, Layers, Cpu, CheckCircle, LogIn } from "lucide-react"
import { FaGithub } from "react-icons/fa"
import { Logo } from "../../components/ui/Logo"
import { LanguageSwitcher } from "../../components/ui/LanguageSwitcher"
import { keyframes } from "@emotion/react"

const pulse = keyframes`
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.7); }
  70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(245, 158, 11, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); }
`

const bounceSlow = keyframes`
  0%, 100% { transform: translateY(-5%); animation-timing-function: cubic-bezier(0.8, 0, 1, 1); }
  50% { transform: translateY(0); animation-timing-function: cubic-bezier(0, 0, 0.2, 1); }
`

export const Home = () => {
  const { t } = useTranslation()

  return (
    <Box minH="100vh" bg="neutral.canvas" color="neutral.text" fontFamily="heading">

      {/* NAVBAR */}
      <Box
        as="nav"
        position="fixed"
        w="full"
        zIndex={50}
        bg="white/90"
        backdropFilter="blur(12px)"
        borderBottomWidth="1px"
        borderColor="neutral.border"
      >
        <Container maxW="container.xl" px={{ base: 4, md: 8 }}>
          <Flex justify="space-between" h="20" align="center" position="relative">
            {/* Logo */}
            <Logo />

            {/* Desktop Menu - absolutely centered */}
            <HStack
              gap={8}
              display={{ base: "none", md: "flex" }}
              position="absolute"
              left="50%"
              transform="translateX(-50%)"
            >
              <Link asChild variant="plain" fontWeight="medium" color="neutral.text" _hover={{ color: "brand.500" }}>
                <a href="#features">{t('navbar.features')}</a>
              </Link>
              <Link asChild variant="plain" fontWeight="medium" color="neutral.text" _hover={{ color: "brand.500" }}>
                <a href="#how-it-works">{t('navbar.method')}</a>
              </Link>
              <Link asChild variant="plain" fontWeight="medium" color="neutral.text" _hover={{ color: "brand.500" }}>
                <a href="#project-scope">{t('navbar.scope')}</a>
              </Link>
            </HStack>

            {/* Buttons */}
            <HStack gap={4}>
              <LanguageSwitcher />
              <Button
                asChild
                bg="brand.500"
                color="white"
                _hover={{ bg: "brand.600", transform: "translateY(-2px)" }}
                transition="all 0.2s"
                shadow="lg"
                shadowColor="green.200"
                size="md"
                px={5}
                borderRadius="lg"
                fontWeight="bold"
              >
                <RouterLink to="/login">
                  <Icon asChild color="currentColor" fontSize="20px">
                    <LogIn />
                  </Icon>
                  {t('navbar.login')}
                </RouterLink>
              </Button>
            </HStack>
          </Flex>
        </Container>
      </Box>

      {/* HERO SECTION */}
      <Box
        position="relative"
        pt={{ base: 32, lg: 48 }}
        pb={{ base: 20, lg: 32 }}
        overflow="hidden"
        bg="neutral.dark"
      >
        {/* Background Effects */}
        <Box
          position="absolute"
          inset={0}
          opacity={0.1}
          bgImage="url('https://www.transparenttextures.com/patterns/cubes.png')"
        />
        <Box
          position="absolute"
          top={0}
          right={0}
          mr={-20}
          mt={-20}
          w="600px"
          h="600px"
          bg="brand.500"
          borderRadius="full"
          filter="blur(120px)"
          opacity={0.2}
        />
        <Box
          position="absolute"
          bottom={0}
          left={0}
          ml={-20}
          mb={-20}
          w="400px"
          h="400px"
          bg="accent.500"
          borderRadius="full"
          filter="blur(100px)"
          opacity={0.1}
        />

        <Container maxW="container.xl" position="relative" textAlign="center" px={{ base: 4, md: 8 }}>

          {/* Badge */}
          <Box
            display="inline-flex"
            alignItems="center"
            gap={2}
            px={4}
            py={2}
            borderRadius="full"
            bg="white/10"
            borderWidth="1px"
            borderColor="white/20"
            color="accent.500"
            fontSize="sm"
            fontWeight="medium"
            mb={8}
          >
            <Box w={2} h={2} borderRadius="full" bg="accent.500" animation={`${pulse} 2s infinite`} />
            {t('hero.badge')}
          </Box>

          {/* Heading */}
          <Heading
            size={{ base: "4xl", md: "6xl", lg: "7xl" }}
            fontWeight="extrabold"
            color="white"
            letterSpacing="tight"
            mb={8}
            lineHeight="1.1"
          >
            {t('hero.title_start')} <br />
            <Box
              as="span"
              fontWeight="inherit"
              css={{
                backgroundImage: 'linear-gradient(to right, #059669, #6ee7b7)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                color: 'transparent'
              }}
            >
              {t('hero.title_highlight')}
            </Box> {t('hero.title_end')}
          </Heading>

          <Text fontSize={{ base: "lg", md: "xl" }} color="neutral.subtext" maxW="2xl" mx="auto" mb={10}>
            {t('hero.subtitle')}
          </Text>

          <Flex direction={{ base: "column", sm: "row" }} justify="center" gap={4}>
            <Button
              asChild
              size="xl"
              bg="accent.500"
              color="white"
              _hover={{ bg: "accent.600" }}
              px={8}
              py={4}
              h="auto"
              borderRadius="xl"
              fontWeight="bold"
              shadow="lg"
              shadowColor="orange.900/20"
            >
              <a href="#how-it-works">
                {t('hero.cta')}
                <Icon asChild ml={2}>
                  <ArrowDown size={20} />
                </Icon>
              </a>
            </Button>
            <Button
              asChild
              size="xl"
              variant="outline"
              borderColor="white/20"
              color="white"
              _hover={{ bg: "white/10" }}
              px={8}
              py={4}
              h="auto"
              borderRadius="xl"
              fontWeight="bold"
              backdropFilter="blur(4px)"
            >
              <a href="https://github.com/BatY0/solara-project" target="_blank" rel="noopener noreferrer">
                <Icon as={FaGithub} mr={2} fontSize="20px" />
                {t('hero.github')}
              </a>
            </Button>
          </Flex>

          {/* Trust Badges */}
          <HStack
            mt={12}
            pt={8}
            borderTopWidth="1px"
            borderColor="white/10"
            justify="center"
            gap={8}
            opacity={0.6}
            filter="grayscale(100%)"
            _hover={{ filter: "grayscale(0%)", opacity: 1 }}
            transition="all 0.5s"
            wrap="wrap"
          >
            <Flex align="center" gap={2} color="whiteAlpha.800" fontWeight="semibold">
              <Icon asChild boxSize={5}>
                <Database size={20} />
              </Icon>
              NASA Power API
            </Flex>
            <Flex align="center" gap={2} color="whiteAlpha.800" fontWeight="semibold">
              <Icon asChild boxSize={5}>
                <Layers size={20} />
              </Icon>
              SoilGrids
            </Flex>
            <Flex align="center" gap={2} color="whiteAlpha.800" fontWeight="semibold">
              <Icon asChild boxSize={5}>
                <Cpu size={20} />
              </Icon>
              ESP32 IoT
            </Flex>
          </HStack>
        </Container>
      </Box>

      {/* FEATURES SECTION */}
      <Box id="features" py={24} bg="neutral.canvas">
        <Container maxW="container.xl" px={{ base: 4, md: 8 }}>
          <VStack gap={4} textAlign="center" mb={16}>
            <Text color="brand.500" fontWeight="bold" letterSpacing="wide" textTransform="uppercase" fontSize="sm">
              {t('features.label')}
            </Text>
            <Heading size="4xl" fontWeight="bold" color="neutral.dark">
              {t('features.title')}
            </Heading>
            <Text fontSize="lg" color="neutral.text" maxW="2xl">
              {t('features.subtitle')}
            </Text>
          </VStack>

          <SimpleGrid columns={{ base: 1, md: 3 }} gap={10}>
            {/* Feature 1 */}
            <VStack
              bg="white"
              p={8}
              borderRadius="3xl"
              shadow="sm"
              borderWidth="1px"
              borderColor="neutral.border"
              align="start"
              transition="all 0.3s"
              _hover={{ shadow: "xl" }}
              className="group"
            >
              <Flex
                w={14}
                h={14}
                bg="blue.50"
                borderRadius="2xl"
                align="center"
                justify="center"
                mb={6}
                transition="transform 0.3s"
                _groupHover={{ transform: "scale(1.1)" }}
              >
                <Icon asChild boxSize={7} color="blue.500">
                  <Wifi size={28} />
                </Icon>
              </Flex>
              <Heading size="xl" color="neutral.dark" mb={3}>{t('features.iot.title')}</Heading>
              <Text color="neutral.text" lineHeight="relaxed">{t('features.iot.desc')}</Text>
            </VStack>

            {/* Feature 2 */}
            <VStack
              bg="white"
              p={8}
              borderRadius="3xl"
              shadow="sm"
              borderWidth="1px"
              borderColor="neutral.border"
              align="start"
              transition="all 0.3s"
              _hover={{ shadow: "xl" }}
              className="group"
            >
              <Flex
                w={14}
                h={14}
                bg="brand.100"
                borderRadius="2xl"
                align="center"
                justify="center"
                mb={6}
                transition="transform 0.3s"
                _groupHover={{ transform: "scale(1.1)" }}
              >
                <Icon asChild boxSize={7} color="brand.500">
                  <Sprout size={28} />
                </Icon>
              </Flex>
              <Heading size="xl" color="neutral.dark" mb={3}>{t('features.recommendation.title')}</Heading>
              <Text color="neutral.text" lineHeight="relaxed">{t('features.recommendation.desc')}</Text>
            </VStack>

            {/* Feature 3 */}
            <VStack
              bg="white"
              p={8}
              borderRadius="3xl"
              shadow="sm"
              borderWidth="1px"
              borderColor="neutral.border"
              align="start"
              transition="all 0.3s"
              _hover={{ shadow: "xl" }}
              className="group"
            >
              <Flex
                w={14}
                h={14}
                bg="orange.50"
                borderRadius="2xl"
                align="center"
                justify="center"
                mb={6}
                transition="transform 0.3s"
                _groupHover={{ transform: "scale(1.1)" }}
              >
                <Icon asChild boxSize={7} color="accent.500">
                  <BarChart2 size={28} />
                </Icon>
              </Flex>
              <Heading size="xl" color="neutral.dark" mb={3}>{t('features.xai.title')}</Heading>
              <Text color="neutral.text" lineHeight="relaxed">{t('features.xai.desc')}</Text>
            </VStack>
          </SimpleGrid>
        </Container>
      </Box>

      {/* HOW IT WORKS */}
      <Box id="how-it-works" py={24} bg="white" borderTopWidth="1px" borderColor="neutral.border">
        <Container maxW="container.xl" px={{ base: 4, md: 8 }}>
          <SimpleGrid columns={{ base: 1, lg: 2 }} gap={16} alignItems="center">

            <Box>
              <Heading size="4xl" fontWeight="bold" color="neutral.dark" mb={6}>
                {t('steps.title')}
              </Heading>
              <Text fontSize="lg" color="neutral.text" mb={8}>
                {t('steps.subtitle')}
              </Text>

              <VStack align="start" gap={8} w="full">
                <HStack gap={4} align="start">
                  <Flex shrink={0} w={10} h={10} borderRadius="full" bg="brand.500" color="white" align="center" justify="center" fontWeight="bold">1</Flex>
                  <Box>
                    <Heading size="lg" fontWeight="bold" color="neutral.dark">{t('steps.step1.title')}</Heading>
                    <Text color="neutral.text" mt={1}>{t('steps.step1.desc')}</Text>
                  </Box>
                </HStack>
                <HStack gap={4} align="start">
                  <Flex shrink={0} w={10} h={10} borderRadius="full" bg="neutral.dark" color="white" align="center" justify="center" fontWeight="bold">2</Flex>
                  <Box>
                    <Heading size="lg" fontWeight="bold" color="neutral.dark">{t('steps.step2.title')}</Heading>
                    <Text color="neutral.text" mt={1}>{t('steps.step2.desc')}</Text>
                  </Box>
                </HStack>
                <HStack gap={4} align="start">
                  <Flex shrink={0} w={10} h={10} borderRadius="full" bg="accent.500" color="white" align="center" justify="center" fontWeight="bold">3</Flex>
                  <Box>
                    <Heading size="lg" fontWeight="bold" color="neutral.dark">{t('steps.step3.title')}</Heading>
                    <Text color="neutral.text" mt={1}>{t('steps.step3.desc')}</Text>
                  </Box>
                </HStack>
              </VStack>
            </Box>

            <Box position="relative">
              <Box
                position="absolute"
                inset={0}
                bgGradient="to-tr"
                gradientFrom="brand.500"
                gradientTo="accent.500"
                borderRadius="3xl"
                transform="rotate(3deg)"
                opacity={0.2}
                filter="blur(20px)"
              />
              <Image
                src="https://images.unsplash.com/photo-1586771107445-d3ca888129ff?q=80&w=1000&auto=format&fit=crop"
                alt="Dashboard Preview"
                position="relative"
                borderRadius="3xl"
                shadow="2xl"
                borderWidth="1px"
                borderColor="neutral.border"
              />

              {/* Floating Card */}
              <Box
                position="absolute"
                bottom="-2.5rem"
                left="-2.5rem"
                bg="white"
                p={6}
                borderRadius="2xl"
                shadow="xl"
                borderWidth="1px"
                borderColor="neutral.border"
                maxW="xs"
                display={{ base: "none", md: "block" }}
                animation={`${bounceSlow} 3s infinite`}
              >
                <Flex align="center" gap={3} mb={3}>
                  <Box bg="green.100" p={2} borderRadius="lg">
                    <Icon asChild color="green.600" boxSize={5}>
                      <CheckCircle size={20} />
                    </Icon>
                  </Box>
                  <Box>
                    <Text fontSize="xs" color="gray.500" fontWeight="bold" textTransform="uppercase">{t('steps.card.status')}</Text>
                    <Text fontWeight="bold" color="neutral.dark">{t('steps.card.result')}</Text>
                  </Box>
                </Flex>
                <Box w="full" bg="gray.100" h={2} borderRadius="full" overflow="hidden">
                  <Box bg="brand.500" h="full" w="92%" />
                </Box>
              </Box>
            </Box>
          </SimpleGrid>
        </Container>
      </Box>

      {/* PROJECT INFO / RESEARCH AREA */}
      <Box id="project-scope" py={20}>
        <Container maxW="container.lg" px={{ base: 4, md: 8 }}>
          <Box
            bg="brand.500"
            borderRadius="3xl"
            p={{ base: 8, md: 12 }}
            textAlign="center"
            position="relative"
            overflow="hidden"
            shadow="2xl"
            shadowColor="green.900/30"
          >
            {/* Decorative Circles */}
            <Box position="absolute" top={0} left={0} ml={-10} mt={-10} w={40} h={40} bg="white" opacity={0.1} borderRadius="full" />
            <Box position="absolute" bottom={0} right={0} mr={-10} mb={-10} w={40} h={40} bg="accent.500" opacity={0.2} borderRadius="full" />

            <Heading size={{ base: "3xl", md: "5xl" }} fontWeight="bold" color="white" mb={6}>
              {t('research.title')}
            </Heading>
            <Text color="brand.100" fontSize="lg" mb={10} maxW="2xl" mx="auto">
              {t('research.desc')}
            </Text>

            <Flex justify="center">
              <Button
                asChild
                bg="white"
                color="brand.500"
                px={8}
                py={6}
                borderRadius="xl"
                fontWeight="bold"
                _hover={{ bg: "brand.50" }}
                shadow="lg"
              >
                <a href="#">
                  {t('research.cta')}
                </a>
              </Button>
            </Flex>
          </Box>
        </Container>
      </Box>

      {/* FOOTER */}
      <Box as="footer" bg="neutral.dark" color="whiteAlpha.800" py={12} borderTopWidth="1px" borderColor="slate.800">
        <Container maxW="container.xl" px={{ base: 4, md: 8 }}>
          <Flex direction={{ base: "column", md: "row" }} justify="space-between" align="center" gap={6}>
            <Logo iconBg="white/10" iconColor="brand.500" textColor="white" />
            <Box textAlign={{ base: "center", md: "right" }} fontSize="sm">
              <Text color="whiteAlpha.800">{t('footer.copyright')}</Text>
              <Text mt={1} color="whiteAlpha.600">{t('footer.tubitak')}</Text>
            </Box>
          </Flex>
        </Container>
      </Box>

    </Box>
  )
}
