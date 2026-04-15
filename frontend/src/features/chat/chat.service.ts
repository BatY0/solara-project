import api from "../../lib/axios";

export interface ChatMessageRequest {
    prompt: string;
    cropId: string;
    threadId: string | null;
}

export interface ChatMessageResponse {
    id: string;
    threadId: string;
    role: string;
    text: string;
    cropId: string;
    createdAt: string;
}

export const chatService = {
    sendMessage: async (data: ChatMessageRequest): Promise<ChatMessageResponse> => {
        const response = await api.post("/chat", data);
        return response.data;
    },
};
