import { Tabs } from 'expo-router';
import { theme } from '../../src/theme/theme';
import { Bell, BookOpen, Home, MessageCircle, Settings } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { AppState, type AppStateStatus, DeviceEventEmitter } from 'react-native';
import { alertsService } from '../../src/services/alertsService';

export default function TabsLayout() {
    const { t } = useTranslation();
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        const fetchUnreadCount = async () => {
            try {
                const count = await alertsService.getUnreadCount();
                setUnreadCount(count);
            } catch (error) {
                console.error('Failed to fetch unread alert count:', error);
            }
        };
        void fetchUnreadCount();
        void fetchUnreadCount();

        let appState: AppStateStatus = AppState.currentState;
        const sub = AppState.addEventListener('change', (nextState) => {
            if ((appState === 'background' || appState === 'inactive') && nextState === 'active') {
                void fetchUnreadCount();
            }
            appState = nextState;
        });

        const alertSub = DeviceEventEmitter.addListener('alerts:updated', (count?: number) => {
            if (typeof count === 'number') {
                setUnreadCount(count);
            } else {
                void fetchUnreadCount();
            }
        });

        return () => {
            sub.remove();
            alertSub.remove();
        };
    }, []);

    return (
        <Tabs screenOptions={{
            tabBarActiveTintColor: theme.colors.brand[500],
            tabBarInactiveTintColor: theme.colors.neutral.subtext,
            headerShown: false,
            tabBarStyle: {
                borderTopColor: theme.colors.neutral.border,
                height: 64,
                paddingBottom: 10,
                paddingTop: 6,
            }
        }}>
            <Tabs.Screen
                name="index"
                options={{
                    title: t('sidebar.dashboard'),
                    tabBarIcon: ({ color }) => <Home color={color} size={24} />,
                }}
            />
            <Tabs.Screen
                name="guides"
                options={{
                    title: t('crop_guide.title'),
                    tabBarIcon: ({ color }) => <BookOpen color={color} size={24} />,
                }}
            />
            <Tabs.Screen
                name="chatbot"
                options={{
                    title: t('chatbot.tab'),
                    tabBarIcon: ({ color }) => <MessageCircle color={color} size={24} />,
                }}
            />
            <Tabs.Screen
                name="alerts"
                options={{
                    title: t('alerts.title'),
                    tabBarIcon: ({ color }) => <Bell color={color} size={24} />,
                    tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: t('sidebar.settings'),
                    tabBarIcon: ({ color }) => <Settings color={color} size={24} />,
                }}
            />
        </Tabs>
    );
}

