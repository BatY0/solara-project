import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Modal,
    KeyboardAvoidingView,
    Platform,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import {
    Globe, Lock, User as UserIcon,
    Eye, EyeOff, AlertTriangle, Settings as SettingsIcon, LogOut,
} from 'lucide-react-native';
import { theme } from '../../src/theme/theme';
import { useAuth } from '../../src/context/AuthContext';
import { storeLanguage } from '../../src/i18n/i18n';
import api from '../../src/api/api';
import { useRouter } from 'expo-router';
import type { PreferredLanguage } from '../../src/types/auth';

const normalizePreferredLanguage = (language: string): PreferredLanguage =>
    language.toLowerCase().startsWith('tr') ? 'tr' : 'en';

export default function SettingsScreen() {
    const { t, i18n } = useTranslation();
    const { user, logout, updateLocalUser } = useAuth();
    const router = useRouter();

    // Profile
    const [name, setName] = useState(user?.name || '');
    const [surname, setSurname] = useState(user?.surname || '');
    const [profileSuccess, setProfileSuccess] = useState('');
    const [profileError, setProfileError] = useState('');
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [languageSuccess, setLanguageSuccess] = useState('');
    const [languageError, setLanguageError] = useState('');

    // Sync form fields when user profile loads (e.g. after login or app init)
    useEffect(() => {
        setName(user?.name || '');
        setSurname(user?.surname || '');
    }, [user?.name, user?.surname]);

    // Password
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [pwdSuccess, setPwdSuccess] = useState('');
    const [pwdError, setPwdError] = useState('');
    const [isSavingPwd, setIsSavingPwd] = useState(false);
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    // Password validation
    const [pwdValids, setPwdValids] = useState({ length: false, uppercase: false, number: false, special: false });
    useEffect(() => {
        setPwdValids({
            length: newPassword.length >= 8,
            uppercase: /[A-Z]/.test(newPassword),
            number: /[0-9]/.test(newPassword),
            special: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
        });
    }, [newPassword]);
    const isPasswordValid = Object.values(pwdValids).every(Boolean);

    // Deletion
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [verificationCode, setVerificationCode] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [delError, setDelError] = useState('');
    const [delSuccess, setDelSuccess] = useState('');

    const handleLanguageChange = async (lng: PreferredLanguage) => {
        setLanguageError('');
        setLanguageSuccess('');
        await i18n.changeLanguage(lng);
        await storeLanguage(lng);

        try {
            const payloadName = (user?.name ?? name).trim();
            const payloadSurname = (user?.surname ?? surname).trim();

            if (!payloadName || !payloadSurname) {
                setLanguageError(t('settings.update_profile_error'));
                return;
            }

            const { data } = await api.put('/users/me/profile', {
                name: payloadName,
                surname: payloadSurname,
                preferredLanguage: lng,
            });

            updateLocalUser({
                name: data.name ?? payloadName,
                surname: data.surname ?? payloadSurname,
                preferredLanguage: data.preferredLanguage ?? lng,
            });

            setLanguageSuccess(t('settings.update_profile_success'));
            setTimeout(() => setLanguageSuccess(''), 3000);
        } catch (error: any) {
            setLanguageError(error.response?.data?.message || t('settings.update_profile_error'));
            setTimeout(() => setLanguageError(''), 3000);
        }
    };

    const handleUpdateProfile = async () => {
        setProfileError(''); setProfileSuccess('');
        setIsSavingProfile(true);
        try {
            const preferredLanguage = normalizePreferredLanguage(i18n.language);
            const { data } = await api.put('/users/me/profile', { name, surname, preferredLanguage });
            updateLocalUser({
                name: data.name ?? name,
                surname: data.surname ?? surname,
                preferredLanguage: data.preferredLanguage ?? preferredLanguage,
            });
            setProfileSuccess(t('settings.update_profile_success'));
            setTimeout(() => setProfileSuccess(''), 3000);
        } catch (error: any) {
            setProfileError(error.response?.data?.message || t('settings.update_profile_error'));
            setTimeout(() => setProfileError(''), 3000);
        } finally {
            setIsSavingProfile(false);
        }
    };

    const handleUpdatePassword = async () => {
        setPwdError(''); setPwdSuccess('');
        if (newPassword !== confirmNewPassword) {
            setPwdError(t('settings.password_mismatch'));
            setTimeout(() => setPwdError(''), 3000);
            return;
        }
        setIsSavingPwd(true);
        try {
            await api.put('/users/me/password', { currentPassword, newPassword });
            setPwdSuccess(t('settings.update_password_success'));
            setCurrentPassword(''); setNewPassword(''); setConfirmNewPassword('');
            setTimeout(() => setPwdSuccess(''), 3000);
        } catch (error: any) {
            const msg = error.response?.data?.message;
            if (msg === 'Incorrect current password.') {
                setPwdError(t('settings.incorrect_current_password'));
            } else {
                setPwdError(msg || t('settings.update_password_error'));
            }
            setTimeout(() => setPwdError(''), 3000);
        } finally {
            setIsSavingPwd(false);
        }
    };

    const handleRequestDeletion = async () => {
        setDelError(''); setDelSuccess('');
        try {
            await api.post('/users/me/delete-request');
            setIsDeleteModalOpen(true);
            setDelSuccess(t('settings.delete_code_sent'));
        } catch {
            setDelError(t('settings.delete_request_failed'));
            setTimeout(() => setDelError(''), 3000);
        }
    };

    const handleConfirmDeletion = async () => {
        setIsDeleting(true); setDelError('');
        try {
            await api.delete('/users/me/delete-confirm', { data: { email: user?.email, code: verificationCode } });
            setIsDeleteModalOpen(false);
            await logout();
            router.replace('/(auth)/login');
        } catch (error: any) {
            setDelError(error.response?.data?.message || t('settings.delete_failed'));
            setTimeout(() => setDelError(''), 3000);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleLogout = () => {
        Alert.alert(
            t('auth.logout_confirm_title'),
            t('auth.logout_confirm_message'),
            [
                {
                    text: t('common.cancel'),
                    style: 'cancel',
                },
                {
                    text: t('common.confirm'),
                    style: 'destructive',
                    onPress: async () => {
                        await logout();
                        router.replace('/(auth)/login');
                    },
                },
            ],
            { cancelable: true },
        );
    };

    const currentLang = normalizePreferredLanguage(i18n.language);

    return (
        <SafeAreaView style={styles.container}>
            {/* HEADER */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>{t('settings.title')}</Text>
                    <Text style={styles.headerSub}>{t('settings.subtitle')}</Text>
                </View>
                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                    <LogOut color={theme.colors.chart.danger} size={20} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

                {/* LANGUAGE SECTION */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <View style={[styles.iconBg, { backgroundColor: '#EFF6FF' }]}>
                            <Globe color="#3b82f6" size={20} />
                        </View>
                        <View>
                            <Text style={styles.cardTitle}>{t('settings.language')}</Text>
                            <Text style={styles.cardSub}>{t('settings.language_desc')}</Text>
                        </View>
                    </View>

                    <View style={styles.langRow}>
                        <TouchableOpacity
                            style={[styles.langBtn, currentLang === 'tr' && styles.langBtnActive]}
                            onPress={() => handleLanguageChange('tr')}
                        >
                            <Text style={[styles.langBtnText, currentLang === 'tr' && styles.langBtnTextActive]}>🇹🇷  Türkçe</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.langBtn, currentLang === 'en' && styles.langBtnActive]}
                            onPress={() => handleLanguageChange('en')}
                        >
                            <Text style={[styles.langBtnText, currentLang === 'en' && styles.langBtnTextActive]}>🇬🇧  English</Text>
                        </TouchableOpacity>
                    </View>
                    {languageError ? <Text style={styles.errorText}>{languageError}</Text> : null}
                    {languageSuccess ? <Text style={styles.successText}>{languageSuccess}</Text> : null}
                </View>

                {/* PROFILE SECTION */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <View style={[styles.iconBg, { backgroundColor: '#EFF6FF' }]}>
                            <UserIcon color="#3b82f6" size={20} />
                        </View>
                        <View>
                            <Text style={styles.cardTitle}>{t('settings.profile_details')}</Text>
                            <Text style={styles.cardSub}>{t('settings.profile_desc')}</Text>
                        </View>
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.fieldLabel}>{t('settings.name')}</Text>
                        <TextInput
                            style={styles.input}
                            value={name}
                            onChangeText={setName}
                            placeholder={t('settings.name')}
                            placeholderTextColor={theme.colors.neutral.subtext}
                        />
                    </View>
                    <View style={styles.formGroup}>
                        <Text style={styles.fieldLabel}>{t('settings.surname')}</Text>
                        <TextInput
                            style={styles.input}
                            value={surname}
                            onChangeText={setSurname}
                            placeholder={t('settings.surname')}
                            placeholderTextColor={theme.colors.neutral.subtext}
                        />
                    </View>

                    {profileError ? <Text style={styles.errorText}>{profileError}</Text> : null}
                    {profileSuccess ? <Text style={styles.successText}>{profileSuccess}</Text> : null}

                    <TouchableOpacity
                        style={[styles.saveBtn, { alignSelf: 'flex-end' }]}
                        onPress={handleUpdateProfile}
                        disabled={isSavingProfile}
                    >
                        {isSavingProfile
                            ? <ActivityIndicator color="#fff" size="small" />
                            : <Text style={styles.saveBtnText}>{t('settings.update_profile')}</Text>}
                    </TouchableOpacity>
                </View>

                {/* SECURITY SECTION */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <View style={[styles.iconBg, { backgroundColor: '#EFF6FF' }]}>
                            <Lock color="#3b82f6" size={20} />
                        </View>
                        <View>
                            <Text style={styles.cardTitle}>{t('settings.security')}</Text>
                            <Text style={styles.cardSub}>{t('settings.security_desc')}</Text>
                        </View>
                    </View>

                    {/* Current password */}
                    <View style={styles.formGroup}>
                        <Text style={styles.fieldLabel}>{t('settings.current_password')}</Text>
                        <View style={styles.passwordRow}>
                            <TextInput
                                style={[styles.input, { flex: 1 }]}
                                secureTextEntry={!showCurrent}
                                value={currentPassword}
                                onChangeText={setCurrentPassword}
                                placeholder="••••••••"
                                placeholderTextColor={theme.colors.neutral.subtext}
                            />
                            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowCurrent(!showCurrent)}>
                                {showCurrent ? <EyeOff color="#6B7280" size={18} /> : <Eye color="#6B7280" size={18} />}
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* New password + requirements */}
                    <View style={styles.formGroup}>
                        {newPassword !== '' && !isPasswordValid && (
                            <View style={styles.requirementsBox}>
                                <Text style={styles.reqTitle}>{t('register.password_req_title')}</Text>
                                <View style={styles.reqGrid}>
                                    <ReqItem valid={pwdValids.length} text={t('register.password_req_length')} />
                                    <ReqItem valid={pwdValids.uppercase} text={t('register.password_req_uppercase')} />
                                    <ReqItem valid={pwdValids.number} text={t('register.password_req_number')} />
                                    <ReqItem valid={pwdValids.special} text={t('register.password_req_special')} />
                                </View>
                            </View>
                        )}
                        <Text style={styles.fieldLabel}>{t('settings.new_password')}</Text>
                        <View style={styles.passwordRow}>
                            <TextInput
                                style={[styles.input, { flex: 1, borderColor: newPassword ? (isPasswordValid ? theme.colors.brand[500] : '#fca5a5') : '#E5E7EB' }]}
                                secureTextEntry={!showNew}
                                value={newPassword}
                                onChangeText={setNewPassword}
                                placeholder="••••••••"
                                placeholderTextColor={theme.colors.neutral.subtext}
                            />
                            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowNew(!showNew)}>
                                {showNew ? <EyeOff color="#6B7280" size={18} /> : <Eye color="#6B7280" size={18} />}
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Confirm password */}
                    <View style={styles.formGroup}>
                        <Text style={styles.fieldLabel}>{t('settings.confirm_new_password')}</Text>
                        <View style={styles.passwordRow}>
                            <TextInput
                                style={[styles.input, { flex: 1, borderColor: confirmNewPassword && newPassword !== confirmNewPassword ? '#fca5a5' : '#E5E7EB' }]}
                                secureTextEntry={!showConfirm}
                                value={confirmNewPassword}
                                onChangeText={setConfirmNewPassword}
                                placeholder="••••••••"
                                placeholderTextColor={theme.colors.neutral.subtext}
                            />
                            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowConfirm(!showConfirm)}>
                                {showConfirm ? <EyeOff color="#6B7280" size={18} /> : <Eye color="#6B7280" size={18} />}
                            </TouchableOpacity>
                        </View>
                    </View>

                    {pwdError ? <Text style={styles.errorText}>{pwdError}</Text> : null}
                    {pwdSuccess ? <Text style={styles.successText}>{pwdSuccess}</Text> : null}

                    <TouchableOpacity
                        style={[styles.saveBtn, (!currentPassword || !newPassword || !confirmNewPassword || !isPasswordValid) && styles.saveBtnDisabled]}
                        onPress={handleUpdatePassword}
                        disabled={!currentPassword || !newPassword || !confirmNewPassword || !isPasswordValid || isSavingPwd}
                    >
                        {isSavingPwd
                            ? <ActivityIndicator color="#fff" size="small" />
                            : <Text style={styles.saveBtnText}>{t('settings.update_password')}</Text>}
                    </TouchableOpacity>
                </View>

                {/* DANGER ZONE */}
                <View style={[styles.card, { borderColor: '#fecaca' }]}>
                    <Text style={styles.dangerTitle}>{t('settings.danger_zone')}</Text>
                    <View style={styles.dangerRow}>
                        <View style={{ flex: 1, paddingRight: 12 }}>
                            <Text style={styles.dangerLabel}>{t('settings.delete_account')}</Text>
                            <Text style={styles.dangerDesc}>{t('settings.delete_account_desc')}</Text>
                        </View>
                        <TouchableOpacity style={styles.deleteBtn} onPress={handleRequestDeletion}>
                            <Text style={styles.deleteBtnText}>{t('settings.delete_account')}</Text>
                        </TouchableOpacity>
                    </View>
                    {delError ? <Text style={[styles.errorText, { marginTop: 8 }]}>{delError}</Text> : null}
                    {delSuccess ? <Text style={[styles.successText, { marginTop: 8 }]}>{delSuccess}</Text> : null}
                </View>

            </ScrollView>

            {/* DELETION CONFIRMATION MODAL */}
            <Modal visible={isDeleteModalOpen} transparent animationType="fade" onRequestClose={() => setIsDeleteModalOpen(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>{t('settings.delete_confirm_title')}</Text>
                        <Text style={styles.modalDesc}>{t('settings.delete_confirm_desc')}</Text>
                        <TextInput
                            style={styles.codeInput}
                            placeholder="000000"
                            placeholderTextColor={theme.colors.neutral.subtext}
                            maxLength={6}
                            keyboardType="number-pad"
                            value={verificationCode}
                            onChangeText={setVerificationCode}
                            textAlign="center"
                        />
                        {delError ? <Text style={[styles.errorText, { textAlign: 'center', marginBottom: 10 }]}>{delError}</Text> : null}
                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={styles.cancelBtn}
                                onPress={() => setIsDeleteModalOpen(false)}
                                disabled={isDeleting}
                            >
                                <Text style={styles.cancelBtnText}>{t('common.cancel')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.confirmDeleteBtn, (verificationCode.length !== 6 || isDeleting) && styles.saveBtnDisabled]}
                                onPress={handleConfirmDeletion}
                                disabled={verificationCode.length !== 6 || isDeleting}
                            >
                                {isDeleting
                                    ? <ActivityIndicator color="#fff" size="small" />
                                    : <Text style={styles.deleteBtnText}>{t('settings.confirm_deletion')}</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

function ReqItem({ valid, text }: { valid: boolean; text: string }) {
    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text style={{ color: valid ? theme.colors.brand[500] : '#9CA3AF', fontSize: 12 }}>
                {valid ? '✓' : '✗'}
            </Text>
            <Text style={{ fontSize: 11, color: valid ? theme.colors.brand[500] : '#9CA3AF', fontWeight: valid ? '600' : '400' }}>
                {text}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.neutral.canvas },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#fff',
        borderBottomWidth: 1, borderBottomColor: theme.colors.neutral.border,
    },
    headerTitle: { fontSize: 22, fontWeight: 'bold', color: theme.colors.neutral.dark },
    headerSub: { fontSize: 13, color: theme.colors.neutral.subtext, marginTop: 2 },
    logoutBtn: { padding: 8 },
    content: { padding: 16, gap: 16, paddingBottom: 40 },
    card: {
        backgroundColor: '#fff', borderRadius: 20, padding: 18, gap: 12,
        borderWidth: 1, borderColor: '#E5E7EB',
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    iconBg: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    cardTitle: { fontSize: 15, fontWeight: 'bold', color: theme.colors.neutral.dark },
    cardSub: { fontSize: 12, color: theme.colors.neutral.subtext, marginTop: 1 },
    cardFooter: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 12 },
    langRow: { flexDirection: 'row', gap: 10 },
    langBtn: {
        flex: 1, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, borderColor: '#E5E7EB',
        alignItems: 'center', backgroundColor: '#F9FAFB',
    },
    langBtnActive: { borderColor: theme.colors.brand[500], backgroundColor: theme.colors.brand[50] },
    langBtnText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
    langBtnTextActive: { color: theme.colors.brand[500] },
    saveBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 18, paddingVertical: 10,
        backgroundColor: theme.colors.brand[500], borderRadius: 12,
    },
    saveBtnDisabled: { opacity: 0.45 },
    saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
    successRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    successText: { fontSize: 13, color: '#16a34a', fontWeight: '500' },
    errorText: { fontSize: 13, color: '#ef4444', fontWeight: '500' },
    formGroup: { gap: 6 },
    fieldLabel: { fontSize: 13, fontWeight: '600', color: '#374151' },
    input: {
        backgroundColor: '#F9FAFB', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB',
        paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: theme.colors.neutral.dark,
    },
    passwordRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    eyeBtn: { padding: 10 },
    requirementsBox: {
        backgroundColor: '#F3F4F6', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 8,
    },
    reqTitle: { fontSize: 12, fontWeight: '700', color: '#374151', marginBottom: 8 },
    reqGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    dangerTitle: { fontSize: 16, fontWeight: 'bold', color: '#DC2626' },
    dangerRow: { flexDirection: 'row', alignItems: 'center' },
    dangerLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 4 },
    dangerDesc: { fontSize: 12, color: theme.colors.neutral.subtext, lineHeight: 18 },
    deleteBtn: { paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#DC2626', borderRadius: 12 },
    deleteBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalCard: { backgroundColor: '#fff', borderRadius: 24, padding: 24, width: '100%', maxWidth: 380 },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#DC2626', marginBottom: 8 },
    modalDesc: { fontSize: 14, color: '#374151', marginBottom: 16, lineHeight: 20 },
    codeInput: {
        borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 14, paddingVertical: 14,
        fontSize: 28, letterSpacing: 12, color: theme.colors.neutral.dark, marginBottom: 16,
        backgroundColor: '#F9FAFB',
    },
    modalActions: { flexDirection: 'row', gap: 10, justifyContent: 'flex-end' },
    cancelBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB' },
    cancelBtnText: { fontSize: 14, fontWeight: '600', color: '#374151' },
    confirmDeleteBtn: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#DC2626', borderRadius: 12 },
});
