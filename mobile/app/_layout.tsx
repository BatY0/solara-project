import { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import * as SplashScreen from 'expo-splash-screen';
import {
    useFonts,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
} from '@expo-google-fonts/inter';
import { getExpoPushToken, registerForNotifications } from '../src/services/notificationsService';
import { pushTokensService } from '../src/services/pushTokensService';
import { useAlertNotifications } from '../src/hooks/useAlertNotifications';
import '../src/i18n/i18n'; // Initialize i18n (TR/EN) on app start

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
    const { isLoading, token } = useAuth();
    useAlertNotifications(Boolean(token));

    const [fontsLoaded] = useFonts({
        Inter_400Regular,
        Inter_500Medium,
        Inter_600SemiBold,
        Inter_700Bold,
    });

    useEffect(() => {
        if (fontsLoaded && !isLoading) {
            SplashScreen.hideAsync();
        }
    }, [fontsLoaded, isLoading]);

    useEffect(() => {
        void registerForNotifications();
    }, []);

    useEffect(() => {
        if (!token) return;

        const syncPushToken = async () => {
            try {
                const expoPushToken = await getExpoPushToken();
                if (!expoPushToken) return;

                const lastSynced = await SecureStore.getItemAsync('expoPushToken');
                if (lastSynced === expoPushToken) return;

                await pushTokensService.registerExpoPushToken(expoPushToken);
                await SecureStore.setItemAsync('expoPushToken', expoPushToken);
            } catch (error) {
                console.error('Failed to sync Expo push token:', error);
            }
        };

        void syncPushToken();
    }, [token]);

    if (!fontsLoaded || isLoading) {
        return null;
    }

    return (
        <Stack screenOptions={{ headerShown: false }}>
            {!token ? (
                <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
            ) : (
                <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
            )}
        </Stack>
    );
}

export default function RootLayout() {
    return (
        <AuthProvider>
            <RootLayoutNav />
        </AuthProvider>
    );
}
