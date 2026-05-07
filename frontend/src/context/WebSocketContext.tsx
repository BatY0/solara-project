import React, { createContext, useContext, useEffect, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

interface WebSocketContextType {
    stompClient: Client | null;
    isConnected: boolean;
}

const WebSocketContext = createContext<WebSocketContextType>({
    stompClient: null,
    isConnected: false,
});

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [stompClient, setStompClient] = useState<Client | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const client = new Client({
            // Note: we're using SockJS, so we configure webSocketFactory instead of brokerURL
            webSocketFactory: () => {
                const baseURL = import.meta.env.VITE_API_URL 
                    ? import.meta.env.VITE_API_URL.replace('/api/v1', '') 
                    : 'http://localhost:8080';
                return new SockJS(`${baseURL}/ws`);
            },
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
            onConnect: () => {
                console.log('Connected to WebSocket');
                setIsConnected(true);
            },
            onDisconnect: () => {
                console.log('Disconnected from WebSocket');
                setIsConnected(false);
            },
            onStompError: (frame) => {
                console.error('Broker reported error: ' + frame.headers['message']);
                console.error('Additional details: ' + frame.body);
            },
            onWebSocketError: (event) => {
                console.error('WebSocket connection error:', event);
            }
        });

        client.activate();
        setStompClient(client);

        return () => {
            if (client.active) {
                client.deactivate();
            }
        };
    }, []);

    return (
        <WebSocketContext.Provider value={{ stompClient, isConnected }}>
            {children}
        </WebSocketContext.Provider>
    );
};

export const useWebSocket = () => useContext(WebSocketContext);
