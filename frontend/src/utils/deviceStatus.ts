import type { Field } from '../features/fields/types';
import { parseBackendDate } from './dateTime';

export type DeviceStatus = 'online' | 'offline' | 'inactive';

export interface DeviceStatusInfo {
    status: DeviceStatus;
    colorScheme: string;
    text: string;
    timeAgo?: string;
}

export function getDeviceStatus(field: Field, t: (key: string, options?: any) => string): DeviceStatusInfo {
    if (!field.deviceId) {
        return {
            status: 'offline',
            colorScheme: 'red',
            text: t('fields_page.offline')
        };
    }

    // Default basic text if no translation, but uses translation key if it existed
    const baseOnlineText = t('fields_page.online');
    
    if (!field.deviceLastSeenAt) {
        return {
            status: 'inactive',
            colorScheme: 'yellow',
            text: `Paired - Waiting for data`
        };
    }

    const lastSeenDate = parseBackendDate(field.deviceLastSeenAt);
    
    // In case the parsing results in invalid date
    if (isNaN(lastSeenDate.getTime())) {
         return {
            status: 'online',
            colorScheme: 'green',
            text: baseOnlineText
        };
    }

    const now = new Date();
    // Use Math.max to prevent negative diffs if clock skew exists
    const diffMs = Math.max(0, now.getTime() - lastSeenDate.getTime());
    
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    let timeAgoText = '';
    if (diffMins < 1) {
        timeAgoText = 'just now';
    } else if (diffMins < 60) {
        timeAgoText = `${diffMins} min${diffMins === 1 ? '' : 's'} ago`;
    } else if (diffHours < 24) {
        timeAgoText = `${diffHours} hr${diffHours === 1 ? '' : 's'} ago`;
    } else {
        timeAgoText = `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    }

    // Threshold of >= 24 hours (1 day) is considered inactive.
    if (diffDays >= 1) {
        return {
            status: 'inactive',
            colorScheme: 'yellow',
            text: `${baseOnlineText} - Last seen ${timeAgoText}`,
            timeAgo: timeAgoText
        };
    }

    return {
        status: 'online',
        colorScheme: 'green',
        text: `${baseOnlineText} - Last seen ${timeAgoText}`,
        timeAgo: timeAgoText
    };
}
