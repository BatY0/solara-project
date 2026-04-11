import { Tabs } from 'expo-router';
import { theme } from '../../src/theme/theme';
import { BookOpen, Home, Settings } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

export default function TabsLayout() {
    const { t } = useTranslation();

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
                name="profile"
                options={{
                    title: t('sidebar.settings'),
                    tabBarIcon: ({ color }) => <Settings color={color} size={24} />,
                }}
            />
        </Tabs>
    );
}

