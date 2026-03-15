import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import * as SplashScreen from 'expo-splash-screen';
import {
    useFonts,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
} from '@expo-google-fonts/inter';
import '../src/i18n/i18n'; // Initialize i18n (TR/EN) on app start

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
    const { isLoading, token } = useAuth();
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
