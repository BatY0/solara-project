import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import * as SecureStore from 'expo-secure-store';
import { useAuth } from './AuthContext';

// STOMP text-encoding polyfill for React Native
import 'text-encoding';

interface WebSocketContextType {
    stompClient: Client | null;
    isConnected: boolean;
    connectionId: number;
}

const WebSocketContext = createContext<WebSocketContextType>({
    stompClient: null,
    isConnected: false,
    connectionId: 0,
});

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { token } = useAuth();
    const [stompClient, setStompClient] = useState<Client | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [connectionId, setConnectionId] = useState(0);
    const connectionIdRef = useRef(0);
    const clientRef = useRef<Client | null>(null);

    useEffect(() => {
        console.log('[WS] useEffect triggered. Token state:', token ? 'HAS TOKEN' : 'NO TOKEN');
        
        if (!token) {
            console.log('[WS] No token, deactivating.');
            if (clientRef.current?.active) {
                clientRef.current.deactivate();
            }
            setIsConnected(false);
            setStompClient(null);
            return;
        }

        const connect = async () => {
            try {
                const apiBase = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080/api/v1';
                const baseURL = apiBase.replace('/api/v1', '');
                // Add token to the URL itself for more reliable mobile handshake
                const wsUrl = baseURL.replace(/^https?/, match => match === 'https' ? 'wss' : 'ws') + `/ws-native?token=${token}`;
                
                console.log('[WS] Connecting to:', wsUrl);

                const client = new Client({
                    // Let stompjs create the socket from brokerURL so it can manage
                    // STOMP subprotocol negotiation itself.
                    brokerURL: wsUrl,
                    connectHeaders: {
                        // We still send it here as a fallback
                        Authorization: `Bearer ${token}`
                    },
                    reconnectDelay: 5000,
                    heartbeatIncoming: 0,
                    heartbeatOutgoing: 0,
                    // React Native WebSocket can corrupt/drop NULL terminators in text frames.
                    // STOMP requires NULL-delimited frames; forcing binary frames avoids that.
                    forceBinaryWSFrames: true,
                    onConnect: () => {
                        connectionIdRef.current += 1;
                        console.log('[WS] SUCCESS! Connected ID:', connectionIdRef.current);
                        setIsConnected(true);
                        setConnectionId(connectionIdRef.current);
                    },
                    onWebSocketClose: (evt) => {
                        // If the server accepts the handshake but closes before STOMP CONNECTED,
                        // `onConnect` never fires. This log is critical for debugging that case.
                        console.log('[WS] WebSocket closed:', {
                            code: (evt as any)?.code,
                            reason: (evt as any)?.reason,
                            wasClean: (evt as any)?.wasClean,
                        });
                        setIsConnected(false);
                    },
                    onDisconnect: () => {
                        console.log('[WS] Disconnected');
                        setIsConnected(false);
                    },
                    onStompError: (frame) => {
                        console.error('[WS] STOMP Error:', frame.headers['message']);
                    },
                    onWebSocketError: (event) => {
                        console.error('[WS] WebSocket Error. Check network/IP.');
                    },
                    debug: (str) => {
                        console.log('[WS DEBUG]', str);
                    }
                });

                // Small delay to ensure state stability in RN
                setTimeout(() => {
                    console.log('[WS] Activating...');
                    client.activate();
                }, 100);

                clientRef.current = client;
                setStompClient(client);
            } catch (err) {
                console.error('[WS] Setup error:', err);
            }
        };

        connect();

        return () => {
            if (clientRef.current) {
                console.log('[WS] Cleaning up.');
                clientRef.current.deactivate();
                clientRef.current = null;
            }
        };
    }, [token]);

    return (
        <WebSocketContext.Provider value={{ stompClient, isConnected, connectionId }}>
            {children}
        </WebSocketContext.Provider>
    );
};

export const useWebSocket = () => useContext(WebSocketContext);
