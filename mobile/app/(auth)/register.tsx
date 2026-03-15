import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { theme } from '../../src/theme/theme';
import { User, Mail, Lock, Eye, EyeOff, CheckCircle, AlertCircle, ArrowLeft, Sprout } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

export default function RegisterScreen() {
    const [name, setName] = useState('');
    const [surname, setSurname] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { register } = useAuth();
    const router = useRouter();
    const { t } = useTranslation();

    // Password Validation
    const [validations, setValidations] = useState({
        length: false,
        uppercase: false,
        number: false,
        special: false,
    });

    useEffect(() => {
        setValidations({
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            number: /[0-9]/.test(password),
            special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
        });
    }, [password]);

    const isPasswordValid = Object.values(validations).every(Boolean);

    const handleRegister = async () => {
        if (!name || !surname || !email || !password) {
            setError(t('validation.required'));
            return;
        }

        if (password !== confirmPassword) {
            setError(t('auth.register.passwords_no_match'));
            return;
        }

        if (!isPasswordValid) {
            setError(t('auth.register.password_not_valid'));
            return;
        }

        setError('');
        setIsLoading(true);
        try {
            await register({ name, surname, email, password });
            router.push({
                pathname: '/(auth)/verify',
                params: { email, mode: 'verify' }
            });
        } catch (err: any) {
            setError(err.response?.data?.message || t('auth.register.failed'));
        } finally {
            setIsLoading(false);
        }
    };

    const RequirementItem = ({ valid, text }: { valid: boolean, text: string }) => (
        <View style={styles.requirementItem}>
            <CheckCircle color={valid ? theme.colors.brand[500] : theme.colors.neutral.subtext} size={14} />
            <Text style={[styles.requirementText, valid && styles.requirementTextValid]}>{text}</Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <ArrowLeft color={theme.colors.neutral.dark} size={24} />
                </TouchableOpacity>
                <View style={styles.logoSmall}>
                    <Sprout color={theme.colors.brand[500]} size={24} />
                    <Text style={styles.logoText}>Solara</Text>
                </View>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <Text style={styles.title}>{t('auth.register.title')}</Text>
                    <Text style={styles.subtitle}>{t('auth.register.subtitle')}</Text>

                    {error ? (
                        <View style={styles.errorContainer}>
                            <AlertCircle color={theme.colors.chart.danger} size={18} />
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    ) : null}

                    <View style={styles.row}>
                        <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                            <Text style={styles.label}>{t('auth.common.first_name')}</Text>
                            <View style={styles.inputWrapper}>
                                <User color={theme.colors.neutral.subtext} size={18} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder={t('auth.common.first_name_placeholder')}
                                    value={name}
                                    onChangeText={setName}
                                />
                            </View>
                        </View>
                        <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                            <Text style={styles.label}>{t('auth.common.last_name')}</Text>
                            <View style={styles.inputWrapper}>
                                <TextInput
                                    style={styles.input}
                                    placeholder={t('auth.common.last_name_placeholder')}
                                    value={surname}
                                    onChangeText={setSurname}
                                />
                            </View>
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>{t('auth.common.email')}</Text>
                        <View style={styles.inputWrapper}>
                            <Mail color={theme.colors.neutral.subtext} size={18} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder={t('auth.common.email_placeholder')}
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>{t('auth.common.password')}</Text>
                        <View style={styles.inputWrapper}>
                            <Lock color={theme.colors.neutral.subtext} size={18} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="••••••••"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                            />
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                {showPassword ? (
                                    <EyeOff color={theme.colors.neutral.subtext} size={18} />
                                ) : (
                                    <Eye color={theme.colors.neutral.subtext} size={18} />
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.requirementsContainer}>
                        <Text style={styles.requirementsTitle}>{t('register.password_req_title')}</Text>
                        <View style={styles.requirementsGrid}>
                            <RequirementItem valid={validations.length} text={t('register.password_req_length')} />
                            <RequirementItem valid={validations.uppercase} text={t('register.password_req_uppercase')} />
                            <RequirementItem valid={validations.number} text={t('register.password_req_number')} />
                            <RequirementItem valid={validations.special} text={t('register.password_req_special')} />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>{t('auth.common.confirm_password')}</Text>
                        <View style={styles.inputWrapper}>
                            <Lock color={theme.colors.neutral.subtext} size={18} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry={true}
                            />
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.button, (isLoading || !isPasswordValid) && styles.buttonDisabled]}
                        onPress={handleRegister}
                        disabled={isLoading || !isPasswordValid}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>{t('auth.register.button')}</Text>
                        )}
                    </TouchableOpacity>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>{t('auth.register.already_have_account')}</Text>
                        <TouchableOpacity onPress={() => router.push('/login')}>
                            <Text style={styles.footerLink}>{t('auth.register.sign_in')}</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        height: 60,
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
    },
    logoSmall: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logoText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.neutral.dark,
        marginLeft: 6,
    },
    scrollContent: {
        padding: 24,
        paddingBottom: 40,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: theme.colors.neutral.dark,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: theme.colors.neutral.subtext,
        marginBottom: 32,
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF2F2',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FECACA',
        marginBottom: 20,
    },
    errorText: {
        color: '#B91C1C',
        fontSize: 14,
        marginLeft: 8,
    },
    row: {
        flexDirection: 'row',
        marginBottom: 0,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.neutral.text,
        marginBottom: 8,
        marginLeft: 4,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.neutral.canvas,
        borderWidth: 1,
        borderColor: theme.colors.neutral.border,
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 52,
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        height: '100%',
        color: theme.colors.neutral.dark,
        fontSize: 16,
    },
    requirementsContainer: {
        backgroundColor: theme.colors.neutral.canvas,
        padding: 16,
        borderRadius: 12,
        marginBottom: 20,
    },
    requirementsTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: theme.colors.neutral.text,
        marginBottom: 8,
    },
    requirementsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    requirementItem: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '50%',
        marginBottom: 6,
    },
    requirementText: {
        fontSize: 12,
        color: theme.colors.neutral.subtext,
        marginLeft: 6,
    },
    requirementTextValid: {
        color: theme.colors.brand[500],
        fontWeight: '500',
    },
    button: {
        backgroundColor: theme.colors.brand[500],
        height: 56,
        alignSelf: 'stretch',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
        shadowColor: theme.colors.brand[500],
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonDisabled: {
        backgroundColor: theme.colors.neutral.subtext,
        shadowOpacity: 0,
        elevation: 0,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 24,
    },
    footerText: {
        color: theme.colors.neutral.subtext,
        fontSize: 14,
    },
    footerLink: {
        color: theme.colors.brand[500],
        fontWeight: 'bold',
        fontSize: 14,
    },
});
