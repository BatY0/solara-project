import { Box, Flex, Text, Button, chakra } from '@chakra-ui/react';
import { Globe, Save } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '../../components/layout/DashboardLayout';

export const Settings = () => {
    const { t, i18n } = useTranslation();

    const handleLanguageChange = (lng: string) => {
        i18n.changeLanguage(lng);
    };

    return (
        <DashboardLayout title={t('settings.title')} subtitle={t('settings.subtitle')}>
            <Flex direction="column" gap={8} maxW="3xl">
                <Box bg="white" borderRadius="2xl" border="1px solid" borderColor="gray.200" shadow="sm" overflow="hidden">
                    <Flex direction="column" p={6}>
                        <Text fontSize="lg" fontWeight="bold" color="gray.800" mb={4}>
                            {t('settings.language')}
                        </Text>

                        <Flex align="center" justify="space-between">
                            <Flex gap={4} align="center">
                                <Flex w={12} h={12} bg="blue.50" borderRadius="xl" align="center" justify="center">
                                    <Globe color="#3b82f6" size={24} />
                                </Flex>
                                <Box>
                                    <Text fontWeight="medium" color="gray.700">{t('settings.language_desc')}</Text>
                                    <Text fontSize="sm" color="gray.500">
                                        {i18n.language === 'en' ? 'English' : 'Türkçe'}
                                    </Text>
                                </Box>
                            </Flex>

                            <chakra.select
                                p={2}
                                bg="gray.50"
                                borderRadius="lg"
                                border="1px solid"
                                borderColor="gray.200"
                                value={i18n.language}
                                onChange={(e: any) => handleLanguageChange(e.target.value)}
                            >
                                <option value="tr">Türkçe</option>
                                <option value="en">English</option>
                            </chakra.select>
                        </Flex>
                    </Flex>

                    <Flex p={4} bg="gray.50" borderTop="1px solid" borderColor="gray.100" justify="flex-end">
                        <Button
                            display="flex" alignItems="center" gap={2} px={6} py={4}
                            bg="brand.500" color="white" fontWeight="bold" borderRadius="xl"
                            _hover={{ bg: "brand.600" }} shadow="md"
                        >
                            <Save size={18} /> {t('settings.save')}
                        </Button>
                    </Flex>
                </Box>
            </Flex>
        </DashboardLayout>
    );
};
