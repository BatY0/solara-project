import { useEffect, useState } from 'react';
import { useWebSocket } from '../context/WebSocketContext';
import { SensorData } from '../types/fields';

export function useFieldTelemetrySocket(fieldId: string) {
    const { stompClient, isConnected, connectionId } = useWebSocket();
    const [liveReading, setLiveReading] = useState<SensorData | null>(null);

    useEffect(() => {
        // Avoid subscribing during the brief window where `isConnected` flips
        // but `connectionId` is still 0 (can cause a subscribe -> cleanup -> resubscribe race).
        if (!isConnected || !stompClient || !fieldId || connectionId === 0) return;

        console.log('[Telemetry] Subscribing to field:', fieldId, 'connectionId:', connectionId);
        let subscription: { unsubscribe: () => void } | null = null;
        try {
            subscription = stompClient.subscribe(`/topic/field.${fieldId}.telemetry`, (message) => {
                let raw: unknown = message.body;

                if (!raw && message.binaryBody) {
                    try {
                        raw = new TextDecoder().decode(message.binaryBody);
                    } catch (e) {
                        console.error('[Telemetry] Failed to decode binary body', e);
                    }
                }

                const rawStr = typeof raw === 'string' ? raw : undefined;
                console.log('[Telemetry] Message received, body length:', rawStr?.length ?? 0);

                // `@stomp/stompjs` usually gives `message.body` as a string,
                // but be defensive (RN / different client versions).
                try {
                    const data: SensorData =
                        typeof raw === 'string'
                            ? (JSON.parse(raw) as SensorData)
                            : (raw as SensorData);

                    console.log('[Telemetry] Parsed OK, soilHumidity:', data.soilHumidity);
                    setLiveReading(data);
                } catch (err) {
                    console.error(
                        '[Telemetry] Failed to parse telemetry message',
                        err,
                        'raw preview:',
                        rawStr ? rawStr.slice(0, 200) : '(non-string body)'
                    );
                }
            });
        } catch (err) {
            console.error('[Telemetry] Failed to create subscription', err);
        }

        return () => {
            subscription?.unsubscribe();
        };
    }, [isConnected, stompClient, fieldId, connectionId]);

    return { liveReading, isConnected };
}
