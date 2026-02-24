import React, { useState, useRef, useEffect, useCallback } from 'react';
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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { theme } from '../../src/theme/theme';
import { Mail, ShieldCheck, KeyRound, ArrowLeft, AlertCircle, CheckCircle, Lock, Eye, EyeOff } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../src/api/api';

const CODE_LENGTH = 6;

export default function VerifyScreen() {
    const router = useRouter();
    const { email: prefilledEmail, mode: paramMode } = useLocalSearchParams<{ email: string, mode: string }>();

    const mode = paramMode === 'forgot' ? 'forgot' : 'verify';
    const [email, setEmail] = useState(prefilledEmail || '');
    const [step, setStep] = useState<1 | 2 | 3>(prefilledEmail ? 2 : 1);

    // Code digits
    const [code, setCode] = useState('');

    // Password reset (Step 3)
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isCompleted, setIsCompleted] = useState(false);

    // Auto-send verification code when arriving with a prefilled email (e.g. from registration)
    useEffect(() => {
        if (prefilledEmail && mode === 'verify') {
            (async () => {
                setIsLoading(true);
                try {
                    await api.post('/auth/verify/request', { email: prefilledEmail });
                    setSuccess('Verification code sent');
                } catch (err: any) {
                    setError(err.response?.data?.message || 'Failed to send code');
                } finally {
                    setIsLoading(false);
                }
            })();
        }
    }, []);

    // --- Step 1: Request Code ---
    const handleRequestCode = async () => {
        if (!email) {
            setError('Please enter your email');
            return;
        }

        setError('');
        setIsLoading(true);
        try {
            await api.post('/auth/verify/request', { email });
            setStep(2);
            setSuccess('Verification code sent');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to send code');
        } finally {
            setIsLoading(false);
        }
    };

    // --- Step 2: Confirm Code ---
    const handleConfirmCode = async (enteredCode: string) => {
        setError('');
        setIsLoading(true);
        try {
            await api.post('/auth/verify/confirm', { email, code: enteredCode });
            if (mode === 'forgot') {
                setStep(3);
            } else {
                setIsCompleted(true);
                setSuccess('Account verified successfully!');
            }
        } catch (err: any) {
            setError('Invalid verification code');
        } finally {
            setIsLoading(false);
        }
    };

    // --- Step 3: Reset Password ---
    const handleResetPassword = async () => {
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setError('');
        setIsLoading(true);
        try {
            await api.post('/auth/verify/reset-password', {
                email,
                newPassword,
                code
            });
            setIsCompleted(true);
            setSuccess('Password reset successfully!');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to reset password');
        } finally {
            setIsLoading(false);
        }
    };

    if (isCompleted) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.successContainer}>
                    <View style={styles.successIconCircle}>
                        <CheckCircle color={theme.colors.brand[500]} size={48} />
                    </View>
                    <Text style={styles.successTitle}>
                        {mode === 'forgot' ? 'Password Reset' : 'Account Verified'}
                    </Text>
                    <Text style={styles.successSubtitle}>{success}</Text>
                    <TouchableOpacity
                        style={styles.button}
                        onPress={() => router.replace('/login')}
                    >
                        <Text style={styles.buttonText}>Go to Login</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <ArrowLeft color={theme.colors.neutral.dark} size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitleText}>
                    {mode === 'forgot' ? 'Forgot Password' : 'Verify Email'}
                </Text>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>

                    {/* STEP 1: Email Input */}
                    {step === 1 && (
                        <View>
                            <View style={styles.iconContainer}>
                                <Mail color={theme.colors.brand[500]} size={32} />
                            </View>
                            <Text style={styles.title}>Enter your email</Text>
                            <Text style={styles.subtitle}>We'll send you a 6-digit verification code.</Text>

                            {error ? (
                                <View style={styles.errorBanner}>
                                    <AlertCircle color={theme.colors.chart.danger} size={18} />
                                    <Text style={styles.errorText}>{error}</Text>
                                </View>
                            ) : null}

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Email Address</Text>
                                <View style={styles.inputWrapper}>
                                    <Mail color={theme.colors.neutral.subtext} size={18} style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="example@company.com"
                                        value={email}
                                        onChangeText={setEmail}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                    />
                                </View>
                            </View>

                            <TouchableOpacity style={styles.button} onPress={handleRequestCode} disabled={isLoading}>
                                {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Send Code</Text>}
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* STEP 2: Code Input */}
                    {step === 2 && (
                        <View>
                            <View style={styles.iconContainer}>
                                <ShieldCheck color={theme.colors.brand[500]} size={32} />
                            </View>
                            <Text style={styles.title}>Verify your email</Text>
                            <Text style={styles.subtitle}>Enter the 6-digit code sent to {email}</Text>

                            {error ? (
                                <View style={styles.errorBanner}>
                                    <AlertCircle color={theme.colors.chart.danger} size={18} />
                                    <Text style={styles.errorText}>{error}</Text>
                                </View>
                            ) : null}

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Verification Code</Text>
                                <TextInput
                                    style={[styles.codeInput, { letterSpacing: 8 }]}
                                    placeholder="000000"
                                    value={code}
                                    onChangeText={(val: string) => {
                                        setCode(val);
                                        if (val.length === CODE_LENGTH) {
                                            handleConfirmCode(val);
                                        }
                                    }}
                                    keyboardType="number-pad"
                                    maxLength={CODE_LENGTH}
                                    textAlign="center"
                                />
                            </View>

                            <TouchableOpacity
                                style={[styles.button, code.length < CODE_LENGTH && styles.buttonDisabled]}
                                onPress={() => handleConfirmCode(code)}
                                disabled={isLoading || code.length < CODE_LENGTH}
                            >
                                {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Confirm Code</Text>}
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.resendButton} onPress={handleRequestCode}>
                                <Text style={styles.resendText}>Didn't receive a code? <Text style={styles.resendLink}>Resend</Text></Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* STEP 3: Reset Password */}
                    {step === 3 && (
                        <View>
                            <View style={styles.iconContainer}>
                                <KeyRound color={theme.colors.brand[500]} size={32} />
                            </View>
                            <Text style={styles.title}>New Password</Text>
                            <Text style={styles.subtitle}>Please choose a strong password for your account.</Text>

                            {error ? (
                                <View style={styles.errorBanner}>
                                    <AlertCircle color={theme.colors.chart.danger} size={18} />
                                    <Text style={styles.errorText}>{error}</Text>
                                </View>
                            ) : null}

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>New Password</Text>
                                <View style={styles.inputWrapper}>
                                    <Lock color={theme.colors.neutral.subtext} size={18} style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="••••••••"
                                        value={newPassword}
                                        onChangeText={setNewPassword}
                                        secureTextEntry={!showPassword}
                                    />
                                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                        {showPassword ? <EyeOff color={theme.colors.neutral.subtext} size={18} /> : <Eye color={theme.colors.neutral.subtext} size={18} />}
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Confirm New Password</Text>
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

                            <TouchableOpacity style={styles.button} onPress={handleResetPassword} disabled={isLoading}>
                                {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Reset Password</Text>}
                            </TouchableOpacity>
                        </View>
                    )}

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
        paddingHorizontal: 20,
        height: 60,
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
    },
    headerTitleText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.neutral.dark,
        marginLeft: 8,
    },
    scrollContent: {
        padding: 24,
    },
    iconContainer: {
        width: 64,
        height: 64,
        backgroundColor: theme.colors.brand[50],
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
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
        lineHeight: 22,
    },
    errorBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF2F2',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FECACA',
        marginBottom: 24,
    },
    errorText: {
        color: '#B91C1C',
        fontSize: 14,
        marginLeft: 8,
    },
    inputGroup: {
        marginBottom: 24,
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
    codeInput: {
        backgroundColor: theme.colors.neutral.canvas,
        borderWidth: 1,
        borderColor: theme.colors.neutral.border,
        borderRadius: 12,
        height: 64,
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.colors.neutral.dark,
    },
    button: {
        backgroundColor: theme.colors.brand[500],
        height: 56,
        alignSelf: 'stretch',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
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
    resendButton: {
        marginTop: 24,
        alignItems: 'center',
    },
    resendText: {
        color: theme.colors.neutral.subtext,
        fontSize: 14,
    },
    resendLink: {
        color: theme.colors.brand[500],
        fontWeight: 'bold',
    },
    successContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
    },
    successIconCircle: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: '#ECFDF5',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    successTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.colors.neutral.dark,
        marginBottom: 8,
    },
    successSubtitle: {
        fontSize: 16,
        color: theme.colors.neutral.subtext,
        textAlign: 'center',
        marginBottom: 40,
    },
});
