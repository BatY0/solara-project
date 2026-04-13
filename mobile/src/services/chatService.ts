import axios from 'axios';

import api from '../api/api';
import type { ChatMessage, SendChatPromptRequest } from '../types/chat';

const getErrorMessage = (error: unknown): string => {
    if (axios.isAxiosError(error)) {
        const fromResponse = (error.response?.data as { message?: string } | undefined)?.message;
        if (fromResponse && fromResponse.trim().length > 0) {
            return fromResponse;
        }
    }

    return 'Unable to reach chatbot right now. Please try again.';
};

export const chatService = {
    sendPrompt: async (payload: SendChatPromptRequest): Promise<ChatMessage> => {
        try {
            const response = await api.post<ChatMessage>('/chat', payload);
            return response.data;
        } catch (error) {
            throw new Error(getErrorMessage(error));
        }
    },
};
