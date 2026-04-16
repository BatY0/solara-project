import { useState, useEffect } from "react"
import { Box, Flex, IconButton, Text, Circle } from "@chakra-ui/react"
import { Menu, Bell } from "lucide-react"
import { Sidebar } from "./Sidebar"
import { useNavigate } from "react-router-dom"
import { alertsService } from "../../features/alerts/alerts.service"

interface DashboardLayoutProps {
    children: React.ReactNode
    title: string
    subtitle?: string
    actions?: React.ReactNode
}

export const DashboardLayout = ({ children, title, subtitle, actions }: DashboardLayoutProps) => {
    const navigate = useNavigate()
    const [unreadCount, setUnreadCount] = useState(0)

    useEffect(() => {
        const fetchCount = async () => {
            try {
                const count = await alertsService.getUnreadCount()
                setUnreadCount(count)
            } catch (err) {
                console.error("Failed to fetch unread notification count", err)
            }
        }
        
        fetchCount(); // initial fetch
        const interval = setInterval(fetchCount, 60000); // Poll every 60s
        
        const handleRefresh = () => fetchCount();
        window.addEventListener('notificationsRead', handleRefresh);
        
        return () => {
            clearInterval(interval);
            window.removeEventListener('notificationsRead', handleRefresh);
        }
    }, []);

    return (
        <Flex minH="100vh" bg="neutral.canvas" fontFamily="body" color="neutral.text">
            <Sidebar />

            <Flex flex={1} direction="column" minW={0} overflowY="auto" pb={{ base: 20, md: 0 }}>
                {/* HEADER */}
                <Box
                    as="header"
                    bg="white"
                    borderBottom="1px solid"
                    borderColor="neutral.border"
                    position="sticky"
                    top={0}
                    zIndex={20}
                >
                    <Box maxW="container.xl" mx="auto" px={{ base: 4, sm: 6, lg: 8 }}>
                        <Flex justify="space-between" align="center" h="80px">
                            {/* Left Side (Title & Mobile Menu) */}
                            <Flex align="center" gap={4}>
                                <IconButton
                                    aria-label="Open menu"
                                    variant="ghost"
                                    display={{ base: "flex", md: "none" }}
                                    color="neutral.subtext"
                                    _hover={{ color: "brand.500" }}
                                >
                                    <Menu size={24} />
                                </IconButton>
                                <Box>
                                    <Text fontSize="2xl" fontWeight="bold" color="neutral.dark">
                                        {title}
                                    </Text>
                                    {subtitle && (
                                        <Text fontSize="sm" color="neutral.subtext" display={{ base: "none", sm: "block" }}>
                                            {subtitle}
                                        </Text>
                                    )}
                                </Box>
                            </Flex>

                            {/* Right Side (Actions) */}
                            <Flex align="center" gap={4}>
                                <Box 
                                    position="relative" 
                                    cursor="pointer" 
                                    color="neutral.subtext" 
                                    transition="colors 0.2s" 
                                    _hover={{ color: "brand.500" }}
                                    onClick={() => navigate('/alerts')}
                                >
                                    <Bell size={24} />
                                    {unreadCount > 0 && (
                                        <Circle
                                            size="14px"
                                            bg="accent.500"
                                            position="absolute"
                                            top="-1"
                                            right="-2"
                                            border="2px solid white"
                                            color="white"
                                            fontSize="9px"
                                            fontWeight="bold"
                                        >
                                            {unreadCount > 9 ? '9+' : unreadCount}
                                        </Circle>
                                    )}
                                </Box>

                                {actions}
                            </Flex>
                        </Flex>
                    </Box>
                </Box>

                {/* PAGE CONTENT */}
                <Box as="main" maxW="container.xl" w="full" mx="auto" px={{ base: 4, sm: 6, lg: 8 }} py={8}>
                    {children}
                </Box>
            </Flex>
        </Flex>
    )
}
