import { Tabs } from 'expo-router';
import { theme } from '../../src/theme/theme';
import { Home, User, Settings } from 'lucide-react-native';

export default function TabsLayout() {
    return (
        <Tabs screenOptions={{
            tabBarActiveTintColor: theme.colors.brand[500],
            tabBarInactiveTintColor: theme.colors.neutral.subtext,
            headerShown: false,
            tabBarStyle: {
                borderTopColor: theme.colors.neutral.border,
                height: 60,
                paddingBottom: 10,
            }
        }}>
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color }) => <Home color={color} size={24} />
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color }) => <User color={color} size={24} />
                }}
            />
        </Tabs>
    );
}
