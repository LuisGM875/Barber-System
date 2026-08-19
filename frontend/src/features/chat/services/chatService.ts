import { apiRequest } from "../../../app/router/api";
import type { ChatConversation, ChatMessage } from "../types/messageTypes";

export const getMyConversation = () => apiRequest<ChatConversation>("/api/chat/mine", { method: "POST" });
export const getConversations = () => apiRequest<ChatConversation[]>("/api/chat/conversations");
export const getMessages = (conversationId: string) => apiRequest<ChatMessage[]>(`/api/chat/conversations/${conversationId}/messages`);
export function sendMessage(conversationId: string, content: string, image?: File | null) {
    const body = new FormData();
    body.append("content", content);
    if (image) body.append("image", image);
    return apiRequest<ChatMessage>(`/api/chat/conversations/${conversationId}/messages`, { method: "POST", body });
}
