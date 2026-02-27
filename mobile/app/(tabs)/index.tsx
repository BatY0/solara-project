import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { theme } from '../../src/theme/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Sprout, LogOut } from 'lucide-react-native';

export default function DashboardScreen() {
    const { user, logout } = useAuth();
    const router = useRouter();

    const handleLogout = async () => {
        await logout();
        router.replace('/(auth)/login');
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.logoRow}>
                    <Sprout color={theme.colors.brand[500]} size={28} />
                    <Text style={styles.brandText}>Solara</Text>
                </View>
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <LogOut color={theme.colors.chart.danger} size={20} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.welcomeCard}>
                    <Text style={styles.welcomeTitle}>Welcome back,</Text>
                    <Text style={styles.userEmail}>{user?.email || 'User'}</Text>
                    <Text style={styles.welcomeSubtitle}>Everything's looking green today.</Text>
                </View>

                <Text style={styles.sectionTitle}>Quick Status</Text>
                <View style={styles.placeholderCard}>
                    <Text style={styles.placeholderText}>Your field data will appear here once connected to sensors.</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.neutral.canvas,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.neutral.border,
    },
    logoRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    brandText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.colors.neutral.dark,
        marginLeft: 8,
    },
    logoutButton: {
        padding: 8,
    },
    content: {
        padding: 20,
    },
    welcomeCard: {
        backgroundColor: theme.colors.brand[900],
        borderRadius: 20,
        padding: 24,
        marginBottom: 24,
        shadowColor: theme.colors.brand[900],
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 8,
    },
    welcomeTitle: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 16,
        marginBottom: 4,
    },
    userEmail: {
        color: '#fff',
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    welcomeSubtitle: {
        color: theme.colors.brand[50],
        fontSize: 14,
        opacity: 0.9,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.neutral.dark,
        marginBottom: 16,
    },
    placeholderCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 30,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: theme.colors.neutral.border,
        borderStyle: 'dashed',
    },
    placeholderText: {
        color: theme.colors.neutral.subtext,
        textAlign: 'center',
        fontSize: 14,
        lineHeight: 20,
    },
});
