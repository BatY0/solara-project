import { useEffect, useState } from 'react';
import { useWebSocket } from '../context/WebSocketContext';
import type { SensorData } from '../features/fields/types';

export function useFieldTelemetrySocket(fieldId: string) {
    const { stompClient, isConnected } = useWebSocket();
    const [liveReading, setLiveReading] = useState<SensorData | null>(null);

    useEffect(() => {
        if (!isConnected || !stompClient || !fieldId) return;

        const subscription = stompClient.subscribe(`/topic/field.${fieldId}.telemetry`, (message) => {
            if (message.body) {
                try {
                    const data = JSON.parse(message.body) as SensorData;
                    setLiveReading(data);
                } catch (err) {
                    console.error('Failed to parse telemetry message', err);
                }
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [isConnected, stompClient, fieldId]);

    return { liveReading, isConnected };
}
