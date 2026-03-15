import React, { useState } from 'react';
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
    ImageBackground,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { theme } from '../../src/theme/theme';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Sprout, AlertCircle } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const router = useRouter();
    const { t } = useTranslation();

    const handleLogin = async () => {
        if (!email || !password) {
            setError(t('validation.required'));
            return;
        }

        setError('');
        setIsLoading(true);
        try {
            await login({ email, password });
            router.replace('/(tabs)');
        } catch (err: any) {
            if (err.type === 'EMAIL_NOT_VERIFIED') {
                router.push({
                    pathname: '/(auth)/verify',
                    params: { email: err.email || email, mode: 'verify' }
                });
            } else {
                setError(t('auth.login.invalid_credentials'));
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <ImageBackground
                source={{ uri: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?q=80&w=1000' }}
                style={styles.headerBackground}
            >
                <View style={styles.overlay} />
                <SafeAreaView style={styles.headerContent}>
                    <View style={styles.logoContainer}>
                        <Sprout color={theme.colors.brand[50]} size={40} />
                        <Text style={styles.brandName}>Solara</Text>
                    </View>
                    <Text style={styles.headerTitle}>{t('auth.login.hero_title')}</Text>
                    <Text style={styles.headerSubtitle}>{t('auth.login.hero_subtitle')}</Text>
                </SafeAreaView>
            </ImageBackground>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.formContainer}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <Text style={styles.title}>{t('auth.login.title')}</Text>
                    <Text style={styles.subtitle}>{t('auth.login.subtitle')}</Text>

                    {error ? (
                        <View style={styles.errorContainer}>
                            <AlertCircle color={theme.colors.chart.danger} size={18} />
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    ) : null}

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>{t('auth.common.email')}</Text>
                        <View style={styles.inputWrapper}>
                            <Mail color={theme.colors.neutral.subtext} size={20} style={styles.inputIcon} />
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
                        <View style={styles.labelRow}>
                            <Text style={styles.label}>{t('auth.common.password')}</Text>
                            <TouchableOpacity onPress={() => router.push({ pathname: '/(auth)/verify', params: { mode: 'forgot' } })}>
                                <Text style={styles.forgotPassword}>{t('auth.login.forgot_password')}</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.inputWrapper}>
                            <Lock color={theme.colors.neutral.subtext} size={20} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="••••••••"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                            />
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                {showPassword ? (
                                    <EyeOff color={theme.colors.neutral.subtext} size={20} />
                                ) : (
                                    <Eye color={theme.colors.neutral.subtext} size={20} />
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.button, isLoading && styles.buttonDisabled]}
                        onPress={handleLogin}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Text style={styles.buttonText}>{t('auth.login.button')}</Text>
                                <ArrowRight color="#fff" size={20} />
                            </>
                        )}
                    </TouchableOpacity>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>{t('auth.login.no_account')}</Text>
                        <TouchableOpacity onPress={() => router.push('/register')}>
                            <Text style={styles.footerLink}>{t('auth.login.register')}</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.neutral.canvas,
    },
    headerBackground: {
        height: 280,
        justifyContent: 'flex-end',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(6, 78, 59, 0.7)', // brand.900 with opacity
    },
    headerContent: {
        padding: 24,
        zIndex: 1,
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    brandName: {
        color: '#fff',
        fontSize: 28,
        fontWeight: 'bold',
        marginLeft: 12,
        letterSpacing: -0.5,
    },
    headerTitle: {
        color: '#fff',
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    headerSubtitle: {
        color: theme.colors.brand[50],
        fontSize: 16,
        opacity: 0.9,
    },
    formContainer: {
        flex: 1,
        marginTop: -20,
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        overflow: 'hidden',
    },
    scrollContent: {
        padding: 24,
        paddingBottom: 40,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.colors.neutral.dark,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: theme.colors.neutral.subtext,
        marginBottom: 24,
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
    inputGroup: {
        marginBottom: 20,
    },
    labelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.neutral.text,
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
    forgotPassword: {
        fontSize: 12,
        color: theme.colors.brand[500],
        fontWeight: 'bold',
    },
    button: {
        backgroundColor: theme.colors.brand[500],
        height: 56,
        alignSelf: 'stretch',
        borderRadius: 12,
        flexDirection: 'row',
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
        opacity: 0.7,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginRight: 8,
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
