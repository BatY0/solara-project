import { Platform } from 'react-native';
import Constants from 'expo-constants';
import api from '../api/api';

interface RegisterPushTokenRequest {
    expoPushToken: string;
    platform: string;
    deviceId?: string;
    deviceName?: string;
}

function getDeviceName(): string | undefined {
    const name = Constants.deviceName;
    if (typeof name === 'string' && name.trim().length > 0) {
        return name.trim();
    }
    return undefined;
}

export const pushTokensService = {
    registerExpoPushToken: async (expoPushToken: string): Promise<void> => {
        const request: RegisterPushTokenRequest = {
            expoPushToken,
            platform: Platform.OS,
            deviceName: getDeviceName(),
        };
        await api.post('/notifications/push-tokens', request);
    },

    unregisterExpoPushToken: async (expoPushToken: string): Promise<void> => {
        await api.delete('/notifications/push-tokens', {
            data: { expoPushToken },
        });
    },
};
