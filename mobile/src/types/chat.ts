export type ChatRole = 'user' | 'chatbot';

export interface ChatMessage {
    id: string;
    threadId: string;
    role: ChatRole;
    text: string;
    cropId?: string | null;
    createdAt: string;
}

export interface SendChatPromptRequest {
    prompt: string;
    cropId?: string;
    threadId?: string;
}

export interface ChatContextParams {
    cropId?: string;
    cropName?: string;
}
