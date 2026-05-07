import { useEffect, useState } from 'react';
import { useWebSocket } from '../context/WebSocketContext';
import type { AlertEvent } from '../features/alerts/types';

export function useNotificationsSocket(userId: string | undefined) {
    const { stompClient, isConnected } = useWebSocket();
    const [latestAlert, setLatestAlert] = useState<AlertEvent | null>(null);

    useEffect(() => {
        if (!isConnected || !stompClient || !userId) return;

        const subscription = stompClient.subscribe(`/topic/user.${userId}.alerts`, (message) => {
            if (message.body) {
                try {
                    const data = JSON.parse(message.body) as AlertEvent;
                    setLatestAlert(data);
                } catch (err) {
                    console.error('Failed to parse alert message', err);
                }
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [isConnected, stompClient, userId]);

    return { latestAlert, isConnected };
}
