import { Box, Flex, Text, VStack, Link as ChakraLink, IconButton, HStack } from "@chakra-ui/react"
import { LayoutDashboard, MapPin, BookOpen, Settings, Sprout, LogOut, Radio, Bell, X } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Link, useLocation } from "react-router-dom"
import { useEffect } from "react"
import { useAuth } from "../../features/auth/useAuth"

interface SidebarProps {
    mobileMenuOpen?: boolean
    onMobileClose?: () => void
}

export const Sidebar = ({ mobileMenuOpen = false, onMobileClose }: SidebarProps) => {
    const { t } = useTranslation()
    const location = useLocation()
    const { user, logout } = useAuth()
    const isAdmin = String(user?.role ?? "").toUpperCase().includes("ADMIN")

    const navItems = isAdmin
        ? [
            { path: "/admin/devices", icon: Radio, label: t("sidebar.iot_devices") },
            { path: "/admin/crop-guides", icon: BookOpen, label: t("sidebar.crop_guide_admin") },
            { path: "/guide", icon: BookOpen, label: t("sidebar.guide") },
            { path: "/settings", icon: Settings, label: t("sidebar.settings") },
        ]
        : [
            { path: "/dashboard", icon: LayoutDashboard, label: t("sidebar.dashboard") },
            { path: "/fields", icon: MapPin, label: t("sidebar.fields") },
            { path: "/guide", icon: BookOpen, label: t("sidebar.guide") },
            { path: "/alerts", icon: Bell, label: t("sidebar.alerts", { defaultValue: "Alerts" }) },
            { path: "/settings", icon: Settings, label: t("sidebar.settings") },
        ]

    useEffect(() => {
        onMobileClose?.()
        // Close mobile menu only when route changes.
        // Intentionally not depending on callback identity to avoid closing every render.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.pathname])

    return (
        <>
            <Flex
                as="aside"
                w="256px"
                h="100vh"
                bg="solara.midnightSlate"
                flexDirection="column"
                display={{ base: "none", md: "flex" }}
                flexShrink={0}
                transition="all 0.3s"
                zIndex={30}
                position="sticky"
                top={0}
            >
                <Flex h="80px" align="center" px={6} borderBottom="1px solid" borderColor="whiteAlpha.200">
                    <Flex align="center" gap={2}>
                        <Flex bg="brand.500" p={1.5} borderRadius="lg" opacity={0.8}>
                            <Sprout size={24} color="#10B981" />
                        </Flex>
                        <Text fontSize="xl" fontWeight="bold" color="white" letterSpacing="wide">
                            Solara
                        </Text>
                    </Flex>
                </Flex>

                <VStack as="nav" flex={1} p={4} gap={2} align="stretch" overflowY="auto">
                    {navItems.map((item) => {
                        const isActive = location.pathname.startsWith(item.path)
                        return (
                            <ChakraLink
                                asChild
                                key={item.path}
                                variant="plain"
                                _hover={{ textDecoration: "none" }}
                                _focus={{ outline: "none", boxShadow: "none" }}
                                _focusVisible={{ outline: "none", boxShadow: "none" }}
                            >
                                <Link to={item.path} style={{ outline: "none", boxShadow: "none" }}>
                                    <Flex
                                        align="center"
                                        gap={3}
                                        px={4}
                                        py={3}
                                        borderRadius="xl"
                                        bg={isActive ? "brand.500" : "transparent"}
                                        color={isActive ? "white" : "neutral.subtext"}
                                        fontWeight="medium"
                                        transition="colors 0.2s"
                                        shadow={isActive ? "lg" : "none"}
                                        _hover={!isActive ? { bg: "whiteAlpha.100", color: "white" } : {}}
                                    >
                                        <item.icon size={20} />
                                        <Text>{item.label}</Text>
                                    </Flex>
                                </Link>
                            </ChakraLink>
                        )
                    })}
                </VStack>

                <Box p={4} borderTop="1px solid" borderColor="whiteAlpha.200">
                    {/* User info */}
                    <Flex
                        align="center"
                        gap={3}
                        px={4}
                        py={2}
                        borderRadius="xl"
                    >
                        <Flex
                            w={9} h={9} borderRadius="full"
                            bg="brand.500" align="center" justify="center"
                            fontSize="sm" fontWeight="bold" color="white"
                        >
                            {user?.name?.[0] || ""}{user?.surname?.[0] || ""}
                        </Flex>
                        <Box>
                            <Text fontSize="sm" fontWeight="medium" color="white">
                                {user?.name} {user?.surname}
                            </Text>
                            <Text fontSize="xs" color="neutral.subtext">
                                {isAdmin ? t("sidebar.admin") : t("sidebar.farmer")}
                            </Text>
                        </Box>
                    </Flex>

                    {/* Logout button */}
                    <Flex
                        align="center" gap={3}
                        px={4} py={3} mt={1}
                        borderRadius="xl"
                        cursor="pointer"
                        color="neutral.subtext"
                        transition="all 0.2s"
                        _hover={{ bg: "red.900", color: "red.300" }}
                        onClick={logout}
                    >
                        <LogOut size={18} />
                        <Text fontSize="sm" fontWeight="medium">{t("sidebar.logout")}</Text>
                    </Flex>
                </Box>
            </Flex>

            {mobileMenuOpen && (
                <>
                    <Box
                        display={{ base: "block", md: "none" }}
                        position="fixed"
                        inset={0}
                        bg="blackAlpha.600"
                        zIndex={1400}
                        onClick={onMobileClose}
                    />
                    <Flex
                        display={{ base: "flex", md: "none" }}
                        position="fixed"
                        left={0}
                        top={0}
                        bottom={0}
                        w="280px"
                        bg="solara.midnightSlate"
                        zIndex={1500}
                        direction="column"
                        boxShadow="2xl"
                    >
                        <Flex h="72px" align="center" justify="space-between" px={5} borderBottom="1px solid" borderColor="whiteAlpha.200">
                            <HStack gap={2}>
                                <Flex bg="brand.500" p={1.5} borderRadius="lg" opacity={0.8}>
                                    <Sprout size={20} color="#10B981" />
                                </Flex>
                                <Text fontSize="lg" fontWeight="bold" color="white">Solara</Text>
                            </HStack>
                            <IconButton aria-label="Close menu" variant="ghost" color="white" onClick={onMobileClose}>
                                <X size={20} />
                            </IconButton>
                        </Flex>

                        <VStack as="nav" flex={1} p={4} gap={2} align="stretch" overflowY="auto">
                            {navItems.map((item) => {
                                const isActive = location.pathname.startsWith(item.path)
                                return (
                                    <ChakraLink
                                        asChild
                                        key={`mobile-${item.path}`}
                                        variant="plain"
                                        _hover={{ textDecoration: "none" }}
                                        _focus={{ outline: "none", boxShadow: "none" }}
                                        _focusVisible={{ outline: "none", boxShadow: "none" }}
                                    >
                                        <Link to={item.path} style={{ outline: "none", boxShadow: "none" }}>
                                            <Flex
                                                align="center"
                                                gap={3}
                                                px={4}
                                                py={3}
                                                borderRadius="xl"
                                                bg={isActive ? "brand.500" : "transparent"}
                                                color={isActive ? "white" : "neutral.subtext"}
                                                fontWeight="medium"
                                                transition="colors 0.2s"
                                                _hover={!isActive ? { bg: "whiteAlpha.100", color: "white" } : {}}
                                            >
                                                <item.icon size={20} />
                                                <Text>{item.label}</Text>
                                            </Flex>
                                        </Link>
                                    </ChakraLink>
                                )
                            })}
                        </VStack>

                        <Box p={4} borderTop="1px solid" borderColor="whiteAlpha.200">
                            <Flex
                                align="center"
                                gap={3}
                                px={4}
                                py={2}
                                borderRadius="xl"
                            >
                                <Flex
                                    w={9}
                                    h={9}
                                    borderRadius="full"
                                    bg="brand.500"
                                    align="center"
                                    justify="center"
                                    fontSize="sm"
                                    fontWeight="bold"
                                    color="white"
                                >
                                    {user?.name?.[0] || ""}{user?.surname?.[0] || ""}
                                </Flex>
                                <Box>
                                    <Text fontSize="sm" fontWeight="medium" color="white">
                                        {user?.name} {user?.surname}
                                    </Text>
                                    <Text fontSize="xs" color="neutral.subtext">
                                        {isAdmin ? t("sidebar.admin") : t("sidebar.farmer")}
                                    </Text>
                                </Box>
                            </Flex>

                            <Flex
                                align="center"
                                gap={3}
                                px={4}
                                py={3}
                                mt={1}
                                borderRadius="xl"
                                cursor="pointer"
                                color="neutral.subtext"
                                transition="all 0.2s"
                                _hover={{ bg: "red.900", color: "red.300" }}
                                onClick={logout}
                            >
                                <LogOut size={18} />
                                <Text fontSize="sm" fontWeight="medium">{t("sidebar.logout")}</Text>
                            </Flex>
                        </Box>
                    </Flex>
                </>
            )}
        </>
    )
}
