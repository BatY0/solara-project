import { useState, useEffect } from 'react';
import { Box, Flex, Text, Button, chakra, IconButton, SimpleGrid, HStack, Icon } from '@chakra-ui/react';
import { Globe, Save, CheckCircle, Lock, User as UserIcon, Eye, EyeOff, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { useAuth } from '../../features/auth/useAuth';
import api from '../../lib/axios';
import {
    Input
} from '@chakra-ui/react';

export const Settings = () => {
    const { t, i18n } = useTranslation();
    const [saved, setSaved] = useState(false);

    const handleLanguageChange = (lng: string) => {
        i18n.changeLanguage(lng);
    };

    const handleSave = () => {
        // Persist to localStorage so the language survives page refresh
        localStorage.setItem('i18nextLng', i18n.language);
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
    };

    const { logout, user, updateLocalUser } = useAuth();

    // Profile State
    const [name, setName] = useState(user?.name || '');
    const [surname, setSurname] = useState(user?.surname || '');
    const [profileSuccess, setProfileSuccess] = useState('');
    const [profileError, setProfileError] = useState('');
    const [isSavingProfile, setIsSavingProfile] = useState(false);

    // Password State
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [pwdSuccess, setPwdSuccess] = useState('');
    const [pwdError, setPwdError] = useState('');
    const [isSavingPwd, setIsSavingPwd] = useState(false);

    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    // Password Validation State
    const [passwordValidations, setPasswordValidations] = useState({
        length: false,
        uppercase: false,
        number: false,
        special: false
    });

    useEffect(() => {
        setPasswordValidations({
            length: newPassword.length >= 8,
            uppercase: /[A-Z]/.test(newPassword),
            number: /[0-9]/.test(newPassword),
            special: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword)
        });
    }, [newPassword]);

    const isPasswordValid = Object.values(passwordValidations).every(Boolean);

    const [isOpen, setIsOpen] = useState(false);
    const [verificationCode, setVerificationCode] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [delError, setDelError] = useState('');
    const [delSuccess, setDelSuccess] = useState('');

    const handleRequestDeletion = async () => {
        setDelError('');
        setDelSuccess('');
        try {
            await api.post('/users/me/delete-request');
            setIsOpen(true); // Open modal to enter code
            setDelSuccess(t('settings.delete_code_sent'));
        } catch (error) {
            setDelError(t('settings.delete_request_failed'));
            setTimeout(() => setDelError(''), 3000);
        }
    };

    const handleConfirmDeletion = async () => {
        setIsDeleting(true);
        setDelError('');
        try {
            await api.delete('/users/me/delete-confirm', { data: { email: user?.email, code: verificationCode } });
            setIsOpen(false);
            logout(); // Log user out and redirect
        } catch (error: any) {
            setDelError(error.response?.data?.message || t('settings.delete_failed'));
            setTimeout(() => setDelError(''), 3000);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleUpdateProfile = async () => {
        setProfileError('');
        setProfileSuccess('');
        setIsSavingProfile(true);
        try {
            const { data } = await api.put('/users/me/profile', { name, surname });
            updateLocalUser(data);
            setProfileSuccess(t('settings.update_profile_success'));
            setTimeout(() => setProfileSuccess(''), 3000);
        } catch (error: any) {
            setProfileError(error.response?.data?.message || t('settings.update_profile_error', 'Profile update failed'));
            setTimeout(() => setProfileError(''), 3000);
        } finally {
            setIsSavingProfile(false);
        }
    };

    const handleUpdatePassword = async () => {
        setPwdError('');
        setPwdSuccess('');
        if (newPassword !== confirmNewPassword) {
            setPwdError(t('settings.password_mismatch'));
            setTimeout(() => setPwdError(''), 3000);
            return;
        }
        setIsSavingPwd(true);
        try {
            await api.put('/users/me/password', { currentPassword, newPassword });
            setPwdSuccess(t('settings.update_password_success'));
            setCurrentPassword('');
            setNewPassword('');
            setConfirmNewPassword('');
            setTimeout(() => setPwdSuccess(''), 3000);
        } catch (error: any) {
            const backendMsg = error.response?.data?.message;
            if (backendMsg === "Incorrect current password.") {
                setPwdError(t('settings.incorrect_current_password'));
            } else {
                setPwdError(backendMsg || t('settings.update_password_error', 'Password update failed'));
            }
            setTimeout(() => setPwdError(''), 3000);
        } finally {
            setIsSavingPwd(false);
        }
    };

    const RequirementItem = ({ valid, text }: { valid: boolean, text: string }) => (
        <HStack gap={2} color={valid ? "brand.500" : "gray.500"}>
            <Icon asChild size="sm">
                {valid ? <CheckCircle size={14} /> : <XCircle size={14} />}
            </Icon>
            <Text fontSize="xs" fontWeight={valid ? "medium" : "normal"}>{text}</Text>
        </HStack>
    );

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

                    <Flex p={4} bg="gray.50" borderTop="1px solid" borderColor="gray.100" justify="space-between" align="center">
                        {/* Success banner */}
                        {saved && (
                            <Flex align="center" gap={2} color="green.600">
                                <CheckCircle size={16} />
                                <Text fontSize="sm" fontWeight="medium">{t('settings.saved_success')}</Text>
                            </Flex>
                        )}
                        {!saved && <Box />}

                        <Button
                            onClick={handleSave}
                            display="flex" alignItems="center" gap={2} px={6} py={4}
                            bg="brand.500" color="white" fontWeight="bold" borderRadius="xl"
                            _hover={{ bg: "brand.600" }} shadow="md"
                        >
                            <Save size={18} /> {t('settings.save')}
                        </Button>
                    </Flex>
                </Box>

                {/* Profile Details Section */}
                <Box bg="white" borderRadius="2xl" border="1px solid" borderColor="gray.200" shadow="sm" overflow="hidden">
                    <Flex direction="column" p={6}>
                        <Flex align="center" gap={3} mb={6}>
                            <Flex w={10} h={10} bg="blue.50" borderRadius="xl" align="center" justify="center">
                                <UserIcon color="#3b82f6" size={20} />
                            </Flex>
                            <Box>
                                <Text fontSize="lg" fontWeight="bold" color="gray.800">
                                    {t('settings.profile_details')}
                                </Text>
                                <Text fontSize="sm" color="gray.500">{t('settings.profile_desc')}</Text>
                            </Box>
                        </Flex>

                        <Flex gap={4} direction={{ base: "column", md: "row" }} mb={4}>
                            <Box flex={1}>
                                <Text fontSize="sm" fontWeight="medium" mb={1}>{t('settings.name')}</Text>
                                <Input value={name} onChange={(e) => setName(e.target.value)} />
                            </Box>
                            <Box flex={1}>
                                <Text fontSize="sm" fontWeight="medium" mb={1}>{t('settings.surname')}</Text>
                                <Input value={surname} onChange={(e) => setSurname(e.target.value)} />
                            </Box>
                        </Flex>

                        {profileError && <Text color="red.500" fontSize="sm" mb={4}>{profileError}</Text>}
                        {profileSuccess && <Text color="green.500" fontSize="sm" mb={4}>{profileSuccess}</Text>}

                        <Flex justify="flex-end">
                            <Button
                                bg="brand.500" color="white" _hover={{ bg: "brand.600" }}
                                onClick={handleUpdateProfile} loading={isSavingProfile}
                            >
                                {t('settings.update_profile')}
                            </Button>
                        </Flex>
                    </Flex>
                </Box>

                {/* Security Section */}
                <Box bg="white" borderRadius="2xl" border="1px solid" borderColor="gray.200" shadow="sm" overflow="hidden">
                    <Flex direction="column" p={6}>
                        <Flex align="center" gap={3} mb={6}>
                            <Flex w={10} h={10} bg="blue.50" borderRadius="xl" align="center" justify="center">
                                <Lock color="#3b82f6" size={20} />
                            </Flex>
                            <Box>
                                <Text fontSize="lg" fontWeight="bold" color="gray.800">
                                    {t('settings.security')}
                                </Text>
                                <Text fontSize="sm" color="gray.500">{t('settings.security_desc')}</Text>
                            </Box>
                        </Flex>

                        <Flex direction="column" gap={4} mb={4} maxW="md">
                            <Box>
                                <Text fontSize="sm" fontWeight="medium" mb={1}>{t('settings.current_password')}</Text>
                                <Box position="relative">
                                    <Input
                                        type={showCurrent ? "text" : "password"}
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        pr="10"
                                    />
                                    <IconButton
                                        aria-label={showCurrent ? "Hide password" : "Show password"}
                                        variant="ghost" size="sm" position="absolute" right={1} top="50%" transform="translateY(-50%)"
                                        color="gray.500" _hover={{ bg: "transparent", color: "gray.700" }}
                                        onClick={() => setShowCurrent(!showCurrent)}
                                    >
                                        {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </IconButton>
                                </Box>
                            </Box>
                            <Box>
                                {/* Password Requirements display */}
                                {newPassword && !isPasswordValid && (
                                    <Box mb={3} p={3} bg="gray.100" borderRadius="xl" border="1px solid" borderColor="gray.200">
                                        <Text fontSize="xs" fontWeight="semibold" color="gray.700" mb={2}>
                                            {t('register.password_req_title', 'Password Requirements:')}
                                        </Text>
                                        <SimpleGrid columns={2} gap={2}>
                                            <RequirementItem valid={passwordValidations.length} text={t('register.password_req_length', '8+ characters')} />
                                            <RequirementItem valid={passwordValidations.uppercase} text={t('register.password_req_uppercase', 'Uppercase letter')} />
                                            <RequirementItem valid={passwordValidations.number} text={t('register.password_req_number', '1+ number')} />
                                            <RequirementItem valid={passwordValidations.special} text={t('register.password_req_special', '1+ special char')} />
                                        </SimpleGrid>
                                    </Box>
                                )}

                                <Text fontSize="sm" fontWeight="medium" mb={1}>{t('settings.new_password')}</Text>
                                <Box position="relative">
                                    <Input
                                        type={showNew ? "text" : "password"}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        pr="10"
                                        borderColor={newPassword ? (isPasswordValid ? "brand.500" : "red.300") : "gray.200"}
                                        _focus={{ borderColor: "brand.500", boxShadow: "0 0 0 1px var(--chakra-colors-brand-500)" }}
                                    />
                                    <IconButton
                                        aria-label={showNew ? "Hide password" : "Show password"}
                                        variant="ghost" size="sm" position="absolute" right={1} top="50%" transform="translateY(-50%)"
                                        color="gray.500" _hover={{ bg: "transparent", color: "gray.700" }}
                                        onClick={() => setShowNew(!showNew)}
                                    >
                                        {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </IconButton>
                                </Box>
                            </Box>
                            <Box>
                                <Text fontSize="sm" fontWeight="medium" mb={1}>{t('settings.confirm_new_password')}</Text>
                                <Box position="relative">
                                    <Input
                                        type={showConfirm ? "text" : "password"}
                                        value={confirmNewPassword}
                                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                                        pr="10"
                                        borderColor={confirmNewPassword && newPassword !== confirmNewPassword ? "red.300" : "gray.200"}
                                        _focus={{ borderColor: "brand.500", boxShadow: "0 0 0 1px var(--chakra-colors-brand-500)" }}
                                    />
                                    <IconButton
                                        aria-label={showConfirm ? "Hide password" : "Show password"}
                                        variant="ghost" size="sm" position="absolute" right={1} top="50%" transform="translateY(-50%)"
                                        color="gray.500" _hover={{ bg: "transparent", color: "gray.700" }}
                                        onClick={() => setShowConfirm(!showConfirm)}
                                    >
                                        {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </IconButton>
                                </Box>
                            </Box>
                        </Flex>

                        {pwdError && <Text color="red.500" fontSize="sm" mb={4}>{pwdError}</Text>}
                        {pwdSuccess && <Text color="green.500" fontSize="sm" mb={4}>{pwdSuccess}</Text>}

                        <Flex justify="flex-start">
                            <Button
                                bg="brand.500" color="white" _hover={{ bg: "brand.600" }}
                                onClick={handleUpdatePassword} loading={isSavingPwd}
                                disabled={!currentPassword || !newPassword || !confirmNewPassword || !isPasswordValid}
                            >
                                {t('settings.update_password')}
                            </Button>
                        </Flex>
                    </Flex>
                </Box>

                {/* Account Deletion Section */}
                <Box bg="white" borderRadius="2xl" border="1px solid" borderColor="red.200" shadow="sm" overflow="hidden">
                    <Flex direction="column" p={6}>
                        <Text fontSize="lg" fontWeight="bold" color="red.600" mb={4}>
                            {t('settings.danger_zone')}
                        </Text>
                        <Flex align="center" justify="space-between">
                            <Box pr={8}>
                                <Text fontWeight="medium" color="gray.800">{t('settings.delete_account')}</Text>
                                <Text fontSize="sm" color="gray.500">
                                    {t('settings.delete_account_desc')}
                                </Text>
                            </Box>
                            <Button colorScheme="red" onClick={handleRequestDeletion}>
                                {t('settings.delete_account')}
                            </Button>
                        </Flex>
                    </Flex>
                    {delError && (
                        <Box bg="red.50" color="red.600" p={4} borderRadius="xl" mt={4} border="1px solid" borderColor="red.100">
                            {delError}
                        </Box>
                    )}
                    {delSuccess && (
                        <Box bg="blue.50" color="blue.600" p={4} borderRadius="xl" mt={4} border="1px solid" borderColor="blue.100">
                            {delSuccess}
                        </Box>
                    )}
                </Box>

                {/* Custom Overlay Modal for Deletion Verification */}
                {isOpen && (
                    <Box position="fixed" top={0} left={0} w="100vw" h="100vh" bg="blackAlpha.600" zIndex={9999} display="flex" alignItems="center" justifyContent="center">
                        <Box bg="white" w="90%" maxW="md" borderRadius="2xl" p={6} shadow="xl">
                            <Text fontSize="xl" fontWeight="bold" color="red.600" mb={4}>{t('settings.delete_confirm_title')}</Text>
                            <Text mb={4}>{t('settings.delete_confirm_desc')}</Text>
                            <Input
                                placeholder="000000"
                                maxLength={6}
                                value={verificationCode}
                                onChange={(e) => setVerificationCode(e.target.value)}
                                textAlign="center"
                                letterSpacing="widest"
                                fontSize="2xl"
                                py={6}
                                mb={4}
                            />
                            {delError && (
                                <Text color="red.500" fontSize="sm" mb={4} textAlign="center">{delError}</Text>
                            )}
                            <Flex justify="flex-end" gap={3}>
                                <Button variant="ghost" onClick={() => setIsOpen(false)} disabled={isDeleting}>
                                    {t('common.cancel', 'Cancel')}
                                </Button>
                                <Button
                                    bg="red.600"
                                    color="white"
                                    _hover={{ bg: "red.700" }}
                                    onClick={handleConfirmDeletion}
                                    disabled={verificationCode.length !== 6 || isDeleting}
                                >
                                    {isDeleting ? "..." : t('settings.confirm_deletion', 'Permanently Delete')}
                                </Button>
                            </Flex>
                        </Box>
                    </Box>
                )}
            </Flex>
        </DashboardLayout>
    );
};
